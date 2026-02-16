/**
 * Dungeon.AI Server Entry Point
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { DungeonMaster } from './services/dm';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Initialize the Dungeon Master with Claude for text, Gemini for art
const dm = new DungeonMaster({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  defaultProvider: 'claude'  // Claude for DM, Gemini only for image gen
});

// Express middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dungeon-ai' });
});

// REST API for character creation (before socket connection)
app.post('/api/characters', async (req, res) => {
  try {
    const { playerId, description, name, suggestedClass, suggestedRace } = req.body;
    
    const character = await dm.createCharacter(playerId, description, {
      name,
      suggestedClass,
      suggestedRace
    });

    res.json({ success: true, character });
  } catch (error) {
    console.error('Character creation error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// REST API for sprite generation
import { getArtService } from './services/art';
const artService = getArtService();

app.post('/api/art/generate', async (req, res) => {
  try {
    const { type, description, waitForResult } = req.body;
    
    console.log(`[Art] Generating ${type}: ${description}`);
    
    const result = await artService.generate({
      type: type || 'character',
      description,
      waitForResult: waitForResult ?? true
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Art generation error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Pre-generated dungeons cache (keyed by socket ID)
const pregeneratedDungeons = new Map<string, any>();

// Generate a dungeon layout
function generateDungeon(width = 20, height = 15) {
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
  
  // Carve rooms (simple dungeon generation)
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const numRooms = 4 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numRooms; i++) {
    const w = 4 + Math.floor(Math.random() * 4);
    const h = 3 + Math.floor(Math.random() * 3);
    const x = 1 + Math.floor(Math.random() * (width - w - 2));
    const y = 1 + Math.floor(Math.random() * (height - h - 2));
    
    rooms.push({ x, y, w, h });
    
    // Carve room
    for (let ry = y; ry < y + h; ry++) {
      for (let rx = x; rx < x + w; rx++) {
        const idx = ry * width + rx;
        if (tiles[idx]) tiles[idx].type = 'floor';
      }
    }
  }
  
  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    const cx1 = Math.floor(r1.x + r1.w / 2);
    const cy1 = Math.floor(r1.y + r1.h / 2);
    const cx2 = Math.floor(r2.x + r2.w / 2);
    const cy2 = Math.floor(r2.y + r2.h / 2);
    
    // Horizontal then vertical
    for (let x = Math.min(cx1, cx2); x <= Math.max(cx1, cx2); x++) {
      const idx = cy1 * width + x;
      if (tiles[idx]) tiles[idx].type = 'floor';
    }
    for (let y = Math.min(cy1, cy2); y <= Math.max(cy1, cy2); y++) {
      const idx = y * width + cx2;
      if (tiles[idx]) tiles[idx].type = 'floor';
    }
  }
  
  // Reveal starting area
  const startRoom = rooms[0];
  const playerX = Math.floor(startRoom.x + startRoom.w / 2);
  const playerY = Math.floor(startRoom.y + startRoom.h / 2);
  
  // Reveal tiles around player
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const idx = (playerY + dy) * width + (playerX + dx);
      if (tiles[idx]) {
        tiles[idx].revealed = true;
        tiles[idx].explored = true;
      }
    }
  }
  
  // Add some entities
  const entities: any[] = [];
  
  // Add a chest in a random room (not the starting room)
  if (rooms.length > 1) {
    const chestRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
    entities.push({
      id: 'chest1',
      type: 'item',
      name: 'Treasure Chest',
      x: Math.floor(chestRoom.x + chestRoom.w / 2),
      y: Math.floor(chestRoom.y + chestRoom.h / 2)
    });
  }
  
  // Maybe add an enemy
  if (rooms.length > 2 && Math.random() > 0.3) {
    const enemyRoom = rooms[rooms.length - 1];
    entities.push({
      id: 'goblin1',
      type: 'enemy',
      name: 'Goblin Scout',
      x: Math.floor(enemyRoom.x + enemyRoom.w / 2),
      y: Math.floor(enemyRoom.y + enemyRoom.h / 2),
      hp: 8,
      maxHp: 8
    });
  }
  
  return {
    tiles,
    entities,
    player: { x: playerX, y: playerY },
    dungeonSize: { width, height },
    currentRoom: {
      id: 'room1',
      type: 'entrance',
      description: 'A damp stone chamber marks the entrance to the dungeon. Torchlight flickers on moss-covered walls.'
    }
  };
}

// Socket.io for real-time gameplay
io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // PRE-GENERATE dungeon when player enters name (for speed)
  socket.on('dungeon:pregenerate', () => {
    console.log(`[${socket.id}] 🏰 Pre-generating dungeon...`);
    const dungeon = generateDungeon();
    pregeneratedDungeons.set(socket.id, dungeon);
    socket.emit('dungeon:pregenerated');
    console.log(`[${socket.id}] ✅ Dungeon pre-generated and cached`);
  });

  // Initialize game with character
  socket.on('game:init', async (data: { name: string; race: string; class: string; spriteSheet?: any }) => {
    console.log(`[${socket.id}] 🎮 game:init for "${data.name}" the ${data.race} ${data.class}`);
    
    socket.data.playerName = data.name;
    socket.data.playerClass = data.class;
    socket.data.playerRace = data.race;
    socket.data.spriteSheet = data.spriteSheet;
    
    // Use pre-generated dungeon or create new one
    let gameState = pregeneratedDungeons.get(socket.id);
    if (!gameState) {
      console.log(`[${socket.id}] No pre-generated dungeon, creating new one...`);
      gameState = generateDungeon();
    } else {
      pregeneratedDungeons.delete(socket.id);
    }
    
    // Add sprite URL to player
    if (data.spriteSheet?.frames?.[0]?.imageUrl) {
      gameState.player.spriteUrl = data.spriteSheet.frames[0].imageUrl;
    }
    
    socket.data.gameState = gameState;
    
    // Send initial state
    socket.emit('game:state', gameState);
    
    // Send DM narration for the room
    socket.emit('dm:narrate', {
      content: `You descend into the darkness. ${gameState.currentRoom.description}\n\nWhat do you do?`,
      timestamp: Date.now()
    });
    
    console.log(`[${socket.id}] ✅ Game initialized, ${gameState.tiles.length} tiles`);
  });

  // Request current state (for reconnection)
  socket.on('game:requestState', () => {
    console.log(`[${socket.id}] 📋 State requested`);
    if (socket.data.gameState) {
      socket.emit('game:state', socket.data.gameState);
    }
  });

  // PLAYER ACTION - main gameplay input
  socket.on('player:action', async (data: { action: string }) => {
    console.log(`[${socket.id}] ⚔️ ACTION: "${data.action}"`);
    
    if (!socket.data.gameState) {
      console.log(`[${socket.id}] ❌ No game state, ignoring action`);
      socket.emit('dm:narrate', {
        content: 'The dungeon has not yet materialized. Please wait...',
        timestamp: Date.now()
      });
      return;
    }
    
    try {
      // Send thinking indicator
      socket.emit('dm:thinking');
      
      // Process action with AI
      const response = await dm.processInput(socket.id, data.action);
      
      // Update game state if needed (movement, combat, etc.)
      // For now, just send the DM response
      socket.emit('dm:narrate', {
        content: response.response || response.narration || response,
        timestamp: Date.now()
      });
      
      // Send updated game state
      socket.emit('game:state', socket.data.gameState);
      
    } catch (error) {
      console.error(`[${socket.id}] Action error:`, error);
      socket.emit('dm:narrate', {
        content: 'The dungeon trembles... something went wrong. Try again.',
        timestamp: Date.now()
      });
    }
  });

  // Also support the old event name for compatibility
  socket.on('player_input', async (data: { input: string }) => {
    socket.emit('player:action', { action: data.input });
  });

  // Backstory generation
  socket.on('backstory:generate', async (data: any) => {
    console.log(`[${socket.id}] 📜 Generating backstory for ${data.name}...`);
    
    try {
      const { BackstoryGenerator } = await import('./services/story/BackstoryGenerator');
      const generator = new BackstoryGenerator();
      
      await generator.generateBackstory(data, {
        onChunk: (text: string) => {
          socket.emit('backstory:chunk', { text });
        },
        onComplete: () => {
          socket.emit('backstory:complete');
        },
        onError: (error: string) => {
          socket.emit('generation:error', { type: 'backstory', message: error });
        }
      });
    } catch (error) {
      console.error(`[${socket.id}] Backstory error:`, error);
      socket.emit('generation:error', { type: 'backstory', message: String(error) });
    }
  });

  // Sprite sheet generation
  socket.on('spritesheet:character', async (data: any) => {
    console.log(`[${socket.id}] 🎨 Generating sprite for ${data.name}...`);
    socket.emit('generation:status', { type: 'sprite', message: 'Starting character art generation...' });
    
    try {
      const result = await artService.generate({
        type: 'character',
        description: `${data.gender || 'heroic'} ${data.race} ${data.class} with ${data.hairColor} hair, fantasy RPG style, pixel art portrait`,
        waitForResult: true
      });
      
      socket.emit('spritesheet:ready', {
        type: 'character',
        sheet: {
          sheetUrl: result.imageUrl,
          frames: [{ imageUrl: result.imageUrl, frame: 0 }]
        }
      });
      
      console.log(`[${socket.id}] ✅ Sprite generated`);
    } catch (error) {
      console.error(`[${socket.id}] Sprite error:`, error);
      socket.emit('generation:error', { type: 'sprite', message: String(error) });
    }
  });

  // Join a game session (multiplayer)
  socket.on('join_session', async (data: { sessionId: string; playerId: string }) => {
    socket.join(data.sessionId);
    socket.data.playerId = data.playerId;
    socket.data.sessionId = data.sessionId;
    
    socket.emit('session_joined', { sessionId: data.sessionId });
  });

  // Start combat
  socket.on('start_combat', async (data: { encounterId?: string }) => {
    try {
      const encounter = await dm.generateEncounter('medium', 'random');
      const combatState = await dm.startCombat(encounter);
      
      io.to(socket.data.sessionId).emit('combat_started', { combatState, encounter });
    } catch (error) {
      console.error('Combat start error:', error);
      socket.emit('error', { message: String(error) });
    }
  });

  // Request recap
  socket.on('request_recap', async () => {
    try {
      const recap = await dm.getRecap();
      socket.emit('recap', { content: recap });
    } catch (error) {
      socket.emit('error', { message: String(error) });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
    pregeneratedDungeons.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🎲 DUNGEON.AI SERVER RUNNING 🎲               ║
║                                                  ║
║   Port: ${PORT}                                     ║
║   The Dungeon Master awaits...                   ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export { app, io, dm };
