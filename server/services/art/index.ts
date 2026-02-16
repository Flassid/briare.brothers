/**
 * Art Generation Service - Public API
 */

// Types
export type {
  AssetType,
  GenerationPriority,
  GenerationStatus,
  ArtProvider,
  AssetSize,
  GenerationRequest,
  GenerationJob,
  GenerationResult,
  QueuedResponse,
  CachedResponse,
  ArtResponse,
  CacheEntry,
  CacheStats,
  ArtServiceConfig,
  ArtServiceEvents
} from './types.js';

export { ASSET_SIZES } from './types.js';

// Prompt utilities
export {
  generatePrompt,
  generateDallePrompt,
  generateCacheKey,
  normalizeDescription,
  getReplicateModel,
  getReplicateParams,
  EXAMPLE_PROMPTS
} from './PromptTemplates.js';

// Services
export { CacheManager } from './CacheManager.js';
export { AssetQueue } from './AssetQueue.js';
export { ReplicateProvider, REPLICATE_MODELS } from './ReplicateProvider.js';
export { DalleProvider, DALLE_PROMPT_TIPS } from './DalleProvider.js';
export { GeminiImageProvider, enhancePromptWithGemini } from './GeminiImageProvider.js';
export { ArtGenerationService, getArtService } from './ArtGenerationService.js';
