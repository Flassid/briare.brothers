import { create } from "zustand";
import type {
  Screen,
  Character,
  Campaign,
  ChatMessage,
  CombatState,
  CombatLogEntry,
  Scene,
  Stats,
  CharacterClass,
  CharacterRace,
} from "@/types/game";

interface GameState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  character: Character | null;
  setCharacter: (character: Character | null) => void;
  campaign: Campaign | null;
  setCampaign: (campaign: Campaign | null) => void;
  campaignCode: string;
  setCampaignCode: (code: string) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  combat: CombatState;
  setCombat: (combat: CombatState) => void;
  addCombatLog: (entry: CombatLogEntry) => void;
  scene: Scene | null;
  setScene: (scene: Scene | null) => void;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const initialCombatState: CombatState = {
  active: false,
  turn: 0,
  initiative: [],
  currentTurnId: null,
  log: [],
};

export const useGameStore = create<GameState>((set) => ({
  screen: "lobby",
  setScreen: (screen) => set({ screen }),
  playerId: null,
  playerName: "",
  setPlayerName: (playerName) => set({ playerName }),
  character: null,
  setCharacter: (character) => set({ character }),
  campaign: null,
  setCampaign: (campaign) => set({ campaign }),
  campaignCode: "",
  setCampaignCode: (campaignCode) => set({ campaignCode }),
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message].slice(-100),
    })),
  clearMessages: () => set({ messages: [] }),
  combat: initialCombatState,
  setCombat: (combat) => set({ combat }),
  addCombatLog: (entry) =>
    set((state) => ({
      combat: {
        ...state.combat,
        log: [...state.combat.log, entry].slice(-50),
      },
    })),
  scene: null,
  setScene: (scene) => set({ scene }),
  connected: false,
  setConnected: (connected) => set({ connected }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const STAT_NAMES: (keyof Stats)[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export const CLASS_INFO: Record<CharacterClass, { name: string; description: string; primaryStat: keyof Stats }> = {
  warrior: { name: "Warrior", description: "Master of martial combat", primaryStat: "STR" },
  mage: { name: "Mage", description: "Wielder of arcane magic", primaryStat: "INT" },
  rogue: { name: "Rogue", description: "Shadow and stealth expert", primaryStat: "DEX" },
  cleric: { name: "Cleric", description: "Divine healer and protector", primaryStat: "WIS" },
  ranger: { name: "Ranger", description: "Wilderness tracker and hunter", primaryStat: "DEX" },
  paladin: { name: "Paladin", description: "Holy warrior of justice", primaryStat: "CHA" },
};

export const RACE_INFO: Record<CharacterRace, { name: string; bonus: Partial<Stats> }> = {
  human: { name: "Human", bonus: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
  elf: { name: "Elf", bonus: { DEX: 2, INT: 1 } },
  dwarf: { name: "Dwarf", bonus: { CON: 2, STR: 1 } },
  halfling: { name: "Halfling", bonus: { DEX: 2, CHA: 1 } },
  dragonborn: { name: "Dragonborn", bonus: { STR: 2, CHA: 1 } },
  tiefling: { name: "Tiefling", bonus: { CHA: 2, INT: 1 } },
};
