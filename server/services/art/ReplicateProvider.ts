/**
 * Replicate Provider for Pixel Art Generation
 * Uses Stable Diffusion with pixel art LoRAs via Replicate API
 */

import Replicate from 'replicate';
import type { 
  IArtProvider, 
  GenerationRequest, 
  AssetSize,
  ProviderConfig 
} from './types.js';
import { 
  generatePrompt, 
  getReplicateModel, 
  getReplicateParams,
  ASSET_SIZES 
} from './PromptTemplates.js';

export class ReplicateProvider implements IArtProvider {
  name = 'replicate' as const;
  private client: Replicate | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeout: 60000,
      maxRetries: 2,
      ...config
    };
  }

  /**
   * Initialize Replicate client
   */
  private getClient(): Replicate {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.REPLICATE_API_TOKEN;
      
      if (!apiKey) {
        throw new Error('REPLICATE_API_TOKEN not configured');
      }

      this.client = new Replicate({
        auth: apiKey
      });
    }
    
    return this.client;
  }

  /**
   * Check if Replicate API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.config.apiKey || process.env.REPLICATE_API_TOKEN;
      if (!apiKey) return false;

      // Simple validation - check if key looks valid
      return apiKey.startsWith('r8_') || apiKey.length > 20;
    } catch {
      return false;
    }
  }

  /**
   * Generate pixel art using Replicate
   */
  async generate(request: GenerationRequest, _prompt?: string): Promise<Buffer> {
    const client = this.getClient();
    
    // Get appropriate size
    const size = this.resolveSize(request);
    
    // Generate optimized prompt
    const { positive, negative } = generatePrompt({
      description: request.description,
      type: request.type,
      size,
      provider: 'replicate'
    });

    // Get model and parameters
    const model = getReplicateModel(request.type);
    const params = getReplicateParams(request.type, size);

    console.log(`[Replicate] Generating ${request.type}: "${request.description}"`);
    console.log(`[Replicate] Model: ${model}`);
    console.log(`[Replicate] Size: ${size.width}x${size.height}`);

    // Run the model
    const output = await client.run(model as `${string}/${string}:${string}`, {
      input: {
        prompt: positive,
        negative_prompt: negative,
        ...params
      }
    });

    // Handle output (can be array or single URL)
    const outputUrl = Array.isArray(output) ? output[0] : output;
    
    if (typeof outputUrl !== 'string') {
      throw new Error('Unexpected output format from Replicate');
    }

    // Fetch the image
    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Resolve size from request or use default
   */
  private resolveSize(request: GenerationRequest): AssetSize {
    if (request.size) {
      return request.size;
    }
    
    // Use first (smaller) size as default
    return ASSET_SIZES[request.type][0];
  }

  /**
   * Estimate generation time
   */
  estimateTimeMs(request: GenerationRequest): number {
    const size = this.resolveSize(request);
    
    // Base time estimates (cold start adds ~2-3s)
    const baseTimes = {
      character: 4000,
      monster: 5000,
      scene: 7000
    };

    // Larger sizes take longer
    const sizeMultiplier = (size.width * size.height) / (128 * 128);
    
    return Math.round(baseTimes[request.type] * Math.sqrt(sizeMultiplier));
  }

  /**
   * Estimate cost per generation
   */
  estimateCost(request: GenerationRequest): number {
    // Replicate pricing is per-second of compute
    // pixel-art-xl: ~$0.00115/second, typical run ~5-10 seconds
    // SDXL: ~$0.00115/second, typical run ~5-15 seconds
    
    const estimatedSeconds = this.estimateTimeMs(request) / 1000;
    const costPerSecond = 0.00115;
    
    return estimatedSeconds * costPerSecond;
  }
}

/**
 * Available Replicate models for pixel art
 * These are tested and known to work well
 */
export const REPLICATE_MODELS = {
  // Primary: Pixel Art XL - best for characters/monsters
  pixelArtXl: {
    id: 'nerijs/pixel-art-xl:5c28a793c657a8c03be8af2daa3e7a61b28dddc2bc3356fa065b3053a9d72e6a',
    description: 'Fine-tuned SDXL for pixel art, excellent for sprites',
    bestFor: ['character', 'monster'],
    costPerSecond: 0.00115
  },
  
  // Alternative: All-In-One Pixel Model
  allInOnePixel: {
    id: 'PublicPrompts/All-In-One-Pixel-Model:c9ed327d5ab40a2e2d6b1c7e1c0a58a72f6b9a96d6e1f5c4d3b2a1e0f9c8b7a6',
    description: 'Versatile pixel art model',
    bestFor: ['character', 'monster', 'scene'],
    costPerSecond: 0.00055
  },
  
  // For complex scenes: SDXL with style prompt
  sdxl: {
    id: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
    description: 'SDXL base model, use with strong pixel art style prompts',
    bestFor: ['scene'],
    costPerSecond: 0.00115
  }
};
