/**
 * Advanced Character Sprite Sheet Generator
 * Generates full sprite sheets with multiple angles, poses, and animations
 * Includes background removal for transparency
 */

import sharp from 'sharp';

// Sprite configuration
const SPRITE_CONFIG = {
  frameSize: 128, // Each frame is 128x128
  poses: {
    // Idle animations (4 directions)
    idle_front: { row: 0, frames: 2, description: 'standing idle, facing forward' },
    idle_back: { row: 1, frames: 2, description: 'standing idle, facing away/back view' },
    idle_left: { row: 2, frames: 2, description: 'standing idle, facing left, side profile' },
    idle_right: { row: 3, frames: 2, description: 'standing idle, facing right, side profile' },
    
    // Walk animations (4 directions)
    walk_front: { row: 4, frames: 4, description: 'walking forward, front view' },
    walk_back: { row: 5, frames: 4, description: 'walking away, back view' },
    walk_left: { row: 6, frames: 4, description: 'walking left, side profile' },
    walk_right: { row: 7, frames: 4, description: 'walking right, side profile' },
    
    // Combat animations
    attack: { row: 8, frames: 4, description: 'attacking with weapon, action pose' },
    cast: { row: 9, frames: 4, description: 'casting magic spell, magical energy' },
    
    // Special abilities
    powerup: { row: 10, frames: 3, description: 'powering up, glowing aura' },
    special: { row: 11, frames: 4, description: 'ultimate ability, dramatic pose' },
    
    // Status animations
    hurt: { row: 12, frames: 2, description: 'taking damage, pain expression' },
    death: { row: 13, frames: 3, description: 'falling down defeated' },
    victory: { row: 14, frames: 2, description: 'victorious celebration pose' },
  }
};

export interface SpriteFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string; // Individual frame as data URL
}

export interface AnimationDef {
  name: string;
  frames: string[]; // Frame names
  frameRate: number;
  loop: boolean;
}

export interface CharacterSpriteSheet {
  id: string;
  characterName: string;
  characterClass: string;
  characterRace: string;
  sheetUrl: string; // Full sheet as data URL
  frameWidth: number;
  frameHeight: number;
  frames: SpriteFrame[];
  animations: AnimationDef[];
  generatedAt: number;
}

// Background removal using sharp
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Convert to raw pixels
    const { data, info } = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const pixels = new Uint8Array(data);
    const { width, height, channels } = info;
    
    // Sample corner colors to detect background
    const corners = [
      getPixelColor(pixels, 0, 0, width, channels),
      getPixelColor(pixels, width - 1, 0, width, channels),
      getPixelColor(pixels, 0, height - 1, width, channels),
      getPixelColor(pixels, width - 1, height - 1, width, channels),
    ];
    
    // Find most common corner color (likely background)
    const bgColor = findMostCommonColor(corners);
    const tolerance = 30; // Color similarity tolerance
    
    // Create alpha channel
    const outputChannels = 4; // RGBA
    const outputData = Buffer.alloc(width * height * outputChannels);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * channels;
        const dstIdx = (y * width + x) * outputChannels;
        
        const r = pixels[srcIdx];
        const g = pixels[srcIdx + 1];
        const b = pixels[srcIdx + 2];
        
        // Check if pixel is similar to background
        const isBackground = colorDistance(
          { r, g, b },
          bgColor
        ) < tolerance;
        
        outputData[dstIdx] = r;
        outputData[dstIdx + 1] = g;
        outputData[dstIdx + 2] = b;
        outputData[dstIdx + 3] = isBackground ? 0 : 255; // Alpha
      }
    }
    
    // Convert back to PNG with alpha
    return sharp(outputData, {
      raw: { width, height, channels: 4 }
    })
      .png()
      .toBuffer();
      
  } catch (error) {
    console.error('[BgRemoval] Error:', error);
    return imageBuffer; // Return original if removal fails
  }
}

function getPixelColor(pixels: Uint8Array, x: number, y: number, width: number, channels: number) {
  const idx = (y * width + x) * channels;
  return {
    r: pixels[idx],
    g: pixels[idx + 1],
    b: pixels[idx + 2]
  };
}

function findMostCommonColor(colors: { r: number; g: number; b: number }[]) {
  // Simple average for now
  const avg = colors.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: Math.round(avg.r / colors.length),
    g: Math.round(avg.g / colors.length),
    b: Math.round(avg.b / colors.length)
  };
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

async function generateImageWithImagen(prompt: string, apiKey: string): Promise<Buffer | null> {
  const model = 'imagen-4.0-generate-001';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[SpriteSheet] Imagen API error:', error);
      return null;
    }

    const data = await response.json() as any;
    
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
    }
    
    return null;
  } catch (error) {
    console.error('[SpriteSheet] Imagen fetch error:', error);
    return null;
  }
}

