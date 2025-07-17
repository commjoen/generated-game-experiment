[![Test](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/test.yml)
[![Deploy to GitHub Pages](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml/badge.svg)](https://github.com/commjoen/generated-game-experiment/actions/workflows/deploy.yml)

# generated-game-experiment
Private experiment to create a game with cursor. Play it for free at https://commjoen.github.io/generated-game-experiment/

# Running the Side-Scrolling Platformer Game

## Development

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open your browser and go to the URL shown in the terminal (usually http://localhost:5173).

## Build for Production

1. Build the project:
   ```sh
   npm run build
   ```
2. Preview the production build:
   ```sh
   npm run preview
   ```

## Docker Deployment

The game includes **optional multiplayer functionality** in a single container:

### Single Container with Optional Multiplayer

```sh
# Build the container
docker build -t platformer-game .

# Run with both game and multiplayer server
docker run -p 8080:80 -p 3001:3001 platformer-game
```

- **Game client**: http://localhost:8080
- **Multiplayer**: Automatically detected and enabled
- **Single-player fallback**: Works even if multiplayer fails

### Cross-platform build and push (amd64 & arm64)

```sh
# Build and push for multiple platforms (replace with your Docker Hub username/image)
docker buildx build --platform linux/amd64,linux/arm64 -t jeroenwillemsen/platformer-game-1:local --load .
```

### Legacy: Game-only mode

```sh
# Run only the game client (no multiplayer)
docker run -p 8080:80 jeroenwillemsen/platformer-game-1:local
# Run the container from latest:
docker run -p 8080:80 jeroenwillemsen/platformer-game-1:latest
```

For detailed multiplayer setup instructions, see [MULTIPLAYER_SETUP.md](./MULTIPLAYER_SETUP.md).

## ☁️ Cloud Deployment

### Render.com (Recommended)

Deploy to Render.com with one click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Or manually:
1. Fork this repository
2. Connect to [Render.com](https://render.com)
3. Create new "Blueprint" service
4. Select your repository (render.yaml will be auto-detected)
5. Deploy!

**Features:**
- ✅ **Free tier available** (750 hours/month)
- ✅ **Automatic HTTPS** and WebSocket support  
- ✅ **Auto-deploy** on git push
- ✅ **Built-in monitoring** and health checks
- ✅ **Graceful sleep handling** (falls back to single-player)

Your game will be available at: `https://your-app-name.onrender.com`

For detailed instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

## 🐳 Docker Images & CI/CD

### Automated Container Builds

Every PR and release automatically builds Docker containers:

- **📦 GitHub Container Registry**: `ghcr.io/commjoen/generated-game-experiment`
- **🌐 Docker Hub**: `username/platformer-game` (optional)
- **🔒 Security Scanning**: Trivy vulnerability scanner
- **🧪 Automatic Testing**: Container functionality tests

### Available Images

```bash
# Latest from main branch
docker pull ghcr.io/commjoen/generated-game-experiment:latest

# Specific PR (for testing)
docker pull ghcr.io/commjoen/generated-game-experiment:pr-123

# Specific release
docker pull ghcr.io/commjoen/generated-game-experiment:v1.0.0
```

### PR Workflow

When you create a PR:
1. 🔨 **Automatic build** triggers
2. 🧪 **Container testing** runs  
3. 💬 **PR comment** with image details
4. 🌐 **Deploy PR image** to test changes

For detailed CI/CD information, see [DOCKER_CI_CD.md](./DOCKER_CI_CD.md).

## Project Documentation

- The full project specification is available in `.cursor/rules/project-spec.md`.
- A transcript of the assistant-user conversation and implementation steps is available in `.cursor/rules/conversation.md`.

These files document the requirements, design decisions, and development history of the project.

## GitHub Pages Deployment

This game is automatically deployed to GitHub Pages on every push to `main` using a GitHub Actions workflow.

- **Live URL:** https://commjoen.github.io/generated-game-experiment/
- The workflow builds the project and publishes the `dist` folder to the `gh-pages` branch.
- The Vite config uses `base: process.env.VITE_BASE_PATH || '/'` to ensure correct asset paths. If you rename the repository, update this value in `vite.config.ts` and the workflow.

To manually trigger a deployment, push to the `main` branch.

## Building for Different Environments

This project uses the `VITE_BASE_PATH` environment variable to set the base path for assets at build time.

- For Docker/nginx (root path):
  ```sh
  VITE_BASE_PATH=/ npm run build
  ```
- For GitHub Pages (repo subpath):
  ```sh
  VITE_BASE_PATH=/generated-game-experiment/ npm run build
  ```

If you change your repository name or deploy to a different subpath, update the value accordingly.
