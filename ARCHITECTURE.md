# Architecture — Ludo: Legends

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     EXPO CLIENT                          │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────┐ │
│  │  Screens │   │  Store   │   │    Rendering        │ │
│  │ (11 tsx) │◄──│ (Zustand)│──►│ (Skia + Reanimated) │ │
│  └────┬─────┘   └────┬─────┘   └─────────────────────┘ │
│       │              │                                   │
│  ┌────▼─────┐   ┌────▼─────────────────────────────┐   │
│  │ Services │   │         Game Engine               │   │
│  │(13 files)│   │ Board │ Rules │ AI │ Dice │ State │   │
│  └────┬─────┘   │ Team  │ Replay                    │   │
│       │         └───────────────────────────────────┘   │
│  ┌────▼─────┐                                           │
│  │ Storage  │  AsyncStorage (profile, wallet, history)  │
│  └──────────┘                                           │
└─────────────┬───────────────────────────────────────────┘
              │ Socket.io
              ▼
┌─────────────────────────────────────────────────────────┐
│                   NODE.JS SERVER                         │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐    │
│  │ Express  │   │ GameRoom │   │  Matchmaking     │    │
│  │ (health) │   │ (auth,   │   │  Queue + ELO     │    │
│  │          │   │  moves,  │   │  (expanding      │    │
│  │          │   │  timer)  │   │   search radius)  │    │
│  └──────────┘   └──────────┘   └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Local Game (vs AI)
```
User taps dice → gameStore.rollDice()
  → processDiceRoll() (engine)
  → set validMoves in state
  → React re-renders board with move highlights

User selects move → gameStore.selectMove()
  → executeMove() (engine)
  → check for capture/finish/win
  → if AI turn: setTimeout → processAITurn()
  → on match end: endMatch() saves to AsyncStorage
```

### Online Game
```
User taps dice → socketService.rollDice()
  → server GameRoom.rollDice() validates
  → server broadcasts 'dice_rolled' to room
  → client receives → updates gameStore

User selects move → socketService.selectMove()
  → server GameRoom.executeMove() validates
  → server broadcasts 'move_executed' to room
  → client receives → updates gameStore
```

## Security Model

| Layer | Protection |
|---|---|
| **Dice** | Server-side `crypto.randomBytes` + SHA-256 + rejection sampling |
| **Moves** | Server validates captures, safe zones, blocking, home column |
| **Auth** | Socket middleware with optional JWT token |
| **Rate limit** | 5 events/second per socket, `guardedOn` wrapper |
| **CORS** | Restricted to app origins (not wildcard) |
| **Rooms** | Stale room GC every 5 minutes, 1-hour max lifetime |
| **State** | `getState()` returns deep copy, preventing client mutation |

## Key Design Decisions

### Pure Engine
The game engine (`src/engine/`) is pure TypeScript with zero React/RN dependencies. This means:
- Engine logic is testable without a device
- Server can reuse the same rules (planned)
- State transitions are immutable (spread operators)

### Store as Bridge
Zustand store bridges the pure engine with React rendering:
- Engine returns new state → store `set()` → React re-renders
- AI turns use a single timeout chain with cleanup on unmount
- `aiProcessing` flag prevents double-execution

### Persistence Strategy
All user data persists locally via AsyncStorage:
- **Immediate**: Settings, wallet, equipped cosmetics
- **On match end**: Match history, progression XP, coin rewards
- **Background**: Daily login streak, ad watch state

No server database yet — ELO and accounts are ephemeral until a backend DB is added.

## File Counts

| Category | Count |
|---|---|
| Screens | 11 |
| Engine modules | 9 |
| Renderers | 6 |
| Services | 13 |
| Components | 2 |
| Store + Theme + Utils | 3 |
| Server files | 4 |
| **Total TypeScript** | **48** |
