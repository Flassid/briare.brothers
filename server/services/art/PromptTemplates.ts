/**
 * Pixel Art Prompt Templates
 * Carefully crafted prompts for consistent retro RPG aesthetic
 */

import type { AssetType, AssetSize, ArtProvider } from './types.js';

// Style modifiers that ensure pixel art aesthetic
const PIXEL_ART_STYLE = {
  base: [
    'pixel art',
    'retro video game style',
    'limited color palette',
    'clean pixel edges',
    'no anti-aliasing',
    'crisp pixels'
  ],
  
  character: [
    '16-bit RPG character portrait',
    'front-facing',
    'shoulders up portrait',
    'expressive face',
    'black outline',
    'transparent background'
  ],
  
  monster: [
    '32-bit RPG monster sprite',
    'full body',
    'menacing pose',
    'game asset style',
    'detailed but stylized',
    'dramatic lighting'
  ],
  
  scene: [
    '16-bit RPG background',
    'side-scrolling perspective',
    'atmospheric lighting',
    'environmental storytelling',
    'layered depth',
    'moody ambiance'
  ]
};

// Negative prompts to avoid common issues
const NEGATIVE_PROMPTS = {
  common: [
    'blurry',
    'realistic',
    'photographic',
    '3D render',
    'smooth gradients',
    'anti-aliased',
    'high resolution photograph',
    'watermark',
    'signature',
    'text'
  ],
  
  character: [
    'full body',
    'action pose',
    'multiple characters',
    'background scenery'
  ],
  
  monster: [
    'cute',
    'friendly',
    'cartoon',
    'chibi'
  ],
  
  scene: [
    'characters',
    'people',
    'modern',
    'futuristic technology'
  ]
};

// Quality enhancers for different providers
const QUALITY_MODIFIERS = {
  replicate: [
    'masterpiece',
    'best quality',
    'highly detailed pixel art'
  ],
  
  dalle: [
    'high quality',
    'professional game asset',
    'polished pixel art'
  ]
};

export interface PromptOptions {
  description: string;
  type: AssetType;
  size: AssetSize;
  provider: ArtProvider;
  additionalStyles?: string[];
  excludeStyles?: string[];
}

export interface GeneratedPrompt {
  positive: string;
  negative: string;
  stylePreset?: string;
}

/**
 * Normalizes description for cache key generation
 * Removes extra whitespace, lowercases, removes special chars
 */
export function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates cache key from request parameters
 */
export function generateCacheKey(
  type: AssetType,
  description: string,
  size: AssetSize
): string {
  const normalized = normalizeDescription(description);
  const sizeKey = `${size.width}x${size.height}`;
  const input = `${type}:${normalized}:${sizeKey}`;
  
  // Simple hash function (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `${type}_${Math.abs(hash).toString(36)}`;
}

/**
 * Generates optimized prompts for pixel art generation
 */
export function generatePrompt(options: PromptOptions): GeneratedPrompt {
  const { description, type, provider, additionalStyles = [], excludeStyles = [] } = options;
  
  // Build positive prompt
  const positiveElements: string[] = [];
  
  // Add quality modifiers first (important for Replicate/SD)
  if (provider === 'replicate' || provider === 'hybrid') {
    positiveElements.push(...QUALITY_MODIFIERS.replicate);
  } else {
    positiveElements.push(...QUALITY_MODIFIERS.dalle);
  }
  
  // Add base pixel art style
  positiveElements.push(...PIXEL_ART_STYLE.base);
  
  // Add type-specific styles
  positiveElements.push(...PIXEL_ART_STYLE[type]);
  
  // Add the actual description
  positiveElements.push(description);
  
  // Add any additional styles
  positiveElements.push(...additionalStyles);
  
  // Filter out excluded styles
  const filteredPositive = positiveElements.filter(
    style => !excludeStyles.some(exc => style.toLowerCase().includes(exc.toLowerCase()))
  );
  
  // Build negative prompt
  const negativeElements = [
    ...NEGATIVE_PROMPTS.common,
    ...NEGATIVE_PROMPTS[type]
  ];
  
  return {
    positive: filteredPositive.join(', '),
    negative: negativeElements.join(', ')
  };
}

