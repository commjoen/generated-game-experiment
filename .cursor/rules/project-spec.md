# Project Specification: Browser-Based Side-Scrolling Platformer Game

## Overview
Create a game that runs in a web browser, featuring a side-scrolling platformer experience. The player controls a character that can move horizontally, jump, and interact with the environment. The game is visually engaging, responsive, and fun to play, with modern customization and deployment options.

## Core Features (Implemented)
- **Player Character**: A controllable character that can move left/right and jump, always spawning on a block.
- **Side-Scrolling World**: The camera follows the player as they move horizontally through a procedurally generated level.
- **Platforms**: Static and moving platforms for the player to jump on, with longer and varied platform lengths.
- **Obstacles & Hazards**: Spikes, pits, and moving platforms challenge the player.
- **Collectibles**: Items (e.g., coins) that the player can collect for points.
- **Finish Marker**: A visible, bold red flag on a white pole, always placed above the last block at the end of the level.
- **Level Progression**: Multiple levels with increasing difficulty and procedural generation.
- **Game Over & Restart**: The game ends when the player loses all lives or falls off screen, with a restart button that resets all state.
- **Score & Top Score**: Score and top score (stored in localStorage) are displayed in a UI overlay.
- **Lives**: Player has a limited number of lives, displayed in the UI.
- **Responsive Controls**: Keyboard controls for desktop, onscreen controls for mobile devices.
- **Responsive Canvas**: The canvas fills the viewport and prevents scrolling/overflow.
- **Session Storage**: Score is stored in session storage and resets on page close.
- **Settings/Options Menu**: Modal overlay with options for background customization:
  - Fixed background gradient (random pastel colors, covers the whole screen, does not scroll)
  - Scrolling background gradient (diagonal, moves with camera)
  - Random landscape background (scrolls with player, fetched from Pixabay)
  - Only one background option can be enabled at a time
- **Image Backgrounds**: Fetches random landscape images from Pixabay using a user-provided API key, and renders them as a parallax/scrolling background.
- **Mobile Support**: Touch controls for mobile devices.
- **Dockerized Deployment**: The application is shippable as a Docker container, with Nginx hosting the game content for easy deployment.
- **Automated Deployment**: GitHub Actions workflows for test and deploy, with deployment to GitHub Pages and correct base path/branch structure.
- **Security**: Nginx config with CORS and security headers, Subresource Integrity (SRI) for built assets.
- **Project Documentation**: Up-to-date README and changelog.

## Stretch Goals (Optional/Future)
- **Sound & Music**: Background music and sound effects.
- **Power-Ups**: Temporary abilities (e.g., double jump, speed boost).
- **Enemy AI**: Simple enemies with basic movement or attack patterns.
- **Leaderboard**: Track and display player scores globally.
- **Additional Levels**: More level types and increasing complexity.

## Art & Assets
- Uses open-source or custom-made assets for characters, backgrounds, and objects.
- All assets are properly credited if not original.

## Deliverables
- Source code in the repository.
- Instructions for running the game locally (in README.md).
- All assets and dependencies included or linked.

## Implementation Status (Current)

- Project is set up with TypeScript and Vite for development and build.
- Responsive HTML page with a canvas for rendering the game.
- Full game loop in TypeScript that updates and renders all game elements.
- Player can move left, right, and jump using keyboard or touch controls.
- Procedurally generated levels with platforms, obstacles, collectibles, and finish marker.
- Settings modal for background customization, including gradients and random landscape images.
- Dockerfile and Nginx config for production deployment.
- Automated deployment to GitHub Pages with SRI and security best practices.
- Up-to-date documentation and changelog. 