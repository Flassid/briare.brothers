/**
 * Art Generation Service Types
 * Defines all interfaces for the pixel art generation pipeline
 */

export type AssetType = 'character' | 'monster' | 'scene' | 'room' | 'effect';
export type GenerationPriority = 'high' | 'normal' | 'low';
export type GenerationStatus = 'queued' | 'generating' | 'complete' | 'failed' | 'cached';
export type ArtProvider = 'replicate' | 'dalle' | 'gemini' | 'hybrid';

export interface AssetSize {
  width: number;
  height: number;
}

export const ASSET_SIZES: Record<AssetType, AssetSize[]> = {
  character: [
    { width: 64, height: 64 },
    { width: 128, height: 128 }
  ],
  monster: [
    { width: 128, height: 128 },
    { width: 256, height: 256 }
  ],
  scene: [
    { width: 512, height: 288 },
    { width: 1024, height: 576 }
  ],
  room: [
    { width: 1024, height: 768 },
    { width: 1920, height: 1080 }
  ],
  effect: [
    { width: 64, height: 64 },
    { width: 128, height: 128 }
  ]
};

export interface GenerationRequest {
  type: AssetType;
  description: string;
  size?: AssetSize;
  priority?: GenerationPriority;
  waitForResult?: boolean;
  sessionId?: string;  // For WebSocket notifications
  metadata?: Record<string, unknown>;
}

export interface GenerationJob {
  id: string;
  request: GenerationRequest;
  status: GenerationStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: GenerationResult;
  error?: string;
  attempts: number;
}

export interface GenerationResult {
  url: string;
  localPath: string;
  cacheKey: string;
  width: number;
  height: number;
  provider: ArtProvider;
  generationTimeMs: number;
  cached: boolean;
}

export interface QueuedResponse {
  jobId: string;
  status: 'queued';
  placeholder: string;
  estimatedTimeMs: number;
  position: number;
}

export interface CachedResponse {
  status: 'ready';
  url: string;
  cached: true;
  cacheKey: string;
}

export interface GeneratingResponse {
  jobId: string;
  status: 'generating';
  startedAt: Date;
}

export type ArtResponse = QueuedResponse | CachedResponse | GeneratingResponse | GenerationResult;

export interface CacheEntry {
  cacheKey: string;
  type: AssetType;
  description: string;
  normalizedDescription: string;
  filePath: string;
  url: string;
  width: number;
  height: number;
  provider: ArtProvider;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  sizeBytes: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  entriesByType: Record<AssetType, number>;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface IArtProvider {
  name: ArtProvider;
  isAvailable(): Promise<boolean>;
  generate(request: GenerationRequest, prompt: string): Promise<Buffer>;
  estimateTimeMs(request: GenerationRequest): number;
  estimateCost(request: GenerationRequest): number;
}

export interface ArtServiceConfig {
  provider: ArtProvider;
  cacheDir: string;
  cacheTtlDays: number;
  maxConcurrentGenerations: number;
  generationTimeoutMs: number;
  replicateConfig?: ProviderConfig;
  dalleConfig?: ProviderConfig;
  geminiConfig?: ProviderConfig;
}

export interface ArtServiceEvents {
  'job:queued': (job: GenerationJob) => void;
  'job:started': (job: GenerationJob) => void;
  'job:complete': (job: GenerationJob, result: GenerationResult) => void;
  'job:failed': (job: GenerationJob, error: Error) => void;
  'cache:hit': (cacheKey: string) => void;
  'cache:miss': (cacheKey: string) => void;
}
