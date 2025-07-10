const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Game constants
const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_POWER = 12;
const GROUND_Y = 400;

// --- Camera and Level Dimensions ---
const LEVEL_WIDTH = 3200; // longer level
let cameraX = 0;

// --- Collectibles and Obstacles ---
interface Collectible extends Rect { collected: boolean; }
interface MovingPlatform extends Rect { dx: number; range: number; startX: number; }

const collectibles: Collectible[] = [];
const spikes: Rect[] = [];
const movingPlatforms: MovingPlatform[] = [];

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

// --- Mobile Controls ---
function setupMobileControls() {
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  if (!isMobile) return;
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');
  if (btnLeft && btnRight && btnJump) {
    btnLeft.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; });
    btnLeft.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowLeft'] = false; });
    btnRight.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; });
    btnRight.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowRight'] = false; });
    btnJump.addEventListener('touchstart', e => { e.preventDefault(); keys['Space'] = true; });
    btnJump.addEventListener('touchend', e => { e.preventDefault(); keys['Space'] = false; });
  }
}
setupMobileControls();

// Level generation
interface Rect { x: number; y: number; width: number; height: number; }

const platforms: Rect[] = [];
const boxes: Rect[] = [];

function generateLevel() {
  let x = 0;
  while (x < LEVEL_WIDTH) {
    // Make blocks longer: 160-320, with some extra long
    const platformWidth = Math.random() < 0.2 ? 320 : 160 + Math.random() * 160;
    platforms.push({ x, y: GROUND_Y, width: platformWidth, height: 50 });
    // Add collectibles on some platforms
    if (Math.random() < 0.5) {
      collectibles.push({ x: x + platformWidth / 2 - 10, y: GROUND_Y - 30, width: 20, height: 20, collected: false });
    }
    // Add spikes in some gaps
    if (Math.random() < 0.3 && x > 0) {
      spikes.push({ x: x - 40, y: GROUND_Y + 35, width: 40, height: 15 });
    }
    // Add moving platforms
    if (Math.random() < 0.2 && x > 0) {
      movingPlatforms.push({ x: x - 60, y: GROUND_Y - 100, width: 80, height: 20, dx: 2, range: 120, startX: x - 60 });
    }
    x += platformWidth;
    const gap = 60 + Math.random() * 80;
    x += gap;
    if (Math.random() < 0.5 && x < LEVEL_WIDTH - 50) {
      boxes.push({ x: x + 10, y: GROUND_Y - 40, width: 40, height: 40 });
    }
  }
  // Ensure a platform at the player spawn point (x=100)
  const spawnX = 100;
  const hasSpawnBlock = platforms.some(plat => plat.x <= spawnX && plat.x + plat.width >= spawnX + 40);
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 60, y: GROUND_Y, width: 80, height: 50 });
  }
}
generateLevel();

function rectsCollide(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

let score = 0;
let level = 1;
let levelEndX = LEVEL_WIDTH - 100;
let respawnTimer = 0;
let lives = 3;
let gameOver = false;
let topScore = Number(localStorage.getItem('topScore') || '0');

function setTopScore(newScore: number) {
  if (newScore > topScore) {
    topScore = newScore;
    localStorage.setItem('topScore', String(topScore));
  }
}

function resetGame() {
  score = 0;
  level = 1;
  lives = 3;
  gameOver = false;
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  generateLevel();
  resetPlayer();
}

function resetPlayer() {
  player.x = 100;
  player.y = GROUND_Y - 50;
  player.vx = 0;
  player.vy = 0;
}

function respawnPlayer() {
  lives--;
  if (lives <= 0) {
    setTopScore(score);
    gameOver = true;
    showRestartButton();
    return;
  }
  resetPlayer();
  respawnTimer = 30; // frames to pause/flash
}

function showRestartButton() {
  let btn = document.getElementById('restart-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'restart-btn';
    btn.textContent = 'Restart';
    btn.style.position = 'fixed';
    btn.style.left = '50%';
    btn.style.top = '50%';
    btn.style.transform = 'translate(-50%, -50%)';
    btn.style.fontSize = '2em';
    btn.style.padding = '16px 32px';
    btn.style.zIndex = '100';
    btn.style.background = '#222';
    btn.style.color = '#fff';
    btn.style.border = '2px solid #0cf';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      btn?.remove();
      resetGame();
    };
    document.body.appendChild(btn);
  } else if (btn) {
    btn.style.display = 'block';
  }
}

function hideRestartButton() {
  const btn = document.getElementById('restart-btn');
  if (btn) btn.style.display = 'none';
}

function generateNewLevel() {
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  generateLevel();
  resetPlayer();
  score = 0;
  level++;
}

