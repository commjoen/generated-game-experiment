const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Game constants
const GRAVITY = 0.5;
const MOVE_SPEED = 5;
const JUMP_POWER = 13;
const GROUND_Y = 400;

// Frame rate and speed control
const TARGET_FPS = 60;
let lastFrameTime = 0;
let frameCount = 0;
let fpsDisplay = 0;
let speedUnlocked = localStorage.getItem('speedUnlocked') === 'true';
let currentSpeedMultiplier = speedUnlocked ? 2 : 1; // 2x speed when unlocked
let showFpsCounter = localStorage.getItem('showFpsCounter') !== 'false'; // Default to true

// --- Camera and Level Dimensions ---
const LEVEL_WIDTH = 3200; // longer level
let cameraX = 0;

// --- Collectibles and Obstacles ---
interface Collectible extends Rect { collected: boolean; type: 'coin' | 'heart' | 'doublejump' | 'grow'; }
interface MovingPlatform extends Rect { dx: number; range: number; startX: number; }

const collectibles: Collectible[] = [];
const spikes: Rect[] = [];
const movingPlatforms: MovingPlatform[] = [];

// --- Finish Flag ---
let finishFlag = { x: 0, y: 0, width: 24, height: 80 };

// Player state
const player = {
  x: 100,
  y: GROUND_Y - 50,
  width: 40,
  height: 50,
  vx: 0,
  vy: 0,
  onGround: false,
  hasDoubleJump: false,
  growLevel: 0, // 0-3
  canDoubleJump: false, // for in-air jump
};

// Platform types
interface Rect { x: number; y: number; width: number; height: number; }
interface SlopePlatform {
  x: number;
  y: number; // left Y
  width: number;
  height: number;
  endY: number; // right Y
  isSlope: true;
}
type Platform = Rect | SlopePlatform;

const platforms: Platform[] = [];
const boxes: Rect[] = [];

function generateLevel() {
  let x = 0;
  let heartPlaced = false;
  let doubleJumpPlaced = false;
  let growPlaced = false;
  const platformCenters: { x: number, y: number }[] = [];
  while (x < LEVEL_WIDTH) {
    // Make blocks longer: 160-320, with some extra long
    const platformWidth = Math.random() < 0.2 ? 320 : 160 + Math.random() * 160;
    let plat: Platform;
    if (Math.random() < 0.25) { // 25% chance for a slope
      // Slope up or down, max ±40px over the width
      const slopeDelta = (Math.random() < 0.5 ? 1 : -1) * (20 + Math.random() * 20);
      plat = {
        x,
        y: GROUND_Y,
        width: platformWidth,
        height: 50,
        endY: GROUND_Y + slopeDelta,
        isSlope: true
      };
    } else {
      plat = { x, y: GROUND_Y, width: platformWidth, height: 50 };
    }
    platforms.push(plat);
    // Save platform center for possible heart placement
    platformCenters.push({ x: x + platformWidth / 2, y: GROUND_Y - 30 });
    // Add coin collectibles on some platforms
    if (Math.random() < 0.5) {
      collectibles.push({ x: x + platformWidth / 2 - 10, y: GROUND_Y - 30, width: 20, height: 20, collected: false, type: 'coin' });
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
  // Place a heart collectible on a random platform (at most 1 per level)
  if (platformCenters.length > 0) {
    const idx: number = Math.floor(Math.random() * platformCenters.length);
    const pos = platformCenters[idx];
    collectibles.push({ x: pos.x - 10, y: pos.y, width: 20, height: 20, collected: false, type: 'heart' });
  }
  // Place a double jump power-up on a random platform (at most 1 per level, not on heart)
  if (platformCenters.length > 1) {
    let idx: number;
    do { idx = Math.floor(Math.random() * platformCenters.length); } while (collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y));
    const pos = platformCenters[idx];
    collectibles.push({ x: pos.x - 10, y: pos.y - 30, width: 20, height: 20, collected: false, type: 'doublejump' });
  }
  // Place a grow power-up on a random platform (at most 1 per level, not on heart or doublejump)
  if (platformCenters.length > 2) {
    let idx: number;
    do { idx = Math.floor(Math.random() * platformCenters.length); } while (
      collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y) ||
      collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y - 30)
    );
    const pos = platformCenters[idx];
    collectibles.push({ x: pos.x - 10, y: pos.y - 60, width: 20, height: 20, collected: false, type: 'grow' });
  }
  // Ensure a platform at the player spawn point (x=100)
  const spawnX = 100;
  const hasSpawnBlock = platforms.some(plat => plat.x <= spawnX && plat.x + plat.width >= spawnX + 40);
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 60, y: GROUND_Y, width: 80, height: 50 });
  }
  // Place finish flag at the end of the last platform
  const lastPlat = platforms[platforms.length - 1];
  let flagX = lastPlat.x + lastPlat.width - 32;
  let flagY = ('isSlope' in lastPlat && lastPlat.isSlope) ? lastPlat.endY - finishFlag.height : lastPlat.y - finishFlag.height;
  finishFlag.x = flagX;
  finishFlag.y = flagY;
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
let nextLevelPending = false;
let nextLevelTimer = 0;

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
  player.y = GROUND_Y - 175; // Start 125 pixels higher than ground
  player.vx = 0;
  player.vy = 0;
  // Do NOT reset power-ups here; they persist across levels
  // player.hasDoubleJump = false;
  // player.growLevel = 0;
  player.canDoubleJump = false;
  setPlayerSizeByGrowLevel();
}

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

