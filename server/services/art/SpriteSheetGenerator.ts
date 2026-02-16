/**
 * AI Sprite Sheet Generator (Gemini Imagen 3)
 * 
 * Generates complete sprite sheets with multiple animation frames
 * using Google's Imagen 3 via Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Cache generated sheets
const sheetCache = new Map<string, GeneratedSpriteSheet>();

export interface SpriteFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  imageBase64?: string;
}

export interface AnimationDef {
  name: string;
  frames: string[];
  frameRate: number;
  loop: boolean;
}

export interface GeneratedSpriteSheet {
  id: string;
  type: 'character' | 'enemy' | 'tileset' | 'effect';
  sheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  frames: SpriteFrame[];
  animations: AnimationDef[];
  generatedAt: number;
}

/**
 * Generate image using Imagen 4.0 (billing enabled)
 */
async function generateImage(prompt: string): Promise<string | null> {
  try {
    // Use Imagen 4.0 (stable) with billing enabled
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            personGeneration: 'ALLOW_ALL',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen 4.0 API error:', response.status, errorText);
      
      // Try alternative endpoint for Gemini 2.0 Flash image gen
      return await generateImageGemini2Flash(prompt);
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0]) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      return `data:image/png;base64,${base64Image}`;
    }
    
    return null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return await generateImageGemini2Flash(prompt);
  }
}

/**
 * Fallback: Generate image using Gemini 2.0 Flash (experimental image gen)
 */
async function generateImageGemini2Flash(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini 2.0 Flash image gen error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Extract image from response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Gemini 2.0 Flash image gen failed:', error);
    return null;
  }
}

// ============ CHARACTER SPRITE SHEETS ============

interface CharacterConfig {
  name: string;
  race: string;
  class: string;
  hairColor?: string;
  primaryColor?: string;
}

/**
 * Generate a complete character sprite sheet with animations
 */
