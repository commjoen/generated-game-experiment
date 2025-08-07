# Generated Game Experiment - Copilot Instructions

Browser-based side-scrolling platformer game built with TypeScript, Vite, and WebSocket multiplayer. Features procedural levels, collectibles, power-ups, and robust multiplayer support. Deployed to GitHub Pages, Render.com, and Docker.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build

- Install dependencies: `npm install` -- takes ~17 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Build production assets: `npm run build` -- takes ~2 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Run all tests: `npm run test` -- takes ~6 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

### Development Servers

- **Singleplayer mode**: `npm run dev` -- starts Vite dev server on http://localhost:5173
- **Multiplayer mode**: Run both commands simultaneously:
  - Terminal 1: `node server.js` -- starts WebSocket server on port 3001
  - Terminal 2: `npm run dev:mp` -- starts dev server with multiplayer enabled
  - Open http://localhost:5173, click ⚙️ settings, enable "Enable Multiplayer (optional)" checkbox

### Production Preview

- Preview built assets: `npm run preview` -- starts preview server on http://localhost:4173
- Health check multiplayer server: `curl http://localhost:3001/health` -- should return JSON status

## Validation

### Manual Validation Requirements

- **CRITICAL**: Always run complete end-to-end validation after making changes.
- Test singleplayer: Open http://localhost:5173, verify game loads, player moves, UI displays correctly
- Test multiplayer: Enable multiplayer in settings (⚙️), verify "Connected to multiplayer server" in browser console
- Test server health: `curl http://localhost:3001/health` returns `{"status":"ok","timestamp":...}`
- **NEVER** rely only on build/test passing - always verify actual game functionality

### Validation Scenarios

1. **Basic Game Function**: Game loads, yellow player character visible, platforms and collectibles rendered
2. **Player Movement**: Arrow keys or WASD move player, space bar jumps
3. **Multiplayer Connection**: Settings modal opens, multiplayer checkbox enables WebSocket connection
4. **Server Connectivity**: Health endpoint responds, WebSocket server accepts connections

## Code Quality & Linting

- **Always run before committing**: `npx eslint .` -- takes ~4 seconds. Set timeout to 30+ seconds.
- **Format code**: `npx prettier --write .` -- takes ~1 second. Set timeout to 30+ seconds.
- **Current status**: ESLint shows 24 warnings (TypeScript `any` types), no errors. This is acceptable.

## Docker & Deployment

### Docker Build

- **Local testing only**: `docker build -t test-game .` -- takes 30+ minutes. NEVER CANCEL. Set timeout to 60+ minutes.
- **Known issue**: Docker build may fail with certificate errors in restricted environments - this is environment-specific, not code-related.
- **Production**: Docker builds work correctly in CI/CD environments (GitHub Actions, Render.com).

### Deployment Targets

- **GitHub Pages**: Automatic deployment on push to main branch (singleplayer only)
- **Render.com**: Automatic Docker deployment with multiplayer support
- **Docker**: Multi-stage build with nginx + Node.js server

## Repository Structure

### Key Files

- `src/main.ts` -- Main game logic and rendering engine
- `src/multiplayer.ts` -- WebSocket client for multiplayer functionality
- `server.js` -- Express + WebSocket server for multiplayer backend
- `vite.config.ts` -- Vite build configuration with version injection
- `package.json` -- Dependencies and npm scripts
- `Dockerfile` -- Multi-stage build for production deployment
- `start.sh` -- Container startup script for nginx + multiplayer server

### Common Commands Output

```bash
# Repository root files
README.md package.json src/ server.js Dockerfile vite.config.ts

# NPM scripts available
npm run dev          # Singleplayer development
npm run dev:mp       # Multiplayer development
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run test suite
```

## Environment Requirements

- **Node.js**: Requires Node 24+, works on Node 20+ with warnings
- **Ports**:
  - 5173 - Vite dev server
  - 4173 - Vite preview server
  - 3001 - Multiplayer WebSocket server
- **Environment Variables**:
  - `VITE_MULTIPLAYER=1` - Enables multiplayer mode in development
  - `NODE_ENV=production` - Production mode (disables debug logging)

## Common Issues & Solutions

### Build Warnings

- Git version warnings (`git describe --tags`) are expected in fresh clones - not errors
- Node version warnings for Node < 24 are acceptable - game still functions correctly

### Docker Issues

- Certificate chain errors during Docker build indicate environment restrictions, not code problems
- Docker builds succeed in proper CI/CD environments (GitHub Actions, Render)

### Multiplayer Debugging

- Check browser console for "Connected to multiplayer server" message
- Verify WebSocket server running: `curl http://localhost:3001/health`
- Enable multiplayer via settings UI (⚙️ button) if not auto-enabled

## Testing Strategy

### Test Suite Coverage

- **84 tests total** covering game mechanics, multiplayer functionality, and server integration
- Enemy placement algorithms, upgrade systems, game state management
- Multiplayer server: player join/leave, score synchronization, collectible handling
- Integration tests require multiplayer server running during test execution

### Critical Test Scenarios

- Game initialization and level generation
- Player movement and collision detection
- Multiplayer WebSocket communication
- Score tracking and leaderboard functionality
- Server health checks and error handling

## Performance & Timing Expectations

### Build Times (with 50% safety buffer)

- `npm install`: ~17s → Use 60s timeout
- `npm run build`: ~2s → Use 60s timeout
- `npm run test`: ~6s → Use 30s timeout
- `npx eslint .`: ~4s → Use 30s timeout
- Docker build: ~30+ minutes → Use 60+ minute timeout

### **CRITICAL REMINDER**: NEVER CANCEL long-running operations. Builds and tests may take longer than expected but will complete successfully.
