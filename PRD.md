# Dungeon.AI - Product Requirements Document

## Overview
Dungeon.AI is an AI-powered multiplayer D&D game featuring:
- AI Dungeon Master that narrates and runs campaigns
- Real-time multiplayer sessions (2-6 players)
- Dynamic pixel art generation for characters, monsters, and scenes
- 16-bit/32-bit retro aesthetic throughout

## Core Architecture

### Frontend (React + Vite)
- Real-time game interface with WebSocket updates
- Pixel art rendering with consistent 16/32-bit aesthetic
- Character creation wizard
- Chat/command interface

### Backend (Node.js + Express)
- WebSocket server for real-time gameplay
- AI DM Service (Claude/GPT for narrative)
- Art Generation Pipeline (this phase)
- Session management

### Database
- Player/character data
- Campaign state
- Generated asset cache

---

## Phase 3: Pixel Art Generation Pipeline

### Goals
1. Generate consistent pixel art assets on-demand
2. Support character portraits, monsters, and scene backgrounds
3. Sub-10 second generation time
4. Aggressive caching to minimize costs
5. Async generation with placeholder support

### Asset Types

#### Character Portraits (64x64 or 128x128)
- Input: Natural language description
- Examples: "grizzled dwarf blacksmith with mechanical arm", "elven ranger with silver hair"
- Style: Consistent pixel art, portrait focus, transparent background

#### Monster Art (128x128 or 256x256)  
- Input: Monster name + DM description
- Examples: "shadow drake with void eyes", "corrupted forest elemental"
- Style: Full body, menacing, fits retro RPG aesthetic

#### Scene Backgrounds (512x288 or 1024x576)
- Input: Location description
- Examples: "dark dungeon corridor with torches", "mystical forest clearing at twilight"
- Style: Atmospheric, side-scroller perspective, moody lighting

### Technical Approach

#### Primary: Replicate API with Pixel Art Models
- Stable Diffusion + pixel art LoRAs
- Models: PublicPrompts/All-In-One-Pixel-Model, nerijs/pixel-art-xl
- Pros: Best pixel art quality, consistent style, cost-effective
- Cons: Requires API key, 3-8 second generation

#### Fallback: DALL-E 3
- Carefully crafted prompts for pixel art style
- Pros: High quality, no LoRA needed
- Cons: More expensive, less consistent pixel aesthetic

#### Hybrid Strategy
- Use Replicate for character/monster portraits
- Use DALL-E 3 for complex scene generation
- Cache everything aggressively

### Prompt Engineering

#### Base Style Prompts
```
CHARACTER: "16-bit pixel art portrait, retro RPG style, {description}, facing forward, clean pixel edges, limited color palette, black outline, transparent background"

MONSTER: "32-bit pixel art creature, retro RPG monster sprite, {description}, full body, menacing pose, game asset style, limited color palette"

SCENE: "16-bit pixel art background, retro RPG environment, {description}, side-scrolling perspective, atmospheric lighting, detailed but stylized"
```

### Caching System
- Hash-based cache keys from normalized descriptions
- Storage: /public/generated/{type}/{hash}.png
- Cache metadata in SQLite/JSON for quick lookup
- TTL: 30 days (configurable)

### Async Generation Flow
1. Request comes in for asset
2. Check cache → return if exists
3. Return placeholder image immediately
4. Queue generation job
5. Generate in background
6. Store result, emit WebSocket event
7. Client updates display

---

## File Structure

```
/server
  /services
    /art
      index.ts              # Main art service exports
      types.ts              # TypeScript interfaces
      ArtGenerationService.ts   # Main orchestrator
      ReplicateProvider.ts      # Replicate API integration
      DalleProvider.ts          # DALL-E integration
      PromptTemplates.ts        # Pixel art prompt engineering
      CacheManager.ts           # Caching logic
      AssetQueue.ts             # Async generation queue
    /dm
      (AI Dungeon Master - future)
  /routes
    art.ts                  # Art generation endpoints
/public
  /generated
    /characters
    /monsters
    /scenes
  /placeholders
    character.png
    monster.png
    scene.png
```

---

## API Endpoints

### POST /api/art/generate
```json
{
  "type": "character" | "monster" | "scene",
  "description": "grizzled dwarf blacksmith",
  "size": "64x64" | "128x128" | "256x256" | "512x288",
  "priority": "high" | "normal" | "low",
  "waitForResult": false
}
```

Response (async):
```json
{
  "jobId": "uuid",
  "status": "queued",
  "placeholder": "/placeholders/character.png",
  "estimatedTime": 5000
}
```

Response (cached):
```json
{
  "status": "ready",
  "url": "/generated/characters/abc123.png",
  "cached": true
}
```

### GET /api/art/status/:jobId
Check generation status

### WebSocket Events
- `art:generating` - Generation started
- `art:complete` - Asset ready
- `art:failed` - Generation failed

---

## Environment Variables

```env
# Art Generation
REPLICATE_API_TOKEN=your_token
OPENAI_API_KEY=your_key
ART_PROVIDER=replicate|dalle|hybrid
ART_CACHE_DIR=./public/generated
ART_CACHE_TTL_DAYS=30

# Generation Settings
MAX_CONCURRENT_GENERATIONS=3
GENERATION_TIMEOUT_MS=30000
```

---

## Success Metrics
- Generation time < 10 seconds (p95)
- Cache hit rate > 60% after initial ramp
- Style consistency score (manual review)
- Cost per 1000 assets < $5

---

## Dependencies
- replicate (Replicate API client)
- openai (DALL-E integration)  
- sharp (image processing)
- crypto (hash generation)
- p-queue (generation queue)