export async function generateCharacterSpriteSheet(
  character: { name: string; race: string; class: string; hairColor?: string; gender?: string },
  onProgress?: (message: string, progress: number) => void
): Promise<CharacterSpriteSheet> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  
  const frames: SpriteFrame[] = [];
  const animations: AnimationDef[] = [];
  
  // Character description for consistent generation
  const charDesc = `${character.gender || 'heroic'} ${character.race} ${character.class} with ${character.hairColor || 'dark'} hair, fantasy RPG character`;
  
  // Generate key poses (not all frames, just key ones to save time/cost)
  const keyPoses = [
    { name: 'idle_front', desc: 'standing idle pose, facing camera, front view' },
    { name: 'idle_side', desc: 'standing idle pose, side profile view' },
    { name: 'walk_1', desc: 'mid-stride walking pose' },
    { name: 'attack_1', desc: 'attacking with weapon raised, action pose' },
    { name: 'attack_2', desc: 'weapon swing follow-through, dynamic pose' },
    { name: 'cast', desc: 'casting magic, hands glowing with energy' },
    { name: 'powerup', desc: 'powering up, glowing aura surrounding body' },
    { name: 'special', desc: 'ultimate ability pose, dramatic lighting, energy burst' },
    { name: 'hurt', desc: 'taking damage, recoiling in pain' },
    { name: 'victory', desc: 'victorious pose, triumphant' },
  ];
  
  const totalPoses = keyPoses.length;
  let generated = 0;
  
  for (const pose of keyPoses) {
    try {
      onProgress?.(`Generating ${pose.name}...`, (generated / totalPoses) * 100);
      
      const prompt = `${charDesc}, ${pose.desc}, full body, centered in frame, solid white background, pixel art style, 2D game sprite, clean lines, vibrant colors`;
      
      console.log(`  [SpriteSheet] Generating: ${pose.name}`);
      
      const buffer = await generateImageWithImagen(prompt, apiKey);
      
      if (buffer) {
        // Remove background
        const transparentBuffer = await removeBackground(buffer);
        
        // Resize to standard frame size
        const resizedBuffer = await sharp(transparentBuffer)
          .resize(SPRITE_CONFIG.frameSize, SPRITE_CONFIG.frameSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
        
        const dataUrl = `data:image/png;base64,${resizedBuffer.toString('base64')}`;
        
        frames.push({
          name: pose.name,
          x: generated * SPRITE_CONFIG.frameSize,
          y: 0,
          width: SPRITE_CONFIG.frameSize,
          height: SPRITE_CONFIG.frameSize,
          imageUrl: dataUrl
        });
        
        console.log(`  ✓ Generated: ${pose.name}`);
      }
      
      generated++;
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.error(`  ✗ Failed: ${pose.name}`, error);
      generated++;
    }
  }
  
  // Build animations from frames
  animations.push(
    { name: 'idle', frames: ['idle_front'], frameRate: 2, loop: true },
    { name: 'walk', frames: ['idle_front', 'walk_1', 'idle_front', 'walk_1'], frameRate: 8, loop: true },
    { name: 'attack', frames: ['attack_1', 'attack_2', 'idle_front'], frameRate: 10, loop: false },
    { name: 'cast', frames: ['cast', 'powerup', 'cast'], frameRate: 6, loop: false },
    { name: 'special', frames: ['powerup', 'special', 'special', 'idle_front'], frameRate: 8, loop: false },
    { name: 'hurt', frames: ['hurt', 'idle_front'], frameRate: 4, loop: false },
    { name: 'victory', frames: ['victory', 'victory'], frameRate: 2, loop: true },
  );
  
  // Create combined sprite sheet
  let sheetUrl = '';
  if (frames.length > 0) {
    try {
      const sheetWidth = frames.length * SPRITE_CONFIG.frameSize;
      const sheetHeight = SPRITE_CONFIG.frameSize;
      
      // Compose all frames into one sheet
      const composites = await Promise.all(
        frames.map(async (frame, idx) => {
          const buffer = Buffer.from(frame.imageUrl.split(',')[1], 'base64');
          return {
            input: buffer,
            left: idx * SPRITE_CONFIG.frameSize,
            top: 0
          };
        })
      );
      
      const sheetBuffer = await sharp({
        create: {
          width: sheetWidth,
          height: sheetHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite(composites)
        .png()
        .toBuffer();
      
      sheetUrl = `data:image/png;base64,${sheetBuffer.toString('base64')}`;
    } catch (err) {
      console.error('[SpriteSheet] Failed to compose sheet:', err);
    }
  }
  
  onProgress?.('Sprite sheet complete!', 100);
  
  return {
    id: `sprite_${character.name}_${Date.now()}`,
    characterName: character.name,
    characterClass: character.class,
    characterRace: character.race,
    sheetUrl,
    frameWidth: SPRITE_CONFIG.frameSize,
    frameHeight: SPRITE_CONFIG.frameSize,
    frames,
    animations,
    generatedAt: Date.now()
  };
}
