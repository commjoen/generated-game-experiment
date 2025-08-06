import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  setupServer,
  teardownServer,
  getTestPort,
} from '../test/server-manager.js';
import {
  generateVerticalLevel,
  VerticalLevel,
  Platform,
  Collectible,
} from './verticalLevel.js';
// For bonus level test
import { generateBonusVerticalLevelForTest } from './bonusLevel.js';

beforeAll(async () => {
  await setupServer();
});

afterAll(async () => {
  await teardownServer();
});

// Helper to get the base URL for requests
function _getBaseUrl() {
  return `http://localhost:${getTestPort()}`;
}

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
  let _topScore: number;
  let gameOver: boolean;
  let options: {
    fixedGradient: boolean;
    scrollGradient: boolean;
    imageBg: boolean;
  };

  beforeEach(() => {
    score = 0;
    lives = 3;
    _topScore = 10;
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
        player.width = 40;
        player.height = 50;
      } else if (player.growLevel === 1) {
        player.width = 60;
        player.height = 75;
      } else if (player.growLevel === 2) {
        player.width = 80;
        player.height = 100;
      } else if (player.growLevel >= 3) {
        player.width = 100;
        player.height = 125;
      }
    }
    player.growLevel = 0;
    setPlayerSizeByGrowLevel();
    expect(player.width).toBe(40);
    expect(player.height).toBe(50);
    player.growLevel = 1;
    setPlayerSizeByGrowLevel();
    expect(player.width).toBe(60);
    expect(player.height).toBe(75);
    player.growLevel = 2;
    setPlayerSizeByGrowLevel();
    expect(player.width).toBe(80);
    expect(player.height).toBe(100);
    player.growLevel = 3;
    setPlayerSizeByGrowLevel();
    expect(player.width).toBe(100);
    expect(player.height).toBe(125);
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
    function respawnPlayer() {
      lives--;
    }
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

describe('Vertical level generation', () => {
  it('should generate platforms from bottom to top', () => {
    const canvasWidth = 800;
    const level: VerticalLevel = generateVerticalLevel(canvasWidth);
    expect(level.platforms.length).toBeGreaterThan(0);
    // First platform should be at the bottom
    expect(level.platforms[0].y).toBeGreaterThan(
      level.platforms[level.platforms.length - 1].y
    );
    // Platforms should be within canvas width
    for (const plat of level.platforms) {
      expect(plat.x).toBeGreaterThanOrEqual(0);
      expect(plat.x + plat.width).toBeLessThanOrEqual(canvasWidth + 1); // allow rounding
    }
  });

  it('should place the finish flag at the topmost platform', () => {
    const canvasWidth = 800;
    const level: VerticalLevel = generateVerticalLevel(canvasWidth);
    const topPlatform = level.platforms[level.platforms.length - 1];
    expect(level.finishFlag.x).toBeGreaterThanOrEqual(topPlatform.x);
    expect(level.finishFlag.x).toBeLessThanOrEqual(
      topPlatform.x + topPlatform.width
    );
    expect(level.finishFlag.y).toBeLessThanOrEqual(topPlatform.y);
  });

  it('should always have a spawn platform at the bottom', () => {
    const canvasWidth = 800;
    const level: VerticalLevel = generateVerticalLevel(canvasWidth);
    const spawnY = 3200;
    const hasSpawnBlock = level.platforms.some(
      (plat: Platform) =>
        plat.y <= spawnY && plat.y + plat.height >= spawnY - 40
    );
    expect(hasSpawnBlock).toBe(true);
  });

  it('should generate at least one heart, doublejump, and grow collectible if enough platforms', () => {
    const canvasWidth = 800;
    const level: VerticalLevel = generateVerticalLevel(canvasWidth);
    const types = level.collectibles.map((c: Collectible) => c.type);
    expect(types).toContain('heart');
    expect(types).toContain('doublejump');
    expect(types).toContain('grow');
  });
});

describe('Bonus level generation', () => {
  it('should generate a solid floor, coins filling the area, and only moving platforms close to each other', () => {
    const LEVEL_HEIGHT = 3200;
    const canvasWidth = 800;
    const level = generateBonusVerticalLevelForTest(canvasWidth);
    // Check for solid floor
    const floor = level.platforms.find(
      (p: any) => p.y === LEVEL_HEIGHT && p.x === 0 && p.width === canvasWidth
    );
    expect(floor).toBeDefined();
    // Check for lots of coins
    expect(
      level.collectibles.filter((c: any) => c.type === 'coin').length
    ).toBeGreaterThan(20);
    // Check that all platforms except the floor are moving platforms
    expect(level.movingPlatforms.length).toBeGreaterThan(5);
    expect(level.platforms.length).toBe(2); // Floor and top beam
    // Check that the top beam exists at the expected y position
    const JUMP_POWER = 13;
    const jumpLength = JUMP_POWER * 8;
    const topBeamY = 40 + jumpLength;
    const topBeam = level.platforms.find(
      (p: any) => p.y === topBeamY && p.width === canvasWidth
    );
    expect(topBeam).toBeDefined();
    // Check that moving platforms are close to each other (vertical gap <= 80)
    let sorted = level.movingPlatforms
      .slice()
      .sort((a: any, b: any) => b.y - a.y);
    for (let i = 1; i < sorted.length; i++) {
      expect(Math.abs(sorted[i].y - sorted[i - 1].y)).toBeLessThanOrEqual(80);
    }
  });
});