export async function generateCharacterSheet(config: CharacterConfig): Promise<GeneratedSpriteSheet> {
  const cacheKey = `char_${config.race}_${config.class}`;
  
  if (sheetCache.has(cacheKey)) {
    console.log(`🎨 Using cached character sheet: ${cacheKey}`);
    return sheetCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating character sprite sheet for ${config.name} (${config.race} ${config.class})...`);

  const raceDesc: Record<string, string> = {
    human: 'human',
    elf: 'elf with pointed ears, slender',
    dwarf: 'dwarf, short and stocky, bearded',
    halfling: 'halfling, small, cheerful',
    dragonborn: 'dragonborn with dragon head and scales',
    tiefling: 'tiefling with horns and tail',
  };

  const classDesc: Record<string, string> = {
    warrior: 'warrior knight with sword and armor',
    mage: 'mage wizard with robe, pointy hat, magic staff, glowing',
    rogue: 'rogue thief with hood, daggers, dark cloak',
    cleric: 'cleric priest with holy robes, glowing staff',
    ranger: 'ranger archer with bow, green cloak, quiver',
    paladin: 'paladin holy knight, shining armor, sword and shield',
  };

  const race = raceDesc[config.race] || config.race;
  const charClass = classDesc[config.class] || config.class;

  const frames: SpriteFrame[] = [];

  // Define the frames we need - just 1 for fast generation
  const frameDefinitions = [
    { name: 'idle_1', prompt: 'heroic standing pose, facing front, confident stance, ready for adventure' },
  ];

  const basePrompt = `pixel art sprite, 64x64 pixels, chibi RPG character, ${race} ${charClass}, retro 16-bit JRPG style, clean crisp pixels, black outline, solid color background, single character centered, vibrant colors, fantasy game character`;

  console.log(`  Generating character portrait with Imagen 4.0...`);

  for (let i = 0; i < frameDefinitions.length; i++) {
    const frameDef = frameDefinitions[i];
    
    try {
      console.log(`    Frame ${i + 1}/${frameDefinitions.length}: ${frameDef.name}`);
      
      const fullPrompt = `${basePrompt}, ${frameDef.prompt}. Do not include any text or watermarks.`;
      const imageUrl = await generateImage(fullPrompt);
      
      if (imageUrl) {
        frames.push({
          name: frameDef.name,
          x: i * 64,
          y: 0,
          width: 64,
          height: 64,
          imageUrl: imageUrl,
        });
        console.log(`    ✓ Generated ${frameDef.name}`);
      } else {
        console.log(`    ✗ Failed ${frameDef.name}, using placeholder`);
        frames.push({
          name: frameDef.name,
          x: i * 64,
          y: 0,
          width: 64,
          height: 64,
          imageUrl: createPlaceholderSprite(config.race, config.class, frameDef.name),
        });
      }
    } catch (error) {
      console.error(`    Failed to generate ${frameDef.name}:`, error);
      frames.push({
        name: frameDef.name,
        x: i * 64,
        y: 0,
        width: 64,
        height: 64,
        imageUrl: createPlaceholderSprite(config.race, config.class, frameDef.name),
      });
    }
  }

  const sheet: GeneratedSpriteSheet = {
    id: `sheet_${Date.now()}`,
    type: 'character',
    sheetUrl: frames[0]?.imageUrl || '',
    frameWidth: 64,
    frameHeight: 64,
    frames,
    animations: [
      { name: 'idle', frames: ['idle_1'], frameRate: 4, loop: true },
    ],
    generatedAt: Date.now(),
  };

  sheetCache.set(cacheKey, sheet);
  console.log(`✅ Character sheet generated with ${frames.length} frames`);
  
  return sheet;
}

// ============ ENEMY SPRITE SHEETS ============

interface EnemyConfig {
  type: string;
  variant?: string;
}

/**
 * Generate enemy sprite sheet
 */
export async function generateEnemySheet(config: EnemyConfig): Promise<GeneratedSpriteSheet> {
  const cacheKey = `enemy_${config.type}_${config.variant || 'default'}`;
  
  if (sheetCache.has(cacheKey)) {
    console.log(`🎨 Using cached enemy sheet: ${cacheKey}`);
    return sheetCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating enemy sprite sheet: ${config.type}...`);

  const enemyPrompts: Record<string, string> = {
    skeleton: 'skeleton warrior, bones, glowing red eyes, tattered armor, undead',
    goblin: 'goblin, green skin, pointy ears, crude weapon, sneaky',
    orc: 'orc warrior, large tusks, muscular, battle axe, fierce',
    slime: 'slime blob monster, gelatinous, translucent, bouncy',
    spider: 'giant spider, multiple eyes, hairy legs, venomous',
    zombie: 'zombie undead, rotting flesh, shambling, arms outstretched',
    bat: 'giant bat, wings spread, fangs, flying',
    rat: 'giant rat, mangy fur, red eyes, long tail',
    ghost: 'ghost spirit, translucent, floating, ethereal glow',
    demon: 'demon imp, red skin, horns, wings, fire',
  };

  const enemyDesc = enemyPrompts[config.type] || config.type;
  const basePrompt = `pixel art sprite, 64x64 pixels, ${enemyDesc}, RPG monster, retro 16-bit style, clean pixels, black outline, solid color background, menacing, fantasy game enemy`;

  const frames: SpriteFrame[] = [];
  
  const frameDefinitions = [
    { name: 'idle_1', prompt: 'idle stance, ready to fight' },
    { name: 'attack_1', prompt: 'attacking, lunging forward' },
    { name: 'attack_2', prompt: 'attack impact, striking' },
    { name: 'hurt', prompt: 'taking damage, recoiling' },
    { name: 'death', prompt: 'defeated, collapsing, dying' },
  ];

  for (let i = 0; i < frameDefinitions.length; i++) {
    const frameDef = frameDefinitions[i];
    
    try {
      console.log(`    Frame ${i + 1}/${frameDefinitions.length}: ${frameDef.name}`);
      
      const fullPrompt = `${basePrompt}, ${frameDef.prompt}. Do not include any text or watermarks.`;
      const imageUrl = await generateImage(fullPrompt);

      frames.push({
        name: frameDef.name,
        x: i * 64,
        y: 0,
        width: 64,
        height: 64,
        imageUrl: imageUrl || createPlaceholderEnemySprite(config.type, frameDef.name),
      });
    } catch (error) {
      console.error(`    Failed to generate ${frameDef.name}:`, error);
      frames.push({
        name: frameDef.name,
        x: i * 64,
        y: 0,
        width: 64,
        height: 64,
        imageUrl: createPlaceholderEnemySprite(config.type, frameDef.name),
      });
    }
  }

  const sheet: GeneratedSpriteSheet = {
    id: `enemy_${config.type}_${Date.now()}`,
    type: 'enemy',
    sheetUrl: frames[0]?.imageUrl || '',
    frameWidth: 64,
    frameHeight: 64,
    frames,
    animations: [
      { name: 'idle', frames: ['idle_1'], frameRate: 4, loop: true },
      { name: 'attack', frames: ['attack_1', 'attack_2'], frameRate: 8, loop: false },
      { name: 'hurt', frames: ['hurt'], frameRate: 6, loop: false },
      { name: 'death', frames: ['death'], frameRate: 4, loop: false },
    ],
    generatedAt: Date.now(),
  };

  sheetCache.set(cacheKey, sheet);
  console.log(`✅ Enemy sheet generated with ${frames.length} frames`);
  
  return sheet;
}

