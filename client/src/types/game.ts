export type Screen = "lobby" | "character-creation" | "game";
export type GamePhase = "exploration" | "combat" | "dialogue" | "rest";

export interface Stats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  level: number;
  stats: Stats;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  portrait: string;
  inventory: InventoryItem[];
  position?: { x: number; y: number };
  spriteKey?: string;
}

export type CharacterClass = "warrior" | "mage" | "rogue" | "cleric" | "ranger" | "paladin";
export type CharacterRace = "human" | "elf" | "dwarf" | "halfling" | "dragonborn" | "tiefling";

export interface InventoryItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "potion" | "scroll" | "misc";
  description: string;
  quantity: number;
  icon: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  position: { x: number; y: number };
  spriteKey: string;
  initiative?: number;
}

export interface CombatState {
  active: boolean;
  turn: number;
  initiative: CombatParticipant[];
  currentTurnId: string | null;
  log: CombatLogEntry[];
}

export interface CombatParticipant {
  id: string;
  name: string;
  type: "player" | "enemy";
  initiative: number;
  hp: number;
  maxHp: number;
  portrait?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: "action" | "damage" | "heal" | "roll" | "system";
  actor?: string;
  target?: string;
  message: string;
  roll?: {
    dice: string;
    result: number;
    modifier: number;
    total: number;
    success?: boolean;
    critical?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  type: "dm" | "player" | "system";
  sender?: string;
  senderId?: string;
  content: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  backgroundKey: string;
  ambiance?: string;
}

export interface Campaign {
  id: string;
  code: string;
  name: string;
  dm: string;
  players: Player[];
  scene: Scene | null;
  phase: GamePhase;
  combat: CombatState;
}

export interface Player {
  id: string;
  name: string;
  character: Character | null;
  ready: boolean;
  connected: boolean;
}

export interface ServerToClientEvents {
  "campaign:state": (campaign: Campaign) => void;
  "dm:narrate": (message: ChatMessage) => void;
  "combat:update": (combat: CombatState) => void;
  "combat:result": (entry: CombatLogEntry) => void;
  "player:joined": (player: Player) => void;
  "player:left": (playerId: string) => void;
  "scene:change": (scene: Scene) => void;
  "chat:message": (message: ChatMessage) => void;
}

export interface ClientToServerEvents {
  "campaign:create": (name: string) => void;
  "campaign:join": (code: string) => void;
  "campaign:leave": () => void;
  "player:action": (action: string) => void;
  "player:ready": () => void;
  "chat:message": (content: string) => void;
}