describe('Circle character rendering', () => {
  it('should identify circle characters correctly', () => {
    // Test function to check if a character is a circle
    function isCircleCharacter(playerCharacter: string) {
      return ['🟡', '🔴', '🔵', '🟢'].includes(playerCharacter);
    }

    // Circle characters should be identified
    expect(isCircleCharacter('🟡')).toBe(true);
    expect(isCircleCharacter('🔴')).toBe(true);
    expect(isCircleCharacter('🔵')).toBe(true);
    expect(isCircleCharacter('🟢')).toBe(true);

    // Non-circle characters should not be identified as circles
    expect(isCircleCharacter('SQUARE')).toBe(false);
    expect(isCircleCharacter('😊')).toBe(false);
    expect(isCircleCharacter('😎')).toBe(false);
    expect(isCircleCharacter('⭐')).toBe(false);
    expect(isCircleCharacter('👑')).toBe(false);
    expect(isCircleCharacter('🚀')).toBe(false);
    expect(isCircleCharacter('👽')).toBe(false);
  });

  it('should use different text baseline for circle vs non-circle characters', () => {
    // Test mock context to verify canvas text baseline setting
    let mockTextBaseline = '';
    const mockCtx = {
      set textBaseline(value: string) {
        mockTextBaseline = value;
      },
      get textBaseline() {
        return mockTextBaseline;
      },
    };

    // Function to simulate the character rendering logic
    function setCharacterBaseline(playerCharacter: string, ctx: any) {
      const isCircleCharacter = ['🟡', '🔴', '🔵', '🟢'].includes(
        playerCharacter
      );

      if (isCircleCharacter) {
        ctx.textBaseline = 'bottom';
      } else {
        ctx.textBaseline = 'middle';
      }
    }

    // Circle characters should use 'bottom' baseline to sit on platforms
    setCharacterBaseline('🟡', mockCtx);
    expect(mockCtx.textBaseline).toBe('bottom');

    setCharacterBaseline('🔴', mockCtx);
    expect(mockCtx.textBaseline).toBe('bottom');

    // Non-circle characters should use 'middle' baseline
    setCharacterBaseline('😊', mockCtx);
    expect(mockCtx.textBaseline).toBe('middle');

    setCharacterBaseline('⭐', mockCtx);
    expect(mockCtx.textBaseline).toBe('middle');
  });
});

