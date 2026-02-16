/**
 * Core types for the DM system
 */

// ============ CHARACTER TYPES ============

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  stats: CharacterStats;
  hp: { current: number; max: number };
  ac: number;
  proficiencyBonus: number;
  backstory: string;
  personality: {
    traits: string[];
    bonds: string[];
    flaws: string[];
    ideals: string[];
  };
  equipment: Equipment[];
  skills: SkillProficiency[];
  abilities: Ability[];
}

export interface Equipment {
  name: string;
  type: 'weapon' | 'armor' | 'item' | 'tool';
  description: string;
  properties?: Record<string, any>;
}

export interface SkillProficiency {
  name: string;
  proficient: boolean;
  expertise: boolean;
  modifier: number;
}

export interface Ability {
  name: string;
  description: string;
  usesPerRest?: number;
  currentUses?: number;
}

// ============ COMBAT TYPES ============

export interface CombatAction {
  playerId: string;
  characterId: string;
  rawInput: string;
  parsedAction: ParsedAction;
  creativityBonus: number;
  difficultyClass: number;
  roll: DiceRoll;
  outcome: ActionOutcome;
}

export interface ParsedAction {
  intent: 'attack' | 'defend' | 'support' | 'interact' | 'move' | 'special';
  target?: string;
  method: string;
  objects?: string[];
  isCreative: boolean;
  creativityReason?: string;
  relevantStats: (keyof CharacterStats)[];
}

export interface DiceRoll {
  d20: number;
  modifier: number;
  total: number;
  advantage?: boolean;
  disadvantage?: boolean;
  criticalHit?: boolean;
  criticalFail?: boolean;
}

export interface ActionOutcome {
  success: boolean;
  degree: 'critical_success' | 'success' | 'partial' | 'failure' | 'critical_failure';
  damage?: { amount: number; type: string };
  effects: Effect[];
  narration: string;
}

export interface Effect {
  type: 'damage' | 'healing' | 'condition' | 'position' | 'item' | 'story';
  target: string;
  value?: number;
  description: string;
  duration?: number;
}

// ============ NARRATIVE TYPES ============

export interface Scene {
  id: string;
  title: string;
  description: string;
  mood: 'tense' | 'mysterious' | 'joyful' | 'dark' | 'epic' | 'peaceful';
  environment: Environment;
  npcs: string[]; // NPC IDs present
  threats: string[]; // Potential danger IDs
  opportunities: string[]; // Interactive elements
  exits: SceneExit[];
}

export interface Environment {
  type: 'dungeon' | 'forest' | 'town' | 'castle' | 'wilderness' | 'underground' | 'planar';
  lighting: 'bright' | 'dim' | 'dark' | 'magical';
  weather?: string;
  sounds: string[];
  smells: string[];
  interactables: Interactable[];
}

export interface Interactable {
  id: string;
  name: string;
  description: string;
  hidden: boolean;
  actionHints: string[];
}

export interface SceneExit {
  direction: string;
  description: string;
  destination: string;
  locked?: boolean;
  hidden?: boolean;
}

export interface WorldState {
  currentSceneId: string;
  time: GameTime;
  globalFlags: Record<string, boolean | number | string>;
  partyReputation: Record<string, number>;
  activeQuests: Quest[];
  completedQuests: string[];
  deadNPCs: string[];
  discoveredLocations: string[];
}

export interface GameTime {
  day: number;
  hour: number;
  period: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  giver: string;
  urgency: 'critical' | 'normal' | 'passive';
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  hidden: boolean;
}

export interface QuestReward {
  type: 'gold' | 'item' | 'reputation' | 'experience' | 'story';
  value: number | string;
  description: string;
}

// ============ NPC TYPES ============

export interface NPC {
  id: string;
  name: string;
  title?: string;
  race: string;
  occupation: string;
  appearance: string;
  personality: NPCPersonality;
  voice: VoiceStyle;
  motivations: string[];
  secrets: string[];
  relationships: Record<string, NPCRelationship>;
  memory: NPCMemory[];
  currentMood: string;
  combatStats?: NPCCombatStats;
}

