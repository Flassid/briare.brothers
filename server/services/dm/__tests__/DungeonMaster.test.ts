/**
 * Tests for the Dungeon Master service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DungeonMaster } from '../DungeonMaster';
import { CharacterGenerator } from '../CharacterGenerator';
import { CombatResolver } from '../CombatResolver';

// Mock the Claude client
vi.mock('../ClaudeClient', () => ({
  ClaudeClient: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockResolvedValue({ content: 'Mock response' }),
    chatJSON: vi.fn().mockResolvedValue({}),
    narrate: vi.fn().mockResolvedValue('The tavern door creaks open...'),
    generateCharacter: vi.fn().mockResolvedValue({
      name: 'Test Hero',
      race: 'Human',
      class: 'Fighter',
      level: 1,
      stats: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 10 },
      hp: { current: 12, max: 12 },
      ac: 16,
      proficiencyBonus: 2,
      backstory: 'A brave warrior...',
      personality: { traits: ['Brave'], bonds: ['Family'], flaws: ['Stubborn'], ideals: ['Honor'] },
      equipment: [{ name: 'Longsword', type: 'weapon', description: 'A well-forged blade' }],
      skills: [],
      abilities: []
    }),
    resolveCombat: vi.fn().mockResolvedValue({
      intent: 'attack',
      target: 'Goblin',
      method: 'sword slash',
      objects: ['longsword'],
      isCreative: false,
      creativityBonus: 0,
      relevantStats: ['strength'],
      primaryStat: 'strength',
      feasible: true,
      suggestedDC: 12
    }),
    generateDialogue: vi.fn().mockResolvedValue('*The dwarf grumbles* "What do ye want?"')
  }))
}));

describe('DungeonMaster', () => {
  let dm: DungeonMaster;

  beforeEach(() => {
    dm = new DungeonMaster();
  });

  describe('Character Creation', () => {
    it('should create a character from description', async () => {
      const character = await dm.createCharacter(
        'player1',
        'A grizzled dwarf warrior seeking revenge'
      );

      expect(character).toBeDefined();
      expect(character.name).toBe('Test Hero');
      expect(character.stats).toBeDefined();
      expect(character.hp.max).toBeGreaterThan(0);
    });

    it('should retrieve created character', async () => {
      await dm.createCharacter('player1', 'A wizard');
      
      const character = dm.getPlayerCharacter('player1');
      expect(character).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should start a new session', async () => {
      await dm.createCharacter('player1', 'A fighter');
      const session = await dm.startSession('campaign1', ['player1']);

      expect(session).toBeDefined();
      expect(session.id).toContain('session_');
      expect(session.worldState.time.day).toBe(1);
    });
  });

  describe('Export/Import', () => {
    it('should export game state', async () => {
      await dm.createCharacter('player1', 'A rogue');
      
      const state = dm.exportState();
      
      expect(state.characters).toHaveLength(1);
      expect(state.session).toBeNull();
    });
  });
});

describe('CharacterGenerator', () => {
  it('should calculate modifiers correctly', () => {
    expect(CharacterGenerator.getModifier(10)).toBe(0);
    expect(CharacterGenerator.getModifier(14)).toBe(2);
    expect(CharacterGenerator.getModifier(8)).toBe(-1);
    expect(CharacterGenerator.getModifier(20)).toBe(5);
  });

  it('should calculate HP correctly', () => {
    // Level 1 Fighter (d10) with 14 CON
    const hp = CharacterGenerator.calculateHP(10, 14, 1);
    expect(hp).toBe(12); // 10 (max d10) + 2 (CON mod)

    // Level 3 Fighter with 14 CON
    const hp3 = CharacterGenerator.calculateHP(10, 14, 3);
    expect(hp3).toBe(12 + 8 + 8); // Level 1 + (avg+1+CON) * 2
  });

  it('should generate quick stats', () => {
    const stats = CharacterGenerator.generateQuickStats('strength', 'constitution', 1);
    
    expect(stats.strength).toBe(15);
    expect(stats.constitution).toBe(13);
    // One stat should be 8
    const values = Object.values(stats);
    expect(values.includes(8)).toBe(true);
  });
});
