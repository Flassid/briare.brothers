/**
 * Combat Resolver
 * 
 * The heart of natural language combat. Parses actions, assesses creativity,
 * calculates outcomes, and narrates results.
 */

import { AIClient } from './AIClient';
import { ACTION_PARSER_PROMPT, OUTCOME_NARRATOR_PROMPT, COMBAT_PROMPT } from './prompts';
import { 
  Character, 
  ParsedAction, 
  DiceRoll, 
  ActionOutcome, 
  CombatAction,
  CombatState,
  Effect,
  CharacterStats
} from './types';

interface ParsedActionResponse {
  intent: 'attack' | 'defend' | 'support' | 'interact' | 'move' | 'special';
  target: string | null;
  method: string;
  objects: string[];
  isCreative: boolean;
  creativityReason: string | null;
  creativityBonus: number;
  relevantStats: (keyof CharacterStats)[];
  primaryStat: keyof CharacterStats;
  feasible: boolean;
  feasibilityNote: string;
  suggestedDC: number;
  advantage: boolean;
  disadvantage: boolean;
  advantageReason: string | null;
}

interface NarrationResponse {
  narration: string;
  soundEffect: string | null;
  environmentChange: string | null;
  enemyReaction: string | null;
  followUpHint: string | null;
}

export class CombatResolver {
  private ai: AIClient;

  constructor(claude: AIClient) {
    this.ai = claude;
  }

  /**
   * Resolve a natural language combat action
   */
  async resolveAction(
    rawInput: string,
    character: Character,
    combatState: CombatState,
    environmentContext: string
  ): Promise<CombatAction> {
    // 1. Parse the action
    const parsedAction = await this.parseAction(rawInput, character, combatState, environmentContext);

    // 2. Calculate difficulty
    const dc = this.calculateDC(parsedAction, combatState);

    // 3. Roll dice
    const roll = this.rollWithModifiers(
      character,
      parsedAction,
      parsedAction.advantage,
      parsedAction.disadvantage
    );

    // 4. Determine outcome
    const outcome = await this.determineOutcome(
      rawInput,
      parsedAction,
      roll,
      dc,
      character,
      combatState
    );

    return {
      playerId: '', // To be filled by caller
      characterId: character.id,
      rawInput,
      parsedAction,
      creativityBonus: parsedAction.creativityBonus,
      difficultyClass: dc,
      roll,
      outcome
    };
  }

  /**
   * Parse natural language into structured action
   */
  private async parseAction(
    rawInput: string,
    character: Character,
    combatState: CombatState,
    environmentContext: string
  ): Promise<ParsedAction> {
    const prompt = `Parse this combat action:

PLAYER ACTION: "${rawInput}"

CHARACTER:
- Name: ${character.name}
- Class: ${character.class}
- Level: ${character.level}
- Stats: STR ${character.stats.strength}, DEX ${character.stats.dexterity}, CON ${character.stats.constitution}, INT ${character.stats.intelligence}, WIS ${character.stats.wisdom}, CHA ${character.stats.charisma}
- Equipment: ${character.equipment.map(e => e.name).join(', ')}

COMBAT SITUATION:
- Round: ${combatState.round}
- Combatants: ${combatState.combatants.map(c => `${c.name} (${c.hp.current}/${c.hp.max} HP)`).join(', ')}

ENVIRONMENT:
${environmentContext}

Analyze this action for intent, creativity, feasibility, and relevant stats.`;

    const response = await this.ai.resolveCombat<ParsedActionResponse>(
      ACTION_PARSER_PROMPT,
      prompt
    );

    return {
      intent: response.intent,
      target: response.target || undefined,
      method: response.method,
      objects: response.objects,
      isCreative: response.isCreative,
      creativityReason: response.creativityReason || undefined,
      relevantStats: response.relevantStats
    };
  }

