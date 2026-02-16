/**
 * Dungeon Master
 * 
 * The main orchestrator that coordinates all DM services.
 * This is the single entry point for game logic.
 */

import { AIClient, AIProvider } from './AIClient';
import { CharacterGenerator } from './CharacterGenerator';
import { NarrativeEngine } from './NarrativeEngine';
import { CombatResolver } from './CombatResolver';
import { EncounterGenerator } from './EncounterGenerator';
import { NPCManager } from './NPCManager';
import { NARRATIVE_PROMPT } from './prompts';
import {
  Character,
  Scene,
  WorldState,
  GameSession,
  CombatState,
  CombatAction,
  DMResponse,
  NPC,
  Encounter,
  SessionEvent
} from './types';

interface DMConfig {
  anthropicApiKey?: string;
  geminiApiKey?: string;
  defaultProvider?: AIProvider;
  defaultModel?: 'fast' | 'quality';
}

export class DungeonMaster {
  private ai: AIClient;
  private characterGen: CharacterGenerator;
  private narrative: NarrativeEngine;
  private combat: CombatResolver;
  private encounters: EncounterGenerator;
  private npcManager: NPCManager;

  private session: GameSession | null = null;
  private characters: Map<string, Character> = new Map();

  constructor(config: DMConfig = {}) {
    this.ai = new AIClient({
      anthropicApiKey: config.anthropicApiKey,
      geminiApiKey: config.geminiApiKey,
      defaultProvider: config.defaultProvider || 'gemini' // Default to Gemini
    });
    
    // All sub-services use the unified AI client
    this.characterGen = new CharacterGenerator(this.ai);
    this.narrative = new NarrativeEngine(this.ai);
    this.combat = new CombatResolver(this.ai);
    this.encounters = new EncounterGenerator(this.ai);
    this.npcManager = new NPCManager(this.ai);
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders(): AIProvider[] {
    return this.ai.getAvailableProviders();
  }

  /**
   * Get current AI provider
   */
  getCurrentProvider(): AIProvider {
    return this.ai.getDefaultProvider();
  }

  /**
   * Switch AI provider
   */
  setProvider(provider: AIProvider): void {
    this.ai.setDefaultProvider(provider);
  }

  // ================== SESSION MANAGEMENT ==================

  /**
   * Start a new game session
   */
  async startSession(
    campaignId: string,
    players: string[],
    initialScene?: Scene
  ): Promise<GameSession> {
    const scene = initialScene || await this.narrative.generateScene(
      'starting_tavern',
      {
        currentScene: {} as Scene,
        worldState: this.createDefaultWorldState(),
        recentHistory: [],
        activeCharacters: []
      },
      { mood: 'peaceful' }
    );

    this.session = {
      id: `session_${Date.now()}`,
      campaignId,
      players,
      worldState: {
        currentSceneId: scene.id,
        time: { day: 1, hour: 18, period: 'evening' },
        globalFlags: {},
        partyReputation: {},
        activeQuests: [],
        completedQuests: [],
        deadNPCs: [],
        discoveredLocations: [scene.id]
      },
      history: [],
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };

    // Generate opening narration
    const characters = Array.from(this.characters.values());
    await this.narrative.narrateSceneEntry(scene, characters);

    return this.session;
  }

  /**
   * Process any player input
   */
  async processInput(
    playerId: string,
    input: string
  ): Promise<DMResponse> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const character = this.getPlayerCharacter(playerId);
    if (!character) {
      throw new Error('Player has no character');
    }

    // Update activity timestamp
    this.session.lastActivityAt = new Date().toISOString();

    // Determine input type and route appropriately
    const inputType = await this.classifyInput(input);

    switch (inputType) {
      case 'combat':
        return this.handleCombatInput(character, input);
      case 'dialogue':
        return this.handleDialogueInput(character, input);
      case 'exploration':
        return this.handleExplorationInput(character, input);
      case 'rest':
        return this.handleRestInput(character, input);
      default:
        return this.handleNarrativeInput(character, input);
    }
  }

