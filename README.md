# 🎲 Dungeon.AI

**AI-Powered Multiplayer D&D with a Claude-Based Dungeon Master**

An immersive tabletop RPG experience where an AI Dungeon Master creates dynamic, personalized adventures. Players describe actions in natural language, and the AI interprets creativity, calculates outcomes, and narrates dramatic results.

---

## ✨ Features

### 🧙 Character Generation
Describe your character in plain English:
> "A grizzled dwarf blacksmith who lost his family to a dragon and now seeks vengeance"

The AI generates:
- Balanced stats (STR, DEX, CON, INT, WIS, CHA)
- Class recommendation with reasoning
- Expanded backstory with hooks
- Personality traits, bonds, and flaws
- Themed starting equipment

### ⚔️ Natural Language Combat
Type any action:
> "I swing from the chandelier and dropkick the orc in the face!"

The system:
1. **Parses** your intent, target, and method
2. **Assesses** creativity (bonus modifiers for clever actions!)
3. **Calculates** difficulty based on situation
4. **Rolls** with appropriate stats and modifiers
5. **Narrates** dramatic, visceral outcomes

**Creativity Bonus Scale:**
- +0: "I attack the goblin"
- +3: "I feint high and sweep his legs"
- +5: "I catch the chandelier chain, swing across, and dropkick all three goblins off the balcony"

### 📖 Narrative Engine
- Immersive scene descriptions with sensory details
- Branching choices that feel organic, not menu-like
- World state tracking (consequences persist)
- Time progression and dynamic events
- Quest generation and tracking

### 👥 NPC System
Every NPC has:
- Distinct personality and voice
- Goals and motivations
- Memory of player interactions
- Relationship tracking (friendship → alliance or rivalry → hostility)
- Consistent behavior across sessions

### 🗺️ Encounter Generation
Dynamic encounters including:
- Combat (scaled to party level)
- Social challenges
- Puzzles with multiple solutions
- Traps with detection and disarm mechanics
- Themed loot appropriate to difficulty

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key

### Installation

```bash
# Clone the repo
git clone https://github.com/your-repo/dungeon-ai.git
cd dungeon-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start development server
npm run dev
```

### Usage

```typescript
import { DungeonMaster } from './server/services/dm';

const dm = new DungeonMaster();

// Create a character
const character = await dm.createCharacter(
  'player1',
  'A mysterious elven ranger who speaks to shadows'
);

// Start a session
const session = await dm.startSession('my-campaign', ['player1']);

// Process player input
const response = await dm.processInput('player1', 'I examine the ancient door');
console.log(response.narration);
```

---

## 📁 Project Structure

```
DungeonAI/
├── server/
│   ├── index.ts              # Express + Socket.io server
│   └── services/
│       └── dm/
│           ├── DungeonMaster.ts      # Main orchestrator
│           ├── ClaudeClient.ts       # Anthropic API wrapper
│           ├── CharacterGenerator.ts # Natural language → character
│           ├── CombatResolver.ts     # Combat action resolution
│           ├── NarrativeEngine.ts    # Story & scene management
│           ├── EncounterGenerator.ts # Dynamic encounters
│           ├── NPCManager.ts         # NPC dialogue & memory
│           ├── types.ts              # TypeScript interfaces
│           └── prompts/              # AI system prompts
│               ├── narrative.ts
│               ├── combat.ts
│               ├── character.ts
│               ├── npc.ts
│               ├── encounter.ts
│               └── scene.ts
├── package.json
├── tsconfig.json
├── PRD.md                    # Product requirements
└── prd.json                  # Task tracking
```

---

## 🧠 AI Architecture

### Model Selection
- **Claude 3.5 Sonnet**: Fast responses for combat, dialogue, quick narration
- **Claude 3 Opus**: Complex character generation, major story beats

### Prompt Engineering
Each prompt is crafted for a specific role:
- **Narrative DM**: Atmospheric storytelling, sensory immersion
- **Combat Parser**: Action analysis, creativity assessment
- **Combat Narrator**: Visceral outcome descriptions
- **NPC Voice**: Personality consistency, relationship awareness
- **Character Creator**: Balanced stats, rich backstory

---

## 🎯 Roadmap

- [x] **Phase 1**: Foundation
- [x] **Phase 2**: AI Dungeon Master Core
- [ ] **Phase 3**: Multiplayer & Real-time
- [ ] **Phase 4**: Frontend UI & Polish

---

## 🤝 Contributing

This is an early-stage project. Issues and PRs welcome!

---

## 📄 License

MIT

---

*"Roll for initiative. The Dungeon Master awaits."* 🎲
