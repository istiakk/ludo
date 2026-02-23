---
description: Start the entire Ludo Legends project (client + server) with one command
---

# Start Ludo: Legends

This workflow starts both the Expo client and the multiplayer server with a single instruction.

## Prerequisites
- Node.js 18+ installed
- Expo CLI available (`npx expo`)

## Steps

// turbo-all

1. Install client dependencies
```bash
cd /Users/istiakmahmood/Documents/antigravity/ludo && npm install --legacy-peer-deps
```

2. Install server dependencies
```bash
cd /Users/istiakmahmood/Documents/antigravity/ludo/server && npm install
```

3. Start the multiplayer server (background)
```bash
cd /Users/istiakmahmood/Documents/antigravity/ludo/server && npm run dev &
```

4. Start the Expo client
```bash
cd /Users/istiakmahmood/Documents/antigravity/ludo && npx expo start
```

## Running on Device
- **iOS Simulator**: Press `i` in the Expo terminal
- **Android Emulator**: Press `a` in the Expo terminal  
- **Physical Device**: Scan the QR code with Expo Go app

## Verification
- Client runs on `http://localhost:8081`
- Server runs on `http://localhost:3001`
- Health check: `curl http://localhost:3001/health`
