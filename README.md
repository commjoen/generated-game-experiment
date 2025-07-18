<!-- Build & Test Status -->
[![Test](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml)
[![Deploy to GitHub Pages](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml)
[![Docker Build and Release](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-release.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-release.yml)

<!-- Project Status -->
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF.svg)](https://vitejs.dev/)

<!-- Deployment & Infrastructure -->
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://commjoen.github.io/generated-game-experiment/)
[![Render Deployment](https://img.shields.io/badge/Render-Deployed-46E3B7.svg)](https://generated-game-experiment.onrender.com/)
[![Docker](https://img.shields.io/badge/Docker-Available-2496ED.svg)](https://github.com/commjoen/generated-game-experiment/pkgs/container/generated-game-experiment)

<!-- Quality & Security -->
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy%20Scanned-green.svg)](https://github.com/commjoen/generated-game-experiment/actions)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-TypeScript-blue.svg)](tsconfig.json)
[![Multiplayer](https://img.shields.io/badge/Multiplayer-WebSocket-orange.svg)](server.js)

# generated-game-experiment

<!-- Badges and status omitted for brevity, keep as in original -->

## Overview
A browser-based, side-scrolling platformer game built with TypeScript, Vite, and Docker. Features procedural levels, collectibles, power-ups, a settings modal, and robust multiplayer support. Containerized with nginx for easy deployment to Render and GitHub Pages.

## Features
- **Procedural Levels**: Each run generates a new level with platforms, spikes, moving platforms, and boxes.
- **Collectibles & Power-Ups**: Coins (score), hearts (lives), double jump (feather), and grow (mushroom, up to 3x size per life).
- **Responsive UI**: Onscreen controls for mobile/Tesla, Tesla Mode toggle, and a settings modal for backgrounds, speed, FPS, multiplayer, and player name.
- **Multiplayer**: Toggle on/off in the UI. Real-time sync of player state (position, name, score) via WebSocket. Optional, with auto-fallback to singleplayer.
- **Leaderboard**: Real-time, deduplicated leaderboard (top 5) in multiplayer, with crown and gold color for the leader.
- **Robust Sync**: Player names and scores are always updated from the server. Collectibles are registered only once per level.
- **Testing & CI**: Unit and integration tests for singleplayer and multiplayer (Vitest, ws, node-fetch). CI/CD with GitHub Actions and Docker.
- **Deployment**: Dockerfile and nginx for production. Render.yaml for Render.com. CORS handled globally. Health checks and build filters included.
- **Documentation**: Up-to-date README, project spec, and conversation transcript.

## Development

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the dev server (singleplayer):
   ```sh
   npm run dev
   ```
3. For multiplayer in dev, run both:
   ```sh
   node server.js
   npm run dev:mp
   ```
   Open two browser windows at http://localhost:5173 to test multiplayer.

## Environment Variables
- `NODE_ENV`: Set to `production` in Docker/Render for optimized builds and to disable progress logging.
- `RENDER`, `DOCKER`: Set automatically in Render/Docker. Used to disable progress logging.
- `VITE_MULTIPLAYER`: Enables multiplayer in dev (`npm run dev:mp`).
- `VITE_BASE_PATH`: Set asset base path for Docker/nginx or GitHub Pages.

## Progress Logging
- **Enabled by default in local development.**
- **Disabled automatically in Docker/Render/production.**
- Logs player progress (position, score, collectibles) to the server console for debugging.

## Build for Production
1. Build:
   ```sh
   npm run build
   ```
2. Preview:
   ```sh
   npm run preview
   ```

## Docker Deployment
- Build and run locally:
  ```sh
  docker buildx build --platform linux/amd64,linux/arm64 -t your-image:local --load .
  docker run -p 8080:80 -p 3001:3001 your-image:local
  ```
- Multiplayer is auto-enabled. Singleplayer fallback is automatic if multiplayer is unavailable.

## Render.com Deployment
- Deploy with one click or manually (see Render docs).
- Multiplayer and health checks are supported out of the box.

## GitHub Pages
- Auto-deployed on every push to `main`.
- Live at: https://commjoen.github.io/generated-game-experiment/

## Testing
- Run all tests:
  ```sh
  npm test
  ```
- Tests cover health checks, multiplayer join, coin collection, score sync, and broadcast.

## Documentation
- **Project spec**: `.cursor/rules/project-spec.md`
- **Conversation transcript**: `.cursor/rules/conversation.md`
- **CI/CD, multiplayer, and deployment**: See `.cursor/fixesanddocs/` for detailed guides.

## Changelog
- Unique IDs for all collectibles (fixes multiplayer coin collection).
- Progress logging is now optional and disabled in Docker/Render.
- Leaderboard deduplicates entries for the leader.
- Multiplayer is robust, with real-time sync and fallback.
- Documentation and CI updated for all new features.

---

For more, see the full project spec and conversation transcript in `.cursor/rules/`.
