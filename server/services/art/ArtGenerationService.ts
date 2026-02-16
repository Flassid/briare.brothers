/**
 * Art Generation Service
 * Main orchestrator for pixel art generation pipeline
 */

import path from 'path';
import sharp from 'sharp';
import { EventEmitter } from 'events';
import {
  GenerationRequest,
  GenerationResult,
  GenerationJob,
  ArtResponse,
  CachedResponse,
  QueuedResponse,
  ArtServiceConfig,
  AssetSize,
  IArtProvider,
  ArtServiceEvents,
  ASSET_SIZES
} from './types.js';
import { CacheManager } from './CacheManager.js';
import { AssetQueue } from './AssetQueue.js';
import { ReplicateProvider } from './ReplicateProvider.js';
import { DalleProvider } from './DalleProvider.js';
import { GeminiImageProvider } from './GeminiImageProvider.js';

// Placeholder paths
const PLACEHOLDERS = {
  character: '/placeholders/character.png',
  monster: '/placeholders/monster.png',
  scene: '/placeholders/scene.png'
};

export class ArtGenerationService extends EventEmitter {
  private config: ArtServiceConfig;
  private cache: CacheManager;
  private queue: AssetQueue;
  private providers: {
    replicate: ReplicateProvider;
    dalle: DalleProvider;
    gemini: GeminiImageProvider;
  };
  private initialized: boolean = false;

  constructor(config: Partial<ArtServiceConfig> = {}) {
    super();
    
    this.config = {
      provider: (process.env.ART_PROVIDER as 'replicate' | 'dalle' | 'gemini' | 'hybrid') || 'gemini',
      cacheDir: process.env.ART_CACHE_DIR || './public/generated',
      cacheTtlDays: parseInt(process.env.ART_CACHE_TTL_DAYS || '30'),
      maxConcurrentGenerations: parseInt(process.env.MAX_CONCURRENT_GENERATIONS || '3'),
      generationTimeoutMs: parseInt(process.env.GENERATION_TIMEOUT_MS || '30000'),
      ...config
    };

    this.cache = new CacheManager(this.config.cacheDir, this.config.cacheTtlDays);
    
    this.queue = new AssetQueue(
      this.config.maxConcurrentGenerations,
      this.config.generationTimeoutMs
    );

    this.providers = {
      replicate: new ReplicateProvider(this.config.replicateConfig),
      dalle: new DalleProvider(this.config.dalleConfig),
      gemini: new GeminiImageProvider({ apiKey: process.env.GEMINI_API_KEY })
    };

    // Forward queue events
    this.queue.on('job:queued', (job) => this.emit('job:queued', job));
    this.queue.on('job:started', (job) => this.emit('job:started', job));
    this.queue.on('job:complete', (job, result) => this.emit('job:complete', job, result));
    this.queue.on('job:failed', (job, error) => this.emit('job:failed', job, error));
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.cache.initialize();
    
    // Check provider availability
    const replicateAvailable = await this.providers.replicate.isAvailable();
    const dalleAvailable = await this.providers.dalle.isAvailable();
    const geminiAvailable = await this.providers.gemini.isAvailable();
    
    console.log('[ArtService] Initialized');
    console.log(`[ArtService] Provider: ${this.config.provider}`);
    console.log(`[ArtService] Replicate available: ${replicateAvailable}`);
    console.log(`[ArtService] DALL-E available: ${dalleAvailable}`);
    console.log(`[ArtService] Gemini available: ${geminiAvailable}`);
    console.log(`[ArtService] Cache dir: ${this.config.cacheDir}`);
    
    this.initialized = true;
  }

  /**
   * Generate pixel art (main entry point)
   */
  async generate(request: GenerationRequest): Promise<ArtResponse> {
    await this.initialize();
    
    const size = request.size || ASSET_SIZES[request.type][0];
    const cacheKey = this.cache.generateCacheKey(request.type, request.description, size);
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`[ArtService] Cache hit: ${cacheKey}`);
      this.emit('cache:hit', cacheKey);
      
