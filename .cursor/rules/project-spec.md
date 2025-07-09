# Project Specification: Browser-Based Side-Scrolling Platformer Game

## Overview
Create a game that runs in a web browser, featuring a side-scrolling platformer experience. The player controls a character that can move horizontally, jump, and interact with the environment. The game should be visually engaging, responsive, and fun to play.

## Core Features
- **Player Character**: A controllable character that can move left/right and jump.
- **Side-Scrolling World**: The camera follows the player as they move horizontally through the level.
- **Platforms**: Static and/or moving platforms for the player to jump on.
- **Obstacles & Hazards**: Elements such as spikes, pits, or enemies that challenge the player.
- **Collectibles**: Items (e.g., coins, power-ups) that the player can collect for points or abilities.
- **Level Progression**: At least one complete level with a start and finish; optionally, multiple levels or increasing difficulty.
- **Game Over & Restart**: The game ends when the player fails (e.g., falls off screen or loses all lives) and can be restarted.

## Technical Requirements
- **Runs in Browser**: Built with web technologies (JavaScript/TypeScript, HTML5, CSS3, and optionally a framework like React or a game engine like Phaser.js).
- **Responsive Controls**: Keyboard controls for movement and jumping.
- **Smooth Animation**: Fluid character and environment animations.
- **Collision Detection**: Accurate collision handling between player, platforms, and obstacles.
- **Performance**: Runs smoothly on modern desktop browsers.
- **Dockerized Deployment**: The application should be shippable as a Docker container, with a webserver (such as Nginx or similar) hosting the game content for easy deployment.

## Stretch Goals (Optional)
- **Mobile Support**: Touch controls for mobile devices.
- **Sound & Music**: Background music and sound effects.
- **Power-Ups**: Temporary abilities (e.g., double jump, speed boost).
- **Enemy AI**: Simple enemies with basic movement or attack patterns.
- **Score & Leaderboard**: Track and display player scores.
- **Multiple Levels**: Additional levels with increasing complexity.

## Art & Assets
- Use open-source or custom-made assets for characters, backgrounds, and objects.
- Ensure all assets are properly credited if not original.

## Deliverables
- Source code in the repository.
- Instructions for running the game locally (in README.md).
- All assets and dependencies included or linked. 

## Implementation Status (First Iteration)

- Project is set up with TypeScript and Vite for development and build.
- Basic HTML page with a canvas for rendering the game.
- Simple game loop in TypeScript that updates and renders the player character.
- Player can move left, right, and jump using keyboard controls.
- Static platform for the player to stand and jump on.
- Instructions for running the game locally are included in the README. 

## Conversation

See `.cursor/rules/conversation.md` for a transcript of the assistant-user conversation and implementation steps. 