// ============ TILESET GENERATION ============

interface TilesetConfig {
  theme: string;
  style?: string;
}

/**
 * Generate dungeon tileset
 */
export async function generateTileset(config: TilesetConfig): Promise<GeneratedSpriteSheet> {
  const cacheKey = `tileset_${config.theme}`;
  
  if (sheetCache.has(cacheKey)) {
    console.log(`🎨 Using cached tileset: ${cacheKey}`);
    return sheetCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating tileset: ${config.theme}...`);

  const themePrompts: Record<string, string> = {
    crypt: 'ancient stone crypt, cobwebs, bones, dark gothic',
    cave: 'natural cave, rocky, stalactites, underground',
    castle: 'castle dungeon, brick walls, medieval, torches',
    temple: 'ancient temple, ornate carvings, mystical, golden accents',
    sewer: 'sewer tunnels, grimy, pipes, murky water',
    forest: 'enchanted forest dungeon, roots, moss, magical',
    ice: 'frozen ice cavern, crystals, snow, blue tint',
    fire: 'volcanic dungeon, lava, obsidian, red glow',
  };

  const themeDesc = themePrompts[config.theme] || config.theme;
  const basePrompt = `pixel art game tile, 32x32 pixels, ${themeDesc}, retro RPG tileset, clean pixels, seamless texture`;

  const frames: SpriteFrame[] = [];
  
  const tileDefinitions = [
    { name: 'floor_1', prompt: 'floor tile, stone ground, walkable' },
    { name: 'floor_2', prompt: 'floor tile variation, slightly different pattern' },
    { name: 'wall_top', prompt: 'wall tile, top of wall, solid' },
    { name: 'wall_front', prompt: 'wall front face, brick pattern' },
    { name: 'door_closed', prompt: 'wooden door, closed, metal bands' },
    { name: 'door_open', prompt: 'wooden door, open, dark interior' },
  ];

  for (let i = 0; i < tileDefinitions.length; i++) {
    const tileDef = tileDefinitions[i];
    
    try {
      console.log(`    Tile ${i + 1}/${tileDefinitions.length}: ${tileDef.name}`);
      
      const fullPrompt = `${basePrompt}, ${tileDef.prompt}. Do not include any text or watermarks.`;
      const imageUrl = await generateImage(fullPrompt);

      frames.push({
        name: tileDef.name,
        x: (i % 4) * 32,
        y: Math.floor(i / 4) * 32,
        width: 32,
        height: 32,
        imageUrl: imageUrl || createPlaceholderTile(config.theme, tileDef.name),
      });
    } catch (error) {
      console.error(`    Failed to generate ${tileDef.name}:`, error);
      frames.push({
        name: tileDef.name,
        x: (i % 4) * 32,
        y: Math.floor(i / 4) * 32,
        width: 32,
        height: 32,
        imageUrl: createPlaceholderTile(config.theme, tileDef.name),
      });
    }
  }

  const sheet: GeneratedSpriteSheet = {
    id: `tileset_${config.theme}_${Date.now()}`,
    type: 'tileset',
    sheetUrl: frames[0]?.imageUrl || '',
    frameWidth: 32,
    frameHeight: 32,
    frames,
    animations: [],
    generatedAt: Date.now(),
  };

  sheetCache.set(cacheKey, sheet);
  console.log(`✅ Tileset generated with ${frames.length} tiles`);
  
  return sheet;
}

// ============ EFFECT SPRITES ============

/**
 * Generate spell/ability effect sprites
 */
export async function generateEffectSprites(effectType: string): Promise<GeneratedSpriteSheet> {
  const cacheKey = `effect_${effectType}`;
  
  if (sheetCache.has(cacheKey)) {
    return sheetCache.get(cacheKey)!;
  }

  console.log(`🎨 Generating effect sprites: ${effectType}...`);

  const effectPrompts: Record<string, string> = {
    fireball: 'fireball spell, flames, orange red, magical fire',
    ice_shard: 'ice shard spell, frozen, blue crystals, cold',
    lightning: 'lightning bolt, electric, yellow white, crackling',
    heal: 'healing magic, green glow, sparkles, restoration',
    shield: 'magic shield, protective barrier, blue dome',
    explosion: 'magical explosion, impact, burst of energy',
    slash: 'sword slash effect, arc, motion blur',
    poison: 'poison cloud, green mist, toxic bubbles',
  };

  const effectDesc = effectPrompts[effectType] || effectType;
  const basePrompt = `pixel art game effect, ${effectDesc}, VFX sprite, solid background, magical, fantasy RPG`;

  const frames: SpriteFrame[] = [];
  const frameCount = 4;
  
  for (let i = 0; i < frameCount; i++) {
    try {
      const progress = ['starting', 'building up', 'peak intensity', 'fading out'][i];
      const fullPrompt = `${basePrompt}, ${progress}, frame ${i + 1} of animation. Do not include any text or watermarks.`;
      
      const imageUrl = await generateImage(fullPrompt);

      frames.push({
        name: `${effectType}_${i + 1}`,
        x: i * 64,
        y: 0,
        width: 64,
        height: 64,
        imageUrl: imageUrl || createPlaceholderEffect(effectType, i),
      });
    } catch (error) {
      console.error(`Failed to generate effect frame ${i}:`, error);
      frames.push({
        name: `${effectType}_${i + 1}`,
        x: i * 64,
        y: 0,
        width: 64,
        height: 64,
        imageUrl: createPlaceholderEffect(effectType, i),
      });
    }
  }

  const sheet: GeneratedSpriteSheet = {
    id: `effect_${effectType}_${Date.now()}`,
    type: 'effect',
    sheetUrl: frames[0]?.imageUrl || '',
    frameWidth: 64,
    frameHeight: 64,
    frames,
    animations: [
      { 
        name: effectType, 
        frames: frames.map(f => f.name), 
        frameRate: 12, 
        loop: false 
      },
    ],
    generatedAt: Date.now(),
  };

  sheetCache.set(cacheKey, sheet);
  return sheet;
}

// ============ PLACEHOLDER GENERATORS ============

function createPlaceholderSprite(race: string, charClass: string, frame: string): string {
  // Create a simple colored placeholder based on class
  const classColors: Record<string, string> = {
    warrior: '#c0392b',
    mage: '#9b59b6',
    rogue: '#2c3e50',
    cleric: '#f1c40f',
    ranger: '#27ae60',
    paladin: '#3498db',
  };
  
  const color = classColors[charClass] || '#7f8c8d';
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect fill="#1a1a2e" width="64" height="64"/>
      <circle cx="32" cy="24" r="12" fill="${color}"/>
      <rect x="20" y="36" width="24" height="24" rx="4" fill="${color}"/>
      <text x="32" y="58" text-anchor="middle" fill="white" font-size="8">${frame.slice(0,4)}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createPlaceholderEnemySprite(type: string, frame: string): string {
  const enemyColors: Record<string, string> = {
    skeleton: '#ecf0f1',
    goblin: '#27ae60',
    orc: '#2c3e50',
    slime: '#3498db',
    spider: '#2c3e50',
    zombie: '#7f8c8d',
    bat: '#34495e',
    rat: '#795548',
    ghost: '#bdc3c7',
    demon: '#c0392b',
  };
  
  const color = enemyColors[type] || '#e74c3c';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect fill="#1a1a2e" width="64" height="64"/>
      <polygon points="32,8 52,48 12,48" fill="${color}"/>
      <circle cx="26" cy="32" r="4" fill="#c0392b"/>
      <circle cx="38" cy="32" r="4" fill="#c0392b"/>
      <text x="32" y="58" text-anchor="middle" fill="white" font-size="6">${type.slice(0,6)}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createPlaceholderTile(theme: string, tileName: string): string {
  const themeColors: Record<string, { bg: string; fg: string }> = {
    crypt: { bg: '#2c3e50', fg: '#7f8c8d' },
    cave: { bg: '#34495e', fg: '#795548' },
    castle: { bg: '#7f8c8d', fg: '#95a5a6' },
    temple: { bg: '#f39c12', fg: '#d4ac0d' },
    sewer: { bg: '#1abc9c', fg: '#16a085' },
    forest: { bg: '#27ae60', fg: '#2ecc71' },
    ice: { bg: '#3498db', fg: '#2980b9' },
    fire: { bg: '#e74c3c', fg: '#c0392b' },
  };
  
  const colors = themeColors[theme] || { bg: '#34495e', fg: '#7f8c8d' };
  const isWall = tileName.includes('wall');
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect fill="${isWall ? colors.fg : colors.bg}" width="32" height="32"/>
      ${isWall ? '<rect x="2" y="2" width="12" height="12" fill="' + colors.bg + '" opacity="0.3"/><rect x="18" y="18" width="12" height="12" fill="' + colors.bg + '" opacity="0.3"/>' : ''}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createPlaceholderEffect(effectType: string, frameIndex: number): string {
  const effectColors: Record<string, string> = {
    fireball: '#e74c3c',
    ice_shard: '#3498db',
    lightning: '#f1c40f',
    heal: '#2ecc71',
    shield: '#9b59b6',
    explosion: '#e67e22',
    slash: '#ecf0f1',
    poison: '#27ae60',
  };
  
  const color = effectColors[effectType] || '#f1c40f';
  const size = 20 + frameIndex * 8;
  const opacity = 1 - (frameIndex * 0.2);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect fill="#1a1a2e" width="64" height="64" opacity="0"/>
      <circle cx="32" cy="32" r="${size}" fill="${color}" opacity="${opacity}"/>
      <circle cx="32" cy="32" r="${size * 0.6}" fill="white" opacity="${opacity * 0.5}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============ UTILITIES ============

/**
 * Get all cached sheets
 */
export function getCachedSheets(): Map<string, GeneratedSpriteSheet> {
  return sheetCache;
}

/**
 * Clear cache
 */
export function clearSheetCache(): void {
  sheetCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { count: number; types: Record<string, number> } {
  const types: Record<string, number> = {};
  
  for (const sheet of sheetCache.values()) {
    types[sheet.type] = (types[sheet.type] || 0) + 1;
  }
  
  return { count: sheetCache.size, types };
}
