/**
 * Gemini API Client
 * 
 * Handles all communication with Google's Gemini API.
 * Uses Gemini 2.0 Flash for fast responses and Gemini 1.5 Pro for quality.
 */

import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';

export type ModelTier = 'fast' | 'quality';

interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiOptions {
  model?: ModelTier;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  jsonMode?: boolean;
}

interface GeminiResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  
  // Model selection - billing enabled, use pro for quality
  private static readonly MODELS = {
    fast: 'gemini-2.5-flash',         // Quick responses, combat
    quality: 'gemini-2.5-pro'         // Better JSON, character gen, complex tasks
  };

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  private getModel(tier: ModelTier, temperature: number, maxTokens: number): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: GeminiClient.MODELS[tier],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    });
  }

  /**
   * Convert our message format to Gemini's format
   */
  private convertMessages(messages: GeminiMessage[]): Content[] {
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  }

  /**
   * Send a message to Gemini and get a response
   */
  async chat(
    messages: GeminiMessage[],
    options: GeminiOptions = {}
  ): Promise<GeminiResponse> {
    const {
      model = 'fast',
      maxTokens = 2048,
      temperature = 0.8,
      system,
    } = options;

    const generativeModel = this.getModel(model, temperature, maxTokens);
    
    // For system instructions, prepend to history as a user->model exchange
    let history = this.convertMessages(messages.slice(0, -1));
    
    if (system) {
      // Add system instruction as first exchange
      history = [
        { role: 'user', parts: [{ text: `SYSTEM: ${system}` }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
        ...history
      ];
    }
    
    const chat = generativeModel.startChat({ history });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    // Get usage metadata if available
    const usageMetadata = response.usageMetadata;
    
    return {
      content: text,
      model: GeminiClient.MODELS[model],
      usage: {
        inputTokens: usageMetadata?.promptTokenCount || 0,
        outputTokens: usageMetadata?.candidatesTokenCount || 0
      }
    };
  }

  /**
   * Get a structured JSON response from Gemini
   */
  async chatJSON<T>(
    messages: GeminiMessage[],
    options: GeminiOptions = {}
  ): Promise<T> {
    const {
      model = 'quality',
      maxTokens = 4096,
      temperature = 0.7,
      system,
    } = options;

    // Create model with JSON response type
    const generativeModel = this.genAI.getGenerativeModel({
      model: GeminiClient.MODELS[model],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json', // Force JSON output
      }
    });

    // Build prompt with system instructions and JSON requirement
    const jsonSystem = (system || '') + `

IMPORTANT: Respond with valid JSON only. No explanations outside the JSON.`;

    let history = this.convertMessages(messages.slice(0, -1));
    
    if (jsonSystem) {
      history = [
        { role: 'user', parts: [{ text: `SYSTEM: ${jsonSystem}` }] },
        { role: 'model', parts: [{ text: 'Understood. I will respond with valid JSON.' }] },
        ...history
      ];
    }
    
    const chat = generativeModel.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    console.log('[Gemini] JSON Response length:', text.length);
    
    try {
      // Clean up response - remove markdown code blocks if present
      let jsonStr = text.trim();
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
      console.error('[Gemini] Failed to parse JSON. Response preview:', text.slice(0, 500));
      throw new Error(`Gemini returned invalid JSON: ${error}`);
    }
  }

  /**
   * Generate narrative text with the DM's voice
   */
  async narrate(
    context: string,
    prompt: string,
    options: GeminiOptions = {}
  ): Promise<string> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      {
        model: 'fast',
        temperature: 0.85,
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
        maxTokens: 8192,  // Character gen needs more tokens for full JSON
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
    conversationHistory: GeminiMessage[],
    playerInput: string
  ): Promise<string> {
    const messages: GeminiMessage[] = [
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
