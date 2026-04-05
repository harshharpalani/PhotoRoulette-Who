# iOS Native Setup (Capacitor)

This project now supports a native iOS wrapper for full camera roll access.

## 1) Install dependencies

```bash
npx pnpm install
```

## 2) Build web assets

```bash
npx pnpm --filter @photoroulette/client run ios:build-web
```

## 3) Set backend URL for native app

Native builds cannot connect sockets to `capacitor://localhost`. Set a real backend URL:

```bash
export VITE_SERVER_URL="https://<your-server-domain>"
```

Use the same environment variable when building and syncing.

## 4) Sync native iOS project

```bash
cd client
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx pnpm run ios:sync
```

## 5) Open in Xcode

```bash
npx pnpm run ios:open
```

Then run on a physical iPhone and grant **full** Photos access.

## Notes

- If the user grants only limited photos access, media selection is blocked by design.
- The app requests photos permission at native app launch and re-checks permission on app resume.
- Safari/mobile web still cannot access the entire camera roll without explicit user file selection.
