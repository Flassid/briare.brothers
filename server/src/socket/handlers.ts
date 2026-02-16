import { Server, Socket } from 'socket.io';
import { 
  generateCharacterSheet, 
  generateEnemySheet, 
  generateTileset,
  generateEffectSprites,
  type GeneratedSpriteSheet 
} from '../../services/art/SpriteSheetGenerator.js';
import { generateBackstory } from '../../services/story/BackstoryGenerator.js';
import { AIClient } from '../../services/dm/AIClient.js';

// AI client for DM narration
const ai = new AIClient();

// ============ TYPES ============
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
  spriteSheet?: GeneratedSpriteSheet;
  hp?: number;
  maxHp?: number;
  currentAnim?: string;
}

interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'entrance' | 'corridor' | 'chamber' | 'treasure' | 'boss';
  description: string;
  entities: Entity[];
  connected: string[];
}

interface Dungeon {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  entities: Entity[];
  currentRoom: string;
  theme: string;
  tileset?: GeneratedSpriteSheet;
}

interface PlayerSession {
  socketId: string;
  playerId: string;
  characterName: string;
  characterClass: string;
  characterRace: string;
  spriteSheet?: GeneratedSpriteSheet;
  x: number;
  y: number;
  dungeon: Dungeon;
  revealedTiles: Set<string>;
}

const players = new Map<string, PlayerSession>();
const pregeneratedDungeons = new Map<string, Dungeon>(); // Pre-generated dungeons for faster game start

// ============ DUNGEON GENERATION ============
function generateDungeon(theme: string = 'crypt'): Dungeon {
  const width = 40;
  const height = 30;
  
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = { x, y, type: 'wall', revealed: false, explored: false };
    }
  }

  const rooms: Room[] = [];
  
  const entrance: Room = {
    id: 'room_entrance', x: 5, y: 12, width: 8, height: 6,
    type: 'entrance',
    description: 'The entrance chamber. Ancient stone walls rise around you, covered in moss and forgotten runes.',
    entities: [], connected: ['room_corridor1']
  };
  rooms.push(entrance);
  
  const corridor1: Room = {
    id: 'room_corridor1', x: 13, y: 13, width: 10, height: 4,
    type: 'corridor',
    description: 'A narrow corridor stretches before you. The walls drip with moisture.',
    entities: [], connected: ['room_entrance', 'room_chamber1']
  };
  rooms.push(corridor1);
  
  const chamber1: Room = {
    id: 'room_chamber1', x: 23, y: 10, width: 10, height: 10,
    type: 'chamber',
    description: 'A large chamber with broken pillars. Something stirs in the darkness...',
    entities: [
      { id: 'skeleton1', type: 'enemy', name: 'Skeletal Guardian', x: 28, y: 14, sprite: 'skeleton', hp: 15, maxHp: 15, currentAnim: 'idle' }
    ],
    connected: ['room_corridor1', 'room_treasure']
  };
  rooms.push(chamber1);
  
  const treasureRoom: Room = {
    id: 'room_treasure', x: 28, y: 3, width: 6, height: 6,
    type: 'treasure',
    description: 'A treasure chamber! An ornate chest gleams in the dim light.',
    entities: [
      { id: 'chest1', type: 'item', name: 'Treasure Chest', x: 30, y: 5, sprite: 'chest' }
    ],
    connected: ['room_chamber1']
  };
  rooms.push(treasureRoom);
  
  // Carve rooms
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          tiles[y][x].type = 'floor';
        }
      }
    }
  }
  
  // Doors and corridors
  tiles[14][13].type = 'door';
  tiles[14][23].type = 'door';
  tiles[9][30].type = 'door';
  for (let x = 12; x <= 13; x++) tiles[14][x].type = 'floor';
  for (let x = 22; x <= 23; x++) tiles[14][x].type = 'floor';
  for (let y = 9; y >= 8; y--) tiles[y][30].type = 'floor';
  
  const entities: Entity[] = [];
  for (const room of rooms) entities.push(...room.entities);
  
  return { width, height, tiles, rooms, entities, currentRoom: 'room_entrance', theme };
}

