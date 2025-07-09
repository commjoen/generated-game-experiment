# Conversation Transcript

## Project Kickoff
- User requested a browser-based side-scrolling platformer game, with a project spec in `.cursor/rules`.
- Assistant created a detailed project specification.
- User requested Docker deployment to be included in the spec.

## First Iteration
- Assistant set up a TypeScript + Vite project, with a canvas-based game loop, player movement, and a static platform.
- User confirmed the dev server worked after moving `index.html` to the root.

## Level Generation & Features
- Assistant implemented procedural level generation with gaps and boxes.
- Added side-scrolling, collectibles, spikes, and moving platforms.
- Implemented score display and level progression (new level generated at end).

## Dockerization
- Assistant added a Dockerfile, .dockerignore, and updated README with Docker instructions.

## Status
- The game is now a replayable, containerized, browser-based platformer with dynamic levels, obstacles, collectibles, and scoring. 

## Mobile Controls & Testing
- Onscreen mobile controls (left, right, jump) were added, visible only on mobile devices.
- Basic tests for player movement, gravity, jump, and collision were added using Vitest.
- GitHub Actions workflow was set up to run tests on every push and pull request.
- Respawn logic improved: player respawns at the start after falling offscreen or hitting a spike, with a brief flashing effect.
- Test for gravity was fixed to ensure correct assertion when the player is above the ground. 