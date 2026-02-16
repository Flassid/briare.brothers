"use client";

import { useGameStore, CLASS_INFO, STAT_NAMES } from "@/stores/gameStore";
import { formatModifier, calculateStatModifier } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function CharacterPanel() {
  const { character } = useGameStore();
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  
  // Get sprite URL from memory or character portrait
  useEffect(() => {
    const sheet = (window as any).__playerSpriteSheet;
    if (sheet?.frames?.[0]?.imageUrl) {
      setSpriteUrl(sheet.frames[0].imageUrl);
    } else if (character?.portrait && !character.portrait.includes('default')) {
      setSpriteUrl(character.portrait);
    }
  }, [character]);

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center text-stone-500">
        <p>No character loaded</p>
      </div>
    );
  }

  const hpPercent = (character.hp / character.maxHp) * 100;
  const manaPercent = (character.mana / character.maxMana) * 100;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-stone-900 to-stone-950">
      {/* Portrait & Name */}
      <div className="text-center">
        <motion.div 
          className="w-24 h-24 mx-auto mb-3 rounded-lg bg-gradient-to-br from-violet-900/50 to-stone-800 border-2 border-amber-700/50 shadow-lg shadow-amber-900/20 flex items-center justify-center overflow-hidden"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {spriteUrl ? (
            <img 
              src={spriteUrl} 
              alt={character.name}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <span className="text-4xl">
              {character.class === 'mage' ? '🧙' : 
               character.class === 'warrior' ? '⚔️' :
               character.class === 'rogue' ? '🗡️' :
               character.class === 'cleric' ? '✝️' :
               character.class === 'ranger' ? '🏹' :
               character.class === 'paladin' ? '🛡️' : '👤'}
            </span>
          )}
        </motion.div>
        <h2 className="font-serif text-xl text-amber-400 font-bold">{character.name}</h2>
        <p className="text-stone-400 text-sm">
          Level {character.level} {character.race.charAt(0).toUpperCase() + character.race.slice(1)} {CLASS_INFO[character.class]?.name || character.class}
        </p>
      </div>

      {/* HP Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-red-400 flex items-center gap-1">
            <span>❤️</span> HP
          </span>
          <span className="text-stone-300 font-mono">{character.hp} / {character.maxHp}</span>
        </div>
        <div className="h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
          <div 
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Mana Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-blue-400 flex items-center gap-1">
            <span>💎</span> Mana
          </span>
          <span className="text-stone-300 font-mono">{character.mana} / {character.maxMana}</span>
        </div>
        <div className="h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300"
            style={{ width: `${manaPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-amber-500 text-sm font-bold uppercase tracking-wide mb-3 border-b border-amber-900/30 pb-2">
          Attributes
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {STAT_NAMES.map((stat) => {
            const value = character.stats[stat];
            const mod = calculateStatModifier(value);
            return (
              <div key={stat} className="bg-stone-800/50 rounded-lg p-3 border border-stone-700/50">
                <div className="text-stone-500 text-xs uppercase tracking-wider">{stat}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-stone-200">{value}</span>
                  <span className={`text-sm font-mono ${mod >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatModifier(mod)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-amber-500 text-sm font-bold uppercase tracking-wide mb-3 border-b border-amber-900/30 pb-2">
          Inventory
        </h3>
        {character.inventory.length === 0 ? (
          <p className="text-stone-600 text-sm italic">Your pack is empty...</p>
        ) : (
          <div className="space-y-2">
            {character.inventory.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm text-stone-300">
                <span>{item.icon || '📦'}</span>
                <span>{item.name}</span>
                {item.quantity > 1 && <span className="text-stone-500">×{item.quantity}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
