/**
 * Art Generation API Routes
 */

import { Router, Request, Response } from 'express';
import { getArtService, ASSET_SIZES } from '../services/art/index.js';
import type { AssetType, GenerationPriority, AssetSize } from '../services/art/index.js';

const router = Router();
const artService = getArtService();

// Initialize art service
artService.initialize().catch(err => {
  console.error('[ArtRoutes] Failed to initialize art service:', err);
});

/**
 * POST /api/art/generate
 * Generate pixel art asset
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      type,
      description,
      size,
      priority = 'normal',
      waitForResult = false,
      sessionId
    } = req.body;

    // Validation
    if (!type || !['character', 'monster', 'scene'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be one of: character, monster, scene'
      });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid description',
        message: 'Description is required and must be a string'
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        error: 'Description too long',
        message: 'Description must be 500 characters or less'
      });
    }

    // Parse size if provided
    let parsedSize: AssetSize | undefined;
    if (size) {
      if (typeof size === 'string') {
        const [width, height] = size.split('x').map(Number);
        parsedSize = { width, height };
      } else if (typeof size === 'object' && size.width && size.height) {
        parsedSize = { width: size.width, height: size.height };
      }
    }

    // Validate size against allowed sizes for type
    if (parsedSize) {
      const allowedSizes = ASSET_SIZES[type as AssetType];
      const isValid = allowedSizes.some(
        s => s.width === parsedSize!.width && s.height === parsedSize!.height
      );
      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid size',
          message: `Size must be one of: ${allowedSizes.map(s => `${s.width}x${s.height}`).join(', ')}`
        });
      }
    }

    // Generate
    const result = await artService.generate({
      type: type as AssetType,
      description,
      size: parsedSize,
      priority: priority as GenerationPriority,
      waitForResult,
      sessionId
    });

    return res.json(result);

  } catch (error) {
    console.error('[ArtRoutes] Generation error:', error);
    return res.status(500).json({
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/art/status/:jobId
 * Check generation job status
 */
router.get('/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  const job = artService.getJobStatus(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'No job with that ID exists'
    });
  }

  return res.json(job);
});

/**
 * GET /api/art/queue
 * Get queue statistics
 */
router.get('/queue', (_req: Request, res: Response) => {
  const stats = artService.getQueueStats();
  return res.json(stats);
});

/**
 * GET /api/art/cache
 * Get cache statistics
 */
router.get('/cache', async (_req: Request, res: Response) => {
  try {
    const stats = await artService.getCacheStats();
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/art/cache/search
 * Search cached assets
 */
router.get('/cache/search', async (req: Request, res: Response) => {
  try {
    const { q, type, limit = '10' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Missing query',
        message: 'Query parameter "q" is required'
      });
    }

    const results = await artService.searchCache(
      q,
      type as 'character' | 'monster' | 'scene' | undefined
    );

    return res.json({
      query: q,
      results: results.slice(0, parseInt(limit as string))
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/art/cache/cleanup
 * Clean up expired cache entries
 */
router.post('/cache/cleanup', async (_req: Request, res: Response) => {
  try {
    const cleaned = await artService.cleanupCache();
    return res.json({
      message: 'Cache cleanup complete',
      entriesRemoved: cleaned
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/art/pregenerate
 * Queue multiple assets for pre-generation
 */
router.post('/pregenerate', async (req: Request, res: Response) => {
  try {
    const { hints } = req.body;
    
    if (!Array.isArray(hints)) {
      return res.status(400).json({
        error: 'Invalid hints',
        message: 'Hints must be an array of generation requests'
      });
    }

    await artService.pregenerate(hints);

    return res.json({
      message: 'Pre-generation queued',
      count: hints.length
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Pre-generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/art/sizes
 * Get available sizes for each asset type
 */
router.get('/sizes', (_req: Request, res: Response) => {
  res.json(ASSET_SIZES);
});

export default router;
