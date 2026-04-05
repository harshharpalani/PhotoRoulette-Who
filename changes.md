# Changes

All notable changes pushed to `main` are documented here. This file is automatically maintained — see [CLAUDE.md](./CLAUDE.md) for the policy.

---

## 2026-04-05 — Initial Implementation

Full-stack Photo Roulette multiplayer game built from scratch.

- **Monorepo setup**: pnpm workspaces with `shared/`, `server/`, `client/` packages, TypeScript throughout
- **Room system**: Create/join via 5-char codes or shareable links, 2-10 players, anonymous display names
- **Media selection**: Browser file picker, random selection of N items, approve/re-roll flow, photos + videos
- **Timing system**: RTT-based clock offset estimation (ping/pong every 2s, rolling window of 10 samples, outlier rejection at 2 sigma, 5ms tie threshold) for fair guess ordering
- **Game engine**: State machine (6 states), round engine with media relay through server, speed-ranked scoring
- **Reveal animations**: Gradual unblur (CSS filter), sliding reveal (clip-path), pixelated-to-clear (canvas), immediate (fade-in), plus random mode
- **UI**: Dark theme, responsive layout, countdown, timer bar, guess buttons, leaderboard, vote-to-end, results page
- **Deployment**: Railway config (`railway.toml`), server serves built client in production

**Key files**: `server/src/game/TimingService.ts`, `server/src/game/RoomManager.ts`, `client/src/reveal/`, `shared/src/events.ts`
