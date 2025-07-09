# generated-game-experiment
Private experiment to create a game with cursor

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
docker buildx build --platform linux/amd64,linux/arm64 -t jeroenwillemsen/platformer-game-1:0.1.0 --loadgi .
```

### Local run (after pulling or building for your platform)

```sh
# Run the container (serves on http://localhost:8080)
docker run -p 8080:80 jeroenwillemsen/platformer-game-1:0.1.0
```

## Project Documentation

- The full project specification is available in `.cursor/rules/project-spec.md`.
- A transcript of the assistant-user conversation and implementation steps is available in `.cursor/rules/conversation.md`.

These files document the requirements, design decisions, and development history of the project.

## GitHub Pages Deployment

This game is automatically deployed to GitHub Pages on every push to `main` using a GitHub Actions workflow.

- **Live URL:** https://jeroenwillemsen.github.io/platformer-game-1/
- The workflow builds the project and publishes the `dist` folder to the `gh-pages` branch.
- The Vite config uses `base: '/platformer-game-1/'` to ensure correct asset paths. If you rename the repository, update this value in `vite.config.ts`.

To manually trigger a deployment, push to the `main` branch.
