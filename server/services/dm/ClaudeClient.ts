/**
 * Claude API Client
 * 
 * Handles all communication with Anthropic's Claude API.
 * Uses Sonnet for speed (combat, quick responses) and Opus for complex moments.
 */

import Anthropic from '@anthropic-ai/sdk';

export type ModelTier = 'fast' | 'quality';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeOptions {
  model?: ModelTier;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  jsonMode?: boolean;
}

interface ClaudeResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ClaudeClient {
  private client: Anthropic;
  
  // Model selection: Sonnet for everything (fast + reliable)
  private static readonly MODELS = {
    fast: 'claude-sonnet-4-20250514',         // Quick responses, combat
    quality: 'claude-sonnet-4-20250514'       // Complex narratives, character gen (same model for reliability)
  };

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Send a message to Claude and get a response
   */
  async chat(
    messages: ClaudeMessage[],
    options: ClaudeOptions = {}
  ): Promise<ClaudeResponse> {
    const {
      model = 'fast',
      maxTokens = 2048,
      temperature = 0.8,
      system,
    } = options;

    const response = await this.client.messages.create({
      model: ClaudeClient.MODELS[model],
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const textContent = response.content.find(c => c.type === 'text');
    
    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  }

  /**
   * Get a structured JSON response from Claude
   */
  async chatJSON<T>(
    messages: ClaudeMessage[],
    options: ClaudeOptions = {}
  ): Promise<T> {
    // Append JSON instruction to system prompt
    const jsonSystem = (options.system || '') + `

CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks, no explanation.
Your entire response must be parseable JSON.`;

    const response = await this.chat(messages, {
      ...options,
      system: jsonSystem,
      temperature: options.temperature ?? 0.7 // Slightly lower for structured output
    });

    try {
      // Clean up response - remove markdown code blocks if present
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', response.content);
      throw new Error(`Claude returned invalid JSON: ${error}`);
    }
  }

  /**
   * Generate narrative text with the DM's voice
   */
  async narrate(
    context: string,
    prompt: string,
    options: ClaudeOptions = {}
  ): Promise<string> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      {
        model: 'fast',
        temperature: 0.85, // Higher for creative narration
        system: context,
        ...options
      }
    );
    return response.content;
  }

  /**
   * Generate character-related content (uses quality model)
   */
  async generateCharacter<T>(
    system: string,
    prompt: string
  ): Promise<T> {
    return this.chatJSON<T>(
      [{ role: 'user', content: prompt }],
      {
        model: 'quality',
        maxTokens: 4096,
        temperature: 0.9,
        system
      }
    );
  }

  /**
   * Quick combat resolution (uses fast model)
   */
  async resolveCombat<T>(
    system: string,
    prompt: string
  ): Promise<T> {
    return this.chatJSON<T>(
      [{ role: 'user', content: prompt }],
      {
        model: 'fast',
        maxTokens: 2048,
        temperature: 0.75,
        system
      }
    );
  }

  /**
   * NPC dialogue generation
   */
  async generateDialogue(
    npcContext: string,
    conversationHistory: ClaudeMessage[],
    playerInput: string
  ): Promise<string> {
    const messages: ClaudeMessage[] = [
      ...conversationHistory,
      { role: 'user', content: playerInput }
    ];

    const response = await this.chat(messages, {
      model: 'fast',
      temperature: 0.85,
      system: npcContext,
      maxTokens: 1024
    });

    return response.content;
  }
}