  // ================== CHARACTER MANAGEMENT ==================

  /**
   * Create a character from natural language description
   */
  async createCharacter(
    playerId: string,
    description: string,
    options?: { name?: string; suggestedClass?: string; suggestedRace?: string }
  ): Promise<Character> {
    const character = await this.characterGen.generateFromDescription(
      description,
      options
    );

    this.characters.set(playerId, character);
    return character;
  }

  /**
   * Get a player's character
   */
  getPlayerCharacter(playerId: string): Character | undefined {
    return this.characters.get(playerId);
  }

  // ================== COMBAT ==================

  /**
   * Start combat encounter
   */
  async startCombat(encounter: Encounter): Promise<CombatState> {
    if (!this.session) throw new Error('No active session');

    const characters = Array.from(this.characters.values());
    
    // Roll initiative for everyone
    const initiativeOrder = [
      ...characters.map(c => ({
        id: c.id,
        name: c.name,
        initiative: this.rollInitiative(c),
        isPlayer: true
      })),
      ...(encounter.enemies || []).flatMap(e => 
        Array(e.quantity).fill(null).map((_, i) => ({
          id: `${e.npcId}_${i}`,
          name: this.npcManager.getNPC(e.npcId)?.name || 'Enemy',
          initiative: Math.floor(Math.random() * 20) + 1,
          isPlayer: false
        }))
      )
    ].sort((a, b) => b.initiative - a.initiative);

    const combatState: CombatState = {
      active: true,
      round: 1,
      initiativeOrder,
      currentTurn: 0,
      combatants: [
        ...characters.map(c => ({
          id: c.id,
          name: c.name,
          isPlayer: true,
          hp: { ...c.hp },
          ac: c.ac,
          conditions: []
        })),
        ...(encounter.enemies || []).flatMap(e => {
          const npc = this.npcManager.getNPC(e.npcId);
          return Array(e.quantity).fill(null).map((_, i) => ({
            id: `${e.npcId}_${i}`,
            name: npc?.name || 'Enemy',
            isPlayer: false,
            hp: npc?.combatStats?.hp || { current: 20, max: 20 },
            ac: npc?.combatStats?.ac || 12,
            conditions: []
          }));
        })
      ],
      environment: {
        terrain: encounter.terrain?.description || 'Open ground',
        hazards: encounter.terrain?.hazards || [],
        cover: encounter.terrain?.cover || [],
        interactables: encounter.terrain?.interactables || []
      }
    };

    this.session.combatState = combatState;
    return combatState;
  }

  /**
   * Process a combat action
   */
  private async handleCombatInput(
    character: Character,
    input: string
  ): Promise<DMResponse> {
    if (!this.session?.combatState?.active) {
      return { narration: 'You are not currently in combat.' };
    }

    const environmentContext = `
Terrain: ${this.session.combatState.environment.terrain}
Hazards: ${this.session.combatState.environment.hazards.join(', ')}
Cover: ${this.session.combatState.environment.cover.join(', ')}
Interactables: ${this.session.combatState.environment.interactables.join(', ')}
    `.trim();

    const action = await this.combat.resolveAction(
      input,
      character,
      this.session.combatState,
      environmentContext
    );

    // Apply damage/effects
    this.applyCombatEffects(action);

    // Record event
    this.recordEvent('combat', action.outcome.narration, {
      action: input,
      outcome: action.outcome.degree,
      damage: action.outcome.damage
    });

    // Check for combat end
    const combatEnded = this.checkCombatEnd();

    return {
      narration: action.outcome.narration + (combatEnded ? '\n\nThe battle is over!' : ''),
      combatUpdates: action.outcome.effects.map(e => ({
        combatantId: e.target,
        hpChange: e.type === 'damage' ? -(e.value || 0) : undefined,
        conditionAdded: e.type === 'condition' ? e.description : undefined
      }))
    };
  }

