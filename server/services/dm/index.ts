/**
 * Dungeon.AI - AI Dungeon Master Service
 * 
 * The brain of the game. Coordinates all AI-driven gameplay:
 * - Character generation
 * - Narrative storytelling
 * - Combat resolution
 * - NPC interactions
 * - Encounter management
 */

export { DungeonMaster } from './DungeonMaster';
export { CharacterGenerator } from './CharacterGenerator';
export { NarrativeEngine } from './NarrativeEngine';
export { CombatResolver } from './CombatResolver';
export { EncounterGenerator } from './EncounterGenerator';
export { NPCManager } from './NPCManager';

// AI Clients
export { AIClient, type AIProvider } from './AIClient';
export { ClaudeClient } from './ClaudeClient';
export { GeminiClient } from './GeminiClient';

// Types
export * from './types';
