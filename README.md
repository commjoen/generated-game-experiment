<!-- Build & Test Status -->

[![Test](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml)
[![Pre-commit](https://github.com/commjoen/generated-game-experiment/actions/workflows/pre-commit.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/pre-commit.yml)
[![Deploy to GitHub Pages](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml)
[![Docker Build and Release](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-release.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-release.yml)
[![Docker Hub Release](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-hub-release.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/docker-hub-release.yml)
[![Create Release](https://github.com/commjoen/generated-game-experiment/actions/workflows/release.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/release.yml)

<!-- Project Status -->

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF.svg)](https://vitejs.dev/)

<!-- Deployment & Infrastructure -->

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://commjoen.github.io/generated-game-experiment/)
[![PR Previews](https://img.shields.io/badge/PR%20Previews-Enabled-blue.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/pr-preview.yml)
[![Render Deployment](https://img.shields.io/badge/Render-Deployed-46E3B7.svg)](https://generated-game-experiment.onrender.com/)
[![Docker](https://img.shields.io/badge/Docker-Available-2496ED.svg)](https://github.com/commjoen/generated-game-experiment/pkgs/container/generated-game-experiment)

<!-- Quality & Security -->

[![Security: Trivy](https://img.shields.io/badge/Security-Trivy%20Scanned-green.svg)](https://github.com/commjoen/generated-game-experiment/actions)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-TypeScript-blue.svg)](tsconfig.json)
[![Multiplayer](https://img.shields.io/badge/Multiplayer-WebSocket-orange.svg)](server.js)

<!-- Social Media Sharing -->

[![Share on Twitter](https://img.shields.io/badge/Share%20on-Twitter-1DA1F2.svg?logo=twitter)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20browser-based%20platformer%20game!%20%F0%9F%8E%AE&url=https://commjoen.github.io/generated-game-experiment/&via=&hashtags=gamedev,typescript,opensource)
[![Share on Facebook](https://img.shields.io/badge/Share%20on-Facebook-1877F2.svg?logo=facebook)](https://www.facebook.com/sharer/sharer.php?u=https://commjoen.github.io/generated-game-experiment/)
[![Share on Mastodon](https://img.shields.io/badge/Share%20on-Mastodon-6364FF.svg?logo=mastodon)](https://mastodon.social/share?text=Check%20out%20this%20awesome%20browser-based%20platformer%20game!%20%F0%9F%8E%AE%20https://commjoen.github.io/generated-game-experiment/)
[![Share on Bluesky](https://img.shields.io/badge/Share%20on-Bluesky-00A8E8.svg)](https://bsky.app/intent/compose?text=Check%20out%20this%20awesome%20browser-based%20platformer%20game!%20%F0%9F%8E%AE%20https://commjoen.github.io/generated-game-experiment/)
[![Share on LinkedIn](https://img.shields.io/badge/Share%20on-LinkedIn-0077B5.svg?logo=linkedin)](https://www.linkedin.com/sharing/share-offsite/?url=https://commjoen.github.io/generated-game-experiment/)
[![Share on Reddit](https://img.shields.io/badge/Share%20on-Reddit-FF4500.svg?logo=reddit)](https://reddit.com/submit?url=https://commjoen.github.io/generated-game-experiment/&title=Check%20out%20this%20awesome%20browser-based%20platformer%20game!%20🎮)
[![Share on WhatsApp](https://img.shields.io/badge/Share%20on-WhatsApp-25D366.svg?logo=whatsapp)](https://wa.me/?text=Check%20out%20this%20awesome%20browser-based%20platformer%20game!%20🎮%20https://commjoen.github.io/generated-game-experiment/)
[![Share on Discord](https://img.shields.io/badge/Share%20on-Discord-5865F2.svg?logo=discord)](https://discord.com/channels/@me)

# generated-game-experiment

<!-- Badges and status omitted for brevity, keep as in original -->

## Overview

A browser-based, side-scrolling platformer game built with TypeScript, Vite, and Docker. Features procedural levels, collectibles, power-ups, a settings modal, and robust multiplayer support. Containerized with nginx for easy deployment to Render and GitHub Pages.

## 🎮 Play the Game

[![Play Multiplayer on Render](https://img.shields.io/badge/🎮%20Play%20Multiplayer-on%20Render-46E3B7?style=for-the-badge&logo=render)](https://generated-game-experiment.onrender.com/)

[![Play Singleplayer on GitHub Pages](https://img.shields.io/badge/🎮%20Play%20Singleplayer-on%20GitHub%20Pages-238636?style=for-the-badge&logo=github)](https://commjoen.github.io/generated-game-experiment/)

## Features

- **Procedural Levels**: Each run generates a new level with platforms, spikes, moving platforms, and boxes.
- **Collectibles & Power-Ups**: Coins (score), hearts (lives), double jump (feather), and grow (mushroom, up to 3x size per life).
- **Responsive UI**: Onscreen controls for mobile/Tesla, Tesla Mode toggle, and a settings modal for backgrounds, speed, FPS, multiplayer, WebRTC transport preference, and player name.
- **Multiplayer**: Toggle on/off in Settings. Real-time sync of player state (position, name, score) via WebSocket with optional WebRTC data-channel acceleration for movement updates.
- **Leaderboard**: Real-time, deduplicated leaderboard (top 5) in multiplayer, with crown and gold color for the leader.
- **Robust Sync**: Player names and scores are always updated from the server. Collectibles are registered only once per level.
- **Testing & CI**: Unit and integration tests for singleplayer and multiplayer (Vitest, ws, node-fetch). CI/CD with GitHub Actions and Docker.
- **Deployment**: Dockerfile and nginx for production. Render.yaml for Render.com. CORS handled globally. Health checks and build filters included.
- **Documentation**: Up-to-date README, project spec, and conversation transcript.
- **GitHub MCP Server**: Integrated Model Context Protocol server providing Git repository management capabilities, AI assistant integration, and 30+ Git operations with CLI aliases for enhanced developer productivity.

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

### Pre-commit Validation

Before committing changes, always run the pre-commit validation to ensure code quality:

```sh
npm run precommit
```

This command will:

- Install pre-commit hooks if not already installed
- Ensure npm dependencies are up to date
- Run all pre-commit checks including:
  - Trim trailing whitespace
  - Fix end-of-file formatting
  - Validate YAML and JSON files
  - Check for merge conflicts
  - Lint GitHub Actions workflows
  - Format TypeScript/JavaScript files with Prettier
  - Run ESLint with auto-fix
  - Perform TypeScript type checking
  - Run related tests

The pre-commit hooks will also run automatically when you commit via `git commit`.

### GitHub MCP Server

The repository includes a GitHub MCP (Model Context Protocol) server that provides enhanced Git repository management capabilities:

```sh
# Access MCP server help
npm run mcp:help

# Quick Git operations using MCP aliases
npm run git:status         # Check repository status
npm run git:flow "message" # Complete workflow (add→commit→push)

# Or use the CLI aliases directly:
gstatus                    # Check status
gadd                       # Add all files
gcommit "message"         # Commit changes
gpush                     # Push to remote
gflow "message"           # Complete workflow (add→commit→push)
```

Available features:

- **30+ Git operations** with CLI aliases (gstatus, gadd, gcommit, etc.)
- **Advanced workflows** (gflow, gquick, gsync, gdev)
- **Model Context Protocol** integration for AI assistants
- **Developer productivity tools** (gbackup, gclean, grelease)

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
- **PR Previews**: Each pull request gets its own preview deployment at `https://commjoen.github.io/generated-game-experiment/pr-{number}/`
- Preview deployments are automatically cleaned up when PRs are closed or merged

### Multiplayer/WebRTC Controls on GitHub Pages

- Open the game, then click the gear icon (Settings) in the top-right corner.
- Use **Enable Multiplayer (optional)** to turn multiplayer mode on/off.
- Use **Prefer WebRTC data channel (experimental)** to control the WebRTC transport preference.
- GitHub Pages is static hosting, so this page surfaces the controls and settings, but live multiplayer sessions require the Render deployment: https://generated-game-experiment.onrender.com/

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

## CI/CD: Ensuring Version Injection Works

To ensure the version string is correctly injected in all environments (including Render and GitHub Pages), make sure your build pipeline fetches the full git history before building:

### Render.com

Add this to your build command or as a prebuild script:

```
git fetch --unshallow || true
```

### GitHub Actions

In your workflow, use the following for the checkout step:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

This ensures that `git describe` and other git commands in `scripts/inject-version.js` work as expected, so the version string is always up to date.

## Changelog

- Unique IDs for all collectibles (fixes multiplayer coin collection).
- Progress logging is now optional and disabled in Docker/Render.
- Leaderboard deduplicates entries for the leader.
- Multiplayer is robust, with real-time sync and fallback.
- Documentation and CI updated for all new features.

---

For more, see the full project spec and conversation transcript in `.cursor/rules/`.