  // ================== DIALOGUE ==================

  /**
   * Handle NPC dialogue
   */
  private async handleDialogueInput(
    character: Character,
    input: string
  ): Promise<DMResponse> {
    // Extract NPC target from input (simplified)
    const npcMatch = input.match(/(?:to|with|ask|tell)\s+(\w+)/i);
    const npcName = npcMatch?.[1];

    // Find NPC in current scene
    const npcs = this.npcManager.exportNPCs();
    const npc = npcs.find(n => 
      n.name.toLowerCase().includes(npcName?.toLowerCase() || '')
    );

    if (!npc) {
      return { narration: 'There is no one by that name here to speak with.' };
    }

    const dialogue = await this.npcManager.getDialogue(
      npc.id,
      character,
      input
    );

    this.recordEvent('dialogue', `${character.name} spoke with ${npc.name}`, {
      npc: npc.name,
      playerInput: input
    });

    return { narration: dialogue };
  }

  // ================== EXPLORATION ==================

  /**
   * Handle exploration actions
   */
  private async handleExplorationInput(
    character: Character,
    input: string
  ): Promise<DMResponse> {
    if (!this.session) throw new Error('No active session');

    // Generate current scene context
    const sceneContext = {
      currentScene: { id: this.session.worldState.currentSceneId } as Scene,
      worldState: this.session.worldState,
      recentHistory: this.session.history.slice(-5),
      activeCharacters: [character]
    };

    const response = await this.narrative.processNarrativeAction(
      input,
      character,
      sceneContext as any
    );

    // Record event
    this.recordEvent('discovery', `${character.name}: ${input.slice(0, 50)}...`, {
      action: input
    });

    return response;
  }

  // ================== REST ==================

  /**
   * Handle rest actions
   */
  private async handleRestInput(
    character: Character,
    input: string
  ): Promise<DMResponse> {
    const isLongRest = input.toLowerCase().includes('long rest');
    const hours = isLongRest ? 8 : 1;

    // Advance time
    if (this.session) {
      const { newState, events } = await this.narrative.advanceTime(
        this.session.worldState,
        hours
      );
      this.session.worldState = newState;
    }

    // Restore HP for long rest
    if (isLongRest) {
      character.hp.current = character.hp.max;
    } else {
      // Short rest - can spend hit dice (simplified)
      const healAmount = Math.floor(Math.random() * 8) + 1 + 
        Math.floor((character.stats.constitution - 10) / 2);
      character.hp.current = Math.min(
        character.hp.max,
        character.hp.current + healAmount
      );
    }

    const narration = isLongRest
      ? `The party takes a long rest, sleeping through the night. ${character.name} awakens refreshed, fully restored.`
      : `${character.name} takes a short rest, catching their breath and tending to minor wounds.`;

    this.recordEvent('rest', narration, { type: isLongRest ? 'long' : 'short' });

    return { narration };
  }

  // ================== NARRATIVE ==================

  /**
   * Handle general narrative input
   */
  private async handleNarrativeInput(
    character: Character,
    input: string
  ): Promise<DMResponse> {
    const context = {
      currentScene: { id: this.session?.worldState.currentSceneId } as Scene,
      worldState: this.session?.worldState || this.createDefaultWorldState(),
      recentHistory: this.session?.history.slice(-5) || [],
      activeCharacters: [character]
    };

    return await this.narrative.processNarrativeAction(input, character, context as any);
  }

  // ================== HELPERS ==================

  /**
   * Classify input type for routing
   */
  private async classifyInput(input: string): Promise<string> {
    // Quick keyword detection
    const lower = input.toLowerCase();
    
    if (this.session?.combatState?.active) {
      // In combat, most inputs are combat actions
      return 'combat';
    }
    
    if (lower.includes('attack') || lower.includes('fight') || lower.includes('hit')) {
      return 'combat';
    }
    
    if (lower.includes('talk to') || lower.includes('speak') || lower.includes('ask')) {
      return 'dialogue';
    }
    
    if (lower.includes('rest') || lower.includes('sleep') || lower.includes('camp')) {
      return 'rest';
    }
    
    if (lower.includes('search') || lower.includes('examine') || lower.includes('investigate')) {
      return 'exploration';
    }

    return 'narrative';
  }

