/**
 * Cache Manager for Generated Art Assets
 * Handles storage, retrieval, and cleanup of cached pixel art
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { AssetType, CacheEntry, CacheStats, AssetSize } from './types.js';

interface CacheIndex {
  version: number;
  entries: Record<string, CacheEntry>;
  stats: {
    hitCount: number;
    missCount: number;
  };
}

export class CacheManager {
  private cacheDir: string;
  private ttlDays: number;
  private index: CacheIndex;
  private indexPath: string;
  private initialized: boolean = false;

  constructor(cacheDir: string, ttlDays: number = 30) {
    this.cacheDir = cacheDir;
    this.ttlDays = ttlDays;
    this.indexPath = path.join(cacheDir, 'cache-index.json');
    this.index = {
      version: 1,
      entries: {},
      stats: { hitCount: 0, missCount: 0 }
    };
  }

  /**
   * Initialize cache directories and load index
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create cache directories
    const dirs = ['characters', 'monsters', 'scenes'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.cacheDir, dir), { recursive: true });
    }

    // Load existing index
    try {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      this.index = JSON.parse(data);
    } catch (error) {
      // Index doesn't exist, use default
      await this.saveIndex();
    }

    this.initialized = true;
  }

  /**
   * Generate a deterministic cache key from description and parameters
   */
  generateCacheKey(
    type: AssetType,
    description: string,
    size: AssetSize
  ): string {
    const normalized = this.normalizeDescription(description);
    const input = `v1:${type}:${normalized}:${size.width}x${size.height}`;
    
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Normalize description for consistent cache keys
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if asset exists in cache
   */
  async has(cacheKey: string): Promise<boolean> {
    await this.initialize();
    
    const entry = this.index.entries[cacheKey];
    if (!entry) {
      return false;
    }

    // Check if file still exists
    try {
      await fs.access(entry.filePath);
      
      // Check TTL
      const age = Date.now() - new Date(entry.createdAt).getTime();
      const maxAge = this.ttlDays * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        // Expired, clean up
        await this.delete(cacheKey);
        return false;
      }
      
      return true;
    } catch {
      // File doesn't exist, remove from index
      delete this.index.entries[cacheKey];
      await this.saveIndex();
      return false;
    }
  }

  /**
   * Get cached entry
   */
  async get(cacheKey: string): Promise<CacheEntry | null> {
    await this.initialize();

    if (!(await this.has(cacheKey))) {
      this.index.stats.missCount++;
      return null;
    }

    const entry = this.index.entries[cacheKey];
    
    // Update access stats
    entry.lastAccessedAt = new Date();
    entry.accessCount++;
    this.index.stats.hitCount++;
    
    await this.saveIndex();
    
    return entry;
  }

  /**
   * Store asset in cache
   */
  async set(
    cacheKey: string,
    type: AssetType,
    description: string,
    imageBuffer: Buffer,
    width: number,
    height: number,
    provider: string
  ): Promise<CacheEntry> {
    await this.initialize();

    const filename = `${cacheKey}.png`;
    const subdir = `${type}s`;
    const subdirPath = path.join(this.cacheDir, subdir);
    const filePath = path.join(subdirPath, filename);
    const url = `/generated/${subdir}/${filename}`;

    // Ensure subdirectory exists
    await fs.mkdir(subdirPath, { recursive: true });

    // Write image file
    await fs.writeFile(filePath, imageBuffer);

    const entry: CacheEntry = {
      cacheKey,
      type,
      description,
      normalizedDescription: this.normalizeDescription(description),
      filePath,
      url,
      width,
      height,
      provider: provider as 'replicate' | 'dalle' | 'hybrid',
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 1,
      sizeBytes: imageBuffer.length
    };

    this.index.entries[cacheKey] = entry;
    await this.saveIndex();

    return entry;
  }

  /**
   * Delete cached entry
   */
  async delete(cacheKey: string): Promise<boolean> {
    await this.initialize();

    const entry = this.index.entries[cacheKey];
    if (!entry) return false;

    try {
      await fs.unlink(entry.filePath);
    } catch {
      // File already gone
    }

    delete this.index.entries[cacheKey];
    await this.saveIndex();

    return true;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    await this.initialize();

    const entries = Object.values(this.index.entries);
    const totalHits = this.index.stats.hitCount;
    const totalMisses = this.index.stats.missCount;

    const entriesByType: Record<AssetType, number> = {
      character: 0,
      monster: 0,
      scene: 0
    };

    let totalSizeBytes = 0;

    for (const entry of entries) {
      entriesByType[entry.type]++;
      totalSizeBytes += entry.sizeBytes;
    }

    return {
      totalEntries: entries.length,
      totalSizeBytes,
      hitCount: totalHits,
      missCount: totalMisses,
      hitRate: totalHits + totalMisses > 0 
        ? totalHits / (totalHits + totalMisses) 
        : 0,
      entriesByType
    };
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    await this.initialize();

    const maxAge = this.ttlDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of Object.entries(this.index.entries)) {
      const age = now - new Date(entry.createdAt).getTime();
      if (age > maxAge) {
        await this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Search cache by description similarity
   */
  async search(
    query: string,
    type?: AssetType,
    limit: number = 10
  ): Promise<CacheEntry[]> {
    await this.initialize();

    const normalizedQuery = this.normalizeDescription(query);
    const queryWords = normalizedQuery.split(' ');

    const scored = Object.values(this.index.entries)
      .filter(entry => !type || entry.type === type)
      .map(entry => {
        // Simple word overlap scoring
        const entryWords = entry.normalizedDescription.split(' ');
        const overlap = queryWords.filter(w => entryWords.includes(w)).length;
        const score = overlap / Math.max(queryWords.length, entryWords.length);
        return { entry, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ entry }) => entry);
  }

  /**
   * Get all entries for a type
   */
  async listByType(type: AssetType): Promise<CacheEntry[]> {
    await this.initialize();
    
    return Object.values(this.index.entries)
      .filter(entry => entry.type === type)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(this.index, null, 2)
    );
  }
}
