/**
 * AI Client Abstraction
 * 
 * Unified interface for Claude and Gemini models.
 * Allows easy switching between providers or using both strategically.
 */

import { ClaudeClient } from './ClaudeClient';
import { GeminiClient } from './GeminiClient';

export type AIProvider = 'claude' | 'gemini';
export type ModelTier = 'fast' | 'quality';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIOptions {
  model?: ModelTier;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  jsonMode?: boolean;
  provider?: AIProvider; // Override default provider for this call
}

interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class AIClient {
  private claudeClient?: ClaudeClient;
  private geminiClient?: GeminiClient;
  private defaultProvider: AIProvider;

  constructor(options: {
    defaultProvider?: AIProvider;
    anthropicApiKey?: string;
    geminiApiKey?: string;
  } = {}) {
    this.defaultProvider = options.defaultProvider || 'gemini'; // Default to Gemini (free tier!)

    // Initialize Claude if key available
    const anthropicKey = options.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== 'your-anthropic-key-here') {
      this.claudeClient = new ClaudeClient(anthropicKey);
    }

    // Initialize Gemini if key available
    const geminiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiClient = new GeminiClient(geminiKey);
    }

    // Validate we have at least one provider
    if (!this.claudeClient && !this.geminiClient) {
      throw new Error('At least one AI provider (Claude or Gemini) must be configured');
    }

    // Fall back to available provider if default isn't configured
    if (this.defaultProvider === 'claude' && !this.claudeClient) {
      console.warn('Claude not configured, falling back to Gemini');
      this.defaultProvider = 'gemini';
    }
    if (this.defaultProvider === 'gemini' && !this.geminiClient) {
      console.warn('Gemini not configured, falling back to Claude');
      this.defaultProvider = 'claude';
    }
  }

  private getClient(provider: AIProvider): ClaudeClient | GeminiClient {
    if (provider === 'claude') {
      if (!this.claudeClient) throw new Error('Claude not configured');
      return this.claudeClient;
    }
    if (!this.geminiClient) throw new Error('Gemini not configured');
    return this.geminiClient;
  }

  /**
   * Send a message and get a response
   */
  async chat(
    messages: AIMessage[],
    options: AIOptions = {}
  ): Promise<AIResponse> {
    const provider = options.provider || this.defaultProvider;
    const client = this.getClient(provider);

    const response = await client.chat(messages, {
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      system: options.system,
    });

    return {
      ...response,
      provider
    };
  }

  /**
   * Get a structured JSON response
   */
  async chatJSON<T>(
    messages: AIMessage[],
    options: AIOptions = {}
  ): Promise<T> {
    const provider = options.provider || this.defaultProvider;
    const client = this.getClient(provider);
    return client.chatJSON<T>(messages, options);
  }

  /**
   * Generate narrative text
   */
  async narrate(
    context: string,
    prompt: string,
    options: AIOptions = {}
  ): Promise<string> {
    const provider = options.provider || this.defaultProvider;
    const client = this.getClient(provider);
    return client.narrate(context, prompt, options);
  }

  /**
   * Generate character content
   */
  async generateCharacter<T>(
    system: string,
    prompt: string,
    provider?: AIProvider
  ): Promise<T> {
    const client = this.getClient(provider || this.defaultProvider);
    return client.generateCharacter<T>(system, prompt);
  }

  /**
   * Resolve combat
   */
  async resolveCombat<T>(
    system: string,
    prompt: string,
    provider?: AIProvider
  ): Promise<T> {
    const client = this.getClient(provider || this.defaultProvider);
    return client.resolveCombat<T>(system, prompt);
  }

  /**
   * Generate NPC dialogue
   */
  async generateDialogue(
    npcContext: string,
    conversationHistory: AIMessage[],
    playerInput: string,
    provider?: AIProvider
  ): Promise<string> {
    const client = this.getClient(provider || this.defaultProvider);
    return client.generateDialogue(npcContext, conversationHistory, playerInput);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.claudeClient) providers.push('claude');
    if (this.geminiClient) providers.push('gemini');
    return providers;
  }

  /**
   * Get current default provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: AIProvider): void {
    if (provider === 'claude' && !this.claudeClient) {
      throw new Error('Claude is not configured');
    }
    if (provider === 'gemini' && !this.geminiClient) {
      throw new Error('Gemini is not configured');
    }
    this.defaultProvider = provider;
  }
}
