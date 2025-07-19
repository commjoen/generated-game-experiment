# Project Specification: Browser-Based Side-Scrolling Platformer Game

## Overview
Create a game that runs in a web browser, featuring a side-scrolling platformer experience. The player controls a character that can move horizontally, jump, and interact with the environment. The game is visually engaging, responsive, and fun to play, with modern customization and deployment options.

## Core Features (Implemented)
- **Player Character**: A controllable character that can move left/right and jump, always spawning on a block.
- **Side-Scrolling World**: The camera follows the player as they move horizontally through a procedurally generated level.
- **Platforms**: Static and moving platforms for the player to jump on, with longer and varied platform lengths.
- **Obstacles & Hazards**: Spikes, pits, and moving platforms challenge the player.
- **Collectibles & Power-Ups**: Items (e.g., coins) that the player can collect for points, and power-ups that grant new abilities:
  - **Double Jump Power-Up**: Grants the ability to double jump until the player dies. Only one can be active at a time; never allows triple jump. Shown as a feather icon in the UI. Persists across levels, resets on death.
  - **Grow Power-Up**: Player can collect up to 3 grow power-ups per life. Each increases player size (hitbox and drawing). Shown as up to 3 mushroom icons in the UI. Resets to normal size on death. Persists across levels, resets on death. No more than 3 can be collected per life.
  - Power-ups are visually distinct and spawn at most once per level (per type).
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
- **Multiplayer (Fully Implemented)**: Users can enable or disable multiplayer via a toggle in the settings menu. When enabled, the game connects to a multiplayer server (Docker/Render supported) and synchronizes player state in real time. If the server is unavailable, the game automatically falls back to singleplayer mode. Robust tests cover both singleplayer and multiplayer scenarios.
- **Unique Collectible IDs**: All collectibles have unique IDs, ensuring correct multiplayer coin collection and state sync.
- **Deduplicated Leaderboard**: The leaderboard in multiplayer mode shows each player only once, even if they are both 'self' and in otherPlayers.
- **Optional Progress Logging**: Player progress logging (position, score, collectibles) is enabled only in local development, and automatically disabled in Docker/Render/production environments.

## Stretch Goals (Optional/Future)
- **Other Power-Ups**: Additional abilities (e.g., speed boost).
- **Enemy AI**: Simple enemies with basic movement or attack patterns.
- **Leaderboard**: Track and display player scores globally.
- **Additional Levels**: More level types and increasing complexity.
- **Sound & Music**: Background music and sound effects.

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
- Power-up system (double jump, grow up to 3x) fully implemented, with UI, persistence across levels, and reset on death.
- Unit tests cover all major features, including power-up logic, edge cases, and reset behavior. 

## Platform Enhancements

- Add to Home Screen (A2HS) / Installable PWA
- App Shortcuts in web app manifest (e.g., New Game, Multiplayer)
- Offline-first enhancements (custom offline page, cache more assets)
- Push Notifications (for updates, invites, etc.)
- Background Sync (for high scores, achievements)
- Native-like UI features (fullscreen, hide browser UI, vibration)
- Gamepad and controller support
- Save state/progress locally (IndexedDB/localStorage)
- Accessibility improvements (ARIA, keyboard navigation, screen reader)
- Platform-specific integrations (iOS/Android icons, splash, theme)

## Level Type Enhancements

- Vertical Climb Levels (ascend/descend instead of side-scroll)
- Auto-Scrolling Levels (forced movement)
- Puzzle/Logic Levels (switches, keys, block pushing)
- Speedrun/Time Attack Levels (beat the clock)
- Boss Levels (unique boss fights)
- Stealth/Evasion Levels (avoid detection)
- Collectathon Levels (collect items to progress)
- Survival/Escape Levels (survive waves or escape threats)
- Gravity/Physics Levels (altered gravity, moving platforms)
- Darkness/Light Levels (limited visibility)
- Water/Underwater Levels (swimming mechanics)
- Reverse/Backwards Levels (return to start)
- Enemy Gauntlet Levels (combat focus)
- Mini-Game or Bonus Levels (short diversions)
- Platforming Precision Levels (require precise jumps/timing) 

## Tizen TV Support

- Detect Tizen/Smart TV user agents and enable TV remote navigation.
- Listen for ArrowLeft, ArrowUp, and ArrowRight key events to control the player (left, jump, right) using the TV remote.
- Integrate with on-screen controls for consistent behavior across devices. 