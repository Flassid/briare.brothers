/**
 * Encounter Generator
 * 
 * Creates dynamic encounters: combat, social, puzzles, traps.
 */

import { AIClient } from './AIClient';
import { ENCOUNTER_GENERATOR_PROMPT } from './prompts';
import {
  Encounter,
  Enemy,
  Puzzle,
  Trap,
  Loot,
  Character,
  WorldState
} from './types';

interface PartyInfo {
  characters: Character[];
  averageLevel: number;
  totalPlayers: number;
}

export class EncounterGenerator {
  private ai: AIClient;

  constructor(claude: AIClient) {
    this.ai = claude;
  }

  /**
   * Generate a combat encounter scaled to party
   */
  async generateCombatEncounter(
    party: PartyInfo,
    difficulty: Encounter['difficulty'],
    theme: string,
    environment: string
  ): Promise<Encounter> {
    const xpBudget = this.calculateXPBudget(party, difficulty);

    const prompt = `Generate a ${difficulty} combat encounter.

PARTY INFO:
- Players: ${party.totalPlayers}
- Average Level: ${party.averageLevel}
- Classes: ${party.characters.map(c => c.class).join(', ')}

XP BUDGET: ~${xpBudget} XP (${difficulty} difficulty)

THEME: ${theme}
ENVIRONMENT: ${environment}

Create an encounter with:
1. Enemies that fit the XP budget
2. Interesting terrain and interactables
3. Varied enemy tactics
4. Appropriate loot
5. Multiple possible resolutions`;

    return await this.ai.generateCharacter<Encounter>(
      ENCOUNTER_GENERATOR_PROMPT,
      prompt
    );
  }

  /**
   * Generate a puzzle encounter
   */
  async generatePuzzle(
    difficulty: 'easy' | 'medium' | 'hard',
    theme: string,
    hints: number = 3
  ): Promise<Encounter> {
    const dcMap = { easy: 12, medium: 15, hard: 18 };

    const prompt = `Generate a ${difficulty} puzzle encounter.

THEME: ${theme}
DIFFICULTY DC: ${dcMap[difficulty]}
NUMBER OF HINTS: ${hints}

Create a puzzle that:
1. Has a clear goal
2. Provides discoverable clues
3. Has multiple valid solutions
4. Has interesting consequences for success/failure/partial
5. Can be attempted multiple times`;

    return await this.ai.generateCharacter<Encounter>(
      ENCOUNTER_GENERATOR_PROMPT,
      prompt
    );
  }

  /**
   * Generate a trap
   */
  async generateTrap(
    partyLevel: number,
    severity: 'nuisance' | 'dangerous' | 'deadly',
    environment: string
  ): Promise<Trap> {
    const damageByLevel: Record<number, Record<string, string>> = {
      1: { nuisance: '1d6', dangerous: '2d6', deadly: '4d6' },
      5: { nuisance: '2d6', dangerous: '4d6', deadly: '8d6' },
      11: { nuisance: '4d6', dangerous: '8d6', deadly: '12d6' },
      17: { nuisance: '6d6', dangerous: '10d6', deadly: '16d6' }
    };

    const levelKey = partyLevel >= 17 ? 17 : partyLevel >= 11 ? 11 : partyLevel >= 5 ? 5 : 1;
    const damage = damageByLevel[levelKey][severity];

    const dcBase = { nuisance: 10, dangerous: 15, deadly: 20 };
    const saveDC = dcBase[severity] + Math.floor(partyLevel / 4);
    const detectDC = saveDC - 2;
    const disarmDC = saveDC;

    const prompt = `Generate a ${severity} trap for level ${partyLevel} party.

ENVIRONMENT: ${environment}
DAMAGE: ${damage}
SAVE DC: ${saveDC}
DETECTION DC: ${detectDC}
DISARM DC: ${disarmDC}

Create a trap that:
1. Fits the environment
2. Has logical placement
3. Can be detected and disarmed
4. Has interesting trigger`;

    return await this.ai.generateCharacter<Trap>(
      ENCOUNTER_GENERATOR_PROMPT,
      prompt
    );
  }

  /**
   * Generate loot appropriate for encounter
   */
  async generateLoot(
    partyLevel: number,
    encounterDifficulty: Encounter['difficulty'],
    theme?: string
  ): Promise<Loot[]> {
    const goldMultiplier = {
      trivial: 0.5,
      easy: 1,
      medium: 2,
      hard: 3,
      deadly: 5
    };

    const baseGold = partyLevel * 10 * goldMultiplier[encounterDifficulty];
    const magicItemChance = {
      trivial: 0,
      easy: 0.1,
      medium: 0.25,
      hard: 0.5,
      deadly: 0.8
    };

    const prompt = `Generate loot for a ${encounterDifficulty} encounter.

PARTY LEVEL: ${partyLevel}
GOLD BUDGET: ~${Math.floor(baseGold)} gold worth
MAGIC ITEM CHANCE: ${Math.floor(magicItemChance[encounterDifficulty] * 100)}%
${theme ? `THEME: ${theme}` : ''}

Generate 3-6 loot items:
- Mix of gold/valuables and items
- Include magic item only if dice favor it
- Some items should be hidden or require investigation
- Theme items to the encounter if applicable

Format as JSON array:
[
  {
    "item": "Item name",
    "quantity": 1,
    "rarity": "common|uncommon|rare|very_rare|legendary",
    "hidden": false,
    "container": "Where found (or null)"
  }
]`;

    return await this.ai.chatJSON<Loot[]>(
      [{ role: 'user', content: prompt }],
      { system: ENCOUNTER_GENERATOR_PROMPT, model: 'fast' }
    );
  }

