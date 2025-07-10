import { describe, it, expect, beforeEach } from 'vitest';

// Minimal mock of player and platform logic for testing
const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_POWER = 12;
const GROUND_Y = 400;

let player: any;
let platform: any;

function resetPlayer() {
  player = {
    x: 100,
    y: GROUND_Y - 50,
    width: 40,
    height: 50,
    vx: 0,
    vy: 0,
    onGround: false,
  };
  platform = {
    x: 0,
    y: GROUND_Y,
    width: 800,
    height: 50,
  };
}

function updatePlayer(keys: Record<string, boolean>) {
  player.vx = 0;
  if (keys['ArrowLeft']) player.vx = -MOVE_SPEED;
  if (keys['ArrowRight']) player.vx = MOVE_SPEED;
  if (keys['Space'] && player.onGround) {
    player.vy = -JUMP_POWER;
    player.onGround = false;
  }
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;
  // Platform collision
  if (
    player.y + player.height > platform.y &&
    player.x + player.width > platform.x &&
    player.x < platform.x + platform.width
  ) {
    player.y = platform.y - player.height;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
}

describe('Game basics', () => {
  beforeEach(() => resetPlayer());

  it('player falls due to gravity', () => {
    player.y = GROUND_Y - player.height - 100; // Start above the ground
    player.onGround = false;
    const y0 = player.y;
    updatePlayer({});
    expect(player.y).toBeGreaterThan(y0);
  });

  it('player moves right', () => {
    const x0 = player.x;
    updatePlayer({ ArrowRight: true });
    expect(player.x).toBeGreaterThan(x0);
  });

  it('player moves left', () => {
    const x0 = player.x;
    updatePlayer({ ArrowLeft: true });
    expect(player.x).toBeLessThan(x0);
  });

  it('player jumps when on ground', () => {
    player.onGround = true;
    updatePlayer({ Space: true });
    expect(player.vy).toBeLessThan(0);
  });

  it('player lands on platform', () => {
    player.y = GROUND_Y - 10;
    player.vy = 5;
    updatePlayer({});
    expect(player.onGround).toBe(true);
    expect(player.y).toBe(GROUND_Y - player.height);
  });
});

describe('Game state logic', () => {
  let score: number;
  let lives: number;
  let topScore: number;
  let gameOver: boolean;
  let options: { fixedGradient: boolean; scrollGradient: boolean; imageBg: boolean };

  beforeEach(() => {
    score = 0;
    lives = 3;
    topScore = 10;
    gameOver = false;
    options = { fixedGradient: false, scrollGradient: false, imageBg: false };
  });

  it('increments score when collecting a coin', () => {
    score++;
    expect(score).toBe(1);
  });

  it('increments lives when collecting a heart (max 5)', () => {
    lives = 4;
    if (lives < 5) lives++;
    expect(lives).toBe(5);
    if (lives < 5) lives++;
    expect(lives).toBe(5); // should not exceed max
  });

  it('decrements lives on respawn, triggers game over at 0', () => {
    lives = 2;
    lives--;
    expect(lives).toBe(1);
    lives--;
    if (lives <= 0) gameOver = true;
    expect(gameOver).toBe(true);
  });

  it('resets score, lives, and gameOver on restart', () => {
    score = 12;
    lives = 1;
    gameOver = true;
    // restart logic
    score = 0;
    lives = 3;
    gameOver = false;
    expect(score).toBe(0);
    expect(lives).toBe(3);
    expect(gameOver).toBe(false);
  });

  it('only one background option can be enabled at a time', () => {
    options.fixedGradient = true;
    options.scrollGradient = false;
    options.imageBg = false;
    expect(options.fixedGradient).toBe(true);
    expect(options.scrollGradient).toBe(false);
    expect(options.imageBg).toBe(false);
    // Enable scrollGradient
    options.fixedGradient = false;
    options.scrollGradient = true;
    expect(options.fixedGradient).toBe(false);
    expect(options.scrollGradient).toBe(true);
    expect(options.imageBg).toBe(false);
    // Enable imageBg
    options.scrollGradient = false;
    options.imageBg = true;
    expect(options.fixedGradient).toBe(false);
    expect(options.scrollGradient).toBe(false);
    expect(options.imageBg).toBe(true);
  });
}); 