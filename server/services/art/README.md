# Pixel Art Generation Service

> Dynamic pixel art generation for Dungeon.AI characters, monsters, and scenes

## Overview

This service generates consistent 16-bit/32-bit style pixel art for:
- **Character Portraits** (64x64, 128x128)
- **Monster Sprites** (128x128, 256x256) 
- **Scene Backgrounds** (512x288, 1024x576)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ArtGenerationService                      │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ CacheManager │  │ AssetQueue  │  │ Provider Selector │  │
│  └──────────────┘  └─────────────┘  └───────────────────┘  │
│           │               │                  │              │
│           ▼               ▼                  ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Generation Pipeline                      │  │
│  │  ┌─────────────────┐    ┌─────────────────┐         │  │
│  │  │ReplicateProvider│    │  DalleProvider  │         │  │
│  │  │ (SD + LoRAs)    │    │   (DALL-E 3)    │         │  │
│  │  └─────────────────┘    └─────────────────┘         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```typescript
import { getArtService } from './server/services/art';

const artService = getArtService();
await artService.initialize();

// Generate a character portrait
const result = await artService.generate({
  type: 'character',
  description: 'grizzled dwarf blacksmith with mechanical arm',
  waitForResult: true  // Sync mode
});

console.log(result.url);  // /generated/characters/abc123.png
```

## Provider Strategy

### Hybrid Mode (Recommended)
- **Characters/Monsters**: Replicate with pixel art LoRAs
- **Scenes**: Either provider based on availability

### Replicate
Best for sprites. Uses:
- `nerijs/pixel-art-xl` - Excellent for characters/monsters
- SDXL with style prompts - Good for complex scenes

### DALL-E 3
Good fallback. More expensive but no setup required.

## API

### Generate Asset

```http
POST /api/art/generate

{
  "type": "character",
  "description": "elven ranger with silver hair",
  "size": "128x128",
  "priority": "high",
  "waitForResult": false
}
```

### Async Response
```json
{
  "jobId": "uuid",
  "status": "queued",
  "placeholder": "/placeholders/character.png",
  "estimatedTimeMs": 5000
}
```

### Cached Response
```json
{
  "status": "ready",
  "url": "/generated/characters/abc123.png",
  "cached": true
}
```

## WebSocket Events

Connect to `ws://localhost:3000?sessionId=your-session` to receive:

- `art:generating` - Generation started
- `art:complete` - Asset ready (includes URL)
- `art:failed` - Generation failed

## Caching

Assets are cached by a hash of:
- Type + Description + Size

Cache features:
- 30-day TTL (configurable)
- LRU-style access tracking
- Search by description similarity
- Automatic cleanup

## Prompt Engineering

The service uses carefully crafted prompts for consistent pixel art:

### Character Prompt Example
```
masterpiece, best quality, highly detailed pixel art,
16-bit RPG character portrait, retro video game style,
[description], front-facing, shoulders up portrait,
clean pixel edges, limited color palette, black outline,
transparent background
```

### Negative Prompts
```
blurry, realistic, photographic, 3D render, 
smooth gradients, anti-aliased, watermark
```

## Configuration

```env
# Provider selection
ART_PROVIDER=hybrid  # replicate|dalle|hybrid

# API Keys
REPLICATE_API_TOKEN=r8_xxx
OPENAI_API_KEY=sk-xxx

# Cache
ART_CACHE_DIR=./public/generated
ART_CACHE_TTL_DAYS=30

# Queue
MAX_CONCURRENT_GENERATIONS=3
GENERATION_TIMEOUT_MS=30000
```

## Cost Estimates

| Provider | Character | Monster | Scene |
|----------|-----------|---------|-------|
| Replicate | ~$0.005 | ~$0.006 | ~$0.008 |
| DALL-E 3 | $0.04 | $0.04 | $0.08 |

With 60%+ cache hit rate, expect ~$2-5 per 1000 unique assets.

## Testing

```bash
npm run test:art
```

## Pre-generation

For the DM service to hint upcoming assets:

```typescript
await artService.pregenerate([
  { type: 'monster', description: 'goblin warrior' },
  { type: 'scene', description: 'dark cave entrance' }
]);
```
