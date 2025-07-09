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

```sh
# Build the Docker image
docker build -t platformer-game .

# Run the container (serves on http://localhost:8080)
docker run -p 8080:80 platformer-game
```

## Project Documentation

- The full project specification is available in `.cursor/rules/project-spec.md`.
- A transcript of the assistant-user conversation and implementation steps is available in `.cursor/rules/conversation.md`.

These files document the requirements, design decisions, and development history of the project.