export interface NPCPersonality {
  archetype: string;
  traits: string[];
  quirks: string[];
  fears: string[];
  values: string[];
}

export interface VoiceStyle {
  tone: string;
  vocabulary: 'simple' | 'common' | 'educated' | 'archaic' | 'slang';
  speechPatterns: string[];
  catchphrases: string[];
}

export interface NPCRelationship {
  characterId: string;
  disposition: number; // -100 to 100
  trust: number;
  history: string[];
  lastInteraction?: string;
}

export interface NPCMemory {
  timestamp: string;
  type: 'conversation' | 'action' | 'gift' | 'threat' | 'help';
  characterId: string;
  summary: string;
  emotional_impact: number; // -10 to 10
}

export interface NPCCombatStats {
  hp: { current: number; max: number };
  ac: number;
  attacks: NPCAttack[];
  abilities: string[];
  cr: number;
}

export interface NPCAttack {
  name: string;
  toHit: number;
  damage: string;
  damageType: string;
  description: string;
}

// ============ ENCOUNTER TYPES ============

export interface Encounter {
  id: string;
  type: 'combat' | 'social' | 'exploration' | 'puzzle' | 'trap';
  name: string;
  description: string;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  enemies?: Enemy[];
  puzzle?: Puzzle;
  trap?: Trap;
  loot: Loot[];
  triggerConditions: string[];
  resolutionOptions: string[];
}

export interface Enemy {
  npcId: string;
  quantity: number;
  tactics: string;
  morale: 'fanatical' | 'brave' | 'normal' | 'cowardly';
  fleeThreshold?: number;
}

export interface Puzzle {
  description: string;
  clues: string[];
  solution: string;
  hints: string[];
  consequences: {
    success: string;
    failure: string;
    partial: string;
  };
}

export interface Trap {
  trigger: string;
  effect: string;
  damage?: string;
  saveDC: number;
  saveType: keyof CharacterStats;
  detection: {
    dc: number;
    method: string;
  };
  disarm: {
    dc: number;
    method: string;
  };
}

export interface Loot {
  item: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  hidden: boolean;
  container?: string;
}

// ============ SESSION TYPES ============

export interface GameSession {
  id: string;
  campaignId: string;
  players: string[];
  worldState: WorldState;
  combatState?: CombatState;
  history: SessionEvent[];
  startedAt: string;
  lastActivityAt: string;
}

export interface CombatState {
  active: boolean;
  round: number;
  initiativeOrder: InitiativeEntry[];
  currentTurn: number;
  combatants: Combatant[];
  environment: CombatEnvironment;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  hp: { current: number; max: number };
  ac: number;
  conditions: string[];
  position?: { x: number; y: number };
}

export interface CombatEnvironment {
  terrain: string;
  hazards: string[];
  cover: string[];
  interactables: string[];
}

export interface SessionEvent {
  timestamp: string;
  type: 'narrative' | 'combat' | 'dialogue' | 'discovery' | 'rest';
  summary: string;
  details: Record<string, any>;
}

// ============ AI RESPONSE TYPES ============

export interface DMResponse {
  narration: string;
  sceneUpdates?: Partial<Scene>;
  worldStateChanges?: Partial<WorldState>;
  npcActions?: NPCAction[];
  promptChoices?: PromptChoice[];
  combatUpdates?: CombatUpdate[];
}

export interface NPCAction {
  npcId: string;
  action: string;
  dialogue?: string;
  effect?: Effect;
}

export interface PromptChoice {
  id: string;
  text: string;
  hint?: string;
  type: 'obvious' | 'hidden' | 'risky';
}

export interface CombatUpdate {
  combatantId: string;
  hpChange?: number;
  conditionAdded?: string;
  conditionRemoved?: string;
  position?: { x: number; y: number };
}