function respawnPlayer() {
  lives--;
  if (lives <= 0) {
    setTopScore(score);
    gameOver = true;
    showRestartButton();
    return;
  }
  // Reset power-ups on death
  player.hasDoubleJump = false;
  player.growLevel = 0;
  player.canDoubleJump = false;
  setPlayerSizeByGrowLevel();
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
    btn.style.top = 'calc(50% + 120px)'; // below the game over text and score
    btn.style.transform = 'translateX(-50%)';
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
    btn.style.top = 'calc(50% + 120px)';
    btn.style.transform = 'translateX(-50%)';
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
  level++;

  // Change background per level
  if (fixedGradient) {
    fixedGradientColors = randomGradientColors();
    localStorage.setItem('fixedGradientColors', JSON.stringify(fixedGradientColors));
  } else if (scrollGradient) {
    scrollGradientColors = randomGradientColors();
    localStorage.setItem('scrollGradientColors', JSON.stringify(scrollGradientColors));
  } else if (imageBg) {
    fetchRandomLandscapeImage();
  }

  launchConfetti();
  nextLevelPending = false;
  nextLevelTimer = 0;
}

function startNextLevelWithConfetti() {
  launchConfetti();
  nextLevelPending = true;
  nextLevelTimer = 120; // 2 seconds at 60fps
}