  /**
   * Roll initiative for a character
   */
  private rollInitiative(character: Character): number {
    const dexMod = Math.floor((character.stats.dexterity - 10) / 2);
    return Math.floor(Math.random() * 20) + 1 + dexMod;
  }

  /**
   * Apply combat effects to combatants
   */
  private applyCombatEffects(action: CombatAction): void {
    if (!this.session?.combatState) return;

    for (const effect of action.outcome.effects) {
      const combatant = this.session.combatState.combatants.find(
        c => c.id === effect.target || c.name.toLowerCase() === effect.target.toLowerCase()
      );

      if (combatant && effect.type === 'damage' && effect.value) {
        combatant.hp.current = Math.max(0, combatant.hp.current - effect.value);
      }

      if (combatant && effect.type === 'condition') {
        combatant.conditions.push(effect.description);
      }
    }
  }

  /**
   * Check if combat has ended
   */
  private checkCombatEnd(): boolean {
    if (!this.session?.combatState) return false;

    const enemies = this.session.combatState.combatants.filter(c => !c.isPlayer);
    const players = this.session.combatState.combatants.filter(c => c.isPlayer);

    const enemiesDefeated = enemies.every(e => e.hp.current <= 0);
    const playersDefeated = players.every(p => p.hp.current <= 0);

    if (enemiesDefeated || playersDefeated) {
      this.session.combatState.active = false;
      return true;
    }

    return false;
  }

  /**
   * Record a session event
   */
  private recordEvent(
    type: SessionEvent['type'],
    summary: string,
    details: Record<string, any>
  ): void {
    if (!this.session) return;

    this.session.history.push({
      timestamp: new Date().toISOString(),
      type,
      summary,
      details
    });
  }

  /**
   * Create default world state
   */
  private createDefaultWorldState(): WorldState {
    return {
      currentSceneId: '',
      time: { day: 1, hour: 12, period: 'afternoon' },
      globalFlags: {},
      partyReputation: {},
      activeQuests: [],
      completedQuests: [],
      deadNPCs: [],
      discoveredLocations: []
    };
  }

  // ================== PUBLIC API ==================

  /**
   * Generate a random encounter
   */
  async generateEncounter(
    difficulty: Encounter['difficulty'],
    theme: string
  ): Promise<Encounter> {
    const characters = Array.from(this.characters.values());
    const avgLevel = characters.reduce((sum, c) => sum + c.level, 0) / characters.length || 1;

    return this.encounters.generateCombatEncounter(
      {
        characters,
        averageLevel: avgLevel,
        totalPlayers: characters.length || 1
      },
      difficulty,
      theme,
      this.session?.worldState.currentSceneId || 'unknown'
    );
  }

  /**
   * Create an NPC
   */
  async createNPC(role: string, context: string): Promise<NPC> {
    return this.npcManager.generateNPC(role, context);
  }

  /**
   * Get session recap
   */
  async getRecap(): Promise<string> {
    if (!this.session) {
      return 'No active session to recap.';
    }
    return this.narrative.generateRecap(this.session);
  }

  /**
   * Export session state for saving
   */
  exportState(): {
    session: GameSession | null;
    characters: Character[];
    npcs: NPC[];
  } {
    return {
      session: this.session,
      characters: Array.from(this.characters.values()),
      npcs: this.npcManager.exportNPCs()
    };
  }

  /**
   * Import saved state
   */
  importState(state: {
    session: GameSession;
    characters: Character[];
    npcs: NPC[];
  }): void {
    this.session = state.session;
    for (const char of state.characters) {
      this.characters.set(char.id, char);
    }
    this.npcManager.loadNPCs(state.npcs);
  }
}
