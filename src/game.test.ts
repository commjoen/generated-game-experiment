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