function update(deltaTime: number) {
  if (gameOver) return;
  if (nextLevelPending) {
    nextLevelTimer--;
    if (nextLevelTimer <= 0) {
      generateNewLevel();
    }
    return;
  }
  if (respawnTimer > 0) {
    respawnTimer--;
    return;
  }
  // Horizontal movement (frame-rate independent)
  player.vx = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -MOVE_SPEED * currentSpeedMultiplier * deltaTime * 60;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx = MOVE_SPEED * currentSpeedMultiplier * deltaTime * 60;

  // Jump (only on new key press)
  const jumpKey = keys['ArrowUp'] || keys['Space'] || keys['KeyW'];
  if (jumpKey && !prevJumpKey) {
    if (player.onGround) {
      player.vy = -JUMP_POWER;
      player.onGround = false;
      if (player.hasDoubleJump) player.canDoubleJump = true;
    } else if (player.hasDoubleJump && player.canDoubleJump) {
      player.vy = -JUMP_POWER;
      player.canDoubleJump = false;
    }
  }
  prevJumpKey = jumpKey;

  // Speed toggle (only on new key press)
  const speedToggleKey = keys['KeyT'];
  if (speedToggleKey && !prevSpeedToggleKey) {
    speedUnlocked = !speedUnlocked;
    localStorage.setItem('speedUnlocked', String(speedUnlocked));
    currentSpeedMultiplier = speedUnlocked ? 2 : 1;
  }
  prevSpeedToggleKey = speedToggleKey;

  // Apply gravity (frame-rate independent)
  player.vy += GRAVITY * deltaTime * 60;

  // Update position (frame-rate independent)
  player.x += player.vx;
  player.y += player.vy;

  // Platform collision (check all platforms)
  player.onGround = false;
  for (const plat of platforms) {
    if ('isSlope' in plat && plat.isSlope) {
      // Slope: calculate y at player's x
      if (player.x + player.width > plat.x && player.x < plat.x + plat.width) {
        const t = (player.x + player.width / 2 - plat.x) / plat.width;
        const yAtX = plat.y + (plat.endY - plat.y) * t;
        if (
          player.y + player.height > yAtX &&
          player.y + player.height < yAtX + plat.height &&
          player.vy >= 0
        ) {
          player.y = yAtX - player.height;
          player.vy = 0;
          player.onGround = true;
          player.canDoubleJump = player.hasDoubleJump; // reset double jump on landing
        }
      }
    } else {
      // Flat platform
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
        player.canDoubleJump = player.hasDoubleJump; // reset double jump on landing
      }
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
      if (c.type === 'doublejump' && player.hasDoubleJump) continue; // can't collect twice
      if (c.type === 'grow' && player.growLevel >= 3) continue; // can't collect more than 3
      c.collected = true;
      if (c.type === 'coin') {
        score++;
        setTopScore(score);
      } else if (c.type === 'heart') {
        if (lives < 5) lives++;
      } else if (c.type === 'doublejump') {
        player.hasDoubleJump = true;
        player.canDoubleJump = false; // must jump once before using
      } else if (c.type === 'grow') {
        if (player.growLevel < 3) player.growLevel++;
        setPlayerSizeByGrowLevel();
      }
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
  if (player.x + player.width >= levelEndX && !nextLevelPending) {
    startNextLevelWithConfetti();
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
let imageBg = localStorage.getItem('imageBg') === 'true';
let imageBgUrl: string | null = localStorage.getItem('imageBgUrl') || null;
let imageBgObj: HTMLImageElement | null = null;
let imageBgLoaded = false;

function fetchRandomLandscapeImage() {
  // Pixabay example (replace with your API key)
  const API_KEY = '51252753-0f1aa9c83b326091b3ad96f88';
  const url = `https://pixabay.com/api/?key=${API_KEY}&q=landscape&image_type=photo&orientation=horizontal&safesearch=true&per_page=50`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.hits && data.hits.length > 0) {
        const random = Math.floor(Math.random() * data.hits.length);
        imageBgUrl = data.hits[random].largeImageURL;
        if (imageBgUrl) {
          localStorage.setItem('imageBgUrl', imageBgUrl);
          loadImageBg();
        }
      }
    })
    .catch(() => {
      imageBgUrl = null;
      imageBgLoaded = false;
    });
}