function revealAround(session: PlayerSession, x: number, y: number, radius: number = 4): void {
  const { dungeon } = session;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tx = x + dx, ty = y + dy;
      if (Math.sqrt(dx * dx + dy * dy) > radius) continue;
      if (ty >= 0 && ty < dungeon.height && tx >= 0 && tx < dungeon.width) {
        dungeon.tiles[ty][tx].revealed = true;
        dungeon.tiles[ty][tx].explored = true;
        session.revealedTiles.add(`${tx},${ty}`);
      }
    }
  }
}

function getVisibleState(session: PlayerSession) {
  const { dungeon, x, y, spriteSheet } = session;
  
  const visibleTiles: Tile[] = [];
  for (let ty = 0; ty < dungeon.height; ty++) {
    for (let tx = 0; tx < dungeon.width; tx++) {
      const tile = dungeon.tiles[ty][tx];
      if (tile.revealed || tile.explored) visibleTiles.push({ ...tile });
    }
  }
  
  const visibleEntities = dungeon.entities.filter(e => dungeon.tiles[e.y]?.[e.x]?.revealed);
  const currentRoom = dungeon.rooms.find(r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
  
  return {
    tiles: visibleTiles,
    tileset: dungeon.tileset,
    entities: visibleEntities,
    player: { x, y, spriteSheet },
    currentRoom: currentRoom ? { id: currentRoom.id, description: currentRoom.description, type: currentRoom.type } : null,
    dungeonSize: { width: dungeon.width, height: dungeon.height }
  };
}

function movePlayer(session: PlayerSession, dx: number, dy: number): { success: boolean; message: string } {
  const newX = session.x + dx, newY = session.y + dy;
  const { dungeon } = session;
  
  if (newX < 0 || newX >= dungeon.width || newY < 0 || newY >= dungeon.height) return { success: false, message: 'You cannot go that way.' };
  if (dungeon.tiles[newY][newX].type === 'wall') return { success: false, message: 'A solid wall blocks your path.' };
  
  session.x = newX;
  session.y = newY;
  revealAround(session, newX, newY, 4);
  
  const newRoom = dungeon.rooms.find(r => newX >= r.x && newX < r.x + r.width && newY >= r.y && newY < r.y + r.height);
  if (newRoom && newRoom.id !== dungeon.currentRoom) {
    dungeon.currentRoom = newRoom.id;
    return { success: true, message: `entering_room:${newRoom.id}` };
  }
  return { success: true, message: 'moved' };
}

function parseMovement(action: string): { dx: number; dy: number } | null {
  const lower = action.toLowerCase();
  if (lower.includes('north') || lower.includes('up')) return { dx: 0, dy: -1 };
  if (lower.includes('south') || lower.includes('down') || lower.includes('back')) return { dx: 0, dy: 1 };
  if (lower.includes('east') || lower.includes('right') || lower.includes('forward')) return { dx: 1, dy: 0 };
  if (lower.includes('west') || lower.includes('left')) return { dx: -1, dy: 0 };
  if (lower.includes('walk') || lower.includes('move') || lower.includes('go') || lower.includes('explore')) return { dx: 1, dy: 0 };
  return null;
}

// Parse freeform actions for character animations
function parseActionForAnimation(action: string): { anim: string; duration: number } | null {
  const lower = action.toLowerCase();
  
  // Running actions
  if (lower.includes('run') || lower.includes('sprint') || lower.includes('dash') || lower.includes('rush')) {
    return { anim: 'walk', duration: 2000 }; // 'walk' with fast speed
  }
  
  // Walking/movement
  if (lower.includes('walk') || lower.includes('step') || lower.includes('move') || lower.includes('go') || lower.includes('head')) {
    return { anim: 'walk', duration: 1500 };
  }
  
  // Climbing/descending stairs or ladders
  if (lower.includes('climb') || lower.includes('descend') || lower.includes('stairs') || lower.includes('ladder')) {
    return { anim: 'walk', duration: 2500 };
  }
  
  // Jumping/leaping
  if (lower.includes('jump') || lower.includes('leap') || lower.includes('vault') || lower.includes('hop')) {
    return { anim: 'special', duration: 800 };
  }
  
  // Sneaking/creeping
  if (lower.includes('sneak') || lower.includes('creep') || lower.includes('stealth') || lower.includes('quietly')) {
    return { anim: 'walk', duration: 2000 };
  }
  
  // Combat actions
  if (lower.includes('attack') || lower.includes('strike') || lower.includes('hit') || lower.includes('slash') || lower.includes('swing') || lower.includes('punch') || lower.includes('kick')) {
    return { anim: 'attack', duration: 1000 };
  }
  
  // Magic/casting
  if (lower.includes('cast') || lower.includes('spell') || lower.includes('magic') || lower.includes('summon') || lower.includes('conjure') || lower.includes('enchant')) {
    return { anim: 'cast', duration: 1500 };
  }
  
  // Yelling/shouting (power up animation)
  if (lower.includes('yell') || lower.includes('shout') || lower.includes('scream') || lower.includes('roar') || lower.includes('cry out')) {
    return { anim: 'powerup', duration: 1200 };
  }
  
  // Defensive actions
  if (lower.includes('dodge') || lower.includes('evade') || lower.includes('roll') || lower.includes('duck')) {
    return { anim: 'hurt', duration: 600 };
  }
  
  // Victory/celebration
  if (lower.includes('celebrate') || lower.includes('cheer') || lower.includes('victory') || lower.includes('triumph')) {
    return { anim: 'victory', duration: 2000 };
  }
  
  // Searching/examining (slight idle variation)
  if (lower.includes('search') || lower.includes('examine') || lower.includes('inspect') || lower.includes('look')) {
    return { anim: 'idle', duration: 1500 };
  }
  
  return null;
}

// Parse freeform actions for movement (position changes)
function parseActionForMovement(action: string): { dx: number; dy: number; steps: number } | null {
  const lower = action.toLowerCase();
  
  // Determine direction
  let dx = 0, dy = 0;
  
  // Vertical movement (stairs, climb, descend)
  if (lower.includes('down') || lower.includes('descend') || lower.includes('stairs') && (lower.includes('down') || lower.includes('descend'))) {
    dy = 1;
  } else if (lower.includes('up') || lower.includes('ascend') || lower.includes('climb')) {
    dy = -1;
  }
  
  // Horizontal movement
  if (lower.includes('forward') || lower.includes('ahead') || lower.includes('onward') || lower.includes('continue')) {
    dx = 1;
  } else if (lower.includes('back') || lower.includes('retreat') || lower.includes('return')) {
    dx = -1;
  }
  
  // Compass directions
  if (lower.includes('north')) dy = -1;
  if (lower.includes('south')) dy = 1;
  if (lower.includes('east')) dx = 1;
  if (lower.includes('west')) dx = -1;
  
  // No movement detected
  if (dx === 0 && dy === 0) {
    // Check if there's any movement verb
    const movementVerbs = ['run', 'walk', 'go', 'move', 'head', 'rush', 'sprint', 'dash', 'enter', 'exit', 'leave'];
    if (!movementVerbs.some(v => lower.includes(v))) {
      return null;
    }
    // Default to forward if movement verb but no direction
    dx = 1;
  }
  
  // Determine speed/steps
  let steps = 1;
  if (lower.includes('run') || lower.includes('sprint') || lower.includes('rush') || lower.includes('dash')) {
    steps = 3; // Running covers more ground
  } else if (lower.includes('walk') || lower.includes('move') || lower.includes('step')) {
    steps = 1;
  } else if (lower.includes('explore') || lower.includes('wander')) {
    steps = 2;
  }
  
  return { dx, dy, steps };
}

// ============ SOCKET HANDLERS ============
export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // ====== DUNGEON PRE-GENERATION (for faster game start) ======
    socket.on('dungeon:pregenerate', () => {
      console.log(`🏰 [${socket.id}] Pre-generating dungeon...`);
      const dungeon = generateDungeon('crypt');
      pregeneratedDungeons.set(socket.id, dungeon);
      socket.emit('dungeon:pregenerated');
      console.log(`✅ [${socket.id}] Dungeon pre-generated and cached`);
    });

    // ====== AI ROOM IMAGE GENERATION ======
    socket.on('generate:room', async (data: { roomType: string; description: string; name: string }) => {
      console.log(`🎨 [${socket.id}] Generating room image: ${data.name}`);
      
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set');
        
        const prompt = `Dark fantasy dungeon scene, ${data.description}, atmospheric lighting with torches, mysterious shadows, highly detailed digital painting, concept art style, no characters, empty room, wide angle establishing shot, dramatic composition`;
        
        // Use Imagen API directly (skip caching for now)
        const model = 'imagen-4.0-generate-001';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
        
        console.log(`  [RoomGen] Calling Imagen API...`);
        
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
              aspectRatio: '16:9',
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Check for quota exceeded - use fallback
          if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
            console.log(`⚠️ [${socket.id}] Imagen quota exceeded, using fallback`);
            socket.emit('room:image:ready', { 
              roomType: data.roomType,
              imageUrl: 'fallback', // Signal to use CSS fallback
              fallback: true
            });
            return;
          }
          
          throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as any;
        
        if (result.predictions?.[0]?.bytesBase64Encoded) {
          const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
          
          socket.emit('room:image:ready', { 
            roomType: data.roomType,
            imageUrl 
          });
          
          console.log(`✅ [${socket.id}] Room image generated: ${data.name}`);
        } else {
          throw new Error('No image data in response');
        }
      } catch (error) {
        console.error(`❌ [${socket.id}] Room generation failed:`, error);
        // Send fallback instead of error so game continues
        socket.emit('room:image:ready', { 
          roomType: data.roomType,
          imageUrl: 'fallback',
          fallback: true
        });
      }
    });

    // ====== BACKSTORY GENERATION ======
    socket.on('backstory:generate', async (data: { 
      name: string; 
      race: string; 
      class: string; 
      personality: string;
      background: string;
      hairColor?: string;
      gender?: string;
    }) => {
      try {
        console.log(`📝 [${data.name}] Generating backstory...`);
        await generateBackstory(socket, data);
      } catch (error) {
        console.error('Backstory generation failed:', error);
        socket.emit('backstory:chunk', { text: `${data.name}, a mysterious ${data.race} ${data.class}, descends into darkness seeking their destiny...` });
        socket.emit('backstory:complete');
      }
    });

    // ====== SPRITE SHEET GENERATION ======
    
    // Generate character sprite sheet with all animations
    socket.on('spritesheet:character', async (data: { name: string; race: string; class: string; hairColor?: string; gender?: string; fullSheet?: boolean }) => {
      try {
        console.log(`🎨 [${data.name}] Generating character sprite sheet...`);
        
        if (data.fullSheet) {
          // Use advanced sprite system with multiple poses
          socket.emit('generation:status', { type: 'character', status: 'generating', message: 'Creating full sprite sheet with animations...' });
          
          const { generateCharacterSpriteSheet } = await import('../../services/art/CharacterSpriteSystem.js');
          
          const sheet = await generateCharacterSpriteSheet(
            { name: data.name, race: data.race, class: data.class, hairColor: data.hairColor, gender: data.gender },
            (message, progress) => {
              socket.emit('generation:progress', { type: 'character', message, progress });
            }
          );
          
          socket.emit('spritesheet:ready', { type: 'character', sheet });
          console.log(`✅ Full sprite sheet ready: ${sheet.frames.length} poses`);
          
        } else {
          // Quick single-frame generation (existing behavior)
          socket.emit('generation:status', { type: 'character', status: 'generating', message: 'Creating your character portrait...' });
          
          const sheet = await generateCharacterSheet({
            name: data.name,
            race: data.race,
            class: data.class,
          });
          
          socket.emit('spritesheet:ready', { type: 'character', sheet });
          console.log(`✅ Character portrait ready: ${sheet.frames.length} frames`);
        }
        
        // Store in session if exists
        const session = players.get(socket.id);
        if (session && session.spriteSheet) {
          // Keep existing
        }
        
      } catch (error) {
        console.error('Character sheet generation failed:', error);
        socket.emit('generation:error', { type: 'character', message: String(error) });
      }
    });

    // Generate enemy sprite sheet
    socket.on('spritesheet:enemy', async (data: { type: string }) => {
      try {
        console.log(`🎨 Generating enemy sprite sheet: ${data.type}...`);
        socket.emit('generation:status', { type: 'enemy', status: 'generating', message: `Spawning ${data.type}...` });
        
        const sheet = await generateEnemySheet({ type: data.type });
        
        socket.emit('spritesheet:ready', { type: 'enemy', enemyType: data.type, sheet });
        console.log(`✅ Enemy sprite sheet ready: ${data.type}`);
        
      } catch (error) {
        console.error('Enemy sheet generation failed:', error);
        socket.emit('generation:error', { type: 'enemy', message: String(error) });
      }
    });

    // Generate dungeon tileset
    socket.on('spritesheet:tileset', async (data: { theme: string }) => {
      try {
        console.log(`🎨 Generating tileset: ${data.theme}...`);
        socket.emit('generation:status', { type: 'tileset', status: 'generating', message: `Creating ${data.theme} dungeon tiles...` });
        
        const sheet = await generateTileset({ theme: data.theme });
        
        socket.emit('spritesheet:ready', { type: 'tileset', theme: data.theme, sheet });
        console.log(`✅ Tileset ready: ${data.theme}`);
        
        // Apply to player's dungeon
        const session = players.get(socket.id);
        if (session) session.dungeon.tileset = sheet;
        
      } catch (error) {
        console.error('Tileset generation failed:', error);
        socket.emit('generation:error', { type: 'tileset', message: String(error) });
      }
    });

    // Generate spell effect
    socket.on('spritesheet:effect', async (data: { effectType: string }) => {
      try {
        console.log(`🎨 Generating effect: ${data.effectType}...`);
        
        const sheet = await generateEffectSprites(data.effectType);
        
        socket.emit('spritesheet:ready', { type: 'effect', effectType: data.effectType, sheet });
        console.log(`✅ Effect sprite ready: ${data.effectType}`);
        
      } catch (error) {
        console.error('Effect generation failed:', error);
        socket.emit('generation:error', { type: 'effect', message: String(error) });
      }
    });

    // ====== GAME INITIALIZATION ======
    socket.on('game:init', async (data: { name: string; race: string; class: string; spriteSheet?: GeneratedSpriteSheet }) => {
      // Prevent double initialization
      if (players.has(socket.id)) {
        console.log(`⚠️ [${data.name}] Already initialized, sending state`);
        const existing = players.get(socket.id)!;
        socket.emit('game:state', getVisibleState(existing));
        return;
      }
      
      console.log(`🎮 Initializing: ${data.name} (${data.race} ${data.class})`);
      
      // Use pre-generated dungeon if available (much faster!)
      let dungeon = pregeneratedDungeons.get(socket.id);
      if (dungeon) {
        console.log(`⚡ Using pre-generated dungeon for ${data.name}`);
        pregeneratedDungeons.delete(socket.id);
      } else {
        console.log(`🏗️ Generating new dungeon for ${data.name}...`);
        dungeon = generateDungeon('crypt');
      }
      const startRoom = dungeon.rooms[0];
      const startX = startRoom.x + Math.floor(startRoom.width / 2);
      const startY = startRoom.y + Math.floor(startRoom.height / 2);
      
      const session: PlayerSession = {
        socketId: socket.id,
        playerId: `player_${socket.id}`,
        characterName: data.name,
        characterClass: data.class,
        characterRace: data.race,
        spriteSheet: data.spriteSheet,
        x: startX,
        y: startY,
        dungeon,
        revealedTiles: new Set()
      };
      
      revealAround(session, startX, startY, 4);
      players.set(socket.id, session);
      
      // Send game state first
      socket.emit('game:state', getVisibleState(session));
      
      // Send welcome narration
      const intro = `🏰 **Welcome to the Dungeon, ${data.name}!**

You descend the ancient stone steps into the ${dungeon.theme}. ${startRoom.description}

The air is thick with dust and forgotten secrets. Your torch flickers, casting long shadows on the walls.

**What do you do?**
• Use the quick action buttons below
• Or type any action: "go east", "search for traps", "listen carefully"`;
      
      console.log(`📜 Sending welcome narration to ${data.name}`);
      socket.emit('dm:narrate', { type: 'narration', content: intro, timestamp: Date.now() });
      
      console.log(`✅ ${data.name} spawned at (${startX}, ${startY})`);
    });

    // ====== PLAYER ACTIONS ======
    socket.on('player:action', async (data: { action: string }) => {
      console.log(`📨 Received player:action from ${socket.id}:`, data.action);
      
      const session = players.get(socket.id);
      if (!session) {
        console.log(`❌ No session for ${socket.id}`);
        socket.emit('error', { message: 'Session not found. Refresh the page.' });
        return;
      }
      
      const action = data.action.toLowerCase();
      console.log(`⚔️ [${session.characterName}] ${data.action}`);
      
      const movement = parseMovement(action);
      
      if (movement) {
        const steps = action.includes('explore') || action.includes('walk around') ? 3 : 1;
        let enteredNewRoom = false, newRoomId = '', blocked = '';
        
        for (let i = 0; i < steps; i++) {
          const result = movePlayer(session, movement.dx, movement.dy);
          if (!result.success) { blocked = result.message; break; }
          if (result.message.startsWith('entering_room:')) {
            enteredNewRoom = true;
            newRoomId = result.message.split(':')[1];
            break;
          }
        }
        
        socket.emit('game:state', getVisibleState(session));
        socket.emit('player:moved', { x: session.x, y: session.y, anim: 'walk' });
        
        if (enteredNewRoom) {
          const room = session.dungeon.rooms.find(r => r.id === newRoomId);
          socket.emit('dm:narrate', { type: 'narration', content: `You enter a new area...\n\n${room?.description}`, timestamp: Date.now() });
          
          // Check for enemies - generate their sprites if needed
          const enemies = room?.entities.filter(e => e.type === 'enemy') || [];
          for (const enemy of enemies) {
            if (!enemy.spriteSheet) {
              socket.emit('generation:status', { type: 'enemy', status: 'generating', message: `A ${enemy.name} appears!` });
            }
          }
        } else if (blocked) {
          socket.emit('dm:narrate', { type: 'narration', content: blocked, timestamp: Date.now() });
        } else {
          socket.emit('dm:narrate', { type: 'narration', content: 'You move carefully through the darkness...', timestamp: Date.now() });
        }
        
      } else if (action.includes('look') || action.includes('examine') || action.includes('search') || action.includes('around') || action.includes('surround')) {
        const state = getVisibleState(session);
        let desc = state.currentRoom?.description || 'You stand in a dark stone corridor. Ancient torches flicker on the walls, casting dancing shadows.';
        const entities = state.entities.filter(e => e.type !== 'player');
        if (entities.length > 0) {
          desc += '\n\n**You see:** ' + entities.map(e => e.type === 'enemy' ? `⚔️ ${e.name}` : `📦 ${e.name}`).join(', ');
        }
        desc += '\n\n*Exits: passages lead in several directions.*';
        console.log(`📜 [${session.characterName}] Look response sent`);
        socket.emit('dm:narrate', { type: 'narration', content: desc, timestamp: Date.now() });
        socket.emit('game:state', getVisibleState(session));
        
      } else if (action.includes('attack')) {
        const enemy = session.dungeon.entities.find(e => e.type === 'enemy' && Math.abs(e.x - session.x) <= 2 && Math.abs(e.y - session.y) <= 2);
        
        if (enemy) {
          socket.emit('player:anim', { anim: 'attack' });
          
          const damage = Math.floor(Math.random() * 8) + 3;
          enemy.hp = (enemy.hp || 0) - damage;
          
          let msg = `⚔️ You attack the **${enemy.name}**! **${damage} damage!**`;
          
          if (enemy.hp <= 0) {
            socket.emit('entity:anim', { entityId: enemy.id, anim: 'death' });
            session.dungeon.entities = session.dungeon.entities.filter(e => e.id !== enemy.id);
            msg += `\n\n💀 The ${enemy.name} is defeated!`;
          } else {
            socket.emit('entity:anim', { entityId: enemy.id, anim: 'hurt' });
            msg += `\n❤️ Enemy: ${enemy.hp}/${enemy.maxHp} HP`;
          }
          
          socket.emit('dm:narrate', { type: 'narration', content: msg, timestamp: Date.now() });
          socket.emit('game:state', getVisibleState(session));
        } else {
          socket.emit('dm:narrate', { type: 'narration', content: 'No enemies nearby to attack.', timestamp: Date.now() });
        }
        
      } else if (action.includes('cast') || action.includes('spell') || action.includes('magic')) {
        socket.emit('player:anim', { anim: 'cast' });
        socket.emit('effect:play', { effectType: 'fireball', x: session.x + 2, y: session.y });
        socket.emit('dm:narrate', { type: 'narration', content: '✨ You channel magical energy... A fireball erupts from your hands!', timestamp: Date.now() });
        
      } else if (action.includes('open') || action.includes('chest') || action.includes('loot')) {
        const chest = session.dungeon.entities.find(e => e.type === 'item' && e.sprite === 'chest' && Math.abs(e.x - session.x) <= 2 && Math.abs(e.y - session.y) <= 2);
        
        if (chest) {
          session.dungeon.entities = session.dungeon.entities.filter(e => e.id !== chest.id);
          socket.emit('dm:narrate', {
            type: 'narration',
            content: '✨ **Treasure found!**\n\n• 💰 50 Gold\n• 🧪 Potion of Healing\n• 📜 Ancient Map',
            timestamp: Date.now()
          });
          socket.emit('game:state', getVisibleState(session));
        } else {
          socket.emit('dm:narrate', { type: 'narration', content: 'No chest nearby.', timestamp: Date.now() });
        }
        
      } else {
        // Parse action for animation and movement BEFORE AI narration
        const actionAnimation = parseActionForAnimation(action);
        const actionMovement = parseActionForMovement(action);
        
        // Trigger character animation immediately
        if (actionAnimation) {
          console.log(`🎬 [${session.characterName}] Animation: ${actionAnimation.anim}`);
          socket.emit('player:anim', { anim: actionAnimation.anim, duration: actionAnimation.duration });
        }
        
        // Handle movement from freeform actions (run, walk, jump, climb, etc.)
        if (actionMovement) {
          console.log(`🏃 [${session.characterName}] Movement: dx=${actionMovement.dx}, dy=${actionMovement.dy}, steps=${actionMovement.steps}`);
          
          for (let i = 0; i < actionMovement.steps; i++) {
            const result = movePlayer(session, actionMovement.dx, actionMovement.dy);
            if (!result.success) break;
          }
          
          socket.emit('game:state', getVisibleState(session));
          socket.emit('player:moved', { 
            x: session.x, 
            y: session.y, 
            anim: actionAnimation?.anim || 'walk',
            positionChange: actionMovement 
          });
        }
        
        // Use AI for narrative response
        try {
          const state = getVisibleState(session);
          const context = `You are a dramatic fantasy Dungeon Master. The player "${session.characterName}" (${session.characterRace} ${session.characterClass}) is in: ${state.currentRoom?.description || 'a dark dungeon corridor'}.
Nearby: ${state.entities.length > 0 ? state.entities.map(e => e.name).join(', ') : 'nothing notable'}.
The player is performing this action: "${data.action}"
Describe what happens vividly in 2-3 sentences. If they're moving (running, walking, climbing, jumping), describe the motion and what they see. Make it cinematic.`;
          
          const narration = await ai.narrate(context, `Player action: "${data.action}"`);
          socket.emit('dm:narrate', { type: 'narration', content: narration, timestamp: Date.now() });
        } catch (err) {
          console.error('[AI Narration Error]', err);
          socket.emit('dm:narrate', {
            type: 'narration',
            content: `You attempt to ${data.action.toLowerCase()}... The dungeon responds with eerie silence.`,
            timestamp: Date.now()
          });
        }
      }
    });

    // Request current game state (for reconnect or scene ready)
    socket.on('game:requestState', () => {
      const session = players.get(socket.id);
      if (session) {
        console.log(`📡 [${session.characterName}] Requested game state`);
        socket.emit('game:state', getVisibleState(session));
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
      players.delete(socket.id);
      pregeneratedDungeons.delete(socket.id); // Clean up any unused pre-generated dungeons
    });
  });
}