  /**
   * Calculate difficulty class based on action and situation
   */
  private calculateDC(parsedAction: ParsedActionResponse, combatState: CombatState): number {
    let dc = parsedAction.suggestedDC;

    // Creativity can make things easier
    if (parsedAction.isCreative) {
      dc = Math.max(5, dc - parsedAction.creativityBonus);
    }

    // Environmental factors (hazards increase difficulty)
    const hazardCount = combatState.environment.hazards.length;
    if (hazardCount > 0 && parsedAction.intent === 'move') {
      dc += hazardCount * 2;
    }

    return Math.min(30, Math.max(5, dc));
  }

  /**
   * Roll d20 with all applicable modifiers
   */
  private rollWithModifiers(
    character: Character,
    parsedAction: ParsedActionResponse,
    advantage: boolean,
    disadvantage: boolean
  ): DiceRoll {
    // Roll d20 (or 2d20 for advantage/disadvantage)
    let d20Roll: number;
    
    if (advantage && !disadvantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      d20Roll = Math.max(roll1, roll2);
    } else if (disadvantage && !advantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      d20Roll = Math.min(roll1, roll2);
    } else {
      d20Roll = Math.floor(Math.random() * 20) + 1;
    }

    // Calculate modifier from primary stat
    const primaryStat = parsedAction.primaryStat;
    const statValue = character.stats[primaryStat];
    const statMod = Math.floor((statValue - 10) / 2);

    // Add proficiency bonus for attacks/skills
    const profBonus = character.proficiencyBonus;

    // Creativity bonus
    const creativityMod = parsedAction.creativityBonus;

    const totalModifier = statMod + profBonus + creativityMod;
    const total = d20Roll + totalModifier;

    return {
      d20: d20Roll,
      modifier: totalModifier,
      total,
      advantage: advantage && !disadvantage,
      disadvantage: disadvantage && !advantage,
      criticalHit: d20Roll === 20,
      criticalFail: d20Roll === 1
    };
  }

  /**
   * Determine action outcome and generate narration
   */
  private async determineOutcome(
    rawInput: string,
    parsedAction: ParsedActionResponse,
    roll: DiceRoll,
    dc: number,
    character: Character,
    combatState: CombatState
  ): Promise<ActionOutcome> {
    // Determine success degree
    let degree: ActionOutcome['degree'];
    let success: boolean;

    if (roll.criticalHit) {
      degree = 'critical_success';
      success = true;
    } else if (roll.criticalFail) {
      degree = 'critical_failure';
      success = false;
    } else if (roll.total >= dc + 10) {
      degree = 'critical_success';
      success = true;
    } else if (roll.total >= dc) {
      degree = 'success';
      success = true;
    } else if (roll.total >= dc - 5) {
      degree = 'partial';
      success = true; // Partial success still counts
    } else {
      degree = 'failure';
      success = false;
    }

    // Calculate damage if applicable
    let damage: { amount: number; type: string } | undefined;
    if (success && parsedAction.intent === 'attack') {
      damage = this.calculateDamage(character, parsedAction, roll.criticalHit);
    }

    // Generate narration
    const narration = await this.generateNarration(
      rawInput,
      parsedAction,
      roll,
      degree,
      damage,
      character
    );

    // Generate effects
    const effects = this.generateEffects(parsedAction, degree, damage, narration);

    return {
      success,
      degree,
      damage,
      effects,
      narration: narration.narration
    };
  }