/**
 * Generates DALL-E specific prompt (single combined prompt)
 */
export function generateDallePrompt(options: PromptOptions): string {
  const { description, type } = options;
  
  const styleGuide = {
    character: `Create a 16-bit pixel art portrait of ${description}. 
      The style should be reminiscent of classic RPG games like Final Fantasy VI or Chrono Trigger. 
      Show only head and shoulders, facing forward. 
      Use a limited color palette with clean pixel edges, no anti-aliasing. 
      Include a black outline around the character. 
      The background should be transparent or a single solid color.
      Make it look like authentic retro game art.`,
    
    monster: `Create a 32-bit pixel art monster sprite of ${description}. 
      Style it like a creature from classic RPGs such as Final Fantasy or Dragon Quest. 
      Show the full body in a menacing battle pose. 
      Use dramatic lighting and a limited color palette with crisp pixels. 
      No anti-aliasing, clean pixel edges throughout.
      Make it look like an authentic retro game enemy sprite.`,
    
    scene: `Create a 16-bit pixel art background scene of ${description}. 
      Style it like environments from classic RPGs like Secret of Mana or Earthbound. 
      Use a side-scrolling perspective with layered depth. 
      Include atmospheric lighting and moody ambiance. 
      Limited color palette with clean pixel edges, no gradients or anti-aliasing.
      Make it look like an authentic retro game background.`
  };
  
  return styleGuide[type];
}

/**
 * Get Replicate model recommendation based on asset type
 */
export function getReplicateModel(type: AssetType): string {
  // These are real Replicate model identifiers for pixel art
  const models: Record<AssetType, string> = {
    // All-in-one pixel art model - great for characters/monsters
    character: 'nerijs/pixel-art-xl:5c28a793c657a8c03be8af2daa3e7a61b28dddc2bc3356fa065b3053a9d72e6a',
    monster: 'nerijs/pixel-art-xl:5c28a793c657a8c03be8af2daa3e7a61b28dddc2bc3356fa065b3053a9d72e6a',
    // For scenes, SDXL with pixel art style works well
    scene: 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc'
  };
  
  return models[type];
}

/**
 * Get generation parameters for Replicate
 */
export function getReplicateParams(type: AssetType, size: AssetSize): Record<string, unknown> {
  const baseParams = {
    num_outputs: 1,
    guidance_scale: 7.5,
    num_inference_steps: 30,
  };
  
  if (type === 'scene') {
    return {
      ...baseParams,
      width: size.width,
      height: size.height,
      scheduler: 'K_EULER',
      refine: 'expert_ensemble_refiner',
      high_noise_frac: 0.8
    };
  }
  
  // For character/monster using pixel-art-xl
  return {
    ...baseParams,
    width: size.width,
    height: size.height,
    // Pixel art specific
    pixel_size: type === 'character' ? 4 : 2,
  };
}

/**
 * Example prompts for testing
 */
export const EXAMPLE_PROMPTS = {
  character: [
    'grizzled dwarf blacksmith with mechanical arm and leather apron',
    'elven ranger with silver hair and emerald cloak',
    'young human wizard with glasses and glowing staff',
    'tiefling rogue with red skin and hooded cloak',
    'half-orc barbarian with tribal tattoos and fur armor'
  ],
  
  monster: [
    'shadow drake with void eyes and ethereal wings',
    'corrupted forest elemental made of twisted bark and thorns',
    'crystal golem with glowing runes and cracked surface',
    'swamp hydra with three decaying heads',
    'flame spirit in the shape of a dancing serpent'
  ],
  
  scene: [
    'dark dungeon corridor with flickering torches and ancient stone',
    'mystical forest clearing at twilight with fireflies',
    'abandoned throne room with broken stained glass windows',
    'underground mushroom cavern with bioluminescent fungi',
    'frozen mountain pass with howling wind and snow'
  ]
};