  /**
   * Generate a random encounter based on terrain
   */
  async generateRandomEncounter(
    party: PartyInfo,
    terrain: string,
    worldState: WorldState
  ): Promise<Encounter | null> {
    // Random encounter chance
    const chance = Math.random();
    if (chance > 0.3) return null; // 30% chance of encounter

    // Determine encounter type
    const typeRoll = Math.random();
    let encounterType: 'combat' | 'social' | 'exploration';
    if (typeRoll < 0.5) encounterType = 'combat';
    else if (typeRoll < 0.8) encounterType = 'social';
    else encounterType = 'exploration';

    // Determine difficulty based on party level and terrain
    const difficultyRoll = Math.random();
    let difficulty: Encounter['difficulty'];
    if (difficultyRoll < 0.3) difficulty = 'easy';
    else if (difficultyRoll < 0.7) difficulty = 'medium';
    else if (difficultyRoll < 0.9) difficulty = 'hard';
    else difficulty = 'deadly';

    const prompt = `Generate a random ${encounterType} encounter.

TERRAIN: ${terrain}
TIME: ${worldState.time.period}
PARTY: ${party.totalPlayers} players, level ~${party.averageLevel}
DIFFICULTY: ${difficulty}

Create a quick encounter appropriate for a random event while traveling.
It should be:
1. Self-contained
2. Resolvable in one scene
3. Potentially connected to larger events
4. Memorable despite being "random"`;

    return await this.ai.generateCharacter<Encounter>(
      ENCOUNTER_GENERATOR_PROMPT,
      prompt
    );
  }

  /**
   * Scale encounter to party
   */
  scaleEncounter(encounter: Encounter, party: PartyInfo): Encounter {
    const scaled = { ...encounter };

    if (scaled.enemies) {
      scaled.enemies = scaled.enemies.map(enemy => {
        const scaledEnemy = { ...enemy };
        
        // Adjust quantity based on party size
        const sizeRatio = party.totalPlayers / 4;
        scaledEnemy.quantity = Math.max(1, Math.round(enemy.quantity * sizeRatio));

        return scaledEnemy;
      });
    }

    return scaled;
  }

  /**
   * Calculate XP budget for encounter difficulty
   */
  private calculateXPBudget(party: PartyInfo, difficulty: Encounter['difficulty']): number {
    // XP thresholds by level (simplified from DMG)
    const thresholds: Record<number, Record<Encounter['difficulty'], number>> = {
      1: { trivial: 12, easy: 25, medium: 50, hard: 75, deadly: 100 },
      2: { trivial: 25, easy: 50, medium: 100, hard: 150, deadly: 200 },
      3: { trivial: 37, easy: 75, medium: 150, hard: 225, deadly: 400 },
      4: { trivial: 62, easy: 125, medium: 250, hard: 375, deadly: 500 },
      5: { trivial: 87, easy: 175, medium: 350, hard: 550, deadly: 700 },
      // ... continues for higher levels
    };

    const level = Math.min(Math.max(1, party.averageLevel), 5); // Clamp to available data
    const perPlayer = thresholds[level]?.[difficulty] ?? 100;

    return perPlayer * party.totalPlayers;
  }

  /**
   * Generate enemy stat block quick reference
   */
  async generateEnemyStats(
    enemyType: string,
    cr: number
  ): Promise<{
    hp: number;
    ac: number;
    attacks: Array<{ name: string; toHit: number; damage: string }>;
    abilities: string[];
  }> {
    // Quick CR-based stat generation
    const hpByCR = Math.floor(15 + cr * 15);
    const acByCR = Math.floor(12 + cr / 2);
    const toHitByCR = Math.floor(3 + cr);
    const damageDice = Math.max(1, Math.floor(cr / 2));

    const prompt = `Generate stats for a CR ${cr} ${enemyType}.

BASE STATS:
- HP: ~${hpByCR}
- AC: ~${acByCR}
- To Hit: +${toHitByCR}
- Damage: ~${damageDice}d6 per attack

Create 1-2 attacks and 0-2 special abilities appropriate for this creature.
Keep it simple and evocative.

Format as JSON:
{
  "hp": number,
  "ac": number,
  "attacks": [{ "name": "", "toHit": number, "damage": "XdY+Z" }],
  "abilities": ["ability description"]
}`;

    return await this.ai.chatJSON<{
      hp: number;
      ac: number;
      attacks: Array<{ name: string; toHit: number; damage: string }>;
      abilities: string[];
    }>(
      [{ role: 'user', content: prompt }],
      { model: 'fast' }
    );
  }
}
