/**
 * Gemini Image Provider
 * 
 * Uses Google's Imagen 4.0 or Nano Banana for image generation.
 * Specialized for pixel art sprites and game assets.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IArtProvider, GenerationRequest, ArtProvider } from './types';
import { generatePrompt } from './PromptTemplates';

// Available image generation models (billing enabled)
export const GEMINI_IMAGE_MODELS = {
  imagen4: 'imagen-4.0-generate-001',           // Google Imagen 4.0 - stable
  imagen4Ultra: 'imagen-4.0-ultra-generate-001', // Ultra quality (slower)
  imagen4Fast: 'imagen-4.0-fast-generate-001',  // Fast version
  gemini3Image: 'gemini-3-pro-image-preview',   // Gemini 3 Pro image
  geminiImage: 'gemini-2.0-flash-exp-image-generation', // Gemini 2.0 (experimental)
};

export class GeminiImageProvider implements IArtProvider {
  name: ArtProvider = 'gemini' as ArtProvider;
  private genAI: GoogleGenerativeAI;
  private model: string;
  private apiKey: string;

  constructor(config?: { apiKey?: string; model?: string }) {
    this.apiKey = config?.apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required for GeminiImageProvider');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Default to Imagen 4.0 (best quality with billing)
    this.model = config?.model || GEMINI_IMAGE_MODELS.imagen4;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // For Imagen models, check via list models endpoint
      if (this.model.startsWith('imagen-') || this.model.includes('nano-banana')) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}`,
          { headers: { 'x-goog-api-key': this.apiKey } }
        );
        return response.ok;
      }
      
      // For Gemini models, try generateContent
      const model = this.genAI.getGenerativeModel({ model: this.model });
      await model.generateContent('test');
      return true;
    } catch (error: any) {
      console.warn('Gemini image provider not available:', error.message);
      return false;
    }
  }

  async generate(request: GenerationRequest, _prompt?: string): Promise<Buffer> {
    // Build the image generation prompt with pixel art specifics
    const imagePrompt = this.buildImagePrompt(request);

    console.log(`[GeminiImage] Generating with model: ${this.model}`);
    console.log(`[GeminiImage] Prompt: ${imagePrompt.slice(0, 100)}...`);

    // Use Imagen API endpoint directly for imagen models
    if (this.model.startsWith('imagen-') || this.model.includes('nano-banana')) {
      return this.generateWithImagen(imagePrompt, request);
    }

    // Use Gemini native image generation
    return this.generateWithGemini(imagePrompt, request);
  }

  /**
   * Generate using Imagen API (REST endpoint)
   */
  private async generateWithImagen(prompt: string, request: GenerationRequest): Promise<Buffer> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:predict`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: request.size 
            ? (request.size.width === request.size.height ? '1:1' : '16:9')
            : '1:1',
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GeminiImage] Imagen API error:', error);
      throw new Error(`Imagen API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    
    // Extract image from response
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
    }

    throw new Error('No image data in Imagen response');
  }

  /**
   * Generate using Gemini native image output
   */
  private async generateWithGemini(prompt: string, request: GenerationRequest): Promise<Buffer> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.model,
      generationConfig: {
        temperature: 0.8,
      }
    });

    try {
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'image/png',
        } as any
      });

      const response = result.response;
      const candidate = response.candidates?.[0];
      
      if (!candidate?.content?.parts) {
        throw new Error('No image content in response');
      }

      // Find image part in response
      for (const part of candidate.content.parts) {
        if ('inlineData' in part && part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }

      throw new Error('No image data in Gemini response');
      
    } catch (error: any) {
      console.error('[GeminiImage] Gemini image generation failed:', error.message);
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }

  private buildImagePrompt(request: GenerationRequest): string {
    const sizeDesc = request.size 
      ? `${request.size.width}x${request.size.height} pixels`
      : '64x64 pixels';

    return `Generate a pixel art sprite image:

STYLE: 16-bit/32-bit retro pixel art style, suitable for a fantasy RPG game
SIZE: ${sizeDesc}
TRANSPARENCY: Use transparent background (PNG with alpha)
PALETTE: Limited color palette (16-32 colors max)

SUBJECT: ${request.description}

TYPE: ${request.type}
${request.type === 'character' ? 'Create a character sprite suitable for a 2D RPG, front-facing idle pose' : ''}
${request.type === 'monster' ? 'Create a monster/enemy sprite with threatening pose' : ''}
${request.type === 'scene' ? 'Create a tileable background scene or environment' : ''}

Additional details from the game:
${request.metadata ? JSON.stringify(request.metadata) : 'Standard fantasy setting'}

Generate only the image, no text or explanations.`;
  }

  estimateTimeMs(request: GenerationRequest): number {
    // Gemini is fast
    switch (request.type) {
      case 'character':
        return 3000;
      case 'monster':
        return 4000;
      case 'scene':
        return 6000;
      default:
        return 4000;
    }
  }

  estimateCost(request: GenerationRequest): number {
    // Gemini API is free tier / very cheap
    return 0.001; // Essentially free
  }
}

/**
 * Fallback: Use Gemini to enhance prompts for other image generators
 * This is useful when native image gen isn't available
 */
export async function enhancePromptWithGemini(
  description: string,
  assetType: string,
  apiKey?: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert pixel art director for a fantasy RPG game.

Given this description: "${description}"
Asset type: ${assetType}

Create a detailed prompt for a pixel art image generator. Include:
1. Exact pose and perspective
2. Color palette suggestions (fantasy RPG style)
3. Key visual details that read well at small sizes
4. Lighting direction
5. Any effects (glow, shadows, etc)

Keep the prompt under 200 words. Output ONLY the prompt, no explanations.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