  /**
   * Calculate damage for successful attacks
   */
  private calculateDamage(
    character: Character,
    parsedAction: ParsedActionResponse,
    isCritical: boolean
  ): { amount: number; type: string } {
    // Base damage (simplified - would be weapon-based in full implementation)
    let baseDice = 8; // d8 default
    let diceCount = 1;
    
    // Find weapon if specified
    const weapon = character.equipment.find(e => e.type === 'weapon');
    if (weapon?.properties?.damage) {
      const match = weapon.properties.damage.match(/(\d+)d(\d+)/);
      if (match) {
        diceCount = parseInt(match[1]);
        baseDice = parseInt(match[2]);
      }
    }

    // Double dice on critical
    if (isCritical) {
      diceCount *= 2;
    }

    // Roll damage
    let damage = 0;
    for (let i = 0; i < diceCount; i++) {
      damage += Math.floor(Math.random() * baseDice) + 1;
    }

    // Add stat modifier
    const primaryStat = parsedAction.primaryStat;
    const statMod = Math.floor((character.stats[primaryStat] - 10) / 2);
    damage += statMod;

    // Creativity bonus to damage
    damage += parsedAction.creativityBonus;

    // Determine damage type
    const damageType = weapon?.properties?.damageType || 'bludgeoning';

    return { amount: Math.max(1, damage), type: damageType };
  }

  /**
   * Generate dramatic narration for the outcome
   */
  private async generateNarration(
    rawInput: string,
    parsedAction: ParsedActionResponse,
    roll: DiceRoll,
    degree: ActionOutcome['degree'],
    damage: { amount: number; type: string } | undefined,
    character: Character
  ): Promise<NarrationResponse> {
    const prompt = `Narrate this combat action outcome:

ORIGINAL ACTION: "${rawInput}"
CHARACTER: ${character.name}, ${character.race} ${character.class}
ROLL: ${roll.d20} + ${roll.modifier} = ${roll.total} (DC was needed)
OUTCOME: ${degree.replace('_', ' ').toUpperCase()}
${damage ? `DAMAGE: ${damage.amount} ${damage.type}` : 'No damage dealt'}
${roll.criticalHit ? 'NATURAL 20!' : ''}
${roll.criticalFail ? 'NATURAL 1!' : ''}

Create a dramatic, visceral narration matching the outcome severity.`;

    return await this.ai.resolveCombat<NarrationResponse>(
      OUTCOME_NARRATOR_PROMPT,
      prompt
    );
  }

  /**
   * Generate mechanical effects from the outcome
   */
  private generateEffects(
    parsedAction: ParsedActionResponse,
    degree: ActionOutcome['degree'],
    damage: { amount: number; type: string } | undefined,
    narration: NarrationResponse
  ): Effect[] {
    const effects: Effect[] = [];

    // Damage effect
    if (damage && parsedAction.target) {
      effects.push({
        type: 'damage',
        target: parsedAction.target,
        value: damage.amount,
        description: `${damage.amount} ${damage.type} damage`
      });
    }

    // Environment change from narration
    if (narration.environmentChange) {
      effects.push({
        type: 'story',
        target: 'environment',
        description: narration.environmentChange
      });
    }

    // Critical success might add conditions
    if (degree === 'critical_success' && parsedAction.intent === 'attack') {
      effects.push({
        type: 'condition',
        target: parsedAction.target || 'unknown',
        description: 'Staggered',
        duration: 1
      });
    }

    // Critical failure might affect the attacker
    if (degree === 'critical_failure') {
      effects.push({
        type: 'condition',
        target: 'self',
        description: 'Off-balance',
        duration: 1
      });
    }

    return effects;
  }

  /**
   * Quick combat round summary
   */
  async summarizeRound(
    combatState: CombatState,
    actions: CombatAction[]
  ): Promise<string> {
    const actionSummaries = actions.map(a => 
      `${a.characterId}: ${a.rawInput} → ${a.outcome.degree}`
    ).join('\n');

    const prompt = `Summarize this combat round in 2-3 sentences:

Round ${combatState.round}
Actions taken:
${actionSummaries}

Remaining combatants:
${combatState.combatants.map(c => `${c.name}: ${c.hp.current}/${c.hp.max} HP`).join('\n')}

Create a brief, dramatic summary of the round's flow.`;

    return await this.ai.narrate(COMBAT_PROMPT, prompt, { maxTokens: 256 });
  }
}
