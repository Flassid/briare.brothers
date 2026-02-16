"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getSocket } from "@/lib/socket";

const TILE_SIZE = 24;
const ANIMATION_FPS = 60;

// Generate dungeon on client side (fallback)
function generateLocalDungeon() {
  const width = 20;
  const height = 15;
  const tiles: any[] = [];
  
  // Fill with walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x, y,
        type: 'wall',
        revealed: false,
        explored: false
      });
    }
  }
  
  // Carve rooms
  const rooms = [
    { x: 2, y: 2, w: 6, h: 5 },
    { x: 10, y: 2, w: 5, h: 4 },
    { x: 10, y: 8, w: 6, h: 5 },
    { x: 2, y: 9, w: 5, h: 4 },
  ];
  
  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      for (let rx = room.x; rx < room.x + room.w; rx++) {
        const idx = ry * width + rx;
        if (tiles[idx]) {
          tiles[idx].type = 'floor';
          tiles[idx].revealed = true;
          tiles[idx].explored = true;
        }
      }
    }
  }
  
  // Connect with corridors
  for (let x = 8; x <= 10; x++) {
    tiles[4 * width + x].type = 'floor';
    tiles[4 * width + x].revealed = true;
  }
  for (let y = 6; y <= 10; y++) {
    tiles[y * width + 13].type = 'floor';
    tiles[y * width + 13].revealed = true;
  }
  for (let x = 7; x <= 10; x++) {
    tiles[10 * width + x].type = 'floor';
    tiles[10 * width + x].revealed = true;
  }
  
  const playerX = 5;
  const playerY = 4;
  
  return {
    tiles,
    entities: [
      { id: 'chest1', type: 'item', name: 'Treasure Chest', x: 12, y: 10, sprite: 'chest' },
      { id: 'goblin1', type: 'enemy', name: 'Goblin Scout', x: 14, y: 4, hp: 8, maxHp: 8, sprite: 'goblin' }
    ],
    player: { x: playerX, y: playerY },
    dungeonSize: { width, height },
    currentRoom: { id: 'room1', type: 'entrance', description: 'A damp stone chamber marks the entrance.' }
  };
}

interface Tile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'stairs' | 'chest' | 'trap';
  revealed: boolean;
  explored: boolean;
}

interface Entity {
  id: string;
  type: 'player' | 'enemy' | 'npc' | 'item';
  name: string;
  x: number;
  y: number;
  sprite: string;
  hp?: number;
  maxHp?: number;
}

interface GameState {
  tiles: Tile[];
  entities: Entity[];
  player: { x: number; y: number; spriteSheet?: any; spriteUrl?: string };
  currentRoom: { id: string; description: string; type: string } | null;
  dungeonSize: { width: number; height: number };
}

// Store for the player sprite image
let playerSpriteImage: HTMLImageElement | null = null;

// Add null check helper
function isValidImage(img: HTMLImageElement | null): img is HTMLImageElement {
  return img !== null && img.complete && img.src !== '';
}

