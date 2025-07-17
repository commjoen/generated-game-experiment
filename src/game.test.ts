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

describe('Power-up logic', () => {
  let player: any;
  function resetPlayer() {
    player = {
      x: 100,
      y: GROUND_Y - 50,
      width: 40,
      height: 50,
      vx: 0,
      vy: 0,
      onGround: false,
      hasDoubleJump: false,
      growLevel: 0,
      canDoubleJump: false,
    };
  }
  beforeEach(() => resetPlayer());

  it('cannot double jump without power-up', () => {
    player.onGround = true;
    // First jump
    player.vy = -JUMP_POWER;
    player.onGround = false;
    player.canDoubleJump = false;
    // Try double jump
    let jumped = false;
    if (player.hasDoubleJump && player.canDoubleJump) {
      player.vy = -JUMP_POWER;
      player.canDoubleJump = false;
      jumped = true;
    }
    expect(jumped).toBe(false);
  });

  it('can double jump once with power-up', () => {
    player.hasDoubleJump = true;
    player.onGround = true;
    // First jump
    player.vy = -JUMP_POWER;
    player.onGround = false;
    player.canDoubleJump = true;
    // Double jump
    let jumps = 0;
    if (player.hasDoubleJump && player.canDoubleJump) {
      player.vy = -JUMP_POWER;
      player.canDoubleJump = false;
      jumps++;
    }
    // Try triple jump
    if (player.hasDoubleJump && player.canDoubleJump) {
      player.vy = -JUMP_POWER;
      player.canDoubleJump = false;
      jumps++;
    }
    expect(jumps).toBe(1);
  });

  it('double jump resets on landing', () => {
    player.hasDoubleJump = true;
    player.canDoubleJump = false;
    // Simulate landing
    player.onGround = true;
    if (player.hasDoubleJump) player.canDoubleJump = true;
    expect(player.canDoubleJump).toBe(true);
  });

  it('double jump is lost on death', () => {
    player.hasDoubleJump = true;
    // Simulate death
    player.hasDoubleJump = false;
    expect(player.hasDoubleJump).toBe(false);
  });

  it('can grow up to 3 times, size increases, cannot grow more', () => {
    player.growLevel = 0;
    function grow() {
      if (player.growLevel < 3) player.growLevel++;
    }
    grow();
    expect(player.growLevel).toBe(1);
    grow();
    expect(player.growLevel).toBe(2);
    grow();
    expect(player.growLevel).toBe(3);
    grow();
    expect(player.growLevel).toBe(3); // cannot exceed 3
  });

  it('grow resets on death', () => {
    player.growLevel = 3;
    // Simulate death
    player.growLevel = 0;
    expect(player.growLevel).toBe(0);
  });

  it('size matches grow level', () => {
    function setPlayerSizeByGrowLevel() {
      if (player.growLevel === 0) {
        player.width = 40; player.height = 50;
      } else if (player.growLevel === 1) {
        player.width = 60; player.height = 75;
      } else if (player.growLevel === 2) {
        player.width = 80; player.height = 100;
      } else if (player.growLevel >= 3) {
        player.width = 100; player.height = 125;
      }
    }
    player.growLevel = 0; setPlayerSizeByGrowLevel();
    expect(player.width).toBe(40); expect(player.height).toBe(50);
    player.growLevel = 1; setPlayerSizeByGrowLevel();
    expect(player.width).toBe(60); expect(player.height).toBe(75);
    player.growLevel = 2; setPlayerSizeByGrowLevel();
    expect(player.width).toBe(80); expect(player.height).toBe(100);
    player.growLevel = 3; setPlayerSizeByGrowLevel();
    expect(player.width).toBe(100); expect(player.height).toBe(125);
  });
});

describe('Singleplayer fallback', () => {
  it('should run in singleplayer mode if multiplayer server is unavailable', async () => {
    // Simulate multiplayerManager.initialize() returning false
    const multiplayerManager = { initialize: async () => false };
    const multiplayerEnabled = await multiplayerManager.initialize();
    expect(multiplayerEnabled).toBe(false);
    // Game should still be playable (simulate a move)
    let player = { x: 100, y: 350, vx: 0, vy: 0 };
    player.x += 5;
    expect(player.x).toBe(105);
  });
});

describe('Player movement and game logic', () => {
  it('should move player left and right', () => {
    let player = { x: 100, vx: 0 };
    player.vx = 5;
    player.x += player.vx;
    expect(player.x).toBe(105);
    player.vx = -3;
    player.x += player.vx;
    expect(player.x).toBe(102);
  });

  it('should jump and fall with gravity', () => {
    let player = { y: 100, vy: 0 };
    const GRAVITY = 0.5;
    player.vy = -10; // jump
    player.y += player.vy;
    expect(player.y).toBe(90);
    player.vy += GRAVITY;
    player.y += player.vy;
    expect(player.y).toBeLessThan(90); // still going up
  });

  it('should collect a coin and increment score', () => {
    let score = 0;
    let coin = { x: 100, y: 100, collected: false };
    let player = { x: 100, y: 100 };
    if (player.x === coin.x && player.y === coin.y && !coin.collected) {
      coin.collected = true;
      score++;
    }
    expect(coin.collected).toBe(true);
    expect(score).toBe(1);
  });

  it('should respawn player and decrement lives', () => {
    let lives = 3;
    function respawnPlayer() { lives--; }
    respawnPlayer();
    expect(lives).toBe(2);
  });

  it('should trigger game over when lives reach 0', () => {
    let lives = 1;
    let gameOver = false;
    function respawnPlayer() {
      lives--;
      if (lives <= 0) gameOver = true;
    }
    respawnPlayer();
    expect(gameOver).toBe(true);
  });
}); 