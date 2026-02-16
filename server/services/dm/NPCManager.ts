/**
 * NPC Manager
 * 
 * Handles NPC generation, dialogue, memory, and relationships.
 */

import { AIClient } from './AIClient';
import { NPC_GENERATOR_PROMPT, NPC_DIALOGUE_PROMPT } from './prompts';
import {
  NPC,
  NPCPersonality,
  VoiceStyle,
  NPCRelationship,
  NPCMemory,
  Character
} from './types';

interface ConversationMessage {
  role: 'player' | 'npc';
  characterName: string;
  content: string;
}

export class NPCManager {
  private ai: AIClient;
  private npcs: Map<string, NPC> = new Map();
  private conversations: Map<string, ConversationMessage[]> = new Map();

  constructor(claude: AIClient) {
    this.ai = claude;
  }

  /**
   * Generate a new NPC
   */
  async generateNPC(
    role: string,
    context: string,
    options: {
      name?: string;
      race?: string;
      hostile?: boolean;
      combatCapable?: boolean;
    } = {}
  ): Promise<NPC> {
    const prompt = `Generate an NPC for this role: ${role}

CONTEXT: ${context}
${options.name ? `NAME: ${options.name}` : ''}
${options.race ? `RACE: ${options.race}` : ''}
${options.hostile ? 'DISPOSITION: Initially hostile or suspicious' : ''}
${options.combatCapable ? 'Should have combat stats' : 'Non-combatant'}

Create a memorable, believable NPC with:
1. Distinctive appearance
2. Unique voice and mannerisms
3. Clear motivations
4. Hidden depths
5. Potential hooks for interaction`;

    const npcData = await this.ai.generateCharacter<NPC>(
      NPC_GENERATOR_PROMPT,
      prompt
    );

    // Generate ID and store
    npcData.id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    npcData.relationships = {};
    npcData.memory = [];
    npcData.currentMood = 'neutral';

    this.npcs.set(npcData.id, npcData);
    return npcData;
  }