// Draw placeholder for player
function drawPlayerPlaceholder(ctx: CanvasRenderingContext2D, px: number, py: number, charClass?: string) {
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;
  
  // Body
  ctx.fillStyle = charClass === 'mage' ? '#9b59b6' : charClass === 'rogue' ? '#2c3e50' : charClass === 'cleric' ? '#f1c40f' : '#e74c3c';
  ctx.beginPath();
  ctx.arc(cx, cy, TILE_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, TILE_SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();
}

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { character } = useGameStore();
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Listen for game state updates via window event
  useEffect(() => {
    const handleGameState = (e: CustomEvent<GameState>) => {
      console.log('[PhaserGame] Received game:state', e.detail.tiles?.length, 'tiles');
      setGameState(e.detail);
    };
    
    window.addEventListener('game:state', handleGameState as EventListener);
    
    // Request state on mount
    const socket = getSocket();
    if (socket?.connected) {
      console.log('[PhaserGame] Requesting initial game state...');
      socket.emit('game:requestState');
    }
    
    // Fallback: Generate local dungeon if server doesn't respond in 2 seconds
    const fallbackTimer = setTimeout(() => {
      if (!gameState) {
        console.log('[PhaserGame] Server timeout - generating local dungeon');
        const localDungeon = generateLocalDungeon();
        setGameState(localDungeon as GameState);
      }
    }, 2000);
    
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('game:state', handleGameState as EventListener);
    };
  }, [gameState]);

  // Animation loop for smooth character animation
  const render = useCallback((timestamp: number) => {
    if (!gameState || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Delta time for animation
    const delta = timestamp - (timeRef.current || timestamp);
    timeRef.current = timestamp;
    
    // Animation values (breathing effect)
    const breathCycle = (timestamp / 1000) * 1.5; // 1.5 cycles per second
    const breathOffset = Math.sin(breathCycle) * 2; // 2px up/down
    const breathScale = 1 + Math.sin(breathCycle) * 0.03; // 3% scale variation
    const glowPulse = 0.3 + Math.sin(timestamp / 500) * 0.15; // Pulsing glow
    
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const { tiles, entities, player, dungeonSize } = gameState;
    
    // Calculate offset to center dungeon
    const offsetX = Math.max(0, (canvas.width - dungeonSize.width * TILE_SIZE) / 2);
    const offsetY = Math.max(0, (canvas.height - dungeonSize.height * TILE_SIZE) / 2);
    
    // Draw tiles
    for (const tile of tiles) {
      const x = offsetX + tile.x * TILE_SIZE;
      const y = offsetY + tile.y * TILE_SIZE;
      
      if (tile.type === 'wall') {
        ctx.fillStyle = tile.revealed ? '#2a2a3e' : '#1a1a28';
      } else if (tile.type === 'door') {
        ctx.fillStyle = '#5c4033';
      } else {
        ctx.fillStyle = tile.revealed ? '#3d3d5c' : '#2d2d44';
      }
      
      ctx.fillRect(x, y, TILE_SIZE - 1, TILE_SIZE - 1);
      
      // Add subtle grid lines
      ctx.strokeStyle = '#1a1a28';
      ctx.strokeRect(x, y, TILE_SIZE - 1, TILE_SIZE - 1);
      
      // Fog for explored but not revealed
      if (tile.explored && !tile.revealed) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
    
    // Draw entities with subtle animations
    for (const entity of entities) {
      const x = offsetX + entity.x * TILE_SIZE + TILE_SIZE / 2;
      const y = offsetY + entity.y * TILE_SIZE + TILE_SIZE / 2;
      
      // Entity-specific animation offset
      const entityBob = Math.sin((timestamp / 800) + entity.x * 0.5 + entity.y * 0.3) * 1.5;
      
      if (entity.type === 'enemy') {
        // Red for enemies with menacing pulse
        const enemyPulse = 1 + Math.sin(timestamp / 300) * 0.1;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x, y + entityBob, (TILE_SIZE / 3) * enemyPulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy glow
        ctx.fillStyle = `rgba(255, 68, 68, ${0.2 + Math.sin(timestamp / 300) * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y + entityBob, TILE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // HP bar
        if (entity.hp !== undefined && entity.maxHp) {
          const hpPercent = entity.hp / entity.maxHp;
          const barWidth = TILE_SIZE - 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(x - barWidth / 2, y - TILE_SIZE / 2 - 6 + entityBob, barWidth, 4);
          ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffff44' : '#ff4444';
          ctx.fillRect(x - barWidth / 2, y - TILE_SIZE / 2 - 6 + entityBob, barWidth * hpPercent, 4);
        }
      } else if (entity.type === 'item') {
        // Gold for items/chests with sparkle
        const sparkle = Math.sin(timestamp / 200) * 0.3;
        ctx.fillStyle = `rgb(${255}, ${215 + sparkle * 40}, ${sparkle * 100})`;
        ctx.fillRect(x - 6, y - 4 + entityBob, 12, 10);
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(x - 6, y - 6 + entityBob, 12, 4);
        
        // Sparkle effect
        if (Math.random() > 0.97) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * 10, y + entityBob + (Math.random() - 0.5) * 10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (entity.type === 'npc') {
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.arc(x, y + entityBob, TILE_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw player with animation
    const px = offsetX + player.x * TILE_SIZE;
    const py = offsetY + player.y * TILE_SIZE;
    
    // Get sprite URL from memory or player data
    const spriteUrl = (window as any).__playerSpriteSheet?.frames?.[0]?.imageUrl || player.spriteUrl;
    
    // Player glow (animated)
    ctx.fillStyle = `rgba(255, 200, 100, ${glowPulse})`;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + breathOffset, TILE_SIZE * (1 + glowPulse * 0.2), 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sprite if available (with animation)
    const spriteSize = TILE_SIZE * 2 * breathScale;
    const spriteOffset = (TILE_SIZE * 2 - spriteSize) / 2;
    
    if (spriteUrl && isValidImage(playerSpriteImage) && playerSpriteImage.src === spriteUrl) {
      // Draw the loaded sprite with breathing animation
      ctx.drawImage(
        playerSpriteImage, 
        px - TILE_SIZE / 2 + spriteOffset, 
        py - TILE_SIZE / 2 + spriteOffset + breathOffset, 
        spriteSize, 
        spriteSize
      );
    } else if (spriteUrl && (!playerSpriteImage || playerSpriteImage.src !== spriteUrl)) {
      // Load the sprite image
      playerSpriteImage = new Image();
      playerSpriteImage.src = spriteUrl;
      // Draw placeholder while loading
      drawPlayerPlaceholder(ctx, px, py + breathOffset, character?.class);
    } else {
      // Draw colored circle as placeholder with animation
      drawPlayerPlaceholder(ctx, px, py + breathOffset, character?.class);
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(render);
  }, [gameState, character]);

  // Start animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Initial size
    setTimeout(handleResize, 100);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0a0a0f] relative">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />
      {!gameState && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-amber-500 animate-pulse">
            🏰 Loading dungeon...
          </div>
        </div>
      )}
    </div>
  );
}