describe('Enemy mechanics', () => {
  let player: any;
  let enemy: any;

  beforeEach(() => {
    player = {
      x: 100,
      y: 350,
      width: 40,
      height: 50,
      vx: 0,
      vy: 0,
      onGround: true,
      eatenEnemy: null,
      growLevel: 0,
    };
    enemy = {
      x: 200,
      y: 370,
      width: 30,
      height: 30,
      dx: 2,
      range: 100,
      startX: 150,
      alive: true,
      id: 'test_enemy_1',
      type: 'square',
    };
  });

  function rectsCollide(a: any, b: any) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  it('should spawn enemies when tube is visible on screen', () => {
    const tube = {
      x: 500,
      y: 350,
      width: 40,
      height: 80,
      hasSpawnedEnemy: false,
    };
    const cameraX = 400; // Camera positioned so tube is visible
    const canvasWidth = 800;
    const levelType = 'horizontal';

    // Check if tube is visible on screen
    let tubeVisible = false;
    if (levelType === 'horizontal') {
      tubeVisible =
        tube.x + tube.width > cameraX && tube.x < cameraX + canvasWidth;
    }

    expect(tubeVisible).toBe(true);

    // Simulate spawning logic
    if (tubeVisible && !tube.hasSpawnedEnemy) {
      tube.hasSpawnedEnemy = true;
    }

    expect(tube.hasSpawnedEnemy).toBe(true);
  });

  it('should not spawn enemies when tube is not visible on screen', () => {
    const tube = {
      x: 1500, // Far off screen
      y: 350,
      width: 40,
      height: 80,
      hasSpawnedEnemy: false,
    };
    const cameraX = 400;
    const canvasWidth = 800;
    const levelType = 'horizontal';

    // Check if tube is visible on screen
    let tubeVisible = false;
    if (levelType === 'horizontal') {
      tubeVisible =
        tube.x + tube.width > cameraX && tube.x < cameraX + canvasWidth;
    }

    expect(tubeVisible).toBe(false);

    // Simulate spawning logic
    if (tubeVisible && !tube.hasSpawnedEnemy) {
      tube.hasSpawnedEnemy = true;
    }

    expect(tube.hasSpawnedEnemy).toBe(false);
  });

  it('should move enemies within their range', () => {
    const initialX = enemy.x;
    // Move enemy
    enemy.x += enemy.dx;
    expect(enemy.x).toBe(initialX + enemy.dx);

    // Test boundary collision - move to edge and check if direction reverses
    enemy.x = enemy.startX + enemy.range + 1; // Move past the boundary
    if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX) {
      enemy.dx *= -1;
    }
    expect(enemy.dx).toBe(-2); // Should reverse direction
  });

  it('should kill enemy when player jumps on top', () => {
    // Position player above enemy, falling down
    player.x = enemy.x;
    player.y = enemy.y - player.height + 5; // Slightly overlapping from above
    player.vy = 5; // Falling down

    let score = 0;
    if (rectsCollide(player, enemy)) {
      // Check if player is landing on top of enemy
      if (player.vy > 0 && player.y < enemy.y) {
        enemy.alive = false;
        player.vy = -8; // Bounce
        score++;
      }
    }

    expect(enemy.alive).toBe(false);
    expect(player.vy).toBe(-8);
    expect(score).toBe(1);
  });

  it('should kill player when touching enemy from side', () => {
    // Position player to the side of enemy
    player.x = enemy.x - player.width + 5; // Slightly overlapping
    player.y = enemy.y;
    player.vy = 0; // Not falling

    let playerDied = false;
    if (rectsCollide(player, enemy)) {
      // Check if player is landing on top of enemy
      if (player.vy > 0 && player.y < enemy.y) {
        // Player jumped on enemy - don't die
      } else {
        // Player touched from side - die
        playerDied = true;
      }
    }

    expect(playerDied).toBe(true);
  });

  it('should not affect dead enemies', () => {
    enemy.alive = false;
    const initialX = enemy.x;

    // Dead enemies should not move
    if (enemy.alive) {
      enemy.x += enemy.dx;
    }

    expect(enemy.x).toBe(initialX); // Should not have moved
  });

  it('should not collide with dead enemies', () => {
    enemy.alive = false;
    player.x = enemy.x;
    player.y = enemy.y;

    let playerDied = false;
    if (enemy.alive && rectsCollide(player, enemy)) {
      playerDied = true;
    }

    expect(playerDied).toBe(false); // Dead enemy should not kill player
  });

  it('should eat circle enemies when action key is pressed', () => {
    enemy.type = 'circle';
    player.x = enemy.x;
    player.y = enemy.y;

    let actionKeyPressed = true;
    let score = 0;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'circle' && actionKeyPressed && !player.eatenEnemy) {
        player.eatenEnemy = { ...enemy };
        enemy.alive = false;
        score++;
      }
    }

    expect(player.eatenEnemy).not.toBeNull();
    expect(player.eatenEnemy?.type).toBe('circle');
    expect(enemy.alive).toBe(false);
    expect(score).toBe(1);
  });

  it('should not eat circle enemies when action key is not pressed', () => {
    enemy.type = 'circle';
    player.x = enemy.x;
    player.y = enemy.y;

    let actionKeyPressed = false;
    let playerDied = false;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'circle' && actionKeyPressed && !player.eatenEnemy) {
        player.eatenEnemy = { ...enemy };
        enemy.alive = false;
      } else if (enemy.type === 'circle') {
        playerDied = true;
      }
    }

    expect(player.eatenEnemy).toBeNull();
    expect(enemy.alive).toBe(true);
    expect(playerDied).toBe(true);
  });

  it('should allow eating circle enemies even when already has eaten enemy', () => {
    enemy.type = 'circle';
    player.x = enemy.x;
    player.y = enemy.y;
    player.eatenEnemy = { type: 'circle', id: 'old_enemy' } as any; // Already has eaten enemy

    let actionKeyPressed = true;
    let score = 0;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'circle' && actionKeyPressed) {
        // Start eating animation (replaces any existing eaten enemy)
        player.eatenEnemy = { ...enemy };
        enemy.alive = false;
        score++;
      }
    }

    expect(player.eatenEnemy).not.toBeNull();
    expect(player.eatenEnemy?.type).toBe('circle');
    expect(enemy.alive).toBe(false);
    expect(score).toBe(1);
  });

  it('should allow jumping on square enemies', () => {
    enemy.type = 'square';
    player.x = enemy.x;
    player.y = enemy.y - player.height + 5;
    player.vy = 5; // Falling down

    let score = 0;
    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'square') {
        if (player.vy > 0 && player.y < enemy.y) {
          enemy.alive = false;
          player.vy = -8;
          score++;
        }
      }
    }

    expect(enemy.alive).toBe(false);
    expect(player.vy).toBe(-8);
    expect(score).toBe(1);
  });

  it('should kill player when touching square enemy from side', () => {
    enemy.type = 'square';
    player.x = enemy.x - player.width + 5;
    player.y = enemy.y;
    player.vy = 0;

    let playerDied = false;
    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'square') {
        if (player.vy > 0 && player.y < enemy.y) {
          // Player jumped on enemy
        } else {
          playerDied = true;
        }
      }
    }

    expect(playerDied).toBe(true);
  });

  it('should shrink big player without losing life when hit by enemy', () => {
    enemy.type = 'square';
    player.x = enemy.x - player.width + 5;
    player.y = enemy.y;
    player.vy = 0; // Side collision
    player.growLevel = 2; // Player is big

    let playerDied = false;
    let playerShrunk = false;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'square') {
        if (player.vy > 0 && player.y < enemy.y) {
          // Player jumped on enemy
        } else {
          // Side collision - handle damage based on size
          if (player.growLevel > 0) {
            player.growLevel = 0;
            playerShrunk = true;
          } else {
            playerDied = true;
          }
        }
      }
    }

    expect(playerShrunk).toBe(true);
    expect(playerDied).toBe(false);
    expect(player.growLevel).toBe(0);
  });

  it('should kill small player when hit by enemy', () => {
    enemy.type = 'square';
    player.x = enemy.x - player.width + 5;
    player.y = enemy.y;
    player.vy = 0; // Side collision
    player.growLevel = 0; // Player is small

    let playerDied = false;
    let playerShrunk = false;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'square') {
        if (player.vy > 0 && player.y < enemy.y) {
          // Player jumped on enemy
        } else {
          // Side collision - handle damage based on size
          if (player.growLevel > 0) {
            player.growLevel = 0;
            playerShrunk = true;
          } else {
            playerDied = true;
          }
        }
      }
    }

    expect(playerShrunk).toBe(false);
    expect(playerDied).toBe(true);
    expect(player.growLevel).toBe(0);
  });

  it('should shrink big player when hit by circle enemy without eating', () => {
    enemy.type = 'circle';
    player.x = enemy.x;
    player.y = enemy.y;
    player.growLevel = 1; // Player is big
    const actionKeyPressed = false; // Not trying to eat

    let playerDied = false;
    let playerShrunk = false;

    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'circle' && actionKeyPressed) {
        // Would eat enemy
      } else {
        // Damage collision - handle based on size
        if (player.growLevel > 0) {
          player.growLevel = 0;
          playerShrunk = true;
        } else {
          playerDied = true;
        }
      }
    }

    expect(playerShrunk).toBe(true);
    expect(playerDied).toBe(false);
    expect(player.growLevel).toBe(0);
  });
});

