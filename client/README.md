# Dungeon.AI - Game Client

An AI-powered multiplayer D&D experience with real-time gameplay and AI Dungeon Master.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Game Engine:** Phaser.js 3
- **State Management:** Zustand
- **Real-time:** Socket.io Client
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── game/               # Phaser.js game components
│   │   └── PhaserGame.tsx  # Main Phaser canvas
│   ├── screens/            # Screen components
│   │   ├── LobbyScreen.tsx
│   │   ├── CharacterCreationScreen.tsx
│   │   └── GameScreen.tsx
│   └── ui/                 # UI components
│       ├── ActionInput.tsx
│       ├── CharacterPanel.tsx
│       ├── ChatPanel.tsx
│       └── CombatUI.tsx
├── hooks/
│   └── useSocket.ts        # Socket.io hook
├── lib/
│   ├── socket.ts           # Socket.io client
│   └── utils.ts            # Utility functions
├── stores/
│   └── gameStore.ts        # Zustand game state
└── types/
    └── game.ts             # TypeScript types
```

## Features

### Lobby
- Create new campaigns
- Join with campaign code
- Player name entry

### Character Creation
- Race selection (Human, Elf, Dwarf, Halfling, Dragonborn, Tiefling)
- Class selection (Warrior, Mage, Rogue, Cleric, Ranger, Paladin)
- Point-buy stat allocation
- Portrait selection

### Game View
- **Phaser Canvas:** Pixel-art game rendering with atmospheric effects
- **Character Panel:** Stats, HP/Mana bars, inventory preview
- **Chat Panel:** DM narration, player messages, system events
- **Combat UI:** Initiative order, health bars, combat log
- **Action Input:** Natural language action submission

### Combat System
- Turn-based initiative display
- Health bars for all participants
- Combat log with dice roll results
- Quick action buttons

## Design Guidelines

- **Palette:** Dark fantasy (purples, crimson, gold accents)
- **Rendering:** Pixel-perfect (no anti-aliasing)
- **Typography:** Cinzel (fantasy) + Crimson Text (body)
- **UX:** Immersive, responsive, atmospheric

## Socket.io Events

### Client → Server
- `campaign:create` - Create new campaign
- `campaign:join` - Join with code
- `campaign:leave` - Leave campaign
- `player:action` - Submit action
- `player:ready` - Ready signal
- `chat:message` - Send chat message

### Server → Client
- `campaign:state` - Full state sync
- `dm:narrate` - DM narration
- `combat:update` - Combat state
- `combat:result` - Action resolution
- `player:joined` - Player joined
- `player:left` - Player left
- `scene:change` - New scene

## Environment Variables

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

## License

MIT
