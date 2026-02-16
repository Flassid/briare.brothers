/**
 * DALL-E Provider for Pixel Art Generation
 * Uses OpenAI's DALL-E 3 with carefully crafted pixel art prompts
 */

import OpenAI from 'openai';
import type { 
  IArtProvider, 
  GenerationRequest, 
  AssetSize,
  ProviderConfig 
} from './types.js';
import { generateDallePrompt, ASSET_SIZES } from './PromptTemplates.js';

// DALL-E 3 supported sizes
type DalleSize = '1024x1024' | '1792x1024' | '1024x1792';

export class DalleProvider implements IArtProvider {
  name = 'dalle' as const;
  private client: OpenAI | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeout: 60000,
      maxRetries: 2,
      model: 'dall-e-3',
      ...config
    };
  }

  /**
   * Initialize OpenAI client
   */
  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      this.client = new OpenAI({
        apiKey,
        timeout: this.config.timeout
      });
    }
    
    return this.client;
  }

  /**
   * Check if OpenAI API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) return false;

      // Simple validation
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    } catch {
      return false;
    }
  }

  /**
   * Generate pixel art using DALL-E 3
   */
  async generate(request: GenerationRequest, _prompt?: string): Promise<Buffer> {
    const client = this.getClient();
    
    // Get target size (will need to resize after)
    const targetSize = this.resolveSize(request);
    
    // DALL-E 3 only supports specific sizes, use closest
    const dalleSize = this.getDalleSize(request);
    
    // Generate optimized prompt for pixel art
    const prompt = generateDallePrompt({
      description: request.description,
      type: request.type,
      size: targetSize,
      provider: 'dalle'
    });

    console.log(`[DALL-E] Generating ${request.type}: "${request.description}"`);
    console.log(`[DALL-E] Size: ${dalleSize} -> resize to ${targetSize.width}x${targetSize.height}`);

    // Generate image
    const response = await client.images.generate({
      model: this.config.model || 'dall-e-3',
      prompt,
      n: 1,
      size: dalleSize,
      quality: 'standard', // 'hd' costs more, not needed for pixel art
      response_format: 'url'
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL in DALL-E response');
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch DALL-E image: ${imageResponse.status}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Note: We return full resolution, resizing happens in ArtGenerationService
    // using sharp to maintain pixel art quality
    return buffer;
  }

  /**
   * Get best DALL-E size for asset type
   */
  private getDalleSize(request: GenerationRequest): DalleSize {
    // DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
    
    if (request.type === 'scene') {
      // Landscape for scenes
      return '1792x1024';
    }
    
    // Square for characters/monsters
    return '1024x1024';
  }

  /**
   * Resolve target size from request
   */
  private resolveSize(request: GenerationRequest): AssetSize {
    if (request.size) {
      return request.size;
    }
    return ASSET_SIZES[request.type][0];
  }

  /**
   * Estimate generation time
   */
  estimateTimeMs(_request: GenerationRequest): number {
    // DALL-E 3 is fairly consistent
    // Typical generation: 5-15 seconds
    return 10000;
  }

  /**
   * Estimate cost per generation
   */
  estimateCost(request: GenerationRequest): number {
    // DALL-E 3 pricing (as of 2024):
    // Standard quality:
    //   1024x1024: $0.040
    //   1024x1792 or 1792x1024: $0.080
    
    if (request.type === 'scene') {
      return 0.080; // Landscape
    }
    return 0.040; // Square
  }
}

/**
 * DALL-E specific prompt tips for pixel art
 */
export const DALLE_PROMPT_TIPS = {
  // Key phrases that help DALL-E produce better pixel art
  styleKeywords: [
    'pixel art',
    '16-bit',
    '32-bit',
    'retro video game',
    'classic RPG style',
    'limited color palette',
    'no anti-aliasing',
    'crisp pixel edges'
  ],
  
  // Reference games help DALL-E understand the style
  referenceGames: [
    'Final Fantasy VI',
    'Chrono Trigger',
    'Secret of Mana',
    'Earthbound',
    'Dragon Quest'
  ],
  
  // Common issues and how to avoid them
  avoidIssues: {
    'smooth gradients': 'Explicitly request "no gradients" or "flat colors"',
    'realistic style': 'Emphasize "retro game asset" and reference games',
    'wrong aspect ratio': 'DALL-E will reframe, resize after with sharp',
    'inconsistent style': 'Include game references and be very specific'
  }
};