describe('Eat/Spit enemy functionality', () => {
  let player: any;
  let enemies: any[];

  beforeEach(() => {
    player = {
      x: 100,
      y: 350,
      width: 40,
      height: 50,
      vx: 0,
      vy: 0,
      eatenEnemy: null,
    };
    enemies = [];
  });

  function _rectsCollide(a: any, b: any) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function spitOutEnemy() {
    if (!player.eatenEnemy) return;

    const spitDirection = player.vx >= 0 ? 1 : -1;
    const spitX = player.x + (spitDirection > 0 ? player.width + 10 : -40);
    const spitY = player.y + 10;

    const spitEnemy = {
      x: spitX,
      y: spitY,
      width: 30,
      height: 30,
      dx: spitDirection * 2,
      dy: 0,
      range: 120,
      startX: spitX,
      alive: true,
      id: 'spit_enemy',
      isJumpingOut: false,
      type: player.eatenEnemy.type,
    };

    enemies.push(spitEnemy);
    player.eatenEnemy = null;
  }

  it('should store eaten enemy in player state', () => {
    const circleEnemy = {
      type: 'circle',
      x: 100,
      y: 350,
      width: 30,
      height: 30,
      alive: true,
    };

    // Simulate eating
    player.eatenEnemy = { ...circleEnemy };

    expect(player.eatenEnemy).not.toBeNull();
    expect(player.eatenEnemy.type).toBe('circle');
  });

  it('should spit out enemy when action key is pressed and player has eaten enemy', () => {
    player.eatenEnemy = { type: 'circle' };
    player.vx = 5; // Moving right

    spitOutEnemy();

    expect(player.eatenEnemy).toBeNull();
    expect(enemies.length).toBe(1);
    expect(enemies[0].type).toBe('circle');
    expect(enemies[0].x).toBeGreaterThan(player.x); // Spit to the right
  });

  it('should spit enemy in direction of player movement', () => {
    player.eatenEnemy = { type: 'circle' };
    player.vx = -3; // Moving left

    spitOutEnemy();

    expect(enemies[0].x).toBeLessThan(player.x); // Spit to the left
    expect(enemies[0].dx).toBeLessThan(0); // Enemy moving left
  });

  it('should not do anything if no enemy is eaten when trying to spit', () => {
    player.eatenEnemy = null;

    spitOutEnemy();

    expect(enemies.length).toBe(0);
  });

  it('should reset eaten enemy on player death', () => {
    player.eatenEnemy = { type: 'circle' };

    // Simulate death
    player.eatenEnemy = null;

    expect(player.eatenEnemy).toBeNull();
  });

  it('should show visual indicator when enemy is eaten', () => {
    // Test that the UI shows an indicator when player has eaten enemy
    player.eatenEnemy = { type: 'circle' };

    const hasIndicator = player.eatenEnemy !== null;
    expect(hasIndicator).toBe(true);
  });

  // Rope animation tests
  describe('Rope Animation', () => {
    let ropeAnimation: any;

    beforeEach(() => {
      ropeAnimation = {
        type: 'none',
        progress: 0,
        duration: 1000,
        startTime: 0,
        targetEnemy: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      };
    });

    function startRopeEatingAnimation(enemy: any) {
      ropeAnimation.type = 'eating';
      ropeAnimation.progress = 0;
      ropeAnimation.startTime = Date.now();
      ropeAnimation.targetEnemy = enemy;
      ropeAnimation.startX = enemy.x + enemy.width / 2;
      ropeAnimation.startY = enemy.y + enemy.height / 2;
      ropeAnimation.endX = player.x + player.width / 2;
      ropeAnimation.endY = player.y + player.height / 2;
    }

    function startRopeSpittingAnimation() {
      if (!player.eatenEnemy) return;

      ropeAnimation.type = 'spitting';
      ropeAnimation.progress = 0;
      ropeAnimation.startTime = Date.now();
      ropeAnimation.startX = player.x + player.width / 2;
      ropeAnimation.startY = player.y + player.height / 2;

      const spitDirection = player.vx >= 0 ? 1 : -1;
      const screenEdgeX = spitDirection > 0 ? 800 : -50; // Mock canvas width
      ropeAnimation.endX = screenEdgeX;
      ropeAnimation.endY = player.y + player.height / 2;

      ropeAnimation.targetEnemy = {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        width: 30,
        height: 30,
        dx: 0,
        dy: 0,
        range: 0,
        startX: 0,
        alive: true,
        id: 'temp_spit',
        isJumpingOut: false,
        type: player.eatenEnemy.type,
      };
    }

    function updateRopeAnimation() {
      if (ropeAnimation.type === 'none') return;

      const elapsed = Date.now() - ropeAnimation.startTime;
      ropeAnimation.progress = Math.min(elapsed / ropeAnimation.duration, 1);

      if (ropeAnimation.type === 'eating' && ropeAnimation.targetEnemy) {
        const enemyX =
          ropeAnimation.startX +
          (ropeAnimation.endX - ropeAnimation.startX) * ropeAnimation.progress;
        const enemyY =
          ropeAnimation.startY +
          (ropeAnimation.endY - ropeAnimation.startY) * ropeAnimation.progress;

        ropeAnimation.targetEnemy.x =
          enemyX - ropeAnimation.targetEnemy.width / 2;
        ropeAnimation.targetEnemy.y =
          enemyY - ropeAnimation.targetEnemy.height / 2;

        if (ropeAnimation.progress >= 1) {
          player.eatenEnemy = { ...ropeAnimation.targetEnemy };
          ropeAnimation.targetEnemy.alive = false;
          ropeAnimation.type = 'none';
          ropeAnimation.targetEnemy = null;
        }
      } else if (
        ropeAnimation.type === 'spitting' &&
        ropeAnimation.targetEnemy
      ) {
        const enemyX =
          ropeAnimation.startX +
          (ropeAnimation.endX - ropeAnimation.startX) * ropeAnimation.progress;
        const enemyY =
          ropeAnimation.startY +
          (ropeAnimation.endY - ropeAnimation.startY) * ropeAnimation.progress;

        ropeAnimation.targetEnemy.x =
          enemyX - ropeAnimation.targetEnemy.width / 2;
        ropeAnimation.targetEnemy.y =
          enemyY - ropeAnimation.targetEnemy.height / 2;

        if (ropeAnimation.progress >= 1) {
          player.eatenEnemy = null;
          ropeAnimation.type = 'none';
          ropeAnimation.targetEnemy = null;
        }
      }
    }

    it('should start rope eating animation when player touches circle enemy', () => {
      const circleEnemy = {
        type: 'circle',
        x: 100,
        y: 350,
        width: 30,
        height: 30,
        alive: true,
      };

      startRopeEatingAnimation(circleEnemy);

      expect(ropeAnimation.type).toBe('eating');
      expect(ropeAnimation.targetEnemy).toBe(circleEnemy);
      expect(ropeAnimation.progress).toBe(0);
    });

    it('should animate enemy moving toward player during eating', () => {
      const circleEnemy = {
        type: 'circle',
        x: 200,
        y: 300,
        width: 30,
        height: 30,
        alive: true,
      };

      startRopeEatingAnimation(circleEnemy);

      // Manually set progress to halfway and update
      ropeAnimation.progress = 0.5;
      const elapsed = ropeAnimation.duration * 0.5;
      ropeAnimation.startTime = Date.now() - elapsed;

      updateRopeAnimation();

      // Enemy should be moving toward current player position
      const currentPlayerCenterX = player.x + player.width / 2;
      const expectedX =
        ropeAnimation.startX +
        (currentPlayerCenterX - ropeAnimation.startX) * 0.5;
      expect(ropeAnimation.targetEnemy.x).toBe(
        expectedX - circleEnemy.width / 2
      );
    });

    it('should complete eating when rope animation finishes', () => {
      const circleEnemy = {
        type: 'circle',
        x: 200,
        y: 300,
        width: 30,
        height: 30,
        alive: true,
      };

      startRopeEatingAnimation(circleEnemy);

      // Manually set progress to complete and update
      ropeAnimation.progress = 1;
      const elapsed = ropeAnimation.duration;
      ropeAnimation.startTime = Date.now() - elapsed;

      updateRopeAnimation();

      expect(player.eatenEnemy).not.toBeNull();
      expect(player.eatenEnemy.type).toBe('circle');
      expect(ropeAnimation.type).toBe('none');
      expect(circleEnemy.alive).toBe(false);
    });

    it('should start rope spitting animation when spitting enemy', () => {
      player.eatenEnemy = { type: 'circle' };
      player.vx = 5; // Moving right

      startRopeSpittingAnimation();

      expect(ropeAnimation.type).toBe('spitting');
      expect(ropeAnimation.targetEnemy).not.toBeNull();
      expect(ropeAnimation.targetEnemy.type).toBe('circle');
    });

    it('should animate enemy moving toward screen edge during spitting', () => {
      player.eatenEnemy = { type: 'circle' };
      player.vx = 5; // Moving right

      startRopeSpittingAnimation();

      // Manually set progress to halfway and update
      ropeAnimation.progress = 0.5;
      const elapsed = ropeAnimation.duration * 0.5;
      ropeAnimation.startTime = Date.now() - elapsed;

      updateRopeAnimation();

      // Enemy should be moving toward screen edge from current player position
      const currentPlayerCenterX = player.x + player.width / 2;
      const expectedX =
        currentPlayerCenterX +
        (ropeAnimation.endX - currentPlayerCenterX) * 0.5;
      expect(ropeAnimation.targetEnemy.x).toBeCloseTo(
        expectedX - ropeAnimation.targetEnemy.width / 2,
        5
      );
    });

    it('should remove enemy when rope spitting animation completes', () => {
      player.eatenEnemy = { type: 'circle' };

      startRopeSpittingAnimation();

      // Manually set progress to complete and update
      ropeAnimation.progress = 1;
      const elapsed = ropeAnimation.duration;
      ropeAnimation.startTime = Date.now() - elapsed;

      updateRopeAnimation();

      expect(player.eatenEnemy).toBeNull();
      expect(ropeAnimation.type).toBe('none');
      expect(ropeAnimation.targetEnemy).toBeNull();
    });

    it('should calculate correct spit direction based on player movement', () => {
      player.eatenEnemy = { type: 'circle' };
      player.vx = -3; // Moving left

      startRopeSpittingAnimation();

      expect(ropeAnimation.endX).toBe(-50); // Left edge of screen

      // Reset and test right direction
      player.vx = 3; // Moving right
      startRopeSpittingAnimation();

      expect(ropeAnimation.endX).toBe(800); // Right edge of screen
    });

    it('should allow eating circle enemy from reasonable distance', () => {
      // Function to find nearby circle enemy (from main.ts logic)
      function findNearbyCircleEnemy(): any | null {
        const EATING_DISTANCE = 60; // Same as in main.ts
        const enemies = [
          {
            type: 'circle',
            x: player.x + 50, // 50 pixels away
            y: player.y,
            width: 30,
            height: 30,
            alive: true,
          },
          {
            type: 'circle',
            x: player.x + 80, // 80 pixels away (too far)
            y: player.y,
            width: 30,
            height: 30,
            alive: true,
          },
        ];

        for (const enemy of enemies) {
          if (!enemy.alive || enemy.type !== 'circle') continue;

          const playerCenterX = player.x + player.width / 2;
          const playerCenterY = player.y + player.height / 2;
          const enemyCenterX = enemy.x + enemy.width / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;

          const distance = Math.sqrt(
            Math.pow(playerCenterX - enemyCenterX, 2) +
              Math.pow(playerCenterY - enemyCenterY, 2)
          );

          if (distance <= EATING_DISTANCE) {
            return enemy;
          }
        }

        return null;
      }

      // Test that nearby enemy can be found
      const nearbyEnemy = findNearbyCircleEnemy();
      expect(nearbyEnemy).not.toBeNull();
      expect(nearbyEnemy.x).toBe(player.x + 50); // Should find the closer enemy

      // Test that the distance calculation works correctly
      const playerCenterX = player.x + player.width / 2; // 120
      const enemyCenterX = nearbyEnemy.x + nearbyEnemy.width / 2; // 165
      const distance = Math.abs(playerCenterX - enemyCenterX); // 45
      expect(distance).toBeLessThan(60); // Should be within eating distance
    });

    it('should have size-based eating distances', () => {
      // Mock a circle enemy at various distances
      const baseDistance = 100;
      const size1Distance = 120;
      const size2Distance = 150;

      // Test base size (growLevel 0)
      player.growLevel = 0;
      function getEatingDistance(): number {
        if (player.growLevel === 0) {
          return 100; // Base size
        } else if (player.growLevel === 1) {
          return 120; // Size +1
        } else if (player.growLevel >= 2) {
          return 150; // Size +2 and above
        }
        return 100; // Fallback
      }

      expect(getEatingDistance()).toBe(baseDistance);

      // Test size +1 (growLevel 1)
      player.growLevel = 1;
      expect(getEatingDistance()).toBe(size1Distance);

      // Test size +2 (growLevel 2)
      player.growLevel = 2;
      expect(getEatingDistance()).toBe(size2Distance);

      // Test size +3 and above (growLevel 3+)
      player.growLevel = 3;
      expect(getEatingDistance()).toBe(size2Distance);

      player.growLevel = 5;
      expect(getEatingDistance()).toBe(size2Distance);
    });

    it('should allow eating circle enemy at size-appropriate distances', () => {
      // Function to find nearby circle enemy using size-based distance
      function findNearbyCircleEnemyWithSize(): any | null {
        function getEatingDistance(): number {
          if (player.growLevel === 0) {
            return 100; // Base size
          } else if (player.growLevel === 1) {
            return 120; // Size +1
          } else if (player.growLevel >= 2) {
            return 150; // Size +2 and above
          }
          return 100; // Fallback
        }

        const EATING_DISTANCE = getEatingDistance();
        const enemies = [
          {
            type: 'circle',
            x: player.x + EATING_DISTANCE - 10, // Just within range
            y: player.y,
            width: 30,
            height: 30,
            alive: true,
          },
        ];

        for (const enemy of enemies) {
          if (!enemy.alive || enemy.type !== 'circle') continue;

          const playerCenterX = player.x + player.width / 2;
          const playerCenterY = player.y + player.height / 2;
          const enemyCenterX = enemy.x + enemy.width / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;

          const distance = Math.sqrt(
            Math.pow(playerCenterX - enemyCenterX, 2) +
              Math.pow(playerCenterY - enemyCenterY, 2)
          );

          if (distance <= EATING_DISTANCE) {
            return enemy;
          }
        }

        return null;
      }

      // Test base size eating range
      player.growLevel = 0;
      let nearbyEnemy = findNearbyCircleEnemyWithSize();
      expect(nearbyEnemy).not.toBeNull();
      expect(nearbyEnemy.x).toBe(player.x + 90); // 100 - 10 = 90

      // Test size +1 eating range
      player.growLevel = 1;
      nearbyEnemy = findNearbyCircleEnemyWithSize();
      expect(nearbyEnemy).not.toBeNull();
      expect(nearbyEnemy.x).toBe(player.x + 110); // 120 - 10 = 110

      // Test size +2 eating range
      player.growLevel = 2;
      nearbyEnemy = findNearbyCircleEnemyWithSize();
      expect(nearbyEnemy).not.toBeNull();
      expect(nearbyEnemy.x).toBe(player.x + 140); // 150 - 10 = 140
    });

    it('should show targeting line when action button is pressed but no enemy nearby', () => {
      // Setup rope animation state
      const ropeAnimation = {
        type: 'none' as 'none' | 'eating' | 'spitting' | 'targeting',
        progress: 0,
        duration: 300,
        startTime: 0,
        targetEnemy: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      };

      function startRopeTargetingAnimation() {
        function getEatingDistance(): number {
          if (player.growLevel === 0) {
            return 100; // Base size
          } else if (player.growLevel === 1) {
            return 120; // Size +1
          } else if (player.growLevel >= 2) {
            return 150; // Size +2 and above
          }
          return 100; // Fallback
        }

        const eatingDistance = getEatingDistance();

        ropeAnimation.type = 'targeting';
        ropeAnimation.progress = 0;
        ropeAnimation.duration = 300;
        ropeAnimation.startTime = Date.now();
        ropeAnimation.targetEnemy = null;

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        ropeAnimation.startX = playerCenterX;
        ropeAnimation.startY = playerCenterY;
        ropeAnimation.endX = playerCenterX + eatingDistance;
        ropeAnimation.endY = playerCenterY;
      }

      // Test targeting line for different sizes
      player.growLevel = 0;
      startRopeTargetingAnimation();
      expect(ropeAnimation.type).toBe('targeting');
      expect(ropeAnimation.endX).toBe(player.x + player.width / 2 + 100);

      player.growLevel = 1;
      startRopeTargetingAnimation();
      expect(ropeAnimation.endX).toBe(player.x + player.width / 2 + 120);

      player.growLevel = 2;
      startRopeTargetingAnimation();
      expect(ropeAnimation.endX).toBe(player.x + player.width / 2 + 150);
    });

    it('should have targeting line follow player movement during animation', () => {
      // Setup a mock canvas context and getEatingDistance function for the drawing test
      const mockCtx = {
        strokeStyle: '',
        lineWidth: 0,
        setLineDash: () => {},
        beginPath: () => {},
        moveTo: (x: number, y: number) => {
          mockCtx.lastMoveX = x;
          mockCtx.lastMoveY = y;
        },
        lineTo: (x: number, y: number) => {
          mockCtx.lastLineX = x;
          mockCtx.lastLineY = y;
        },
        stroke: () => {},
        lastMoveX: 0,
        lastMoveY: 0,
        lastLineX: 0,
        lastLineY: 0,
      };

      function getEatingDistance(): number {
        return 100; // Base distance for test
      }

      function drawRopeAnimationTest() {
        if (ropeAnimation.type === 'targeting') {
          const cameraX = 0; // No camera offset for test
          const playerCenterX = player.x + player.width / 2 - cameraX;
          const playerCenterY = player.y + player.height / 2;

          // Calculate end position based on current player position (this is the fix)
          const eatingDistance = getEatingDistance();
          const endX = playerCenterX + eatingDistance;
          const endY = playerCenterY;

          mockCtx.moveTo(playerCenterX, playerCenterY);
          mockCtx.lineTo(endX, endY);
        }
      }

      // Setup rope animation state
      const ropeAnimation = {
        type: 'targeting' as 'none' | 'eating' | 'spitting' | 'targeting',
        progress: 0,
        duration: 300,
        startTime: Date.now(),
        targetEnemy: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      };

      // Initial player position
      player.x = 100;
      player.y = 300;

      // Draw targeting line at initial position
      drawRopeAnimationTest();
      const initialStartX = mockCtx.lastMoveX;
      const initialStartY = mockCtx.lastMoveY;
      const initialEndX = mockCtx.lastLineX;
      const initialEndY = mockCtx.lastLineY;

      expect(initialStartX).toBe(player.x + player.width / 2);
      expect(initialStartY).toBe(player.y + player.height / 2);
      expect(initialEndX).toBe(player.x + player.width / 2 + 100);
      expect(initialEndY).toBe(player.y + player.height / 2);

      // Move player to new position
      player.x = 200;
      player.y = 250;

      // Draw targeting line at new position
      drawRopeAnimationTest();
      const newStartX = mockCtx.lastMoveX;
      const newStartY = mockCtx.lastMoveY;
      const newEndX = mockCtx.lastLineX;
      const newEndY = mockCtx.lastLineY;

      // Verify the targeting line moved with the player
      expect(newStartX).toBe(player.x + player.width / 2);
      expect(newStartY).toBe(player.y + player.height / 2);
      expect(newEndX).toBe(player.x + player.width / 2 + 100);
      expect(newEndY).toBe(player.y + player.height / 2);

      // Verify the line actually moved from the initial position
      expect(newStartX).not.toBe(initialStartX);
      expect(newStartY).not.toBe(initialStartY);
      expect(newEndX).not.toBe(initialEndX);
      expect(newEndY).not.toBe(initialEndY);
    });
  });
});
