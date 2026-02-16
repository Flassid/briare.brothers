/**
 * Character Generator
 * 
 * Transforms natural language character concepts into fully realized D&D characters.
 */

import { AIClient } from './AIClient';
import { CHARACTER_GENERATOR_PROMPT } from './prompts';
import { Character, CharacterStats, Equipment, SkillProficiency, Ability } from './types';

interface CharacterGenResponse {
  name: string;
  race: string;
  raceReasoning: string;
  class: string;
  classReasoning: string;
  stats: CharacterStats;
  statsReasoning: string;
  level: number;
  hp: { current: number; max: number };
  ac: number;
  proficiencyBonus: number;
  backstory: string;
  incitingIncident: string;
  personality: {
    traits: string[];
    bonds: string[];
    flaws: string[];
    ideals: string[];
  };
  equipment: Equipment[];
  skills: SkillProficiency[];
  abilities: Ability[];
  voiceAndMannerisms: string;
  visualDescription: string;
  secretOrGoal: string;
}

export class CharacterGenerator {
  private ai: AIClient;

  constructor(ai: AIClient) {
    this.ai = ai;
  }

  /**
   * Generate a character from a natural language description
   */
  async generateFromDescription(
    description: string,
    options: {
      name?: string;
      suggestedRace?: string;
      suggestedClass?: string;
      level?: number;
    } = {}
  ): Promise<Character> {
    const prompt = this.buildPrompt(description, options);
    
    const response = await this.ai.generateCharacter<CharacterGenResponse>(
      CHARACTER_GENERATOR_PROMPT,
      prompt
    );

    return this.responseToCharacter(response);
  }

  /**
   * Enhance an existing character with more backstory
   */
  async enhanceBackstory(character: Character): Promise<string> {
    const prompt = `Enhance this character's backstory with more specific details, hooks, and connections.

Current character:
Name: ${character.name}
Race: ${character.race}
Class: ${character.class}
Current backstory: ${character.backstory}

Personality:
- Traits: ${character.personality.traits.join(', ')}
- Bonds: ${character.personality.bonds.join(', ')}
- Flaws: ${character.personality.flaws.join(', ')}

Expand the backstory with:
1. Specific names of places and people from their past
2. A formative event that shaped their worldview
3. A relationship that ended badly
4. A mentor or rival
5. An unresolved mystery or question

Keep the same tone and themes. Output should be 3-4 paragraphs.`;

    return await this.ai.narrate(
      'You are a character backstory writer. Create rich, specific histories that beg to be explored.',
      prompt,
      { model: 'quality' }
    );
  }

  /**
   * Generate character voice sample
   */
  async generateVoiceSample(character: Character, situation: string): Promise<string> {
    const prompt = `Generate 3-4 lines of dialogue showing how ${character.name} speaks.

Character: ${character.name}, ${character.race} ${character.class}
Personality traits: ${character.personality.traits.join(', ')}
Flaws: ${character.personality.flaws.join(', ')}
Backstory: ${character.backstory}

Situation: ${situation}

Show their unique voice, mannerisms, and personality through dialogue.`;

    return await this.ai.narrate(
      'You are a dialogue writer. Create distinctive character voices.',
      prompt,
      { model: 'fast' }
    );
  }

  private buildPrompt(description: string, options: any): string {
    let prompt = `Create a complete D&D character from this concept:

"${description}"

`;
    if (options.name) {
      prompt += `Use the name: ${options.name}\n`;
    }
    if (options.suggestedRace) {
      prompt += `Consider this race: ${options.suggestedRace} (but override if the concept demands it)\n`;
    }
    if (options.suggestedClass) {
      prompt += `Consider this class: ${options.suggestedClass} (but override if the concept demands it)\n`;
    }
    if (options.level && options.level > 1) {
      prompt += `Starting level: ${options.level}\n`;
    }

    prompt += `
Remember:
- Honor the player's vision above all
- Add surprising details they'll love
- Create hooks for future adventures
- Make the character feel ALIVE`;

    return prompt;
  }

  private responseToCharacter(response: CharacterGenResponse): Character {
    return {
      id: this.generateId(),
      name: response.name,
      race: response.race,
      class: response.class,
      level: response.level,
      stats: response.stats,
      hp: response.hp,
      ac: response.ac,
      proficiencyBonus: response.proficiencyBonus,
      backstory: response.backstory,
      personality: response.personality,
      equipment: response.equipment,
      skills: response.skills,
      abilities: response.abilities
    };
  }

  private generateId(): string {
    return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Quick stat array generation for NPCs
   */
  static generateQuickStats(
    primary: keyof CharacterStats,
    secondary: keyof CharacterStats,
    level: number = 1
  ): CharacterStats {
    const base: CharacterStats = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };

    base[primary] = 15 + Math.floor(level / 4);
    base[secondary] = 13 + Math.floor(level / 4);
    
    // Pick a dump stat (not primary or secondary)
    const stats = Object.keys(base) as (keyof CharacterStats)[];
    const dumpOptions = stats.filter(s => s !== primary && s !== secondary);
    const dump = dumpOptions[Math.floor(Math.random() * dumpOptions.length)];
    base[dump] = 8;

    return base;
  }

  /**
   * Calculate modifier from stat
   */
  static getModifier(stat: number): number {
    return Math.floor((stat - 10) / 2);
  }

  /**
   * Calculate HP for a class at level
   */
  static calculateHP(
    hitDie: number, 
    constitution: number, 
    level: number
  ): number {
    const conMod = this.getModifier(constitution);
    // Level 1: Max hit die + CON
    // Subsequent levels: Average + CON per level
    const level1HP = hitDie + conMod;
    const avgPerLevel = Math.ceil(hitDie / 2) + 1 + conMod;
    return level1HP + (avgPerLevel * (level - 1));
  }
}