function update() {
  if (gameOver) return;
  if (respawnTimer > 0) {
    respawnTimer--;
    return;
  }
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

  // Platform collision (check all platforms)
  player.onGround = false;
  for (const plat of platforms) {
    if (
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height &&
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.vy >= 0
    ) {
      player.y = plat.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Box collision (treat as solid obstacles)
  for (const box of boxes) {
    if (rectsCollide(player, box)) {
      // Simple collision response: push player up or to the side
      if (player.y + player.height - player.vy <= box.y) {
        // Landed on top
        player.y = box.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.x + player.width - player.vx <= box.x) {
        // Hit from left
        player.x = box.x - player.width;
      } else if (player.x - player.vx >= box.x + box.width) {
        // Hit from right
        player.x = box.x + box.width;
      } else if (player.y - player.vy >= box.y + box.height) {
        // Hit from below
        player.y = box.y + box.height;
        player.vy = 0;
      }
    }
  }

  // Move moving platforms
  for (const plat of movingPlatforms) {
    plat.x += plat.dx;
    if (plat.x > plat.startX + plat.range || plat.x < plat.startX) {
      plat.dx *= -1;
    }
  }

  // Moving platform collision
  for (const plat of movingPlatforms) {
    if (
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height &&
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.vy >= 0
    ) {
      player.y = plat.y - player.height;
      player.vy = 0;
      player.onGround = true;
      // Move player with platform
      player.x += plat.dx;
    }
  }

  // Collectibles
  for (const c of collectibles) {
    if (!c.collected && rectsCollide(player, c)) {
      c.collected = true;
      score++;
      setTopScore(score);
    }
  }
  // Spike collision (game over logic placeholder)
  for (const spike of spikes) {
    if (rectsCollide(player, spike)) {
      respawnPlayer();
      break;
    }
  }
  // Offscreen (falling)
  if (player.y > canvas.height + 100) {
    respawnPlayer();
  }
  // End of level
  if (player.x + player.width >= levelEndX) {
    generateNewLevel();
  }
  // --- Camera follows player ---
  cameraX = player.x - canvas.width / 2 + player.width / 2;
  cameraX = Math.max(0, Math.min(cameraX, LEVEL_WIDTH - canvas.width));

  // Prevent going off screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > LEVEL_WIDTH) player.x = LEVEL_WIDTH - player.width;
}

// --- Settings Menu Logic ---
let fixedGradient = localStorage.getItem('fixedGradient') === 'true';
let scrollGradient = localStorage.getItem('scrollGradient') === 'true';
let fixedGradientColors: [string, string] = JSON.parse(localStorage.getItem('fixedGradientColors') || 'null') || randomGradientColors();
let scrollGradientColors: [string, string] = JSON.parse(localStorage.getItem('scrollGradientColors') || 'null') || randomGradientColors();

function randomGradientColors(): [string, string] {
  function pastel() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 75%)`;
  }
  return [pastel(), pastel()];
}

function applyBackgroundSettings() {
  localStorage.setItem('fixedGradient', String(fixedGradient));
  localStorage.setItem('scrollGradient', String(scrollGradient));
  localStorage.setItem('fixedGradientColors', JSON.stringify(fixedGradientColors));
  localStorage.setItem('scrollGradientColors', JSON.stringify(scrollGradientColors));
}

window.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const fixedGradientToggle = document.getElementById('fixed-gradient-toggle') as HTMLInputElement;
  const scrollGradientToggle = document.getElementById('scroll-gradient-toggle') as HTMLInputElement;
  if (settingsBtn && settingsModal && closeSettings && fixedGradientToggle && scrollGradientToggle) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
      fixedGradientToggle.checked = fixedGradient;
      scrollGradientToggle.checked = scrollGradient;
      scrollGradientToggle.disabled = fixedGradient;
      fixedGradientToggle.disabled = scrollGradient;
    });
    closeSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    fixedGradientToggle.addEventListener('change', () => {
      fixedGradient = fixedGradientToggle.checked;
      if (fixedGradient) {
        fixedGradientColors = randomGradientColors();
        scrollGradient = false;
        scrollGradientToggle.checked = false;
        scrollGradientToggle.disabled = true;
      } else {
        scrollGradientToggle.disabled = false;
      }
      applyBackgroundSettings();
    });
    scrollGradientToggle.addEventListener('change', () => {
      scrollGradient = scrollGradientToggle.checked;
      if (scrollGradient) {
        scrollGradientColors = randomGradientColors();
        fixedGradient = false;
        fixedGradientToggle.checked = false;
        fixedGradientToggle.disabled = true;
      } else {
        fixedGradientToggle.disabled = false;
      }
      applyBackgroundSettings();
    });
  }
});

function draw() {
  // Draw background
  if (fixedGradient) {
    // Fixed gradient (does not scroll)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, fixedGradientColors[0]);
    grad.addColorStop(1, fixedGradientColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (scrollGradient) {
    // Scrolling diagonal gradient (moves with camera)
    const grad = ctx.createLinearGradient(-cameraX, 0, LEVEL_WIDTH - cameraX, canvas.height);
    grad.addColorStop(0, scrollGradientColors[0]);
    grad.addColorStop(1, scrollGradientColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.save();
  ctx.translate(-cameraX, 0);
  // Draw platforms
  ctx.fillStyle = '#654321';
  for (const plat of platforms) {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  }
  // Draw moving platforms
  ctx.fillStyle = '#888';
  for (const plat of movingPlatforms) {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  }
  // Draw boxes
  ctx.fillStyle = '#b5651d';
  for (const box of boxes) {
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }
  // Draw collectibles
  ctx.fillStyle = '#0cf';
  for (const c of collectibles) {
    if (!c.collected) ctx.beginPath(), ctx.arc(c.x + c.width/2, c.y + c.height/2, 10, 0, 2 * Math.PI), ctx.fill();
  }
  // Draw spikes
  ctx.fillStyle = '#e33';
  for (const spike of spikes) {
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y + spike.height);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
  }
  // Draw player (flash if respawning)
  ctx.restore();
  if (respawnTimer > 0 && Math.floor(respawnTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  } else {
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ff0';
  ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
  ctx.globalAlpha = 1;
  // Draw UI overlay
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Top Score: ${topScore}`, 20, 60);
  ctx.fillText(`Level: ${level}`, 20, 90);
  ctx.fillText(`Lives: ${lives}`, 20, 120);
  ctx.restore();
  if (gameOver) {
    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#e33';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
    ctx.restore();
    showRestartButton();
  } else {
    hideRestartButton();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop(); 