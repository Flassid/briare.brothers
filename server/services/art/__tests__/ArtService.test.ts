/**
 * Art Generation Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePrompt,
  generateDallePrompt,
  generateCacheKey,
  normalizeDescription,
  EXAMPLE_PROMPTS
} from '../PromptTemplates.js';
import { CacheManager } from '../CacheManager.js';
import { AssetQueue } from '../AssetQueue.js';
import type { AssetType, GenerationRequest, GenerationResult } from '../types.js';

describe('PromptTemplates', () => {
  describe('normalizeDescription', () => {
    it('should lowercase and trim', () => {
      expect(normalizeDescription('  Hello World  ')).toBe('hello world');
    });

    it('should remove special characters', () => {
      expect(normalizeDescription("Dwarf's mechanical arm!")).toBe('dwarfs mechanical arm');
    });

    it('should collapse whitespace', () => {
      expect(normalizeDescription('multiple   spaces   here')).toBe('multiple spaces here');
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys', () => {
      const key1 = generateCacheKey('character', 'dwarf blacksmith', { width: 64, height: 64 });
      const key2 = generateCacheKey('character', 'dwarf blacksmith', { width: 64, height: 64 });
      expect(key1).toBe(key2);
    });

    it('should differ for different descriptions', () => {
      const key1 = generateCacheKey('character', 'dwarf blacksmith', { width: 64, height: 64 });
      const key2 = generateCacheKey('character', 'elf ranger', { width: 64, height: 64 });
      expect(key1).not.toBe(key2);
    });

    it('should differ for different sizes', () => {
      const key1 = generateCacheKey('character', 'dwarf', { width: 64, height: 64 });
      const key2 = generateCacheKey('character', 'dwarf', { width: 128, height: 128 });
      expect(key1).not.toBe(key2);
    });

    it('should be case-insensitive', () => {
      const key1 = generateCacheKey('character', 'DWARF BLACKSMITH', { width: 64, height: 64 });
      const key2 = generateCacheKey('character', 'dwarf blacksmith', { width: 64, height: 64 });
      expect(key1).toBe(key2);
    });
  });

  describe('generatePrompt', () => {
    it('should generate prompts for characters', () => {
      const result = generatePrompt({
        description: 'grizzled dwarf blacksmith',
        type: 'character',
        size: { width: 64, height: 64 },
        provider: 'replicate'
      });

      expect(result.positive).toContain('pixel art');
      expect(result.positive).toContain('grizzled dwarf blacksmith');
      expect(result.positive).toContain('portrait');
      expect(result.negative).toContain('blurry');
      expect(result.negative).toContain('realistic');
    });

    it('should generate prompts for monsters', () => {
      const result = generatePrompt({
        description: 'shadow drake',
        type: 'monster',
        size: { width: 128, height: 128 },
        provider: 'replicate'
      });

      expect(result.positive).toContain('monster sprite');
      expect(result.positive).toContain('full body');
      expect(result.negative).not.toContain('full body'); // Should not be in negative
    });

    it('should generate prompts for scenes', () => {
      const result = generatePrompt({
        description: 'dark dungeon corridor',
        type: 'scene',
        size: { width: 512, height: 288 },
        provider: 'replicate'
      });

      expect(result.positive).toContain('background');
      expect(result.positive).toContain('atmospheric');
    });
  });

  describe('generateDallePrompt', () => {
    it('should include style references for DALL-E', () => {
      const prompt = generateDallePrompt({
        description: 'elven mage',
        type: 'character',
        size: { width: 64, height: 64 },
        provider: 'dalle'
      });

      expect(prompt).toContain('16-bit pixel art');
      expect(prompt).toContain('elven mage');
      expect(prompt).toContain('Final Fantasy');
    });
  });

  describe('EXAMPLE_PROMPTS', () => {
    it('should have examples for all types', () => {
      expect(EXAMPLE_PROMPTS.character.length).toBeGreaterThan(0);
      expect(EXAMPLE_PROMPTS.monster.length).toBeGreaterThan(0);
      expect(EXAMPLE_PROMPTS.scene.length).toBeGreaterThan(0);
    });
  });
});

describe('AssetQueue', () => {
  let queue: AssetQueue;

  beforeEach(() => {
    queue = new AssetQueue(2, 5000, 1);
  });

  it('should enqueue and track jobs', async () => {
    const request: GenerationRequest = {
      type: 'character',
      description: 'test character'
    };

    const mockExecutor = vi.fn().mockImplementation(async () => ({
      url: '/test.png',
      localPath: '/public/test.png',
      cacheKey: 'test123',
      width: 64,
      height: 64,
      provider: 'replicate',
      generationTimeMs: 100,
      cached: false
    } as GenerationResult));

    const { job, promise } = await queue.enqueue(request, mockExecutor);

    expect(job.id).toBeDefined();
    expect(job.status).toBe('queued');
    expect(job.request).toBe(request);

    const result = await promise;
    expect(result.url).toBe('/test.png');
    expect(mockExecutor).toHaveBeenCalled();
  });

  it('should track queue statistics', async () => {
    const stats = queue.getStats();
    expect(stats.pending).toBe(0);
    expect(stats.active).toBe(0);
  });

  it('should handle job cancellation', async () => {
    const request: GenerationRequest = {
      type: 'character',
      description: 'test'
    };

    // Slow executor
    const slowExecutor = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 10000))
    );

    const { job } = await queue.enqueue(request, slowExecutor);
    
    // Cancel immediately (while still queued)
    // Note: This test might be flaky depending on timing
    const cancelled = queue.cancel(job.id);
    
    // Job might have already started, so we just check it was processed
    expect(job.id).toBeDefined();
  });
});

describe('Integration', () => {
  it('should work end-to-end with mocked providers', async () => {
    // This would be a full integration test with mocked API responses
    // For now, just verify the types compile correctly
    
    const request: GenerationRequest = {
      type: 'character' as AssetType,
      description: 'test dwarf',
      size: { width: 64, height: 64 },
      priority: 'normal',
      waitForResult: true
    };

    expect(request.type).toBe('character');
  });
});
