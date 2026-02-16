/**
 * AI Backstory Generator
 * 
 * Generates character backstories with streaming for live typewriter effect
 * Uses Gemini by default, falls back to Claude if needed
 */

import { Socket } from 'socket.io';
import { AIClient } from '../dm/AIClient.js';

// Initialize AI client (defaults to Gemini)
const ai = new AIClient();

interface CharacterInfo {
  name: string;
  race: string;
  class: string;
  personality: string;
  background: string;
  hairColor?: string;
  gender?: string;
}

const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  brave: 'fearless and courageous, never backing down from a challenge',
  cunning: 'clever and strategic, always thinking three steps ahead',
  noble: 'honorable and righteous, bound by a strict moral code',
  mysterious: 'enigmatic and secretive, with hidden depths',
  cheerful: 'optimistic and lighthearted, finding joy even in darkness',
  vengeful: 'driven by past wrongs, seeking justice or revenge',
};

const BACKGROUND_HOOKS: Record<string, string> = {
  orphan: 'raised on the unforgiving streets, learning to survive by wit and will alone',
  noble: 'once heir to a great house, now stripped of title and fortune',
  soldier: 'a veteran of bloody conflicts, haunted by memories of fallen comrades',
  scholar: 'once a respected academic, exiled for forbidden knowledge',
  criminal: 'a former thief and scoundrel, seeking redemption for past sins',
  wanderer: 'without home or history, drifting through the world like a leaf on the wind',
};

/**
 * Generate and stream a character backstory
 */
export async function generateBackstory(socket: Socket, character: CharacterInfo): Promise<void> {
  const personality = PERSONALITY_DESCRIPTIONS[character.personality] || character.personality;
  const background = BACKGROUND_HOOKS[character.background] || character.background;
  
  const systemPrompt = `You are a master storyteller for a fantasy RPG. Write dramatic, evocative backstories that feel like the opening of an epic novel. Keep it punchy and concise.`;
  
  const prompt = `Write a compelling backstory for this character:

CHARACTER:
- Name: ${character.name}
- Race: ${character.race}
- Class: ${character.class}
- Personality: ${personality}
- Background: ${background}
- Hair: ${character.hairColor || 'dark'}
- Presentation: ${character.gender || 'mysterious'}

REQUIREMENTS:
- Write exactly 3-4 sentences (50-70 words max)
- One dramatic hook, one key past moment, one reason for the quest
- Third person, present tense
- Punchy and evocative

Begin:`;

  try {
    console.log(`📝 Generating backstory for ${character.name} using ${ai.getDefaultProvider()}...`);
    
    // Generate the full backstory
    const backstory = await ai.narrate(systemPrompt, prompt);
    
    // Stream it to the client with typewriter effect
    // Target: ~10 seconds (fast, dramatic)
    const words = backstory.split(' ');
    const delayPerWord = 80; // Fast typing
    
    for (let i = 0; i < words.length; i++) {
      const text = words[i] + (i < words.length - 1 ? ' ' : '');
      socket.emit('backstory:chunk', { text });
      await new Promise(resolve => setTimeout(resolve, delayPerWord));
    }

    socket.emit('backstory:complete');
    console.log(`✅ Backstory complete for ${character.name}`);
    
  } catch (error) {
    console.error('Backstory generation error:', error);
    
    // Fallback backstory
    const fallback = `${character.name} stands at the threshold of darkness, a ${character.race} ${character.class} whose past is shrouded in mystery. ${background}. Now, driven by forces they barely understand, they descend into the ancient dungeon, ready to face whatever horrors await below.`;
    
    socket.emit('backstory:chunk', { text: fallback });
    socket.emit('backstory:complete');
  }
}

/**
 * Generate a quick one-shot backstory (non-streaming)
 */
export async function generateQuickBackstory(character: CharacterInfo): Promise<string> {
  const personality = PERSONALITY_DESCRIPTIONS[character.personality] || character.personality;
  const background = BACKGROUND_HOOKS[character.background] || character.background;
  
  try {
    const systemPrompt = `You are a master storyteller. Write dramatic, evocative fantasy backstories.`;
    
    const prompt = `Write a 2-paragraph fantasy backstory for ${character.name}, a ${character.race} ${character.class} who is ${personality}. They were ${background}. Make it dramatic and hint at why they seek the dungeon. Keep it under 200 words.`;
    
    return await ai.narrate(systemPrompt, prompt);
    
  } catch (error) {
    console.error('Quick backstory error:', error);
    return `${character.name}, a ${character.race} ${character.class}, seeks answers in the depths below.`;
  }
}
