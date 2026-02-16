"use client";

import { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCharacter } from "./AnimatedCharacter";

interface RoomScene {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  exits: string[];
  entities: { id: string; name: string; type: 'enemy' | 'npc' | 'item'; emoji: string }[];
}

// Default room scenes while AI generates
const DEFAULT_ROOMS: Record<string, RoomScene> = {
  entrance: {
    id: 'entrance',
    name: 'Dungeon Entrance',
    description: 'Ancient stone steps descend into darkness. Torchlight flickers on moss-covered walls.',
    exits: ['north'],
    entities: []
  },
  corridor: {
    id: 'corridor',
    name: 'Dark Corridor',
    description: 'A narrow passage stretches before you. Water drips from the ceiling.',
    exits: ['north', 'south'],
    entities: []
  },
  chamber: {
    id: 'chamber',
    name: 'Guard Chamber',
    description: 'A large chamber with broken pillars. Something stirs in the shadows...',
    exits: ['south', 'east'],
    entities: [{ id: 'goblin1', name: 'Goblin Scout', type: 'enemy', emoji: '👺' }]
  },
  treasure: {
    id: 'treasure',
    name: 'Treasure Vault',
    description: 'Gold gleams in the dim light. An ornate chest sits against the far wall.',
    exits: ['west'],
    entities: [{ id: 'chest1', name: 'Treasure Chest', type: 'item', emoji: '📦' }]
  }
};