      return {
        status: 'ready',
        url: cached.url,
        cached: true,
        cacheKey
      } as CachedResponse;
    }
    
    this.emit('cache:miss', cacheKey);
    
    // If waitForResult is true, generate synchronously
    if (request.waitForResult) {
      return this.generateSync(request, size, cacheKey);
    }
    
    // Otherwise, queue for async generation
    return this.generateAsync(request, size, cacheKey);
  }

  /**
   * Generate synchronously (blocks until complete)
   */
  private async generateSync(
    request: GenerationRequest,
    size: AssetSize,
    cacheKey: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    // Select provider
    const provider = await this.selectProvider(request);
    
    console.log(`[ArtService] Generating sync with ${provider.name}`);
    
    // Generate image
    const imageBuffer = await provider.generate(request);
    
    // Process image (resize to exact size, optimize)
    const processedBuffer = await this.processImage(imageBuffer, size, request.type);
    
    // Cache result
    const entry = await this.cache.set(
      cacheKey,
      request.type,
      request.description,
      processedBuffer,
      size.width,
      size.height,
      provider.name
    );
    
    const generationTimeMs = Date.now() - startTime;
    
    return {
      url: entry.url,
      localPath: entry.filePath,
      cacheKey,
      width: size.width,
      height: size.height,
      provider: provider.name,
      generationTimeMs,
      cached: false
    };
  }

  /**
   * Queue for async generation
   */
  private async generateAsync(
    request: GenerationRequest,
    size: AssetSize,
    cacheKey: string
  ): Promise<QueuedResponse> {
    const { job } = await this.queue.enqueue(
      request,
      async (job: GenerationJob) => {
        return this.generateSync(job.request, size, cacheKey);
      }
    );
    
    const position = this.queue.getPosition(job.id);
    const provider = await this.selectProvider(request);
    const estimatedTime = provider.estimateTimeMs(request) + this.queue.getEstimatedWait(job.id);
    
    return {
      jobId: job.id,
      status: 'queued',
      placeholder: PLACEHOLDERS[request.type],
      estimatedTimeMs: estimatedTime,
      position
    };
  }

  /**
   * Select the best provider for a request
   */
  private async selectProvider(request: GenerationRequest): Promise<IArtProvider> {
    const { provider } = this.config;
    
    // If specific provider configured, use it
    if (provider === 'replicate') {
      if (await this.providers.replicate.isAvailable()) {
        return this.providers.replicate;
      }
      throw new Error('Replicate provider not available');
    }
    
    if (provider === 'dalle') {
      if (await this.providers.dalle.isAvailable()) {
        return this.providers.dalle;
      }
      throw new Error('DALL-E provider not available');
    }

    if (provider === 'gemini') {
      if (await this.providers.gemini.isAvailable()) {
        return this.providers.gemini;
      }
      throw new Error('Gemini provider not available');
    }
    
    // Hybrid mode: choose based on asset type and availability
    const geminiAvailable = await this.providers.gemini.isAvailable();
    const replicateAvailable = await this.providers.replicate.isAvailable();
    const dalleAvailable = await this.providers.dalle.isAvailable();
    
    if (!replicateAvailable && !dalleAvailable && !geminiAvailable) {
      throw new Error('No art providers available');
    }

    // Prefer Gemini first (free and fast)
    if (geminiAvailable) {
      return this.providers.gemini;
    }
    
    // Fallback to Replicate for characters/monsters (better pixel art LoRAs)
    if (request.type === 'character' || request.type === 'monster') {
      if (replicateAvailable) return this.providers.replicate;
      return this.providers.dalle;
    }
    
    // For scenes, DALL-E can be good too
    if (request.type === 'scene') {
      // Use DALL-E if Replicate is busy or unavailable
      if (dalleAvailable && (!replicateAvailable || this.queue.getStats().pending > 5)) {
        return this.providers.dalle;
      }
      if (replicateAvailable) return this.providers.replicate;
      return this.providers.dalle;
    }
    
    // Default
    return replicateAvailable ? this.providers.replicate : this.providers.dalle;
  }

  /**
   * Process generated image (resize, optimize)
   */
  private async processImage(
    buffer: Buffer,
    targetSize: AssetSize,
    type: string
  ): Promise<Buffer> {
    let image = sharp(buffer);
    
    // Get original dimensions
    const metadata = await image.metadata();
    
    // For pixel art, use nearest neighbor interpolation to maintain crisp edges
    if (metadata.width !== targetSize.width || metadata.height !== targetSize.height) {
      image = image.resize(targetSize.width, targetSize.height, {
        kernel: 'nearest', // Critical for pixel art!
        fit: 'cover'
      });
    }
    
    // Ensure PNG output with transparency for characters/monsters
    if (type === 'character' || type === 'monster') {
      return image.png({
        compressionLevel: 9,
        palette: true, // Use palette mode for smaller files
        colors: 256
      }).toBuffer();
    }
    
    // Scenes can be larger, optimize differently
    return image.png({
      compressionLevel: 9
    }).toBuffer();
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): GenerationJob | null {
    return this.queue.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Search cache
   */
  async searchCache(query: string, type?: 'character' | 'monster' | 'scene') {
    return this.cache.search(query, type);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache() {
    return this.cache.cleanup();
  }

  /**
   * Pre-generate hints (for DM service integration)
   */
  async pregenerate(hints: GenerationRequest[]): Promise<void> {
    for (const hint of hints) {
      // Fire and forget with low priority
      this.generate({
        ...hint,
        priority: 'low',
        waitForResult: false
      }).catch(err => {
        console.warn('[ArtService] Pre-generation failed:', err.message);
      });
    }
  }

  /**
   * Typed event emitter
   */
  on<K extends keyof ArtServiceEvents>(
    event: K,
    listener: ArtServiceEvents[K]
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  emit<K extends keyof ArtServiceEvents>(
    event: K,
    ...args: Parameters<ArtServiceEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

// Singleton instance
let artServiceInstance: ArtGenerationService | null = null;

export function getArtService(config?: Partial<ArtServiceConfig>): ArtGenerationService {
  if (!artServiceInstance) {
    artServiceInstance = new ArtGenerationService(config);
  }
  return artServiceInstance;
}
