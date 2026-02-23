# 🎲 Ludo: Legends

**Classic game. Legendary moves.** A premium, real-time multiplayer Ludo game built with React Native, Expo, Skia rendering, and a Socket.io multiplayer server.

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socketdotio)

---

## ✨ Features

### 🎮 Game Engine
- **4-player Ludo** with server-authoritative rules
- **4 game modes**: Classic, Speed (spawn with 1 or 6), Pro, Casual (no captures)
- **4-tier AI**: Easy, Intermediate, Hard, Expert with weighted move scoring
- **Cryptographic dice** — rejection sampling for zero bias
- **Triple-six penalty** — last-moved token returns home
- **Comeback detection** — tracks trailing-player victories

### 🌐 Multiplayer
- **Real-time Socket.io** server with room management
- **ELO matchmaking** with expanding search radius
- **30-second turn timer** with auto-move on timeout
- **Rematch system** and disconnection handling
- **Rate limiting** (5 events/sec) and auth middleware

### 🏆 Progression & Social
- **XP / Level system** with persistent progression
- **ELO rankings** with tier badges (Bronze → Diamond)
- **Friends, squads, and rivalries** social layer
- **Match history** (last 50 matches saved locally)
- **Daily login rewards** with streak bonuses

### 💰 Monetization
- **Rewarded ads** — 5 opt-in placements, 10/day cap
- **Dual currency** — Coins (free) + Gems (premium)
- **Season Pass** — 30-tier free/paid tracks with missions
- **IAP bundles** — $0.99–$49.99 gem packs
- **Creator codes** — 5-15% commission for content creators
- **Challenge cards** — shareable match results for social media

### 🎨 Premium UI/UX
- **GPU-accelerated Skia board** rendering
- **3D token sprites** with player-color gradients
- **Inter font family** (4 weights)
- **Dark mode** quiet-luxury aesthetic
- **Error boundaries** with recovery UI
- **4-step tutorial** for new players

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Expo Go** app on your device (or iOS Simulator / Android Emulator)

### One-Command Start

```bash
# Install everything and start both client + server:
cd server && npm install && npm run dev &
cd .. && npm install --legacy-peer-deps && npx expo start
```

Or use the `/start` workflow in your AI assistant.

### Manual Start

```bash
# 1. Install client dependencies
cd ~/Documents/antigravity/ludo
npm install --legacy-peer-deps

# 2. Install server dependencies
cd server
npm install

# 3. Start the multiplayer server
npm run dev
# → Server running on http://localhost:3001

# 4. In a new terminal, start the Expo client
cd ~/Documents/antigravity/ludo
npx expo start
# → Press 'i' for iOS, 'a' for Android, or scan QR
```

### Verify Server

```bash
curl http://localhost:3001/health
# → {"status":"ok","rooms":0,"queueSize":0,"uptime":...}
```

---

## 📁 Project Structure

