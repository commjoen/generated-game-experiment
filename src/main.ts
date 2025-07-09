const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Game constants
const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_POWER = 12;
const GROUND_Y = 400;

// Player state
const player = {
  x: 100,
  y: GROUND_Y - 50,
  width: 40,
  height: 50,
  vx: 0,
  vy: 0,
  onGround: false,
};

// Platform
const platform = {
  x: 0,
  y: GROUND_Y,
  width: 800,
  height: 50,
};

// Input state
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function update() {
  // Horizontal movement
  player.vx = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -MOVE_SPEED;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx = MOVE_SPEED;

  // Jump
  if ((keys['ArrowUp'] || keys['Space'] || keys['KeyW']) && player.onGround) {
    player.vy = -JUMP_POWER;
    player.onGround = false;
  }

  // Apply gravity
  player.vy += GRAVITY;

  // Update position
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

  // Prevent going off screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platform
  ctx.fillStyle = '#654321';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

  // Draw player
  ctx.fillStyle = '#ff0';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop(); 