  /**
   * Generate NPC dialogue response
   */
  async getDialogue(
    npcId: string,
    character: Character,
    playerInput: string
  ): Promise<string> {
    const npc = this.npcs.get(npcId);
    if (!npc) throw new Error(`NPC ${npcId} not found`);

    // Get or create conversation history
    const convKey = `${npcId}_${character.id}`;
    if (!this.conversations.has(convKey)) {
      this.conversations.set(convKey, []);
    }
    const history = this.conversations.get(convKey)!;

    // Get relationship with this character
    const relationship = npc.relationships[character.id] || {
      characterId: character.id,
      disposition: 0,
      trust: 0,
      history: []
    };

    // Build NPC context for Claude
    const npcContext = this.buildNPCContext(npc, character, relationship);

    // Convert history to Claude format
    const claudeHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'npc' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }));

    // Generate dialogue
    const response = await this.ai.generateDialogue(
      npcContext,
      claudeHistory,
      playerInput
    );

    // Update conversation history
    history.push({ role: 'player', characterName: character.name, content: playerInput });
    history.push({ role: 'npc', characterName: npc.name, content: response });

    // Record memory of this interaction
    this.recordMemory(npcId, character.id, playerInput, response);

    return response;
  }

  /**
   * Build context string for NPC dialogue
   */
  private buildNPCContext(
    npc: NPC,
    character: Character,
    relationship: NPCRelationship
  ): string {
    return `${NPC_DIALOGUE_PROMPT}

=== NPC PROFILE ===
Name: ${npc.name}${npc.title ? ` "${npc.title}"` : ''}
Race: ${npc.race}
Occupation: ${npc.occupation}
Appearance: ${npc.appearance}

PERSONALITY:
- Archetype: ${npc.personality.archetype}
- Traits: ${npc.personality.traits.join(', ')}
- Quirks: ${npc.personality.quirks.join(', ')}
- Fears: ${npc.personality.fears.join(', ')}
- Values: ${npc.personality.values.join(', ')}

VOICE:
- Tone: ${npc.voice.tone}
- Vocabulary: ${npc.voice.vocabulary}
- Speech Patterns: ${npc.voice.speechPatterns.join(', ')}
- Catchphrases: ${npc.voice.catchphrases.join(', ')}

MOTIVATIONS: ${npc.motivations.join('; ')}
SECRETS (do not reveal easily): ${npc.secrets.join('; ')}

CURRENT MOOD: ${npc.currentMood}

=== RELATIONSHIP WITH ${character.name.toUpperCase()} ===
Disposition: ${this.getDispositionLabel(relationship.disposition)} (${relationship.disposition})
Trust Level: ${relationship.trust}
History: ${relationship.history.slice(-3).join('; ') || 'First meeting'}

=== MEMORIES OF THIS PLAYER ===
${npc.memory
  .filter(m => m.characterId === character.id)
  .slice(-5)
  .map(m => `- ${m.type}: ${m.summary} (impact: ${m.emotional_impact})`)
  .join('\n') || 'No previous interactions'}

=== SPEAKING TO ===
${character.name}, a ${character.race} ${character.class}

Respond in character. Include action tags for physical behavior.`;
  }

  /**
   * Record memory of interaction
   */
  private recordMemory(
    npcId: string,
    characterId: string,
    playerInput: string,
    npcResponse: string
  ): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    // Analyze interaction type (simplified)
    let type: NPCMemory['type'] = 'conversation';
    let emotionalImpact = 0;

    const lowerInput = playerInput.toLowerCase();
    if (lowerInput.includes('threaten') || lowerInput.includes('attack')) {
      type = 'threat';
      emotionalImpact = -5;
    } else if (lowerInput.includes('help') || lowerInput.includes('save')) {
      type = 'help';
      emotionalImpact = 3;
    } else if (lowerInput.includes('give') || lowerInput.includes('offer')) {
      type = 'gift';
      emotionalImpact = 2;
    }

    const memory: NPCMemory = {
      timestamp: new Date().toISOString(),
      type,
      characterId,
      summary: `Player said: "${playerInput.slice(0, 50)}..."`,
      emotional_impact: emotionalImpact
    };

    npc.memory.push(memory);

    // Update relationship
    if (!npc.relationships[characterId]) {
      npc.relationships[characterId] = {
        characterId,
        disposition: 0,
        trust: 0,
        history: []
      };
    }

    npc.relationships[characterId].disposition += emotionalImpact;
    npc.relationships[characterId].lastInteraction = new Date().toISOString();
  }

  /**
   * Update NPC mood based on events
   */
  updateMood(npcId: string, newMood: string, reason?: string): void {
    const npc = this.npcs.get(npcId);
    if (npc) {
      npc.currentMood = newMood;
    }
  }

  /**
   * Modify relationship with character
   */
  modifyRelationship(
    npcId: string,
    characterId: string,
    dispositionChange: number,
    trustChange: number = 0,
    reason?: string
  ): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    if (!npc.relationships[characterId]) {
      npc.relationships[characterId] = {
        characterId,
        disposition: 0,
        trust: 0,
        history: []
      };
    }

    const rel = npc.relationships[characterId];
    rel.disposition = Math.max(-100, Math.min(100, rel.disposition + dispositionChange));
    rel.trust = Math.max(-100, Math.min(100, rel.trust + trustChange));
    
    if (reason) {
      rel.history.push(reason);
    }
  }

  /**
   * Get disposition label from numeric value
   */
  private getDispositionLabel(disposition: number): string {
    if (disposition <= -50) return 'Hostile';
    if (disposition <= -10) return 'Unfriendly';
    if (disposition <= 9) return 'Neutral';
    if (disposition <= 49) return 'Friendly';
    return 'Allied';
  }

  /**
   * Get NPC by ID
   */
  getNPC(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  /**
   * Load NPCs from saved state
   */
  loadNPCs(npcs: NPC[]): void {
    for (const npc of npcs) {
      this.npcs.set(npc.id, npc);
    }
  }

  /**
   * Export all NPCs for saving
   */
  exportNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Generate NPC action in a scene
   */
  async generateNPCAction(
    npcId: string,
    scene: string,
    context: string
  ): Promise<{ action: string; dialogue?: string }> {
    const npc = this.npcs.get(npcId);
    if (!npc) throw new Error(`NPC ${npcId} not found`);

    const prompt = `What does ${npc.name} do in this situation?

NPC: ${npc.name}, ${npc.occupation}
Personality: ${npc.personality.traits.join(', ')}
Current mood: ${npc.currentMood}
Motivations: ${npc.motivations.join('; ')}

SCENE: ${scene}
CONTEXT: ${context}

Describe their action and any dialogue in their distinctive voice.
Format as JSON: { "action": "...", "dialogue": "..." or null }`;

    return await this.ai.chatJSON<{ action: string; dialogue?: string }>(
      [{ role: 'user', content: prompt }],
      { system: NPC_DIALOGUE_PROMPT, model: 'fast' }
    );
  }

  /**
   * Generate NPC gossip or rumors
   */
  async generateRumor(npcId: string): Promise<string> {
    const npc = this.npcs.get(npcId);
    if (!npc) throw new Error(`NPC ${npcId} not found`);

    const prompt = `${npc.name} shares a rumor or piece of gossip in their distinctive voice.

NPC: ${npc.name}, ${npc.occupation}
Voice: ${npc.voice.tone}, ${npc.voice.vocabulary} vocabulary
Speech patterns: ${npc.voice.speechPatterns.join(', ')}

Generate a short bit of gossip or rumor they might share, with their characteristic way of speaking.`;

    return await this.ai.narrate(NPC_DIALOGUE_PROMPT, prompt, { maxTokens: 256 });
  }
}
