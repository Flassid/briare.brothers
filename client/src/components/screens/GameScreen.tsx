"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getSocket, connectSocket } from "@/lib/socket";
import { DungeonScene } from "@/components/game/DungeonScene";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { CharacterPanel } from "@/components/ui/CharacterPanel";
import { CombatUI } from "@/components/ui/CombatUI";
import { ActionInput } from "@/components/ui/ActionInput";
import { motion, AnimatePresence } from "framer-motion";
import { generateId } from "@/lib/utils";

export function GameScreen() {
  const { character, combat, connected, setConnected, addMessage, messages, setIsLoading } = useGameStore();
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);

  // Request game state when entering this screen (game:init was already sent from CharacterCreation)
  useEffect(() => {
    if (!character) return;
    
    console.log('[GameScreen] Mounted for', character.name, 'initialized:', gameInitialized);
    
    const socket = getSocket();
    
    if (socket?.connected) {
      setConnected(true);
      
      // Request state (game:init was already sent from CharacterCreation)
      console.log('[GameScreen] Requesting game state...');
      socket.emit("game:requestState");
      
      // Add welcome message if first time
      if (!gameInitialized) {
        addMessage({
          id: generateId(),
          timestamp: Date.now(),
          type: "system",
          content: `⚔️ ${character.name} the ${character.race} ${character.class} descends into the dungeon...`
        });
      }
    } else {
      console.log('[GameScreen] Socket not connected, connecting...');
      connectSocket().then(() => {
        const s = getSocket();
        if (s?.connected) {
          setConnected(true);
          // Re-emit game:init since we reconnected
          console.log('[GameScreen] Reconnected, re-emitting game:init');
          s.emit("game:init", {
            name: character.name,
            race: character.race,
            class: character.class,
            spriteSheet: (window as any).__playerSpriteSheet
          });
        }
      });
    }
  }, [character, gameInitialized, setConnected, addMessage]);

  // Listen for game:state via window event
  useEffect(() => {
    const handleGameState = () => {
      console.log('[GameScreen] game:state event received');
      setIsLoading(false);
      setGameInitialized(true);
    };
    
    window.addEventListener('game:state', handleGameState);
    return () => window.removeEventListener('game:state', handleGameState);
  }, [setIsLoading]);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-black">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-stone-900/90 border-b border-amber-900/30 backdrop-blur">
        <button 
          onClick={() => setShowCharPanel(!showCharPanel)} 
          className="px-3 py-1.5 rounded bg-stone-800 border border-stone-700 text-stone-300 text-sm"
        >
          {showCharPanel ? "✕" : "👤"}
        </button>
        <div className="text-amber-500 font-serif">{character?.name}</div>
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
      </div>

      {/* Desktop character panel */}
      <aside className="hidden md:flex w-64 flex-col bg-stone-900/95 border-r border-amber-900/30">
        <CharacterPanel />
      </aside>

      {/* Mobile character panel */}
      <AnimatePresence>
        {showCharPanel && (
          <motion.aside 
            initial={{ x: -280 }} 
            animate={{ x: 0 }} 
            exit={{ x: -280 }} 
            className="absolute left-0 top-14 bottom-0 w-64 z-50 bg-stone-900/98 border-r border-amber-900/30 md:hidden"
          >
            <CharacterPanel />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main game area */}
      <main className="flex-1 flex flex-col min-h-0 relative bg-black">
        <DungeonScene />
        {combat.active && (
          <div className="absolute top-0 left-0 right-0 p-4 z-10">
            <CombatUI />
          </div>
        )}
      </main>

      {/* Chat + Actions panel */}
      <aside className="h-[40vh] md:h-auto md:w-96 flex flex-col bg-stone-900/95 border-t md:border-t-0 md:border-l border-amber-900/30">
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatPanel />
        </div>
        <ActionInput />
      </aside>
    </div>
  );
}
