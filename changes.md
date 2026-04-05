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

---

## 2026-04-05 — Documentation & Change Log Automation

Added project documentation and automated change tracking.

- **README.md**: Project overview, features, tech stack, setup instructions, architecture summary, and link to change log
- **CLAUDE.md**: Developer context for Claude Code sessions — key commands, architecture details, timing system explanation, and change log policy
- **changes.md**: Change log file tracking all pushes to main with dated entries
- **.claude/settings.json**: PostToolUse hook on `Bash` that detects `git push` to `main` and injects a reminder to update changes.md before proceeding

**Key files**: `README.md`, `CLAUDE.md`, `changes.md`, `.claude/settings.json`

---

## 2026-04-05 — iOS Native Camera Roll Migration

### iOS Native Camera Roll Integration
- Added Capacitor iOS integration under `client/ios` with Capacitor config and iOS scripts.
- Added Photos usage permissions to iOS `Info.plist`.
- Added `IOS_SETUP.md` runbook for native iOS build/sync/open workflow.

### Camera Roll Media Selection Flow
- Replaced the old upload/approve flow with a platform-aware media service:
  - iOS native path uses full Photos permission checks and camera roll loading.
  - Web path keeps file picker fallback.
- Selection now uses `MEDIA_SELECTION_COUNT = 16`.
- Implemented random media selection + reroll behavior through new media service abstractions.
- Added launch-time and foreground permission checks for native iOS.

### Game Config and Scope Controls
- Added `MediaScope` (`photos_only`, `photos_and_videos`) to shared game config types.
- Added host lobby control for media scope selection.
- Default media scope is now `photos_only`.

### Server/Socket Behavior
- Server now validates submitted manifests against room media scope.
- When host changes media scope in lobby:
  - all player media readiness is reset,
  - stored manifests are cleared,
  - `lobby:media-reset` is emitted.
- Room create/join payloads now include room config for client initialization.

### Client State and Reliability
- Added reducer action to reset all media-ready states.
- Added shared media upload getter store so media upload callbacks persist across lobby/game route transitions.
- Updated socket client handling for native builds to use `VITE_SERVER_URL`.

### Tooling and Dependencies
- Added Capacitor + media plugin dependencies and lockfile updates.
- Added `vite-env.d.ts` to support `import.meta.env` typing.
