"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connectSocket } from "@/lib/socket";
import { generateCampaignCode } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Floating rune particles - fixed positions to avoid hydration mismatch
const RUNE_CONFIG = [
  { rune: 'ᚠ', x: 5, duration: 14 }, { rune: 'ᚢ', x: 15, duration: 16 },
  { rune: 'ᚦ', x: 25, duration: 12 }, { rune: 'ᚨ', x: 35, duration: 18 },
  { rune: 'ᚱ', x: 45, duration: 15 }, { rune: 'ᚲ', x: 55, duration: 13 },
  { rune: 'ᚷ', x: 65, duration: 17 }, { rune: 'ᚹ', x: 75, duration: 14 },
  { rune: 'ᚺ', x: 85, duration: 16 }, { rune: 'ᚾ', x: 95, duration: 12 },
  { rune: 'ᛁ', x: 10, duration: 19 }, { rune: 'ᛃ', x: 30, duration: 15 },
  { rune: 'ᛈ', x: 50, duration: 14 }, { rune: 'ᛇ', x: 70, duration: 16 },
  { rune: 'ᛊ', x: 90, duration: 13 },
];

const RuneParticle = ({ index, delay }: { index: number; delay: number }) => {
  const config = RUNE_CONFIG[index % RUNE_CONFIG.length];
  
  return (
    <motion.div
      className="absolute text-amber-500/20 text-2xl pointer-events-none select-none"
      style={{ left: `${config.x}%`, bottom: '-20px' }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ 
        y: -800, 
        opacity: [0, 0.6, 0.6, 0],
        x: [0, 30, 0]
      }}
      transition={{ 
        duration: config.duration,
        delay,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {config.rune}
    </motion.div>
  );
};

export function LobbyScreen() {
  const { setScreen, setPlayerName, playerName, setCampaignCode } = useGameStore();
  const [mode, setMode] = useState<"menu" | "create" | "join" | "solo">("menu");
  const [campaignName, setCampaignName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [typedTitle, setTypedTitle] = useState("");

  // Typewriter effect for title
  useEffect(() => {
    const title = "DUNGEON.AI";
    let i = 0;
    const interval = setInterval(() => {
      setTypedTitle(title.slice(0, i + 1));
      i++;
      if (i >= title.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCampaign = () => {
    if (!playerName.trim()) {
      setError("Enter your name, adventurer!");
      return;
    }
    if (!campaignName.trim()) {
      setError("Your quest needs a name!");
      return;
    }
    const code = generateCampaignCode();
    setCampaignCode(code);
    setScreen("character-creation");
  };

  const handleJoinCampaign = () => {
    if (!playerName.trim()) {
      setError("Enter your name, adventurer!");
      return;
    }
    if (joinCode.length !== 6) {
      setError("Campaign code must be 6 characters!");
      return;
    }
    setCampaignCode(joinCode.toUpperCase());
    setScreen("character-creation");
  };

  const handleSoloAdventure = async () => {
    if (!playerName.trim()) {
      setError("Enter your name, adventurer!");
      return;
    }
    
    // Clear any old character/sprite data for fresh start
    useGameStore.getState().setCharacter(null);
    useGameStore.getState().clearMessages();
    if (typeof window !== 'undefined') {
      (window as any).__playerSpriteSheet = null;
    }
    
    // Connect socket early
    await connectSocket();
    
    setCampaignCode("SOLO_" + Date.now());
    setScreen("character-creation");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating runes */}
        {Array.from({ length: 15 }).map((_, i) => (
          <RuneParticle key={i} index={i} delay={i * 0.8} />
        ))}
        
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-amber-900/10 to-transparent" />
        
        {/* Torch flicker effect */}
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.4, 0.7, 0.3], scale: [1, 1.2, 1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-20 right-10 w-4 h-4 bg-orange-400 rounded-full blur-xl"
          animate={{ opacity: [0.5, 0.3, 0.6, 0.4, 0.5], scale: [1.2, 1, 1.3, 1, 1.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center p-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <h1 className="font-serif text-6xl md:text-7xl font-bold tracking-wider">
              <span className="bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 bg-clip-text text-transparent drop-shadow-lg">
                {typedTitle}
              </span>
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-amber-500"
              >
                _
              </motion.span>
            </h1>
            {/* Decorative underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-2"
            />
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-amber-200/60 text-lg mt-4 font-serif italic"
          >
            "Where every story is uniquely yours..."
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="flex items-center justify-center gap-4 mt-3 text-stone-500 text-sm"
          >
            <span>⚔️ AI Dungeon Master</span>
            <span>•</span>
            <span>🎨 Generated Sprites</span>
            <span>•</span>
            <span>📜 Unique Stories</span>
          </motion.div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 rounded-2xl blur-lg" />
          
          <div className="relative bg-stone-900/90 border border-amber-900/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-black/50">
            {/* Name input (always visible) */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="flex items-center gap-2 text-amber-500/80 text-sm mb-2 font-medium">
                <span>⚔️</span>
                <span>What shall we call you, adventurer?</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError(""); }}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-100 text-lg placeholder:text-stone-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                maxLength={20}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Main menu */}
              {mode === "menu" && (
                <motion.div 
                  key="menu"
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <button 
                    onClick={handleSoloAdventure}
                    className="w-full py-4 rounded-lg bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white font-bold text-lg shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-3 group"
                  >
                    <span className="text-2xl group-hover:animate-bounce">🏰</span>
                    <span>Solo Adventure</span>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setMode("create")} 
                      className="py-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-amber-700 text-stone-300 hover:text-amber-300 font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <span>✨</span>
                      <span>Create Party</span>
                    </button>
                    <button 
                      onClick={() => setMode("join")} 
                      className="py-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-violet-700 text-stone-300 hover:text-violet-300 font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <span>🎯</span>
                      <span>Join Party</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Create campaign */}
              {mode === "create" && (
                <motion.div 
                  key="create"
                  initial={{ opacity: 0, x: 50 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="flex items-center gap-2 text-amber-500/80 text-sm mb-2">
                      <span>📜</span>
                      <span>Name Your Quest</span>
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="The Dragon's Lair..."
                      className="w-full px-4 py-3 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      maxLength={40}
                    />
                  </div>
                  <button 
                    onClick={handleCreateCampaign}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold transition-all"
                  >
                    Create & Continue →
                  </button>
                  <button 
                    onClick={() => setMode("menu")} 
                    className="w-full py-2 text-stone-500 hover:text-stone-300 text-sm transition-all"
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

              {/* Join campaign */}
              {mode === "join" && (
                <motion.div 
                  key="join"
                  initial={{ opacity: 0, x: 50 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="flex items-center gap-2 text-violet-400/80 text-sm mb-2">
                      <span>🔑</span>
                      <span>Enter Party Code</span>
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      className="w-full px-4 py-4 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-100 text-center font-mono text-3xl tracking-[0.5em] placeholder:text-stone-600 placeholder:tracking-[0.3em] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all uppercase"
                      maxLength={6}
                    />
                  </div>
                  <button 
                    onClick={handleJoinCampaign}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white font-bold transition-all"
                  >
                    Join Party →
                  </button>
                  <button 
                    onClick={() => setMode("menu")} 
                    className="w-full py-2 text-stone-500 hover:text-stone-300 text-sm transition-all"
                  >
                    ← Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center mt-4 flex items-center justify-center gap-2"
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-8 text-center"
        >
          <p className="text-stone-600 text-xs">
            Powered by Gemini AI • Imagen 4.0 • Built with ❤️
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 text-stone-700 text-lg">
            <span>🐉</span>
            <span>⚔️</span>
            <span>🏰</span>
            <span>💎</span>
            <span>🔮</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}