function loadImageBg() {
  if (!imageBgUrl) return;
  imageBgObj = new window.Image();
  imageBgObj.crossOrigin = 'anonymous';
  imageBgObj.onload = () => { imageBgLoaded = true; };
  imageBgObj.onerror = () => { imageBgLoaded = false; };
  imageBgObj.src = imageBgUrl!;
}
if (imageBgUrl) loadImageBg();

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
  localStorage.setItem('imageBg', String(imageBg));
  localStorage.setItem('fixedGradientColors', JSON.stringify(fixedGradientColors));
  localStorage.setItem('scrollGradientColors', JSON.stringify(scrollGradientColors));
  if (!imageBg) {
    localStorage.removeItem('imageBgUrl');
    imageBgUrl = null;
    imageBgObj = null;
    imageBgLoaded = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const fixedGradientToggle = document.getElementById('fixed-gradient-toggle') as HTMLInputElement;
  const scrollGradientToggle = document.getElementById('scroll-gradient-toggle') as HTMLInputElement;
  const imageBgToggle = document.getElementById('image-bg-toggle') as HTMLInputElement;
  const speedUnlockToggle = document.getElementById('speed-unlock-toggle') as HTMLInputElement;
  const fpsCounterToggle = document.getElementById('fps-counter-toggle') as HTMLInputElement;
  if (settingsBtn && settingsModal && closeSettings && fixedGradientToggle && scrollGradientToggle && imageBgToggle && speedUnlockToggle && fpsCounterToggle) {
          settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        fixedGradientToggle.checked = fixedGradient;
        scrollGradientToggle.checked = scrollGradient;
        imageBgToggle.checked = imageBg;
        speedUnlockToggle.checked = speedUnlocked;
        fpsCounterToggle.checked = showFpsCounter;
      });
    closeSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    fixedGradientToggle.addEventListener('change', () => {
      if (fixedGradientToggle.checked) {
        fixedGradient = true;
        scrollGradient = false;
        imageBg = false;
        scrollGradientToggle.checked = false;
        imageBgToggle.checked = false;
        fixedGradientColors = randomGradientColors();
      } else {
        fixedGradient = false;
      }
      applyBackgroundSettings();
    });
    scrollGradientToggle.addEventListener('change', () => {
      if (scrollGradientToggle.checked) {
        scrollGradient = true;
        fixedGradient = false;
        imageBg = false;
        fixedGradientToggle.checked = false;
        imageBgToggle.checked = false;
        scrollGradientColors = randomGradientColors();
      } else {
        scrollGradient = false;
      }
      applyBackgroundSettings();
    });
    imageBgToggle.addEventListener('change', () => {
      if (imageBgToggle.checked) {
        imageBg = true;
        fixedGradient = false;
        scrollGradient = false;
        fixedGradientToggle.checked = false;
        scrollGradientToggle.checked = false;
        fetchRandomLandscapeImage();
      } else {
        imageBg = false;
      }
      applyBackgroundSettings();
    });
    speedUnlockToggle.addEventListener('change', () => {
      speedUnlocked = speedUnlockToggle.checked;
      localStorage.setItem('speedUnlocked', String(speedUnlocked));
      currentSpeedMultiplier = speedUnlocked ? 2 : 1;
    });
    fpsCounterToggle.addEventListener('change', () => {
      showFpsCounter = fpsCounterToggle.checked;
      localStorage.setItem('showFpsCounter', String(showFpsCounter));
    });
  }
});

// --- Confetti Animation ---
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  angle: number;
  spin: number;
}
let confettiParticles: ConfettiParticle[] = [];
let confettiTimer = 0;
function launchConfetti() {
  confettiParticles = [];
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 3;
    confettiParticles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height / 2 - 80 + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
      size: 8 + Math.random() * 8,
      life: 60 + Math.random() * 40,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2
    });
  }
  confettiTimer = 60;
}
function updateConfetti() {
  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // gravity
    p.angle += p.spin;
    p.life--;
  }
  confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < canvas.height + 40);
  if (confettiTimer > 0) confettiTimer--;
}
function drawConfetti() {
  for (const p of confettiParticles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size/2, -p.size/6, p.size, p.size/3);
    ctx.restore();
  }
}

