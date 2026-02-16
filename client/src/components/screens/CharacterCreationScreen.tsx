"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore, CLASS_INFO, RACE_INFO, STAT_NAMES } from "@/stores/gameStore";
import { generateId, formatModifier, calculateStatModifier } from "@/lib/utils";
import { getSocket, connectSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import type { CharacterClass, CharacterRace, Stats, Character } from "@/types/game";

// Extended options
const HAIR_COLORS = [
  { id: 'black', name: 'Raven Black', hex: '#1a1a2e' },
  { id: 'brown', name: 'Chestnut Brown', hex: '#8B4513' },
  { id: 'blonde', name: 'Golden Blonde', hex: '#F4D03F' },
  { id: 'red', name: 'Fiery Red', hex: '#C0392B' },
  { id: 'white', name: 'Silver White', hex: '#ECF0F1' },
  { id: 'blue', name: 'Mystic Blue', hex: '#3498DB' },
  { id: 'purple', name: 'Royal Purple', hex: '#9B59B6' },
  { id: 'green', name: 'Forest Green', hex: '#27AE60' },
];

const PERSONALITIES = [
  { id: 'brave', name: 'Brave', desc: 'Fearless in the face of danger', emoji: '🦁' },
  { id: 'cunning', name: 'Cunning', desc: 'Always three steps ahead', emoji: '🦊' },
  { id: 'noble', name: 'Noble', desc: 'Honor above all else', emoji: '👑' },
  { id: 'mysterious', name: 'Mysterious', desc: 'Shrouded in secrets', emoji: '🌙' },
  { id: 'cheerful', name: 'Cheerful', desc: 'Finding light in darkness', emoji: '☀️' },
  { id: 'vengeful', name: 'Vengeful', desc: 'Driven by the past', emoji: '🔥' },
];

const BACKGROUNDS = [
  { id: 'orphan', name: 'Orphan', desc: 'Raised on the streets, forged by hardship' },
  { id: 'noble', name: 'Fallen Noble', desc: 'Once had everything, now seeks redemption' },
  { id: 'soldier', name: 'Veteran Soldier', desc: 'Wars leave scars that never heal' },
  { id: 'scholar', name: 'Exiled Scholar', desc: 'Knowledge is power, and power corrupts' },
  { id: 'criminal', name: 'Reformed Criminal', desc: 'The past is never truly buried' },
  { id: 'wanderer', name: 'Wanderer', desc: 'No home, no ties, endless horizons' },
];

type Step = "basics" | "appearance" | "personality" | "stats" | "generating" | "reveal";

export function CharacterCreationScreen() {
  const { setScreen, setCharacter, playerName } = useGameStore();
  
  // Basic info
  const [step, setStep] = useState<Step>("basics");
  const [characterName, setCharacterName] = useState(playerName || "");
  const [selectedRace, setSelectedRace] = useState<CharacterRace | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [dungeonPregenerated, setDungeonPregenerated] = useState(false);
  
  // Appearance
  const [selectedHairColor, setSelectedHairColor] = useState<string>("brown");
  const [selectedGender, setSelectedGender] = useState<string>("neutral");
  
  // Personality
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<Stats>({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 });
  const [pointsRemaining, setPointsRemaining] = useState(27);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [backstory, setBackstory] = useState("");
  const [backstoryComplete, setBackstoryComplete] = useState(false);
  const [spriteReady, setSpriteReady] = useState(false);
  const [spriteProgress, setSpriteProgress] = useState(0);
  const [spriteMessage, setSpriteMessage] = useState("");
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(null);
  const [revealReady, setRevealReady] = useState(false);
  
  const backstoryRef = useRef<HTMLDivElement>(null);
  const pregenTriggered = useRef(false);

  // Pre-generate dungeon when name is entered (for instant game start)
  useEffect(() => {
    if (characterName.length >= 2 && !pregenTriggered.current && !dungeonPregenerated) {
      pregenTriggered.current = true;
      const socket = getSocket();
      
      if (socket.connected) {
        console.log('[CharCreation] 🏰 Pre-generating dungeon...');
        socket.emit('dungeon:pregenerate');
      } else {
        // Wait for connection
        connectSocket().then(() => {
          const s = getSocket();
          s.emit('dungeon:pregenerate');
        });
      }
    }
  }, [characterName, dungeonPregenerated]);

  // Listen for socket events via window (from SocketProvider)
  useEffect(() => {
    const handleBackstoryChunk = (e: CustomEvent) => {
      setBackstory(prev => prev + e.detail.text);
      if (backstoryRef.current) {
        backstoryRef.current.scrollTop = backstoryRef.current.scrollHeight;
      }
    };
    
    const handleBackstoryComplete = () => {
      setBackstoryComplete(true);
      checkRevealReady();
    };
    
    const handleSpriteReady = (e: CustomEvent) => {
      if (e.detail.type === 'character') {
        const previewUrl = e.detail.sheet.frames[0]?.imageUrl || e.detail.sheet.sheetUrl;
        setGeneratedSpriteUrl(previewUrl);
        setSpriteReady(true);
        (window as any).__playerSpriteSheet = e.detail.sheet;
        checkRevealReady();
      }
    };
    
    const handleGenerationError = (e: CustomEvent) => {
      console.error('[Generation] Error:', e.detail.message);
      setSpriteReady(true);
    };
    
    const handleGenerationProgress = (e: CustomEvent) => {
      if (e.detail.type === 'character') {
        setSpriteProgress(e.detail.progress || 0);
        setSpriteMessage(e.detail.message || '');
      }
    };
    
    const handleDungeonPregen = () => {
      console.log('[CharCreation] ✅ Dungeon pre-generated!');
      setDungeonPregenerated(true);
    };
    
    window.addEventListener('backstory:chunk', handleBackstoryChunk as EventListener);
    window.addEventListener('backstory:complete', handleBackstoryComplete);
    window.addEventListener('spritesheet:ready', handleSpriteReady as EventListener);
    window.addEventListener('generation:error', handleGenerationError as EventListener);
    window.addEventListener('generation:progress', handleGenerationProgress as EventListener);
    window.addEventListener('dungeon:pregenerated', handleDungeonPregen);
    
    // Sprite timeout fallback (longer for full sprite sheet - 10 poses)
    const spriteTimeout = setTimeout(() => {
      setSpriteReady(true);
    }, 180000); // 3 minutes for full sheet
    
    return () => {
      clearTimeout(spriteTimeout);
      window.removeEventListener('backstory:chunk', handleBackstoryChunk as EventListener);
      window.removeEventListener('backstory:complete', handleBackstoryComplete);
      window.removeEventListener('spritesheet:ready', handleSpriteReady as EventListener);
      window.removeEventListener('generation:error', handleGenerationError as EventListener);
      window.removeEventListener('generation:progress', handleGenerationProgress as EventListener);
      window.removeEventListener('dungeon:pregenerated', handleDungeonPregen);
    };
  }, []);

  const checkRevealReady = () => {
    // Small delay for dramatic effect
    setTimeout(() => {
      if (backstoryComplete || backstory.length > 500) {
        setRevealReady(true);
      }
    }, 2000);
  };

  useEffect(() => {
    if (spriteReady && backstoryComplete) {
      setTimeout(() => setRevealReady(true), 1500);
    }
  }, [spriteReady, backstoryComplete]);

  const getStatCost = (value: number): number => (value <= 13 ? 1 : value <= 15 ? 2 : 0);

  const adjustStat = (stat: keyof Stats, delta: number) => {
    const currentValue = stats[stat];
    const newValue = currentValue + delta;
    if (newValue < 8 || newValue > 15) return;
    const currentCost = Array.from({ length: currentValue - 8 }, (_, i) => getStatCost(8 + i + 1)).reduce((a, b) => a + b, 0);
    const newCost = Array.from({ length: newValue - 8 }, (_, i) => getStatCost(8 + i + 1)).reduce((a, b) => a + b, 0);
    const costDiff = newCost - currentCost;
    if (costDiff > pointsRemaining) return;
    setStats({ ...stats, [stat]: newValue });
    setPointsRemaining(pointsRemaining - costDiff);
  };

  const getFinalStats = (): Stats => {
    if (!selectedRace) return stats;
    const bonus = RACE_INFO[selectedRace].bonus;
    return {
      STR: stats.STR + (bonus.STR || 0),
      DEX: stats.DEX + (bonus.DEX || 0),
      CON: stats.CON + (bonus.CON || 0),
      INT: stats.INT + (bonus.INT || 0),
      WIS: stats.WIS + (bonus.WIS || 0),
      CHA: stats.CHA + (bonus.CHA || 0),
    };
  };

  // Start the generation process
  const startGeneration = () => {
    if (!selectedRace || !selectedClass || !selectedPersonality || !selectedBackground) return;
    
    setStep("generating");
    setIsGenerating(true);
    setBackstory("");
    setBackstoryComplete(false);
    setSpriteReady(false);
    setRevealReady(false);
    
    const socket = getSocket();
    
    // Request backstory generation (streamed)
    socket.emit('backstory:generate', {
      name: characterName || 'The Stranger',
      race: selectedRace,
      class: selectedClass,
      personality: selectedPersonality,
      background: selectedBackground,
      hairColor: selectedHairColor,
      gender: selectedGender,
    });
    
    // Request FULL sprite sheet with multiple poses and animations
    socket.emit('spritesheet:character', {
      name: characterName || 'Adventurer',
      race: selectedRace,
      class: selectedClass,
      hairColor: selectedHairColor,
      gender: selectedGender,
      fullSheet: true, // Enable full sprite sheet generation
    });
  };

  const proceedToReveal = () => {
    setStep("reveal");
  };

  const handleFinish = async () => {
    if (!selectedRace || !selectedClass) return;
    
    const finalStats = getFinalStats();
    const maxHp = 10 + calculateStatModifier(finalStats.CON) + Math.floor(finalStats.CON / 2);
    
    const character: Character = {
      id: generateId(),
      name: characterName || "The Stranger",
      race: selectedRace,
      class: selectedClass,
      level: 1,
      stats: finalStats,
      hp: maxHp,
      maxHp: maxHp,
      mana: selectedClass === "mage" ? 20 : 10,
      maxMana: selectedClass === "mage" ? 20 : 10,
      portrait: generatedSpriteUrl || "/portraits/default.png",
      inventory: [],
      spriteKey: `${selectedClass}_idle`,
    };
    
    // Store backstory
    localStorage.setItem('playerBackstory', backstory);
    
    // Make sure socket is connected
    const socket = getSocket();
    if (!socket?.connected) {
      console.log('[CharCreation] Socket disconnected, reconnecting...');
      await connectSocket();
    }
    
    // IMPORTANT: Emit game:init BEFORE switching screens (while socket is still stable)
    console.log('[CharCreation] Emitting game:init for', character.name);
    socket.emit("game:init", {
      name: character.name,
      race: character.race,
      class: character.class,
      spriteSheet: (window as any).__playerSpriteSheet
    });
    
    // Small delay to let the server process before we switch screens
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('[CharCreation] Entering game with character:', character.name);
    setCharacter(character);
    setScreen("game");
  };

  const stepTitles: Record<Step, string> = {
    basics: "Origin",
    appearance: "Appearance", 
    personality: "Soul",
    stats: "Abilities",
    generating: "Destiny Unfolds",
    reveal: "Your Legend Begins"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-950 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-stone-900/90 border border-amber-900/40 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-amber-900/20"
      >
        {/* Header */}
        {step !== "generating" && step !== "reveal" && (
          <div className="text-center mb-6">
            <h1 className="font-serif text-3xl text-amber-400 mb-2">{stepTitles[step]}</h1>
            <div className="flex gap-2 justify-center">
              {["basics", "appearance", "personality", "stats"].map((s, idx) => (
                <div 
                  key={s} 
                  className={`w-3 h-3 rounded-full transition-all ${
                    ["basics", "appearance", "personality", "stats"].indexOf(step as any) >= idx 
                      ? "bg-amber-500 shadow-lg shadow-amber-500/50" 
                      : "bg-stone-700"
                  }`} 
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: BASICS (Race + Class + Name) */}
          {step === "basics" && (
            <motion.div key="basics" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">What shall you be called?</label>
                <input 
                  type="text" 
                  value={characterName} 
                  onChange={(e) => setCharacterName(e.target.value)} 
                  placeholder="Enter your name..." 
                  className="w-full px-4 py-3 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-100 text-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" 
                  maxLength={24} 
                />
              </div>

              {/* Race */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Choose Your Race</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(RACE_INFO) as [CharacterRace, typeof RACE_INFO[CharacterRace]][]).map(([key, info]) => (
                    <button 
                      key={key} 
                      onClick={() => setSelectedRace(key)} 
                      className={`p-3 rounded-lg text-center transition-all border ${
                        selectedRace === key 
                          ? "bg-amber-900/50 border-amber-500 shadow-lg shadow-amber-500/20" 
                          : "bg-stone-800/50 border-stone-700 hover:border-amber-700"
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {key === 'human' ? '👤' : key === 'elf' ? '🧝' : key === 'dwarf' ? '🪓' : 
                         key === 'halfling' ? '🍀' : key === 'dragonborn' ? '🐉' : '😈'}
                      </div>
                      <div className="font-serif text-sm text-stone-200">{info.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Choose Your Path</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(CLASS_INFO) as [CharacterClass, typeof CLASS_INFO[CharacterClass]][]).map(([key, info]) => (
                    <button 
                      key={key} 
                      onClick={() => setSelectedClass(key)} 
                      className={`p-3 rounded-lg text-center transition-all border ${
                        selectedClass === key 
                          ? "bg-amber-900/50 border-amber-500 shadow-lg shadow-amber-500/20" 
                          : "bg-stone-800/50 border-stone-700 hover:border-amber-700"
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {key === 'warrior' ? '⚔️' : key === 'mage' ? '🧙' : key === 'rogue' ? '🗡️' : 
                         key === 'cleric' ? '✨' : key === 'ranger' ? '🏹' : '🛡️'}
                      </div>
                      <div className="font-serif text-sm text-stone-200">{info.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep("appearance")} 
                disabled={!selectedRace || !selectedClass} 
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold disabled:opacity-50 transition-all"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 2: APPEARANCE */}
          {step === "appearance" && (
            <motion.div key="appearance" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
              {/* Gender/Presentation */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Presentation</label>
                <div className="flex gap-3">
                  {[
                    { id: 'masculine', label: 'Masculine', emoji: '♂️' },
                    { id: 'feminine', label: 'Feminine', emoji: '♀️' },
                    { id: 'neutral', label: 'Androgynous', emoji: '⚧️' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedGender(opt.id)}
                      className={`flex-1 p-3 rounded-lg text-center transition-all border ${
                        selectedGender === opt.id 
                          ? "bg-violet-900/50 border-violet-500" 
                          : "bg-stone-800/50 border-stone-700 hover:border-violet-700"
                      }`}
                    >
                      <div className="text-xl">{opt.emoji}</div>
                      <div className="text-sm text-stone-300">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Hair Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedHairColor(color.id)}
                      className={`p-2 rounded-lg text-center transition-all border ${
                        selectedHairColor === color.id 
                          ? "border-amber-500 ring-2 ring-amber-500/30" 
                          : "border-stone-700 hover:border-amber-700"
                      }`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full mx-auto mb-1 border-2 border-stone-600"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs text-stone-400">{color.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("basics")} className="flex-1 py-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300">← Back</button>
                <button onClick={() => setStep("personality")} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 text-white font-bold">Continue →</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PERSONALITY */}
          {step === "personality" && (
            <motion.div key="personality" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
              {/* Personality Trait */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Your Nature</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONALITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersonality(p.id)}
                      className={`p-3 rounded-lg text-left transition-all border ${
                        selectedPersonality === p.id 
                          ? "bg-amber-900/50 border-amber-500" 
                          : "bg-stone-800/50 border-stone-700 hover:border-amber-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.emoji}</span>
                        <span className="font-serif text-stone-200">{p.name}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <label className="block text-amber-500/80 text-sm mb-2 font-medium">Your Past</label>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUNDS.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBackground(b.id)}
                      className={`p-3 rounded-lg text-left transition-all border ${
                        selectedBackground === b.id 
                          ? "bg-violet-900/50 border-violet-500" 
                          : "bg-stone-800/50 border-stone-700 hover:border-violet-700"
                      }`}
                    >
                      <div className="font-serif text-stone-200">{b.name}</div>
                      <p className="text-xs text-stone-500 mt-1">{b.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("appearance")} className="flex-1 py-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300">← Back</button>
                <button 
                  onClick={() => setStep("stats")} 
                  disabled={!selectedPersonality || !selectedBackground}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 text-white font-bold disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: STATS */}
          {step === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Distribute your abilities</span>
                <span className="text-amber-500 font-mono">Points: <span className="text-xl font-bold">{pointsRemaining}</span></span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {STAT_NAMES.map((stat) => (
                  <div key={stat} className="flex items-center gap-3 bg-stone-800/30 rounded-lg p-3">
                    <span className="w-10 font-mono text-stone-400 text-sm">{stat}</span>
                    <button onClick={() => adjustStat(stat, -1)} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600" disabled={stats[stat] <= 8}>-</button>
                    <span className="w-8 text-center font-mono text-lg text-stone-200">{stats[stat]}</span>
                    <button onClick={() => adjustStat(stat, 1)} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600" disabled={stats[stat] >= 15}>+</button>
                    <span className={`text-sm ${calculateStatModifier(getFinalStats()[stat]) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatModifier(calculateStatModifier(getFinalStats()[stat]))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep("personality")} className="flex-1 py-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300">← Back</button>
                <button 
                  onClick={startGeneration}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-violet-700 to-purple-600 hover:from-violet-600 hover:to-purple-500 text-white font-bold"
                >
                  ✨ Forge My Destiny
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: GENERATING (Backstory + Sprite) */}
          {step === "generating" && (
            <motion.div 
              key="generating" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="text-5xl mb-4"
                >
                  ✨
                </motion.div>
                <h2 className="font-serif text-2xl text-amber-400 mb-2">The Fates Are Weaving...</h2>
                <p className="text-stone-500 text-sm">Your legend is being written</p>
              </div>

              {/* Live Backstory */}
              <div 
                ref={backstoryRef}
                className="bg-stone-950/80 rounded-lg p-4 h-64 overflow-y-auto border border-amber-900/30"
              >
                <p className="text-stone-300 font-serif leading-relaxed whitespace-pre-wrap">
                  {backstory}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="text-amber-500"
                  >
                    ▌
                  </motion.span>
                </p>
              </div>

              {/* Progress indicators */}
              <div className="space-y-4">
                <div className="flex justify-center gap-8 text-sm">
                  <div className={`flex items-center gap-2 ${backstoryComplete ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {backstoryComplete ? '✓' : <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>}
                    <span>Backstory</span>
                  </div>
                  <div className={`flex items-center gap-2 ${spriteReady ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {spriteReady ? '✓' : <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span>}
                    <span>Sprite Sheet ({Math.round(spriteProgress)}%)</span>
                  </div>
                </div>
                
                {/* Sprite generation progress bar */}
                {!spriteReady && spriteProgress > 0 && (
                  <div className="space-y-2">
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${spriteProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-center text-stone-500 text-xs">{spriteMessage || 'Generating poses...'}</p>
                  </div>
                )}
              </div>

              {revealReady && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={proceedToReveal}
                  className="w-full py-4 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-lg shadow-lg shadow-amber-500/30"
                >
                  ⚔️ Reveal Your Character
                </motion.button>
              )}
            </motion.div>
          )}

          {/* STEP 6: GRAND REVEAL */}
          {step === "reveal" && (
            <motion.div 
              key="reveal" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h1 className="font-serif text-4xl text-amber-400 mb-2">
                  {characterName || "The Stranger"}
                </h1>
                <p className="text-stone-400">
                  {selectedRace && RACE_INFO[selectedRace].name} {selectedClass && CLASS_INFO[selectedClass].name}
                </p>
              </motion.div>

              {/* Character Portrait */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
                className="relative mx-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-40 h-40 mx-auto rounded-full border-4 border-amber-500 bg-stone-900 flex items-center justify-center overflow-hidden shadow-2xl shadow-amber-500/30">
                  {generatedSpriteUrl ? (
                    <img 
                      src={generatedSpriteUrl} 
                      alt={characterName} 
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                  ) : (
                    <span className="text-6xl">
                      {selectedClass === 'mage' ? '🧙' : selectedClass === 'warrior' ? '⚔️' : selectedClass === 'rogue' ? '🗡️' : '✨'}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Traits */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex justify-center gap-4 text-sm"
              >
                <span className="px-3 py-1 rounded-full bg-amber-900/50 text-amber-400">
                  {PERSONALITIES.find(p => p.id === selectedPersonality)?.emoji} {PERSONALITIES.find(p => p.id === selectedPersonality)?.name}
                </span>
                <span className="px-3 py-1 rounded-full bg-violet-900/50 text-violet-400">
                  {BACKGROUNDS.find(b => b.id === selectedBackground)?.name}
                </span>
              </motion.div>

              {/* Backstory excerpt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-stone-950/60 rounded-lg p-4 max-h-32 overflow-y-auto border border-stone-800"
              >
                <p className="text-stone-400 text-sm font-serif italic leading-relaxed">
                  "{backstory.slice(0, 300)}..."
                </p>
              </motion.div>

              {/* Begin Button */}
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                onClick={handleFinish}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 text-black font-bold text-xl shadow-lg shadow-amber-500/30 animate-pulse"
              >
                ⚔️ Enter the Dungeon
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
