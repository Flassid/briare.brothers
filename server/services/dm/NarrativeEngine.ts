/**
 * Narrative Engine
 * 
 * Drives the storytelling: scene generation, branching choices, world state tracking.
 */

import { AIClient } from './AIClient';
import { NARRATIVE_PROMPT, SCENE_GENERATOR_PROMPT } from './prompts';
import {
  Scene,
  WorldState,
  DMResponse,
  PromptChoice,
  Character,
  GameSession,
  SessionEvent,
  Quest
} from './types';

interface SceneGenResponse extends Scene {}

interface NarrativeContext {
  currentScene: Scene;
  worldState: WorldState;
  recentHistory: SessionEvent[];
  activeCharacters: Character[];
}

export class NarrativeEngine {
  private ai: AIClient;

  constructor(claude: AIClient) {
    this.ai = claude;
  }

  /**
   * Generate a new scene
   */
  async generateScene(
    type: string,
    context: NarrativeContext,
    parameters: {
      mood?: Scene['mood'];
      threat?: boolean;
      connected?: string[];
    } = {}
  ): Promise<Scene> {
    const prompt = this.buildScenePrompt(type, context, parameters);

    return await this.ai.generateCharacter<SceneGenResponse>(
      SCENE_GENERATOR_PROMPT,
      prompt
    );
  }

  /**
   * Narrate player entering a scene
   */
  async narrateSceneEntry(
    scene: Scene,
    characters: Character[],
    approachMethod?: string
  ): Promise<string> {
    const charNames = characters.map(c => c.name).join(', ');
    
    const prompt = `The party (${charNames}) enters: ${scene.title}

Scene description: ${scene.description}
Mood: ${scene.mood}
${approachMethod ? `Approach: ${approachMethod}` : ''}

Narrate their arrival. Use the read-aloud text as a foundation but adapt it for the specific party and their approach. Include sensory details. End with a subtle prompt for action without explicitly asking "what do you do?"`;

    return await this.ai.narrate(NARRATIVE_PROMPT, prompt);
  }

  /**
   * Process player action in narrative context
   */
  async processNarrativeAction(
    action: string,
    character: Character,
    context: NarrativeContext
  ): Promise<DMResponse> {
    const prompt = `Process this player action in narrative mode:

PLAYER: ${character.name} (${character.race} ${character.class})
ACTION: "${action}"

CURRENT SCENE: ${context.currentScene.title}
${context.currentScene.description}

WORLD STATE:
- Time: Day ${context.worldState.time.day}, ${context.worldState.time.period}
- Active Quests: ${context.worldState.activeQuests.map(q => q.title).join(', ') || 'None'}
- Recent Events: ${context.recentHistory.slice(-3).map(e => e.summary).join('; ')}

INTERACTABLES IN SCENE:
${context.currentScene.environment.interactables.map(i => 
  `- ${i.name}: ${i.description}`
).join('\n')}

NPCs PRESENT: ${context.currentScene.npcs.join(', ') || 'None'}

Respond to this action. Describe what happens, reveal information as appropriate, and move the story forward. Include any scene updates, world state changes, or NPC reactions.`;

    const response = await this.ai.chatJSON<{
      narration: string;
      sceneUpdates?: Partial<Scene>;
      worldStateChanges?: Record<string, any>;
      npcReactions?: { npcId: string; reaction: string }[];
      discoveredInfo?: string[];
      promptChoices?: PromptChoice[];
    }>(
      [{ role: 'user', content: prompt }],
      { system: NARRATIVE_PROMPT, model: 'fast' }
    );

    return {
      narration: response.narration,
      sceneUpdates: response.sceneUpdates,
      worldStateChanges: response.worldStateChanges as Partial<WorldState> | undefined,
      promptChoices: response.promptChoices
    };
  }

  /**
   * Generate branching choices for current situation
   */
  async generateChoices(
    context: NarrativeContext,
    situationDescription?: string
  ): Promise<PromptChoice[]> {
    const prompt = `Generate 3-4 natural choices for the players.

SITUATION: ${situationDescription || context.currentScene.description}
SCENE: ${context.currentScene.title}
EXITS: ${context.currentScene.exits.map(e => e.direction).join(', ')}
INTERACTABLES: ${context.currentScene.environment.interactables.map(i => i.name).join(', ')}
NPCs: ${context.currentScene.npcs.join(', ') || 'None'}

Generate choices that:
1. Feel natural, not like a menu
2. Include obvious and non-obvious options
3. Vary in risk/reward
4. Don't all lead to the same place

Format as JSON array:
[
  { "id": "choice_1", "text": "Natural description of choice", "hint": "subtle hint about consequence", "type": "obvious|hidden|risky" }
]`;

    const response = await this.ai.chatJSON<PromptChoice[]>(
      [{ role: 'user', content: prompt }],
      { system: NARRATIVE_PROMPT, model: 'fast' }
    );

    return response;
  }

