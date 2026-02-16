"use client";

import { useGameStore } from "@/stores/gameStore";
import { getHealthPercentage } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { CombatParticipant } from "@/types/game";

export function CombatUI() {
  const { combat } = useGameStore();
  if (!combat.active) return null;

  const getCurrentTurnName = (): string => {
    const current = combat.initiative.find((p) => p.id === combat.currentTurnId);
    return current?.name || "Unknown";
  };

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="dungeon-panel p-3 text-center">
        <div className="text-dungeon-gold font-fantasy text-lg">⚔️ COMBAT - Round {combat.turn}</div>
        {combat.currentTurnId && <div className="text-sm text-dungeon-muted mt-1">{getCurrentTurnName()}&apos;s turn</div>}
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        <AnimatePresence>
          {combat.initiative.map((participant, idx) => (
            <motion.div key={participant.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: idx * 0.1 }}>
              <InitiativeCard participant={participant} isActive={participant.id === combat.currentTurnId} position={idx + 1} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {combat.log.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dungeon-panel p-2 max-h-24 overflow-y-auto">
          <div className="space-y-1">
            {combat.log.slice(-5).map((entry) => (
              <div key={entry.id} className="text-xs text-dungeon-muted flex items-center gap-2">
                <span className="text-dungeon-accent">{entry.actor}</span>
                <span>{entry.message}</span>
                {entry.roll && (
                  <span className={`font-mono ${entry.roll.critical ? "text-dungeon-gold font-bold" : entry.roll.success ? "text-green-400" : "text-red-400"}`}>
                    [{entry.roll.dice}: {entry.roll.total}]
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InitiativeCard({ participant, isActive, position }: { participant: CombatParticipant; isActive: boolean; position: number }) {
  const hpPercent = getHealthPercentage(participant.hp, participant.maxHp);
  const isDead = participant.hp <= 0;

  return (
    <div className={`dungeon-panel p-2 min-w-[80px] transition-all relative ${isActive ? "border-dungeon-gold shadow-gold-glow scale-105" : isDead ? "opacity-50" : ""}`}>
      <div className="text-xs text-dungeon-muted mb-1 text-center">#{position}</div>
      <div className="w-12 h-12 mx-auto mb-2 rounded overflow-hidden bg-dungeon-bg flex items-center justify-center">
        <span className="text-2xl">{participant.type === "player" ? "⚔️" : "👹"}</span>
      </div>
      <div className={`text-xs text-center truncate mb-1 ${participant.type === "player" ? "text-dungeon-accent" : "text-dungeon-crimson"}`}>{participant.name}</div>
      <div className="health-bar h-2">
        <motion.div className={`h-full ${participant.type === "player" ? "health-bar-fill" : "bg-dungeon-crimson"}`} animate={{ width: `${hpPercent}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="text-xs text-center mt-1 font-mono text-dungeon-muted">{participant.hp}/{participant.maxHp}</div>
      {isActive && <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-dungeon-gold rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
    </div>
  );
}
