/**
 * AI Sprite Generator using Replicate
 * Generates pixel art character sprites on demand
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Sprite cache to avoid regenerating
const spriteCache = new Map<string, string>();

interface CharacterDetails {
  name: string;
  race: string;
  class: string;
  gender?: string;
  hairColor?: string;
  skinTone?: string;
}

/**
 * Generate a pixel art character sprite
 */
export async function generateCharacterSprite(character: CharacterDetails): Promise<string> {
  const cacheKey = `${character.race}_${character.class}_${character.hairColor || 'default'}`;
  
  // Check cache first
  if (spriteCache.has(cacheKey)) {
    console.log(`🎨 Using cached sprite for ${cacheKey}`);
    return spriteCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating sprite for: ${character.name} (${character.race} ${character.class})`);

  // Build the prompt for pixel art character
  const raceDescriptions: Record<string, string> = {
    human: 'human',
    elf: 'elf with pointed ears',
    dwarf: 'short dwarf with beard',
    halfling: 'small halfling hobbit',
    dragonborn: 'dragonborn with scales and dragon head',
    tiefling: 'tiefling with horns and red skin',
  };

  const classDescriptions: Record<string, string> = {
    warrior: 'warrior with sword and armor, knight',
    mage: 'mage wizard with robe and pointy hat, magic staff',
    rogue: 'rogue thief with hood and daggers, dark cloak',
    cleric: 'cleric priest with holy robes and staff',
    ranger: 'ranger archer with bow and green cloak',
    paladin: 'paladin holy knight with shining armor and shield',
  };

  const race = raceDescriptions[character.race] || character.race;
  const charClass = classDescriptions[character.class] || character.class;
  const hair = character.hairColor || 'brown';

  const prompt = `pixel art, 32x32 sprite, chibi RPG character, ${race} ${charClass}, ${hair} hair, fantasy game character, retro 16-bit style, clean pixel art, centered, transparent background, single character, front facing, cute chibi proportions, vibrant colors`;

  const negativePrompt = 'blurry, realistic, photo, 3d render, multiple characters, text, watermark, signature, frame, border, background scenery';

  try {
    // Using SDXL with pixel art styling
    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      {
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt,
          width: 512,  // Generate larger, we'll scale down
          height: 512,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
        }
      }
    );

    // Output is an array of image URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    console.log(`✅ Sprite generated: ${imageUrl}`);
    
    // Cache it
    spriteCache.set(cacheKey, imageUrl as string);
    
    return imageUrl as string;
  } catch (error) {
    console.error('Sprite generation error:', error);
    throw error;
  }
}

/**
 * Generate a monster/enemy sprite
 */
export async function generateEnemySprite(enemyType: string): Promise<string> {
  const cacheKey = `enemy_${enemyType}`;
  
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating enemy sprite: ${enemyType}`);

  const enemyPrompts: Record<string, string> = {
    skeleton: 'skeleton warrior undead, bones, glowing red eyes',
    goblin: 'green goblin with pointy ears and crude weapon',
    orc: 'large orc warrior with tusks and battle axe',
    slime: 'blue slime blob monster, gelatinous',
    dragon: 'small dragon wyrmling with wings',
    zombie: 'zombie undead shambling corpse',
    spider: 'giant spider with multiple eyes',
    rat: 'giant rat dungeon creature',
  };

  const enemyDesc = enemyPrompts[enemyType] || enemyType;

  const prompt = `pixel art, 32x32 sprite, ${enemyDesc}, fantasy RPG monster, retro 16-bit game style, clean pixel art, centered, transparent background, single creature, menacing, front facing`;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      {
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, realistic, photo, 3d, multiple, text, watermark',
          width: 512,
          height: 512,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    spriteCache.set(cacheKey, imageUrl as string);
    
    return imageUrl as string;
  } catch (error) {
    console.error('Enemy sprite generation error:', error);
    throw error;
  }
}

/**
 * Generate dungeon environment tile
 */
export async function generateTileSprite(tileType: string): Promise<string> {
  const cacheKey = `tile_${tileType}`;
  
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  const tilePrompts: Record<string, string> = {
    floor: 'stone dungeon floor tile, cobblestone, dark fantasy',
    wall: 'dungeon brick wall tile, dark stone, mossy',
    door: 'wooden dungeon door with iron bands',
    chest: 'treasure chest, golden trim, wooden',
    torch: 'wall torch with flame, medieval',
  };

  const tileDesc = tilePrompts[tileType] || tileType;

  const prompt = `pixel art, 32x32 tile, ${tileDesc}, seamless texture, retro game style, top-down RPG, clean pixels`;

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      {
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, realistic, photo, 3d, character, person',
          width: 512,
          height: 512,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7,
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    spriteCache.set(cacheKey, imageUrl as string);
    
    return imageUrl as string;
  } catch (error) {
    console.error('Tile sprite generation error:', error);
    throw error;
  }
}

/**
 * Get cached sprite URL or null
 */
export function getCachedSprite(key: string): string | null {
  return spriteCache.get(key) || null;
}

/**
 * Clear the sprite cache
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
}