  /**
   * Advance time and trigger time-based events
   */
  async advanceTime(
    worldState: WorldState,
    hours: number
  ): Promise<{ newState: WorldState; events: string[] }> {
    const newState = { ...worldState };
    const events: string[] = [];

    // Advance hours
    newState.time.hour += hours;
    while (newState.time.hour >= 24) {
      newState.time.hour -= 24;
      newState.time.day += 1;
    }

    // Update time period
    const hour = newState.time.hour;
    if (hour >= 5 && hour < 7) newState.time.period = 'dawn';
    else if (hour >= 7 && hour < 12) newState.time.period = 'morning';
    else if (hour >= 12 && hour < 17) newState.time.period = 'afternoon';
    else if (hour >= 17 && hour < 20) newState.time.period = 'evening';
    else if (hour >= 20 && hour < 24) newState.time.period = 'night';
    else newState.time.period = 'midnight';

    // Check for time-sensitive quests
    for (const quest of newState.activeQuests) {
      if (quest.urgency === 'critical') {
        events.push(`The ${quest.title} grows more urgent as time passes.`);
      }
    }

    return { newState, events };
  }

  /**
   * Generate a quest from narrative context
   */
  async generateQuest(
    giver: string,
    context: NarrativeContext,
    questType: 'main' | 'side' | 'personal'
  ): Promise<Quest> {
    const prompt = `Generate a ${questType} quest.

Quest Giver: ${giver}
Current Scene: ${context.currentScene.title}
World State: Day ${context.worldState.time.day}
Active Quests: ${context.worldState.activeQuests.map(q => q.title).join(', ') || 'None'}

Create a quest that:
1. Fits naturally with the giver and location
2. Has clear objectives but room for creativity
3. Connects to the broader world
4. Has interesting rewards

Output as JSON:
{
  "id": "quest_unique_id",
  "title": "Quest name",
  "description": "What the giver tells the players",
  "objectives": [
    { "id": "obj_1", "description": "What to do", "completed": false, "hidden": false }
  ],
  "rewards": [
    { "type": "gold|item|reputation|experience|story", "value": "amount or item name", "description": "What they get" }
  ],
  "giver": "NPC name",
  "urgency": "critical|normal|passive"
}`;

    return await this.ai.generateCharacter<Quest>(
      NARRATIVE_PROMPT,
      prompt
    );
  }

  /**
   * Generate session recap
   */
  async generateRecap(session: GameSession): Promise<string> {
    const majorEvents = session.history.filter(e => 
      e.type === 'discovery' || e.type === 'combat'
    );

    const prompt = `Generate a "Previously on..." style recap for this D&D session.

Major Events:
${majorEvents.map(e => `- ${e.summary}`).join('\n')}

Current State:
- Location: Scene ${session.worldState.currentSceneId}
- Day: ${session.worldState.time.day}
- Active Quests: ${session.worldState.activeQuests.map(q => q.title).join(', ')}

Create a dramatic, engaging 2-3 paragraph recap that:
1. Highlights key moments
2. Reminds of unresolved threads
3. Builds anticipation for what's next
4. Feels like a TV show recap`;

    return await this.ai.narrate(
      NARRATIVE_PROMPT,
      prompt,
      { model: 'quality', maxTokens: 1024 }
    );
  }

  private buildScenePrompt(
    type: string,
    context: NarrativeContext,
    parameters: any
  ): string {
    return `Generate a ${type} scene.

CURRENT NARRATIVE CONTEXT:
- Previous Scene: ${context.currentScene.title}
- Time: Day ${context.worldState.time.day}, ${context.worldState.time.period}
- Party has discovered: ${context.worldState.discoveredLocations.slice(-5).join(', ') || 'Nothing notable yet'}

SCENE PARAMETERS:
- Type: ${type}
- Mood: ${parameters.mood || 'as appropriate'}
- Should contain threat: ${parameters.threat || 'if fitting'}
- Connected to: ${parameters.connected?.join(', ') || 'the previous scene'}

Create a richly detailed scene with interactables, sensory details, and hooks for exploration.`;
  }
}
