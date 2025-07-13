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

To build and run the game in a Docker container:

### Cross-platform build and push (amd64 & arm64)

```sh
# Build and push for multiple platforms (replace with your Docker Hub username/image)
docker buildx build --platform linux/amd64,linux/arm64 -t jeroenwillemsen/platformer-game-1:local --load .
```

### Local run (after pulling or building for your platform)

```sh
# Run the container (serves on http://localhost:8080)
docker run -p 8080:80 jeroenwillemsen/platformer-game-1:local
# Run the container from latest:
docker run -p 8080:80 jeroenwillemsen/platformer-game-1:latest
```

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
