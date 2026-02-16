"use client";

import { useRef, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { formatTimestamp } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/types/game";

export function ChatPanel() {
  const { messages, connected } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-stone-900 to-stone-950">
      {/* Header */}
      <div className="p-3 border-b border-amber-900/30 bg-stone-900/80 backdrop-blur">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-amber-400 text-lg flex items-center gap-2">
            <span className="text-2xl">📜</span>
            Chronicle
          </h2>
          <div className={`text-xs px-2 py-1 rounded ${connected ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
            {connected ? "⚡ Connected" : "⚠ Disconnected"}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-amber-900/50">
        {messages.length === 0 && (
          <div className="text-center text-stone-500 py-12">
            <div className="text-4xl mb-4">🏰</div>
            <p className="font-serif text-lg">Your adventure awaits...</p>
            <p className="text-sm mt-2 text-stone-600">Describe your first action below</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.type === "system") {
    return (
      <div className="text-center text-stone-500 text-xs italic py-2 px-4">
        {message.content}
      </div>
    );
  }

  const isDM = message.type === "dm";
  
  return (
    <div className={`rounded-lg p-4 ${
      isDM 
        ? "bg-gradient-to-r from-amber-950/60 to-stone-900/60 border-l-4 border-amber-600 shadow-lg shadow-amber-900/20" 
        : "bg-gradient-to-r from-violet-950/40 to-stone-900/40 border-l-4 border-violet-500"
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold tracking-wide uppercase ${isDM ? "text-amber-500" : "text-violet-400"}`}>
          {isDM ? "🐉 Dungeon Master" : `⚔️ ${message.sender || "You"}`}
        </span>
        <span className="text-xs text-stone-600">{formatTimestamp(message.timestamp)}</span>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDM ? "text-stone-200 font-serif" : "text-stone-300"}`}>
        {message.content}
      </p>
    </div>
  );
}
