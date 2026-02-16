"use client";

import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMessage } from "@/types/game";
import { generateId } from "@/lib/utils";

// Sprite sheet types
export interface SpriteFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
}

export interface AnimationDef {
  name: string;
  frames: string[];
  frameRate: number;
  loop: boolean;
}

export interface GeneratedSpriteSheet {
  id: string;
  type: 'character' | 'enemy' | 'tileset' | 'effect';
  sheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  frames: SpriteFrame[];
  animations: AnimationDef[];
  generatedAt: number;
}

export function useSocket() {
  const { 
    setConnected, 
    addMessage, 
    setIsLoading,
  } = useGameStore();
  
  const initialized = useRef(false);
  const spriteSheetCallbacks = useRef<Map<string, (sheet: GeneratedSpriteSheet) => void>>(new Map());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();

    socket.on("connect", () => {
      console.log("[Socket] Connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });

    // Generation status updates
    socket.on("generation:status", (data: { type: string; status: string; message: string }) => {
      console.log(`[Generation] ${data.type}: ${data.message}`);
      addMessage({
        id: generateId(),
        timestamp: Date.now(),
        type: "system",
        content: `🎨 ${data.message}`
      });
    });

    // Sprite sheet ready
    socket.on("spritesheet:ready", (data: { type: string; sheet: GeneratedSpriteSheet; enemyType?: string; theme?: string; effectType?: string }) => {
      console.log(`[SpriteSheet] ${data.type} ready:`, data.sheet.frames.length, "frames");
      
      // Store in window for Phaser to access
      const key = data.enemyType || data.theme || data.effectType || data.type;
      (window as any).__spriteSheets = (window as any).__spriteSheets || {};
      (window as any).__spriteSheets[key] = data.sheet;
      
      // Trigger any waiting callbacks
      const callback = spriteSheetCallbacks.current.get(key);
      if (callback) {
        callback(data.sheet);
        spriteSheetCallbacks.current.delete(key);
      }
      
      // Emit custom event for Phaser
      window.dispatchEvent(new CustomEvent('spritesheet:loaded', { detail: data }));
    });

    // Generation error
    socket.on("generation:error", (data: { type: string; message: string }) => {
      console.error(`[Generation] Error:`, data.message);
      addMessage({
        id: generateId(),
        timestamp: Date.now(),
        type: "system",
        content: `❌ Failed to generate ${data.type}: ${data.message}`
      });
    });

    // DM narration
    socket.on("dm:narrate", (data: { type: string; content: string; timestamp: number }) => {
      setIsLoading(false);
      addMessage({
        id: generateId(),
        timestamp: data.timestamp || Date.now(),
        type: "dm",
        content: data.content
      });
    });

    // Game state
    socket.on("game:state", () => {
      setIsLoading(false);
    });

    // Animation triggers
    socket.on("player:anim", (data: { anim: string }) => {
      window.dispatchEvent(new CustomEvent('player:anim', { detail: data }));
    });

    socket.on("entity:anim", (data: { entityId: string; anim: string }) => {
      window.dispatchEvent(new CustomEvent('entity:anim', { detail: data }));
    });

    socket.on("effect:play", (data: { effectType: string; x: number; y: number }) => {
      window.dispatchEvent(new CustomEvent('effect:play', { detail: data }));
    });

    // Errors
    socket.on("error", (data: { message: string }) => {
      console.error("[Socket] Error:", data.message);
      setIsLoading(false);
      addMessage({
        id: generateId(),
        timestamp: Date.now(),
        type: "system",
        content: `❌ ${data.message}`
      });
    });

    connectSocket().catch(console.error);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("generation:status");
      socket.off("spritesheet:ready");
      socket.off("generation:error");
      socket.off("dm:narrate");
      socket.off("game:state");
      socket.off("player:anim");
      socket.off("entity:anim");
      socket.off("effect:play");
      socket.off("error");
    };
  }, [setConnected, addMessage, setIsLoading]);

  // Generate character sprite sheet
  const generateCharacterSheet = useCallback((name: string, race: string, charClass: string): Promise<GeneratedSpriteSheet> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      
      const timeout = setTimeout(() => {
        spriteSheetCallbacks.current.delete('character');
        reject(new Error('Generation timed out'));
      }, 120000); // 2 minute timeout
      
      spriteSheetCallbacks.current.set('character', (sheet) => {
        clearTimeout(timeout);
        resolve(sheet);
      });
      
      socket.emit('spritesheet:character', { name, race, class: charClass });
    });
  }, []);

  // Generate enemy sprite sheet
  const generateEnemySheet = useCallback((enemyType: string): Promise<GeneratedSpriteSheet> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      
      const timeout = setTimeout(() => {
        spriteSheetCallbacks.current.delete(enemyType);
        reject(new Error('Generation timed out'));
      }, 120000);
      
      spriteSheetCallbacks.current.set(enemyType, (sheet) => {
        clearTimeout(timeout);
        resolve(sheet);
      });
      
      socket.emit('spritesheet:enemy', { type: enemyType });
    });
  }, []);

  // Generate tileset
  const generateTileset = useCallback((theme: string): Promise<GeneratedSpriteSheet> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      
      const timeout = setTimeout(() => {
        spriteSheetCallbacks.current.delete(theme);
        reject(new Error('Generation timed out'));
      }, 120000);
      
      spriteSheetCallbacks.current.set(theme, (sheet) => {
        clearTimeout(timeout);
        resolve(sheet);
      });
      
      socket.emit('spritesheet:tileset', { theme });
    });
  }, []);

  // Generate effect sprites
  const generateEffect = useCallback((effectType: string): Promise<GeneratedSpriteSheet> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      
      const timeout = setTimeout(() => {
        spriteSheetCallbacks.current.delete(effectType);
        reject(new Error('Generation timed out'));
      }, 60000);
      
      spriteSheetCallbacks.current.set(effectType, (sheet) => {
        clearTimeout(timeout);
        resolve(sheet);
      });
      
      socket.emit('spritesheet:effect', { effectType });
    });
  }, []);

  // Send player action
  const sendAction = useCallback((action: string) => {
    if (!action.trim()) return;
    
    const socket = getSocket();
    console.log('[useSocket] sendAction:', action, 'connected:', socket.connected);
    
    const currentChar = useGameStore.getState().character;
    
    addMessage({
      id: generateId(),
      timestamp: Date.now(),
      type: "player",
      sender: currentChar?.name || "You",
      content: action
    });
    
    setIsLoading(true);
    socket.emit("player:action", { action });
  }, [addMessage, setIsLoading]);

  // Initialize game
  const initGame = useCallback((spriteSheet?: GeneratedSpriteSheet) => {
    const currentChar = useGameStore.getState().character;
    if (currentChar) {
      getSocket().emit("game:init", {
        name: currentChar.name,
        race: currentChar.race,
        class: currentChar.class,
        spriteSheet,
      });
    }
  }, []);

  return {
    generateCharacterSheet,
    generateEnemySheet,
    generateTileset,
    generateEffect,
    sendAction,
    initGame,
    disconnect: disconnectSocket
  };
}
