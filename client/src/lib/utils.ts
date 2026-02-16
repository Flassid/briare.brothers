import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateCampaignCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function rollDice(diceNotation: string): { rolls: number[]; total: number; modifier: number } {
  // Parse notation like "2d6+3" or "1d20-2"
  const match = diceNotation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    return { rolls: [0], total: 0, modifier: 0 };
  }

  const numDice = parseInt(match[1], 10);
  const dieSize = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * dieSize) + 1);
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return { rolls, total, modifier };
}

export function calculateStatModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function getHealthPercentage(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export function getHealthColor(percentage: number): string {
  if (percentage > 60) return "bg-green-600";
  if (percentage > 30) return "bg-yellow-500";
  return "bg-red-600";
}