export function DungeonScene() {
  const { character } = useGameStore();
  const [currentRoom, setCurrentRoom] = useState<RoomScene>(DEFAULT_ROOMS.entrance);
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [characterPos, setCharacterPos] = useState({ x: 50, y: 70 }); // percentage
  const [isMoving, setIsMoving] = useState(false);
  const [spriteSheet, setSpriteSheet] = useState<any>(null);
  const [currentAnim, setCurrentAnim] = useState<string>('idle');
  
  // Get sprite sheet on client only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sheet = (window as any).__playerSpriteSheet;
      if (sheet) {
        setSpriteSheet(sheet);
      }
    }
  }, [character]);

  // Handle animation changes based on actions
  const playAnimation = (anim: string, duration: number = 1500) => {
    console.log('[DungeonScene] Playing animation:', anim, 'for', duration, 'ms');
    setCurrentAnim(anim);
    // Return to idle after non-looping animations
    if (anim !== 'idle') {
      setTimeout(() => {
        console.log('[DungeonScene] Animation complete, returning to idle');
        setCurrentAnim('idle');
      }, duration);
    }
  };

  // Generate AI room image
  const generateRoomImage = async (room: RoomScene) => {
    setIsGeneratingImage(true);
    
    const socket = getSocket();
    if (!socket?.connected) {
      console.log('[DungeonScene] Socket not connected, retrying in 1s...');
      setTimeout(() => generateRoomImage(room), 1000);
      return;
    }

    console.log('[DungeonScene] Requesting room image:', room.name);
    
    // Request room image generation
    socket.emit('generate:room', {
      roomType: room.id,
      description: room.description,
      name: room.name
    });
  };

  // Listen for room image generation and game events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRoomImage = (e: CustomEvent) => {
      console.log('[DungeonScene] Room image received, fallback:', e.detail.fallback);
      if (e.detail.fallback || e.detail.imageUrl === 'fallback') {
        // Use CSS gradient fallback
        setRoomImage(null);
      } else {
        setRoomImage(e.detail.imageUrl);
      }
      setIsGeneratingImage(false);
    };

    // Listen for animation triggers from actions
    const handleAnimation = (e: CustomEvent) => {
      const anim = e.detail?.anim || e.detail?.animation;
      const duration = e.detail?.duration || 1500;
      console.log('[DungeonScene] Animation event:', anim, 'duration:', duration);
      if (anim) {
        playAnimation(anim, duration);
      }
    };

    // Listen for player moved events (position changes from freeform actions)
    const handlePlayerMoved = (e: CustomEvent) => {
      const { x, y, anim, positionChange } = e.detail || {};
      console.log('[DungeonScene] Player moved:', { x, y, anim, positionChange });
      
      if (anim) {
        playAnimation(anim, 2000);
      }
      
      // Animate character movement across the scene
      if (positionChange) {
        setIsMoving(true);
        
        // Calculate visual movement direction
        const { dx, dy, steps } = positionChange;
        const moveX = characterPos.x + (dx * steps * 8); // 8% per step
        const moveY = characterPos.y + (dy * steps * 5); // 5% per step for vertical
        
        // Clamp to scene bounds
        const newX = Math.max(20, Math.min(80, moveX));
        const newY = Math.max(40, Math.min(85, moveY));
        
        setCharacterPos({ x: newX, y: newY });
        
        setTimeout(() => {
          setIsMoving(false);
          setCurrentAnim('idle');
        }, 2000);
      }
    };

    // Listen for room changes from server
    const handleRoomChange = (e: CustomEvent) => {
      const newRoomId = e.detail?.roomId || e.detail?.room;
      if (newRoomId && DEFAULT_ROOMS[newRoomId]) {
        setIsMoving(true);
        setCharacterPos({ x: 50, y: 120 }); // Exit down
        
        setTimeout(() => {
          setCurrentRoom(DEFAULT_ROOMS[newRoomId]);
          setRoomImage(null);
          generateRoomImage(DEFAULT_ROOMS[newRoomId]);
          setCharacterPos({ x: 50, y: -20 }); // Enter from top
          
          setTimeout(() => {
            setCharacterPos({ x: 50, y: 70 });
            setIsMoving(false);
          }, 100);
        }, 500);
      }
    };

    window.addEventListener('room:image:ready', handleRoomImage as EventListener);
    window.addEventListener('player:anim', handleAnimation as EventListener);
    window.addEventListener('player:moved', handlePlayerMoved as EventListener);
    window.addEventListener('room:change', handleRoomChange as EventListener);
    
    // Generate image for initial room after a short delay
    const timer = setTimeout(() => {
      generateRoomImage(currentRoom);
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('room:image:ready', handleRoomImage as EventListener);
      window.removeEventListener('player:anim', handleAnimation as EventListener);
      window.removeEventListener('player:moved', handlePlayerMoved as EventListener);
      window.removeEventListener('room:change', handleRoomChange as EventListener);
    };
  }, []);

  // Move to a new room
  const moveToRoom = (direction: string) => {
    setIsMoving(true);
    
    // Animate character walking off screen
    const exitX = direction === 'east' ? 120 : direction === 'west' ? -20 : 50;
    const exitY = direction === 'north' ? -20 : direction === 'south' ? 120 : 70;
    setCharacterPos({ x: exitX, y: exitY });

    setTimeout(() => {
      // Change room
      const roomOrder = ['entrance', 'corridor', 'chamber', 'treasure'];
      const currentIndex = roomOrder.indexOf(currentRoom.id);
      const nextIndex = (currentIndex + 1) % roomOrder.length;
      const nextRoom = DEFAULT_ROOMS[roomOrder[nextIndex]];
      
      setCurrentRoom(nextRoom);
      setRoomImage(null);
      generateRoomImage(nextRoom);
      
      // Reset character position (entering from opposite side)
      const enterX = direction === 'east' ? -10 : direction === 'west' ? 110 : 50;
      const enterY = direction === 'north' ? 110 : direction === 'south' ? -10 : 70;
      setCharacterPos({ x: enterX, y: enterY });
      
      // Animate character entering
      setTimeout(() => {
        setCharacterPos({ x: 50, y: 70 });
        setIsMoving(false);
      }, 100);
    }, 500);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Room Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoom.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {roomImage ? (
            <img 
              src={roomImage} 
              alt={currentRoom.name}
              className="w-full h-full object-cover"
            />
          ) : (
            // Atmospheric fallback scene
            <div className="w-full h-full relative overflow-hidden">
              {/* Base gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-black" />
              
              {/* Stone texture overlay */}
              <div className="absolute inset-0 opacity-20" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundSize: '150px 150px'
                }} 
              />
              
              {/* Torch glow effects */}
              <div className="absolute top-1/4 left-1/6 w-32 h-48 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="absolute top-1/3 right-1/5 w-28 h-40 bg-amber-500/15 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Arch/doorway silhouette */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-80">
                <div className="w-full h-full bg-black/60 rounded-t-full" />
              </div>
              
              {/* Floor stones hint */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-950 to-transparent" />
              
              {/* Loading indicator or ready state */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isGeneratingImage ? (
                  <div className="space-y-4 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-5xl"
                    >
                      🎨
                    </motion.div>
                    <p className="text-amber-500/60 text-sm">Conjuring vision...</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          
          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60 pointer-events-none" />
          
          {/* Fog/atmosphere overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Animated Character */}
      <motion.div
        className="absolute z-10"
        animate={{
          left: `${characterPos.x}%`,
          top: `${characterPos.y}%`,
          scale: isMoving ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          left: { duration: isMoving ? 1.5 : 0.3, ease: "easeInOut" },
          top: { duration: isMoving ? 1.5 : 0.3, ease: "easeInOut" },
          scale: { duration: 0.3 }
        }}
        style={{
          transform: 'translate(-50%, -50%)'
        }}
      >
        <AnimatedCharacter
          spriteSheet={spriteSheet}
          fallbackEmoji={character?.class === 'mage' ? '🧙' : character?.class === 'rogue' ? '🗡️' : '⚔️'}
          currentAnimation={isMoving ? 'walk' : currentAnim}
          size={128}
        />
      </motion.div>

      {/* Room Info Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-amber-900/30"
        >
          <h2 className="font-serif text-xl text-amber-400">{currentRoom.name}</h2>
          <p className="text-stone-400 text-sm mt-1">{currentRoom.description}</p>
        </motion.div>
      </div>

      {/* Entities in room */}
      {currentRoom.entities.length > 0 && (
        <div className="absolute top-24 right-4 z-20 space-y-2">
          {currentRoom.entities.map(entity => (
            <motion.div
              key={entity.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`px-3 py-2 rounded-lg backdrop-blur-sm border flex items-center gap-2 ${
                entity.type === 'enemy' 
                  ? 'bg-red-900/50 border-red-700/50 text-red-300' 
                  : entity.type === 'item'
                  ? 'bg-amber-900/50 border-amber-700/50 text-amber-300'
                  : 'bg-green-900/50 border-green-700/50 text-green-300'
              }`}
            >
              <span className="text-xl">{entity.emoji}</span>
              <span className="text-sm">{entity.name}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* No navigation buttons - controlled via chat/action panel */}
    </div>
  );
}