```
ludo/
├── app/                    # Expo Router screens (11)
│   ├── _layout.tsx         # Root: fonts, splash, error boundary
│   ├── index.tsx           # Home screen (5-tab nav)
│   ├── game.tsx            # Active game board
│   ├── mode-select.tsx     # Browse all game modes
│   ├── profile.tsx         # Player stats & scorecard
│   ├── rankings.tsx        # ELO leaderboard
│   ├── shop.tsx            # Cosmetics store
│   ├── settings.tsx        # Game settings
│   ├── season-pass.tsx     # Season pass tiers & missions
│   ├── share.tsx           # Challenge cards & creator codes
│   └── tutorial.tsx        # 4-step onboarding
│
├── src/
│   ├── engine/             # Pure game logic (9 modules)
│   │   ├── types.ts        # All game types
│   │   ├── Board.ts        # 15×15 grid geometry
│   │   ├── Rules.ts        # Move validation + mode variants
│   │   ├── GameState.ts    # State transitions + match stats
│   │   ├── AI.ts           # 4-tier weighted move AI
│   │   ├── Dice.ts         # Fair dice with distribution tracking
│   │   ├── TeamEngine.ts   # 2v2 team mechanics
│   │   ├── ReplaySystem.ts # Match recording & playback
│   │   └── index.ts        # Barrel exports
│   │
│   ├── rendering/          # GPU Skia components (6)
│   │   ├── BoardCanvas.tsx # Full board render
│   │   ├── GameBoard.tsx   # Board + tokens composite
│   │   ├── TokenSprite.tsx # 3D animated tokens
│   │   ├── DiceRenderer.tsx# Animated dice with pips
│   │   ├── ThreatOverlay.tsx # Danger zone visualization
│   │   └── SignatureMoments.ts # Celebration animations
│   │
│   ├── services/           # Business logic (13)
│   │   ├── SocketService.ts      # Socket.io client
│   │   ├── StorageService.ts     # AsyncStorage persistence
│   │   ├── AuthService.ts        # Guest + social auth
│   │   ├── SocialService.ts      # Friends & squads
│   │   ├── ProgressionService.ts # XP, levels, cosmetics
│   │   ├── SoundManager.ts       # Audio engine
│   │   ├── AdService.ts          # Rewarded ads
│   │   ├── EconomyEngine.ts      # Dual currency wallet
│   │   ├── IAPService.ts         # In-app purchases
│   │   ├── SeasonPassService.ts  # Season pass + missions
│   │   ├── MonetizationAnalytics.ts # Revenue tracking
│   │   ├── ChallengeCardService.ts  # Social share cards
│   │   └── CreatorCodeService.ts    # Creator revenue sharing
│   │
│   ├── store/
│   │   └── gameStore.ts    # Zustand state management
│   │
│   ├── components/
│   │   ├── ErrorBoundary.tsx # Crash recovery UI
│   │   └── LoadingScreen.tsx # Loading + matchmaking
│   │
│   ├── theme/
│   │   └── design-system.ts # Colors, typography, spacing
│   │
│   └── utils/
│       └── PerformanceMonitor.ts # FPS + memory tracking
│
├── server/                 # Multiplayer server (4 modules)
│   └── src/
│       ├── index.ts        # Express + Socket.io entry
│       ├── game/
│       │   └── GameRoom.ts # Server-authoritative game room
│       └── matchmaking/
│           ├── Queue.ts    # ELO-based matchmaking
│           └── EloEngine.ts # Rating calculations
│
├── assets/                 # App icons & splash
├── app.json                # Expo config
├── package.json            # Client dependencies
├── tsconfig.json           # TypeScript config
└── .agents/workflows/
    └── start.md            # One-command startup workflow
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Rendering** | @shopify/react-native-skia |
| **Animation** | react-native-reanimated 4.1 |
| **Navigation** | expo-router 6 (file-based) |
| **State** | Zustand 5 |
| **Fonts** | Inter (Google Fonts via expo-font) |
| **Persistence** | @react-native-async-storage |
| **Networking** | socket.io-client 4.8 |
| **Server** | Node.js + Express + Socket.io 4.7 |
| **Crypto** | Node `crypto` (SHA-256 dice) |

---

## 🎮 Game Modes

| Mode | Rules |
|---|---|
| **Classic** | Standard Ludo rules. Roll 6 to spawn. Triple-six penalty. |
| **Speed** | Spawn with 1 OR 6. Rolling 1 gives extra turn. No triple-six penalty. |
| **Casual** | No captures — tokens pass through each other. |
| **Pro** | Classic + planned: pair blocking, tactical depth. |

---

## 💰 Monetization Overview

```
Free players   →  Coins from matches + daily login + ads  →  Common/Rare cosmetics
Light spenders →  Season Pass ($4.99/mo)                  →  Premium rewards by playing
Bigger spenders→  Gem bundles ($0.99–$49.99)              →  Epic/Legendary cosmetics
Creators       →  5-15% commission on fan purchases       →  Passive revenue from code
```

**Zero pay-to-win.** All purchasable items are cosmetic only.

---

## 📜 License

Private — All rights reserved.