function draw() {
  // Draw background
  if (imageBg && imageBgLoaded && imageBgObj) {
    // Parallax/scrolling background
    const img = imageBgObj;
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const bgWidth = img.width * scale;
    const bgHeight = img.height * scale;
    // Scroll image with cameraX, wrap if needed
    let bgX = -cameraX % bgWidth;
    if (bgX > 0) bgX -= bgWidth;
    for (let x = bgX; x < canvas.width; x += bgWidth) {
      ctx.drawImage(img, x, 0, bgWidth, bgHeight);
    }
  } else if (fixedGradient) {
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
    if ('isSlope' in plat && plat.isSlope) {
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.width, plat.endY);
      ctx.lineTo(plat.x + plat.width, plat.endY + plat.height);
      ctx.lineTo(plat.x, plat.y + plat.height);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    }
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
  for (const c of collectibles) {
    if (!c.collected) {
      if (c.type === 'coin') {
        ctx.fillStyle = '#0cf';
        ctx.beginPath();
        ctx.arc(c.x + c.width/2, c.y + c.height/2, 10, 0, 2 * Math.PI);
        ctx.fill();
      } else if (c.type === 'heart') {
        // Draw a heart shape
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        ctx.scale(1.2, 1.2);
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(0, 0, -10, 0, -10, 6);
        ctx.bezierCurveTo(-10, 12, 0, 16, 0, 20);
        ctx.bezierCurveTo(0, 16, 10, 12, 10, 6);
        ctx.bezierCurveTo(10, 0, 0, 0, 0, 6);
        ctx.closePath();
        ctx.fillStyle = '#e33';
        ctx.fill();
        ctx.restore();
      } else if (c.type === 'doublejump') {
        // Feather icon
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        ctx.rotate(-0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, -10, 0, -20);
        ctx.quadraticCurveTo(-8, -10, 0, 0);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#0cf';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (c.type === 'grow') {
        // Mushroom icon
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 2 * Math.PI);
        ctx.lineTo(10, 10);
        ctx.arc(0, 10, 10, 0, Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 10, Math.PI, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = '#e33';
        ctx.fill();
        ctx.restore();
      }
    }
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
  if (showFpsCounter) {
    ctx.fillText(`FPS: ${fpsDisplay}`, 20, 120);
  }
  if (speedUnlocked) {
    ctx.fillStyle = '#0cf';
    const speedY = showFpsCounter ? 150 : 120;
    ctx.fillText(`Speed: ${currentSpeedMultiplier}x`, 20, speedY);
  }
  // Draw hearts for lives
  for (let i = 0; i < lives; i++) {
    ctx.save();
    ctx.translate(20 + i * 28, 120);
    ctx.scale(1.2, 1.2);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, 0, -10, 0, -10, 6);
    ctx.bezierCurveTo(-10, 12, 0, 16, 0, 20);
    ctx.bezierCurveTo(0, 16, 10, 12, 10, 6);
    ctx.bezierCurveTo(10, 0, 0, 0, 0, 6);
    ctx.closePath();
    ctx.fillStyle = '#e33';
    ctx.fill();
    ctx.restore();
  }
  // Draw power-up icons
  let iconX = 20 + lives * 28 + 20;
  if (player.hasDoubleJump) {
    // Feather icon
    ctx.save();
    ctx.translate(iconX, 120);
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -10, 0, -20);
    ctx.quadraticCurveTo(-8, -10, 0, 0);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#0cf';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    iconX += 36;
  }
  for (let i = 0; i < player.growLevel; i++) {
    // Mushroom icon
    ctx.save();
    ctx.translate(iconX, 120);
    ctx.beginPath();
    ctx.arc(0, 0, 10, Math.PI, 2 * Math.PI);
    ctx.lineTo(10, 10);
    ctx.arc(0, 10, 10, 0, Math.PI, true);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 10, Math.PI, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#e33';
    ctx.fill();
    ctx.restore();
    iconX += 36;
  }
  ctx.restore();
  if (gameOver) {
    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#e33';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Top Score: ${topScore}`, canvas.width / 2, canvas.height / 2 + 40);
    if (score > (Number(localStorage.getItem('topScore') || '0'))) {
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#0cf';
      ctx.fillText('You beat your own top score!', canvas.width / 2, canvas.height / 2 + 90);
      if (confettiTimer === 0) launchConfetti();
    }
    ctx.restore();
    showRestartButton();
  } else {
    hideRestartButton();
  }
  // Draw finish flag just before confetti
  ctx.save();
  ctx.translate(-cameraX, 0);
  // Draw pole
  ctx.fillStyle = '#fff';
  ctx.fillRect(finishFlag.x, finishFlag.y, 8, finishFlag.height);
  // Draw flag
  ctx.beginPath();
  ctx.moveTo(finishFlag.x + 8, finishFlag.y);
  ctx.lineTo(finishFlag.x + 8 + 32, finishFlag.y + 16);
  ctx.lineTo(finishFlag.x + 8, finishFlag.y + 32);
  ctx.closePath();
  ctx.fillStyle = '#e33';
  ctx.fill();
  ctx.restore();
  // Draw confetti last so it appears on top
  drawConfetti();
}

function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastFrameTime;

  // Always draw to keep the browser happy
  draw();
  
  // Update game logic at target FPS (approximately)
  if (deltaTime >= 1000 / TARGET_FPS) {
    // Calculate FPS for display
    frameCount++;
    if (frameCount % 60 === 0) { // Update FPS display every 60 frames
      fpsDisplay = Math.round(1000 / (deltaTime / 60));
    }

    update(deltaTime / 1000); // Pass actual delta time in seconds
    updateConfetti();
    lastFrameTime = currentTime;
  }
  requestAnimationFrame(gameLoop);
}

// Input state
const keys: Record<string, boolean> = {};
let prevJumpKey = false;
let prevSpeedToggleKey = false;
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

gameLoop(); 