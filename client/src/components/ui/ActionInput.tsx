"use client";

import { useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getSocket } from "@/lib/socket";
import { generateId } from "@/lib/utils";
import { motion } from "framer-motion";

const QUICK_ACTIONS = [
  { label: "Look Around", action: "I look around and examine my surroundings carefully", icon: "👀" },
  { label: "Search", action: "I search the area for anything interesting or hidden", icon: "🔍" },
  { label: "Move Forward", action: "I cautiously move forward deeper into the dungeon", icon: "🚶" },
  { label: "Attack", action: "I ready my weapon and attack!", icon: "⚔️" },
  { label: "Defend", action: "I take a defensive stance, preparing for danger", icon: "🛡️" },
  { label: "Cast Spell", action: "I channel my magical energy and cast a spell", icon: "✨" },
  { label: "Talk", action: "I attempt to communicate", icon: "💬" },
  { label: "Rest", action: "I take a moment to catch my breath and rest", icon: "🏕️" },
];

export function ActionInput() {
  const { combat, character, isLoading, setIsLoading, addMessage } = useGameStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isPlayerTurn = combat.active && combat.currentTurnId === "player";

  const sendAction = (action: string) => {
    if (!action.trim()) return;
    
    const socket = getSocket();
    console.log('[ActionInput] Sending action:', action);
    
    addMessage({
      id: generateId(),
      timestamp: Date.now(),
      type: "player",
      sender: character?.name || "You",
      content: action
    });
    
    setIsLoading(true);
    socket.emit("player:action", { action });
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    sendAction(input.trim());
    setInput("");
  };

  const handleQuickAction = (action: string) => {
    if (isLoading) return;
    sendAction(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3 bg-gradient-to-t from-stone-950 to-stone-900 p-4 border-t border-amber-900/30">
      {/* Quick Action Chips - Always Visible */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((qa) => (
          <button 
            key={qa.label} 
            onClick={() => handleQuickAction(qa.action)}
            disabled={isLoading}
            className="
              px-3 py-1.5 rounded-full text-xs font-medium
              bg-stone-800/80 hover:bg-amber-900/60 
              border border-stone-700 hover:border-amber-600
              text-stone-300 hover:text-amber-200
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1.5
              shadow-sm hover:shadow-amber-900/30
            "
          >
            <span>{qa.icon}</span>
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Main Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={combat.active 
              ? (isPlayerTurn ? "⚔️ Your turn! Describe your combat action..." : "⏳ Waiting for your turn...") 
              : "🎭 What do you do? Describe your action in natural language..."
            }
            disabled={isLoading || (combat.active && !isPlayerTurn)}
            rows={2}
            className="
              w-full px-4 py-3 rounded-lg
              bg-stone-800/60 border border-stone-700/50
              focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20
              text-stone-200 placeholder-stone-500
              resize-none transition-all duration-200
              font-serif text-sm
              disabled:opacity-50
            "
          />
          {input.length > 0 && (
            <span className="absolute right-3 bottom-3 text-xs text-stone-600">
              {input.length}/500
            </span>
          )}
        </div>
        
        <button 
          onClick={handleSubmit} 
          disabled={!input.trim() || isLoading || (combat.active && !isPlayerTurn)} 
          className="
            px-6 py-3 rounded-lg font-bold
            bg-gradient-to-r from-amber-700 to-amber-600
            hover:from-amber-600 hover:to-amber-500
            text-white shadow-lg shadow-amber-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center gap-2
          "
        >
          {isLoading ? (
            <motion.span 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
              className="inline-block"
            >
              ⏳
            </motion.span>
          ) : (
            <>
              <span>⚡</span>
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </div>
      
      {/* Status indicator */}
      {isLoading && (
        <div className="text-center">
          <span className="text-amber-500 text-sm animate-pulse font-serif">
            🎲 The Dungeon Master weaves your fate...
          </span>
        </div>
      )}
    </div>
  );
}
