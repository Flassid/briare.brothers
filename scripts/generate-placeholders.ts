/**
 * Generate Placeholder Images
 * Creates simple pixel art placeholders for loading states
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACEHOLDERS_DIR = path.join(__dirname, '../public/placeholders');

// Simple 8-bit style color palette
const COLORS = {
  background: '#1a1a2e',
  outline: '#16213e',
  primary: '#0f3460',
  secondary: '#e94560',
  accent: '#533483'
};

async function createPlaceholder(
  filename: string,
  width: number,
  height: number,
  pattern: 'character' | 'monster' | 'scene'
): Promise<void> {
  // Create a simple SVG placeholder that looks like a loading sprite
  const svg = generateSVG(width, height, pattern);
  
  // Convert to PNG
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(PLACEHOLDERS_DIR, filename));
    
  console.log(`Created: ${filename} (${width}x${height})`);
}

function generateSVG(width: number, height: number, pattern: string): string {
  const pixelSize = Math.max(4, Math.floor(width / 16));
  
  if (pattern === 'character') {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${COLORS.background}"/>
        <g transform="translate(${width/2 - pixelSize*4}, ${height/2 - pixelSize*5})">
          <!-- Simple character silhouette -->
          <rect x="${pixelSize*2}" y="0" width="${pixelSize*4}" height="${pixelSize*2}" fill="${COLORS.outline}"/>
          <rect x="${pixelSize}" y="${pixelSize*2}" width="${pixelSize*6}" height="${pixelSize*4}" fill="${COLORS.primary}"/>
          <rect x="${pixelSize*2}" y="${pixelSize*6}" width="${pixelSize*4}" height="${pixelSize*4}" fill="${COLORS.outline}"/>
          <!-- Loading dots -->
          <rect x="${pixelSize*2}" y="${pixelSize*4}" width="${pixelSize}" height="${pixelSize}" fill="${COLORS.secondary}" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite"/>
          </rect>
          <rect x="${pixelSize*3.5}" y="${pixelSize*4}" width="${pixelSize}" height="${pixelSize}" fill="${COLORS.secondary}" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.33s" repeatCount="indefinite"/>
          </rect>
          <rect x="${pixelSize*5}" y="${pixelSize*4}" width="${pixelSize}" height="${pixelSize}" fill="${COLORS.secondary}" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="0.66s" repeatCount="indefinite"/>
          </rect>
        </g>
        <text x="${width/2}" y="${height - pixelSize}" text-anchor="middle" fill="${COLORS.secondary}" font-family="monospace" font-size="${pixelSize*1.5}">LOADING...</text>
      </svg>
    `;
  }
  
  if (pattern === 'monster') {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${COLORS.background}"/>
        <g transform="translate(${width/2 - pixelSize*5}, ${height/2 - pixelSize*5})">
          <!-- Monster silhouette -->
          <rect x="${pixelSize*2}" y="0" width="${pixelSize*6}" height="${pixelSize*3}" fill="${COLORS.accent}"/>
          <rect x="0" y="${pixelSize*3}" width="${pixelSize*10}" height="${pixelSize*5}" fill="${COLORS.outline}"/>
          <rect x="${pixelSize}" y="${pixelSize*8}" width="${pixelSize*2}" height="${pixelSize*2}" fill="${COLORS.primary}"/>
          <rect x="${pixelSize*7}" y="${pixelSize*8}" width="${pixelSize*2}" height="${pixelSize*2}" fill="${COLORS.primary}"/>
          <!-- Glowing eyes -->
          <rect x="${pixelSize*2}" y="${pixelSize*4}" width="${pixelSize*2}" height="${pixelSize}" fill="${COLORS.secondary}">
            <animate attributeName="fill" values="${COLORS.secondary};#fff;${COLORS.secondary}" dur="2s" repeatCount="indefinite"/>
          </rect>
          <rect x="${pixelSize*6}" y="${pixelSize*4}" width="${pixelSize*2}" height="${pixelSize}" fill="${COLORS.secondary}">
            <animate attributeName="fill" values="${COLORS.secondary};#fff;${COLORS.secondary}" dur="2s" repeatCount="indefinite"/>
          </rect>
        </g>
        <text x="${width/2}" y="${height - pixelSize}" text-anchor="middle" fill="${COLORS.secondary}" font-family="monospace" font-size="${pixelSize*1.5}">SUMMONING...</text>
      </svg>
    `;
  }
  
  // Scene
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${COLORS.background}"/>
      <!-- Ground -->
      <rect x="0" y="${height*0.7}" width="100%" height="${height*0.3}" fill="${COLORS.outline}"/>
      <!-- Mountains/structures in background -->
      <polygon points="${width*0.1},${height*0.7} ${width*0.3},${height*0.3} ${width*0.5},${height*0.7}" fill="${COLORS.primary}"/>
      <polygon points="${width*0.4},${height*0.7} ${width*0.6},${height*0.2} ${width*0.8},${height*0.7}" fill="${COLORS.accent}"/>
      <!-- Stars/particles -->
      <rect x="${width*0.2}" y="${height*0.15}" width="${pixelSize/2}" height="${pixelSize/2}" fill="${COLORS.secondary}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="${width*0.7}" y="${height*0.1}" width="${pixelSize/2}" height="${pixelSize/2}" fill="${COLORS.secondary}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="${width*0.85}" y="${height*0.25}" width="${pixelSize/2}" height="${pixelSize/2}" fill="${COLORS.secondary}">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="1s" repeatCount="indefinite"/>
      </rect>
      <text x="${width/2}" y="${height*0.55}" text-anchor="middle" fill="${COLORS.secondary}" font-family="monospace" font-size="${pixelSize*2}">RENDERING WORLD...</text>
    </svg>
  `;
}

async function main() {
  // Ensure directories exist
  await fs.mkdir(PLACEHOLDERS_DIR, { recursive: true });
  await fs.mkdir(path.join(__dirname, '../public/generated/characters'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../public/generated/monsters'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../public/generated/scenes'), { recursive: true });
  
  // Create gitkeep
  await fs.writeFile(path.join(__dirname, '../public/generated/.gitkeep'), '');
  
  // Generate placeholders
  await createPlaceholder('character.png', 128, 128, 'character');
  await createPlaceholder('monster.png', 256, 256, 'monster');
  await createPlaceholder('scene.png', 512, 288, 'scene');
  
  console.log('\n✓ All placeholders generated!');
}

main().catch(console.error);
