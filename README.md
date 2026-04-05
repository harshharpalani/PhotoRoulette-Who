# Photo Roulette - "Who?"

A web-based multiplayer Photo Roulette party game. Players join a room, approve a random selection of photos/videos from their device, then race to guess whose media is being revealed each round.

## Features

- **Room System**: Create/join via 5-character codes or shareable links (2-10 players)
- **Media Selection**: Game randomly picks photos/videos from your device; approve or re-roll until satisfied
- **4 Reveal Animations**: Gradual unblur, sliding reveal, pixelated-to-clear, immediate (+ random mode)
- **Precise Timing**: RTT-based clock offset estimation with outlier rejection and 5ms tie threshold for fair guess ordering
- **Speed-Ranked Scoring**: 1st correct guesser gets the most points, ties share the higher score
- **Vote to End Early**: Majority vote ends the game before all rounds are played
- **Host Controls**: Reveal style, duration (5-10s), number of rounds

## Tech Stack

- **Monorepo**: pnpm workspaces (`shared/`, `server/`, `client/`)
- **Frontend**: React 18 + Vite + React Router + socket.io-client
- **Backend**: Node.js + Express + Socket.IO
- **Language**: TypeScript throughout
- **State**: In-memory (no database)
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Install & Run

```bash
pnpm install
pnpm dev
```

This starts the server on `:3001` and the client on `:5173` (with proxy to server).

### Production Build

```bash
pnpm build
pnpm start
```

The server serves the built React client as static files.

### Deploy to Railway

Connect the repo to Railway. The `railway.toml` handles build and start commands automatically.

## Project Structure

```
PhotoRoulette-Who/
├── shared/           # Shared types, events, constants
├── server/           # Express + Socket.IO backend
│   └── src/
│       ├── game/     # RoomManager, TimingService, RoundEngine, ScoreEngine, StateMachine
│       ├── socket/   # Socket.IO handlers (room, lobby, game, timing)
│       └── utils/    # Room code generation, logger
├── client/           # React + Vite frontend
│   └── src/
│       ├── pages/    # Home, Join, Lobby, Game, Results
│       ├── components/  # MediaPicker, RevealCanvas, PlayerGuessBar, ScoreBoard, etc.
│       ├── reveal/   # Animation strategies (unblur, slide, pixelate, immediate)
│       ├── hooks/    # useSocket, useTimingSync, useMediaFiles, useGameState
│       └── state/    # React context + reducer for game state
├── railway.toml      # Railway deployment config
└── changes.md        # Change log (auto-updated on pushes to main)
```

## How It Works

1. Host creates a room and shares the code/link
2. Players join and select photos/videos from their device
3. Game randomly picks media, player approves or re-rolls
4. Host configures reveal style, duration, and round count
5. Each round: one player's media is revealed gradually
6. Players race to guess whose media it is
7. Server reconciles guess timestamps using clock offset estimation to ensure fairness
8. Speed-ranked points awarded; leaderboard shown between rounds

## Changelog

See [changes.md](./changes.md) for a log of all changes pushed to main. This file is automatically maintained.
