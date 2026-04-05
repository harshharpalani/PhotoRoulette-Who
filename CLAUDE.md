# CLAUDE.md

## Project Overview

Photo Roulette - "Who?" is a web-based multiplayer party game. Players join rooms, approve random photo/video selections from their devices, then race to guess whose media is being revealed.

## Tech Stack

- **Monorepo**: pnpm workspaces with `shared/`, `server/`, `client/`
- **Frontend**: React 18 + Vite + TypeScript + React Router + socket.io-client
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **No database**: All game state is in-memory

## Key Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run server + client in dev mode
pnpm build            # Production build (shared -> client -> server)
pnpm start            # Start production server
pnpm --filter shared build       # Build shared types
pnpm --filter server typecheck   # Typecheck server
pnpm --filter client typecheck   # Typecheck client
```

## Architecture

### Shared Package (`shared/src/`)
- `types.ts` - Game enums and interfaces (Player, GameConfig, RevealStyle, GameState, etc.)
- `events.ts` - Socket.IO event type contracts (ClientToServerEvents, ServerToClientEvents)
- `constants.ts` - Game constants (timing thresholds, player limits, durations)

### Server (`server/src/`)
- `game/TimingService.ts` - **Critical**: RTT-based clock offset estimation for fair guess ordering
- `game/RoomManager.ts` - Room lifecycle, player management, game orchestration
- `game/RoundEngine.ts` - Round lifecycle, media relay, guess collection
- `game/ScoreEngine.ts` - Speed-ranked scoring with tie threshold
- `game/GameStateMachine.ts` - State transitions with guards
- `socket/handlers/` - Socket.IO event handlers split by domain

### Client (`client/src/`)
- `reveal/` - Four reveal animation strategies (unblur, slide, pixelate, immediate)
- `state/` - React context + reducer for game state management
- `hooks/` - Socket event subscription, timing sync, media file handling
- `pages/` - Route-level components (Home, Join, Lobby, Game, Results)
- `components/` - Reusable UI components

## Timing System (Most Important Subsystem)

The timing system ensures fair guess ordering regardless of network latency:
1. Server pings each client every 2s, client responds with high-res timestamp
2. Server computes RTT and clock offset per client (rolling window of 10, outlier rejection at 2 sigma)
3. On guess: `reconciledTimestamp = clientTimestamp + avgOffset`
4. Guesses within 5ms are ties (same rank/score)

## Change Log Policy

**changes.md** tracks all changes pushed to main. When pushing to main, always append a new entry to `changes.md` with:
- Date
- Brief high-level description of what changed and why
- List of key files/areas affected

This is enforced by a PostToolUse hook that reminds you after any `git push` to main.
