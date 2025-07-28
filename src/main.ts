import { multiplayerManager } from './multiplayer.js';

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
interface Collectible extends Rect { collected: boolean; type: 'coin' | 'heart' | 'doublejump' | 'grow'; id: string; }
interface MovingPlatform extends Rect { dx: number; range: number; startX: number; }

// Unique collectible id generator
let collectibleIdCounter = 0;
function generateCollectibleId(type: string) {
  return `${type}_${Date.now()}_${collectibleIdCounter++}`;
}

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

// Multiplayer state
let otherPlayers: Map<string, any> = new Map();
let multiplayerEnabled = localStorage.getItem('multiplayerEnabled') === 'true';
let lastPositionUpdate = 0;
let playerName = localStorage.getItem('playerName') || '';
let playerNameInput: HTMLInputElement | null = null;

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

// --- Level Type Toggle ---
let levelType: 'horizontal' | 'vertical' = localStorage.getItem('levelType') as any || 'horizontal';
let manualLevelType: boolean = localStorage.getItem('manualLevelType') === 'true';
let manualLevelTypeValue: 'horizontal' | 'vertical' = (localStorage.getItem('manualLevelTypeValue') as 'horizontal' | 'vertical') || levelType;

// --- Camera for vertical levels ---
let cameraY = 0;
const LEVEL_HEIGHT = 3200; // for vertical levels

// --- Add a simple UI toggle for level type ---
let levelTypeToggle: HTMLInputElement | null = null;

// --- Vertical Level Generation ---
async function generateVerticalLevel() {
  let y = LEVEL_HEIGHT;
  const platformSpacing = Math.min(JUMP_POWER * 8, 180); // always less than jump distance
  const minPlatformWidth = 140;
  const maxPlatformWidth = 320;
  const platformHeight = 50;
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  let heartPlaced = false;
  let doubleJumpPlaced = false;
  let growPlaced = false;
  const platformCenters: { x: number, y: number }[] = [];
  let lastX = 100 + Math.random() * (canvas.width - minPlatformWidth - 200);
  let isFirst = true;
  while (y > 0) {
    let x, width;
    if (isFirst) {
      // Make the lowest bar screen wide
      x = 0;
      width = canvas.width;
      isFirst = false;
    } else {
      // Randomize platform width
      width = minPlatformWidth + Math.random() * (maxPlatformWidth - minPlatformWidth);
      // Randomize horizontal position, but ensure overlap with previous
      let minX = Math.max(0, lastX - width + 40);
      let maxX = Math.min(canvas.width - width, lastX + width - 40);
      if (minX > maxX) { minX = maxX = lastX; }
      x = minX + Math.random() * (maxX - minX);
    }
    platforms.push({ x, y, width, height: platformHeight });
    platformCenters.push({ x: x + width / 2, y: y - 30 });
    // Add coin collectibles on some platforms
    if (Math.random() < 0.5) {
      collectibles.push({ x: x + width / 2 - 10, y: y - 30, width: 20, height: 20, collected: false, type: 'coin', id: generateCollectibleId('coin') });
    }
    // Add spikes on some platforms
    if (Math.random() < 0.3 && y < LEVEL_HEIGHT - platformSpacing) {
      spikes.push({ x: x + width / 2 - 20, y: y + platformHeight - 15, width: 40, height: 15 });
    }
    // Add moving platforms
    if (Math.random() < 0.2 && y < LEVEL_HEIGHT - platformSpacing) {
      movingPlatforms.push({ x: x - 60, y: y - 100, width: 80, height: 20, dx: 2, range: 120, startX: x - 60 });
    }
    y -= platformSpacing;
    // Add boxes on some platforms
    if (Math.random() < 0.5 && y > 50) {
      boxes.push({ x: x + 10, y: y - 40, width: 40, height: 40 });
    }
    lastX = x;
  }
  // Place a heart collectible on a random platform (at most 1 per level)
  if (platformCenters.length > 0) {
    const idx: number = Math.floor(Math.random() * platformCenters.length);
    const pos = platformCenters[idx];
    collectibles.push({ x: pos.x - 10, y: pos.y, width: 20, height: 20, collected: false, type: 'heart', id: generateCollectibleId('heart') });
  }
  // Place a double jump power-up on a random platform (at most 1 per level, not on heart)
  if (platformCenters.length > 1) {
    let idx: number;
    let attempts = 0;
    const maxAttempts = platformCenters.length * 3;
    do {
      idx = Math.floor(Math.random() * platformCenters.length);
      attempts++;
    } while (
      attempts < maxAttempts &&
      collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y)
    );
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({ x: pos.x - 10, y: pos.y - 30, width: 20, height: 20, collected: false, type: 'doublejump', id: generateCollectibleId('doublejump') });
    }
  }
  // Place a grow power-up on a random platform (at most 1 per level, not on heart or doublejump)
  if (platformCenters.length > 2) {
    let idx: number;
    let attempts = 0;
    const maxAttempts = platformCenters.length * 3;
    do {
      idx = Math.floor(Math.random() * platformCenters.length);
      attempts++;
    } while (
      attempts < maxAttempts && (
        collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y) ||
        collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y - 30)
      )
    );
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({ x: pos.x - 10, y: pos.y - 60, width: 20, height: 20, collected: false, type: 'grow', id: generateCollectibleId('grow') });
    }
  }
  // Ensure a platform at the player spawn point (y = LEVEL_HEIGHT)
  const spawnY = LEVEL_HEIGHT;
  const hasSpawnBlock = platforms.some(plat => plat.y <= spawnY && plat.y + plat.height >= spawnY - 40);
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 100, y: LEVEL_HEIGHT, width: minPlatformWidth + Math.random() * (maxPlatformWidth - minPlatformWidth), height: platformHeight });
  }
  // Place finish flag at the topmost platform
  const lastPlat = platforms[platforms.length - 1];
  finishFlag.x = lastPlat.x + lastPlat.width / 2 - finishFlag.width / 2;
  finishFlag.y = lastPlat.y - finishFlag.height;

  // Register all collectibles with the server for multiplayer
  if (multiplayerEnabled && collectibles.length > 0) {
    const backendUrl =
      window.location.port === '5173'
        ? 'http://localhost:3001/register-collectibles'
        : '/register-collectibles';
    try {
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectibles: collectibles.map(c => ({ id: (c as any).id, type: c.type })) })
      });
    } catch (e) { /* ignore */ }
  }
}

// Patch generateLevel and resetGame to use vertical if selected
if (manualLevelType) {
  levelType = manualLevelTypeValue;
}
async function generateLevel() {
  if (levelType === 'vertical') {
    await generateVerticalLevel();
    return;
  }
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
      collectibles.push({ x: x + platformWidth / 2 - 10, y: GROUND_Y - 30, width: 20, height: 20, collected: false, type: 'coin', id: generateCollectibleId('coin') });
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
    collectibles.push({ x: pos.x - 10, y: pos.y, width: 20, height: 20, collected: false, type: 'heart', id: generateCollectibleId('heart') });
  }
  // Place a double jump power-up on a random platform (at most 1 per level, not on heart)
  if (platformCenters.length > 1) {
    let idx: number;
    let attempts = 0;
    const maxAttempts = platformCenters.length * 3; // Give it reasonable attempts
    
    do { 
      idx = Math.floor(Math.random() * platformCenters.length);
      attempts++;
    } while (
      attempts < maxAttempts && 
      collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y)
    );
    
    // Only place if we found a valid spot
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({ x: pos.x - 10, y: pos.y - 30, width: 20, height: 20, collected: false, type: 'doublejump', id: generateCollectibleId('doublejump') });
    }
  }
  // Place a grow power-up on a random platform (at most 1 per level, not on heart or doublejump)
  if (platformCenters.length > 2) {
    let idx: number;
    let attempts = 0;
    const maxAttempts = platformCenters.length * 3; // Give it reasonable attempts
    
    do { 
      idx = Math.floor(Math.random() * platformCenters.length);
      attempts++;
    } while (
      attempts < maxAttempts && (
        collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y) ||
        collectibles.some(c => c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y - 30)
      )
    );
    
    // Only place if we found a valid spot
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({ x: pos.x - 10, y: pos.y - 60, width: 20, height: 20, collected: false, type: 'grow', id: generateCollectibleId('grow') });
    }
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

  // Register all collectibles with the server for multiplayer
  if (multiplayerEnabled && collectibles.length > 0) {
    const backendUrl =
      window.location.port === '5173'
        ? 'http://localhost:3001/register-collectibles'
        : '/register-collectibles';
    try {
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectibles: collectibles.map(c => ({ id: (c as any).id, type: c.type })) })
      });
    } catch (e) { /* ignore */ }
  }
}
generateLevel().then(() => resetPlayer());

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

// Total points system for upgrades
let totalPoints = Number(localStorage.getItem('totalPoints') || '0');
let playerCharacter = localStorage.getItem('playerCharacter') || 'SQUARE'; // Default yellow square (original)
let purchasedUpgrades: Record<string, boolean> = JSON.parse(localStorage.getItem('purchasedUpgrades') || '{}');

// Available upgrades and their costs
const UPGRADES = {
  characters: [
    { id: 'yellow_square', emoji: 'SQUARE', name: 'Yellow Square', cost: 0, unlocked: true },
    { id: 'yellow_circle', emoji: '🟡', name: 'Yellow Circle', cost: 10 },
    { id: 'red_circle', emoji: '🔴', name: 'Red Circle', cost: 50 },
    { id: 'blue_circle', emoji: '🔵', name: 'Blue Circle', cost: 50 },
    { id: 'green_circle', emoji: '🟢', name: 'Green Circle', cost: 50 },
    { id: 'smiley', emoji: '😊', name: 'Smiley Face', cost: 100 },
    { id: 'cool', emoji: '😎', name: 'Cool Face', cost: 150 },
    { id: 'star', emoji: '⭐', name: 'Star', cost: 200 },
    { id: 'crown', emoji: '👑', name: 'Crown', cost: 300 },
    { id: 'rocket', emoji: '🚀', name: 'Rocket', cost: 500 },
    { id: 'alien', emoji: '👽', name: 'Alien', cost: 750 },
  ],
  gameplay: [
    { id: 'extra_life', name: 'Start with Extra Life', cost: 100, description: 'Begin each game with 4 lives instead of 3' },
    { id: 'double_jump_start', name: 'Start with Double Jump', cost: 200, description: 'Begin each level with double jump ability' },
    { id: 'speed_boost', name: 'Permanent Speed Boost', cost: 300, description: '1.5x movement speed permanently' },
    { id: 'lucky_coins', name: 'Lucky Coins', cost: 400, description: 'Coins are worth 2 points each' },
    { id: 'tough_skin', name: 'Tough Skin', cost: 500, description: 'Start each game with 5 lives instead of 3' },
  ]
};

function setTopScore(newScore: number) {
  if (newScore > topScore) {
    topScore = newScore;
    localStorage.setItem('topScore', String(topScore));
  }
}

// Total points management
function addTotalPoints(points: number) {
  totalPoints += points;
  localStorage.setItem('totalPoints', String(totalPoints));
}

function spendTotalPoints(points: number): boolean {
  if (totalPoints >= points) {
    totalPoints -= points;
    localStorage.setItem('totalPoints', String(totalPoints));
    return true;
  }
  return false;
}

function purchaseUpgrade(upgradeId: string): boolean {
  if (purchasedUpgrades[upgradeId]) {
    return false; // Already purchased
  }
  
  // Find upgrade cost
  let cost = 0;
  let found = false;
  
  // Check character upgrades
  for (const char of UPGRADES.characters) {
    if (char.id === upgradeId) {
      cost = char.cost;
      found = true;
      break;
    }
  }
  
  // Check gameplay upgrades
  if (!found) {
    for (const upgrade of UPGRADES.gameplay) {
      if (upgrade.id === upgradeId) {
        cost = upgrade.cost;
        found = true;
        break;
      }
    }
  }
  
  if (!found || !spendTotalPoints(cost)) {
    return false;
  }
  
  purchasedUpgrades[upgradeId] = true;
  localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
  
  // Handle character purchases
  if (UPGRADES.characters.some(c => c.id === upgradeId)) {
    const character = UPGRADES.characters.find(c => c.id === upgradeId);
    if (character) {
      playerCharacter = character.emoji;
      localStorage.setItem('playerCharacter', playerCharacter);
    }
  }
  
  return true;
}

// Shop modal functions
function openShopModal() {
  const shopModal = document.getElementById('shop-modal');
  if (shopModal) {
    shopModal.style.display = 'flex';
    // Hide GitHub star button to prevent touch interference on mobile
    const githubStarBtn = document.getElementById('github-star-btn');
    if (githubStarBtn) githubStarBtn.style.display = 'none';
    updateShopDisplay();
  }
}

function updateShopDisplay() {
  // Update points display
  const pointsEl = document.getElementById('shop-points');
  if (pointsEl) {
    pointsEl.textContent = String(totalPoints);
  }
  
  // Update character upgrades
  const characterContainer = document.getElementById('character-upgrades');
  if (characterContainer) {
    characterContainer.innerHTML = '';
    
    UPGRADES.characters.forEach(char => {
      const isOwned = char.unlocked || purchasedUpgrades[char.id];
      const isSelected = playerCharacter === char.emoji;
      const canAfford = totalPoints >= char.cost;
      
      const charDiv = document.createElement('div');
      charDiv.style.cssText = `
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:12px;
        border-radius:8px;
        border:2px solid ${isSelected ? '#ffd700' : (isOwned ? '#0cf' : '#666')};
        background:${isSelected ? 'rgba(255,215,0,0.1)' : (isOwned ? 'rgba(0,204,255,0.1)' : '#333')};
        cursor:pointer;
        transition:all 0.2s;
      `;
      
      charDiv.innerHTML = `
        <div style="font-size:2em;margin-bottom:8px;">${char.emoji === 'SQUARE' ? '🟨' : char.emoji}</div>
        <div style="font-size:0.9em;text-align:center;margin-bottom:4px;">${char.name}</div>
        <div style="font-size:0.8em;color:${isOwned ? '#0cf' : (canAfford ? '#ffd700' : '#999')};">
          ${isOwned ? (isSelected ? 'Selected' : 'Owned') : `${char.cost} pts`}
        </div>
      `;
      
      charDiv.addEventListener('click', () => {
        if (isOwned) {
          // Select this character
          playerCharacter = char.emoji;
          localStorage.setItem('playerCharacter', playerCharacter);
          updateShopDisplay();
        } else if (canAfford) {
          // Purchase this character
          if (purchaseUpgrade(char.id)) {
            updateShopDisplay();
          }
        }
      });
      
      characterContainer.appendChild(charDiv);
    });
  }
  
  // Update gameplay upgrades
  const gameplayContainer = document.getElementById('gameplay-upgrades');
  if (gameplayContainer) {
    gameplayContainer.innerHTML = '';
    
    UPGRADES.gameplay.forEach(upgrade => {
      const isOwned = purchasedUpgrades[upgrade.id];
      const canAfford = totalPoints >= upgrade.cost;
      
      const upgradeDiv = document.createElement('div');
      upgradeDiv.style.cssText = `
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:16px;
        border-radius:8px;
        border:2px solid ${isOwned ? '#0cf' : '#666'};
        background:${isOwned ? 'rgba(0,204,255,0.1)' : '#333'};
        ${!isOwned && canAfford ? 'cursor:pointer;' : ''}
        transition:all 0.2s;
      `;
      
      upgradeDiv.innerHTML = `
        <div>
          <div style="font-weight:bold;margin-bottom:4px;">${upgrade.name}</div>
          <div style="font-size:0.9em;color:#ccc;">${upgrade.description}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.2em;color:${isOwned ? '#0cf' : (canAfford ? '#ffd700' : '#999')};">
            ${isOwned ? '✓ Owned' : `${upgrade.cost} pts`}
          </div>
        </div>
      `;
      
      if (!isOwned && canAfford) {
        upgradeDiv.addEventListener('click', () => {
          if (purchaseUpgrade(upgrade.id)) {
            updateShopDisplay();
          }
        });
      }
      
      gameplayContainer.appendChild(upgradeDiv);
    });
  }
}

function resetGame() {
  score = 0;
  level = 1;
  // Apply purchased upgrades to starting lives
  lives = 3;
  if (purchasedUpgrades['extra_life']) {
    lives = 4;
  }
  if (purchasedUpgrades['tough_skin']) {
    lives = 5;
  }
  localStorage.setItem('levelType', 'horizontal');
  gameOver = false;
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  // Do not reset manualLevelType or manualLevelTypeValue here
  if (manualLevelType) {
    levelType = manualLevelTypeValue;
  } else {
    levelType = 'horizontal';
  }
  generateLevel();
  
  // Apply purchased upgrades
  if (purchasedUpgrades['double_jump_start']) {
    player.hasDoubleJump = true;
  }
  
  resetPlayer();
}

function resetPlayer() {
  // console.log('resetPlayer() called. Current levelType:', levelType);
  // console.trace('resetPlayer() call stack');
  if (levelType === 'vertical') {
    // Always use the first platform (lowest, screen-wide) for spawn
    const bottomPlatform = platforms[0];
    // console.log('Using platform[0] for spawn:', bottomPlatform);
    player.x = bottomPlatform.x + bottomPlatform.width / 2 - player.width / 2;
    player.y = bottomPlatform.y - player.height;
    // console.log('Player repositioned to:', { x: player.x, y: player.y });
    player.vx = 0;
    player.vy = 0;
    // Calculate scale as in draw()
    const widest = Math.max(...platforms.map(p => p.width));
    const levelW = Math.max(canvas.width, widest);
    const scale = canvas.width / levelW;
    const visibleHeight = canvas.height / scale;
    // Set cameraY so the player's feet are just above the bottom edge, but don't scroll past the bottom of the level
    cameraY = Math.min(
      Math.max(0, player.y + player.height - visibleHeight + 8),
      LEVEL_HEIGHT - visibleHeight
    );
  } else {
    player.x = 100;
    player.y = GROUND_Y - 175;
    player.vx = 0;
    player.vy = 0;
  }
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
  level++;
  
  let isBonusLevel = false;
  
  // Manual override
  if (manualLevelType) {
    levelType = manualLevelTypeValue;
  } else {
    // Always start horizontal, then every fifth level is bonus, then every third level is vertical
    if (level === 1) {
      levelType = 'horizontal';
    } else if (level % 5 === 0) {
      // console.log('Bonus level condition triggered, calling generateBonusVerticalLevel()');
      generateBonusVerticalLevel();
      // Don't call resetPlayer() since generateBonusVerticalLevel() already positions the player correctly
      // console.log('Setting isBonusLevel = true and returning early');
      isBonusLevel = true;
    } else if (level % 3 === 0) {
      levelType = 'vertical';
    } else {
      levelType = 'horizontal';
    }
  }
  
  if (isBonusLevel) {
    // Skip the rest of the function for bonus levels
    launchConfetti();
    nextLevelPending = false;
    nextLevelTimer = 0;
    return;
  }
  
  localStorage.setItem('levelType', levelType);
  if (levelTypeToggle && levelTypeToggle instanceof HTMLInputElement) {
    levelTypeToggle.checked = manualLevelType && manualLevelTypeValue === 'vertical';
  }
  generateLevel();
  // console.log('About to call resetPlayer() at line 528 - this should not happen after bonus level');
  resetPlayer();

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
  const speedMultiplier = currentSpeedMultiplier * (purchasedUpgrades['speed_boost'] ? 1.5 : 1);
  if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -MOVE_SPEED * speedMultiplier * deltaTime * 60;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx = MOVE_SPEED * speedMultiplier * deltaTime * 60;

  // Jump (continuous while key is held)
  const jumpKey = keys['ArrowUp'] || keys['Space'] || keys['KeyW'];
  
  // Update jump cooldown
  if (jumpCooldown > 0) {
    jumpCooldown--;
  }
  
  if (jumpKey && jumpCooldown === 0) {
    if (player.onGround) {
      player.vy = -JUMP_POWER;
      player.onGround = false;
      if (player.hasDoubleJump) player.canDoubleJump = true;
      jumpCooldown = 8; // Small cooldown to prevent infinite jumping
    } else if (player.hasDoubleJump && player.canDoubleJump) {
      player.vy = -JUMP_POWER;
      player.canDoubleJump = false;
      jumpCooldown = 8; // Cooldown for double jump too
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
      if (multiplayerEnabled) {
        multiplayerManager.collectItem((c as any).id);
      }
      if (c.type === 'coin') {
        const coinValue = purchasedUpgrades['lucky_coins'] ? 2 : 1;
        score++;
        addTotalPoints(coinValue);
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
  if (levelType === 'horizontal' && player.y > canvas.height + 100) {
    respawnPlayer();
  }
  // End of level
  if (levelType === 'horizontal') {
    if (player.x + player.width >= levelEndX && !nextLevelPending) {
      startNextLevelWithConfetti();
    }
  } else if (levelType === 'vertical') {
    // Check collision with finish flag
    if (!nextLevelPending &&
      player.x + player.width > finishFlag.x &&
      player.x < finishFlag.x + finishFlag.width &&
      player.y + player.height > finishFlag.y &&
      player.y < finishFlag.y + finishFlag.height) {
      // console.log('Finish flag collision detected!');
      // console.log('Player bounds:', { 
      //   left: player.x, 
      //   right: player.x + player.width, 
      //   top: player.y, 
      //   bottom: player.y + player.height 
      // });
      // console.log('Flag bounds:', { 
      //   left: finishFlag.x, 
      //   right: finishFlag.x + finishFlag.width, 
      //   top: finishFlag.y, 
      //   bottom: finishFlag.y + finishFlag.height 
      // });
      startNextLevelWithConfetti();
    }
  }
  // --- Camera follows player ---
  if (levelType === 'vertical') {
    cameraY = player.y - canvas.height / 2 + player.height / 2;
    cameraY = Math.max(0, Math.min(cameraY, LEVEL_HEIGHT - canvas.height));
    cameraX = 0;
  } else {
    cameraX = player.x - canvas.width / 2 + player.width / 2;
    cameraX = Math.max(0, Math.min(cameraX, LEVEL_WIDTH - canvas.width));
    cameraY = 0;
  }

  if (levelType === 'vertical') {
    const widest = Math.max(...platforms.map(p => p.width));
    const levelW = Math.max(canvas.width, widest);
    const scale = canvas.width / levelW;
    // Clamp player.x so they cannot move off screen
    player.x = Math.max(0, Math.min(player.x, levelW - player.width));
  } else {
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > LEVEL_WIDTH) player.x = LEVEL_WIDTH - player.width;
  }
  
  // Send multiplayer updates (throttled)
  if (multiplayerEnabled && Date.now() - lastPositionUpdate > 50) { // Update every 50ms
    multiplayerManager.updatePlayerPosition(
      player.x, 
      player.y, 
      player.width, 
      player.height, 
      player.growLevel
    );
    lastPositionUpdate = Date.now();
  }
}

// --- Tesla Detection and Onscreen Controls Logic ---
function isTeslaBrowser() {
  // Tesla browser user agent contains 'Tesla' or 'QtCarBrowser'
  return /Tesla|QtCarBrowser/i.test(navigator.userAgent);
}
let teslaMode = localStorage.getItem('teslaMode') === 'true';
function shouldShowOnscreenControls() {
  return isTeslaBrowser() || teslaMode || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
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

// Version injection globals
// @ts-ignore
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'unknown';
// @ts-ignore
const COMMITHASH = typeof __COMMITHASH__ !== 'undefined' ? __COMMITHASH__ : 'unknown';
// @ts-ignore
const BRANCH = typeof __BRANCH__ !== 'undefined' ? __BRANCH__ : 'unknown';
// @ts-ignore
const GITTAG = typeof __GITTAG__ !== 'undefined' ? __GITTAG__ : 'none';
// @ts-ignore
const BUILDDATE = typeof __BUILDDATE__ !== 'undefined' ? __BUILDDATE__ : 'unknown';

window.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const fixedGradientToggle = document.getElementById('fixed-gradient-toggle') as HTMLInputElement;
  const scrollGradientToggle = document.getElementById('scroll-gradient-toggle') as HTMLInputElement;
  const imageBgToggle = document.getElementById('image-bg-toggle') as HTMLInputElement;
  const speedUnlockToggle = document.getElementById('speed-unlock-toggle') as HTMLInputElement;
  const fpsCounterToggle = document.getElementById('fps-counter-toggle') as HTMLInputElement;
  const teslaModeToggle = document.getElementById('tesla-mode-toggle') as HTMLInputElement;
  const multiplayerToggle = document.getElementById('multiplayer-toggle') as HTMLInputElement;
  playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
  levelTypeToggle = document.getElementById('level-type-toggle') as HTMLInputElement;
  if (settingsBtn && settingsModal && closeSettings && fixedGradientToggle && scrollGradientToggle && imageBgToggle && speedUnlockToggle && fpsCounterToggle && teslaModeToggle && multiplayerToggle && playerNameInput && levelTypeToggle) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
      // Hide GitHub star button to prevent touch interference on mobile
      const githubStarBtn = document.getElementById('github-star-btn');
      if (githubStarBtn) githubStarBtn.style.display = 'none';
      
      fixedGradientToggle.checked = fixedGradient;
      scrollGradientToggle.checked = scrollGradient;
      imageBgToggle.checked = imageBg;
      speedUnlockToggle.checked = speedUnlocked;
      fpsCounterToggle.checked = showFpsCounter;
      teslaModeToggle.checked = teslaMode;
      multiplayerToggle.checked = multiplayerEnabled;
      if (playerNameInput) playerNameInput.value = playerName;
      // Set the level type toggle state
      if (levelTypeToggle) levelTypeToggle.checked = manualLevelType && manualLevelTypeValue === 'vertical';
    });
    closeSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
      // Show GitHub star button again
      const githubStarBtn = document.getElementById('github-star-btn');
      if (githubStarBtn) githubStarBtn.style.display = 'flex';
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
    teslaModeToggle.addEventListener('change', () => {
      teslaMode = teslaModeToggle.checked;
      localStorage.setItem('teslaMode', String(teslaMode));
      updateOnscreenControlsVisibility();
    });
    multiplayerToggle.addEventListener('change', () => {
      multiplayerEnabled = multiplayerToggle.checked;
      localStorage.setItem('multiplayerEnabled', String(multiplayerEnabled));
      window.location.reload(); // Reload to re-init multiplayer
    });
    levelTypeToggle.addEventListener('change', () => {
      manualLevelType = levelTypeToggle!.checked;
      if (manualLevelType) {
        manualLevelTypeValue = 'vertical';
        levelType = 'vertical';
      } else {
        // revert to auto mode and force horizontal immediately
        manualLevelTypeValue = 'horizontal';
        levelType = 'horizontal';
      }
      localStorage.setItem('manualLevelType', String(manualLevelType));
      localStorage.setItem('manualLevelTypeValue', manualLevelTypeValue);
      localStorage.setItem('levelType', levelType);
      resetGame();
    });
    if (playerNameInput) {
      playerNameInput.addEventListener('input', () => {
        playerName = playerNameInput!.value.slice(0, 12);
        localStorage.setItem('playerName', playerName);
      });
    }
  }
  
  // Shop modal handling
  const shopBtn = document.getElementById('shop-btn');
  const shopModal = document.getElementById('shop-modal');
  const closeShop = document.getElementById('close-shop');
  
  if (shopBtn && shopModal && closeShop) {
    shopBtn.addEventListener('click', () => {
      openShopModal();
    });
    
    closeShop.addEventListener('click', () => {
      shopModal.style.display = 'none';
      // Show GitHub star button again
      const githubStarBtn = document.getElementById('github-star-btn');
      if (githubStarBtn) githubStarBtn.style.display = 'flex';
    });
  }
  
  // Set version in settings modal if present
  const versionEl = document.querySelector('.version-string, #version, .version, #version-string') as HTMLElement;
  if (versionEl) {
    versionEl.textContent = `Version: ${VERSION} (tag: ${GITTAG}, ${BRANCH}, ${COMMITHASH}, built: ${BUILDDATE})`;
  }
  updateOnscreenControlsVisibility();
});

function updateOnscreenControlsVisibility() {
  const onscreenControls = document.getElementById('onscreen-controls');
  const desktopCopyright = document.getElementById('desktop-copyright');
  const show = shouldShowOnscreenControls();
  if (onscreenControls) {
    onscreenControls.style.display = show ? 'flex' : 'none';
  }
  if (desktopCopyright) {
    desktopCopyright.style.display = show ? 'none' : 'block';
  }
}

// --- Onscreen Controls Setup (was setupMobileControls) ---
function setupOnscreenControls() {
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnJump = document.getElementById('btn-jump');
  if (btnLeft && btnRight && btnJump) {
    btnLeft.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; }, { passive: false });
    btnLeft.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowLeft'] = false; }, { passive: false });
    btnRight.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; }, { passive: false });
    btnRight.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowRight'] = false; }, { passive: false });
    btnJump.addEventListener('touchstart', e => { e.preventDefault(); keys['Space'] = true; }, { passive: false });
    btnJump.addEventListener('touchend', e => { e.preventDefault(); keys['Space'] = false; }, { passive: false });
    // Also support mouse for Tesla browser
    btnLeft.addEventListener('mousedown', e => { e.preventDefault(); keys['ArrowLeft'] = true; });
    btnLeft.addEventListener('mouseup', e => { e.preventDefault(); keys['ArrowLeft'] = false; });
    btnRight.addEventListener('mousedown', e => { e.preventDefault(); keys['ArrowRight'] = true; });
    btnRight.addEventListener('mouseup', e => { e.preventDefault(); keys['ArrowRight'] = false; });
    btnJump.addEventListener('mousedown', e => { e.preventDefault(); keys['Space'] = true; });
    btnJump.addEventListener('mouseup', e => { e.preventDefault(); keys['Space'] = false; });
  }
}
setupOnscreenControls();
updateOnscreenControlsVisibility();

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
  let scale = 1;
  if (levelType === 'vertical') {
    // Zoom out to fit the full horizontal level
    const widest = Math.max(...platforms.map(p => p.width));
    const levelW = Math.max(canvas.width, widest);
    scale = canvas.width / levelW;
    // Center cameraX on player, but clamp so player stays visible
    cameraX = Math.max(0, Math.min(player.x + player.width / 2 - (canvas.width / (2 * scale)), levelW - canvas.width / scale));
    // Clamp cameraY as before
    cameraY = Math.max(0, Math.min(player.y + player.height / 2 - (canvas.height / (2 * scale)), LEVEL_HEIGHT - canvas.height / scale));
    ctx.scale(scale, scale);
  }
  ctx.translate(-cameraX, -cameraY);
  // Draw platforms
  ctx.fillStyle = '#654321';
  let lowestPlatformIndex = -1;
  if (levelType === 'vertical' && platforms.length > 0) {
    let maxY = -Infinity;
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].y > maxY) {
        maxY = platforms[i].y;
        lowestPlatformIndex = i;
      }
    }
  }
  for (let i = 0; i < platforms.length; i++) {
    const plat = platforms[i];
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
    // Draw up-arrow on the visually lowest platform in vertical mode
    if (levelType === 'vertical' && i === lowestPlatformIndex) {
      ctx.save();
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.85;
      ctx.fillText('↑', plat.x + plat.width / 2, plat.y + plat.height / 2);
      ctx.globalAlpha = 1;
      ctx.restore();
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
  
  // Draw player character (original square or custom emoji)
  ctx.save();
  if (playerCharacter === 'SQUARE') {
    // Draw original yellow rectangle
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x - cameraX, player.y - cameraY, player.width, player.height);
  } else {
    // Draw custom emoji character
    ctx.font = `${Math.min(player.width, player.height)}px serif`;
    ctx.textAlign = 'center';
    
    // Check if this is a circle character that should "roll" on platforms
    const isCircleCharacter = ['🟡', '🔴', '🔵', '🟢'].includes(playerCharacter);
    
    if (isCircleCharacter) {
      // For circle characters, position them to sit on the platform surface
      // Use 'middle' baseline but adjust Y position downward to account for emoji rendering
      ctx.textBaseline = 'middle';
      ctx.fillText(
        playerCharacter, 
        player.x - cameraX + player.width / 2, 
        player.y - cameraY + player.height - 20  // Move down by 20 pixels to sit on platform
      );
    } else {
      // For other characters, keep them centered in the hitbox
      ctx.textBaseline = 'middle';
      ctx.fillText(
        playerCharacter, 
        player.x - cameraX + player.width / 2, 
        player.y - cameraY + player.height / 2
      );
    }
  }
  ctx.restore();
  
  ctx.globalAlpha = 1;
  // Draw other players
  ctx.save();
  ctx.fillStyle = '#0cf'; // Distinct color for other players
  // Find highest score among all players (including yourself)
  let highestScore = score;
  let highestPlayerIds: string[] = [];
  for (const other of otherPlayers.values()) {
    if (typeof other.score === 'number' && other.score > highestScore) {
      highestScore = other.score;
      highestPlayerIds = [other.id];
    } else if (typeof other.score === 'number' && other.score === highestScore) {
      highestPlayerIds.push(other.id);
    }
  }
  if (score === highestScore) highestPlayerIds.push('self');
  for (const other of otherPlayers.values()) {
    ctx.fillRect(other.x - cameraX, other.y - cameraY, other.width, other.height);
    // Draw name and crown above player only in multiplayer mode
    if (multiplayerEnabled && otherPlayers.size > 0 && other.name) {
      ctx.save();
      ctx.font = '16px sans-serif';
      if (highestPlayerIds.includes(other.id)) {
        ctx.fillStyle = 'gold';
        ctx.fillText('👑', other.x - cameraX + other.width / 2, other.y - 22);
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.textAlign = 'center';
      ctx.fillText(other.name, other.x - cameraX + other.width / 2, other.y - 8);
      ctx.restore();
    }
  }
  ctx.restore();
  // Draw your own name
  if (multiplayerEnabled && otherPlayers.size > 0) {
    ctx.save();
    ctx.font = '16px sans-serif';
    if (highestPlayerIds.includes('self')) {
      ctx.fillStyle = 'gold';
      ctx.fillText('👑', player.x - cameraX + player.width / 2, player.y - 22);
    } else {
      ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'center';
    ctx.fillText(playerName || 'Player', player.x - cameraX + player.width / 2, player.y - 8);
    ctx.restore();
  }
  // Draw UI overlay
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Top Score: ${topScore}`, 20, 60);
  ctx.fillText(`Level: ${level}`, 20, 90);
  ctx.fillStyle = '#ffd700'; // Gold color for total points
  ctx.fillText(`Total Points: ${totalPoints}`, 20, 120);
  ctx.fillStyle = '#fff'; // Reset color
  let nextY = 150;
  if (showFpsCounter) {
    ctx.fillText(`FPS: ${fpsDisplay}`, 20, nextY);
    nextY += 30;
  }
  if (speedUnlocked) {
    ctx.fillStyle = '#0cf';
    ctx.fillText(`Speed: ${currentSpeedMultiplier}x`, 20, nextY);
    ctx.fillStyle = '#fff';
  }
  // Draw leaderboard (top-right) only in multiplayer mode with >1 player
  if (multiplayerEnabled && otherPlayers.size > 0) {
    // --- Leaderboard ---
    // Deduplicate by player id (self and others)
    const leaderboardMap = new Map();
    // Add self
    leaderboardMap.set(multiplayerManager.currentPlayerId, { id: multiplayerManager.currentPlayerId, name: playerName || 'Player', score, isSelf: true });
    // Add others, but skip if id matches self
    for (const p of otherPlayers.values()) {
      if (p.id !== multiplayerManager.currentPlayerId) {
        leaderboardMap.set(p.id, { id: p.id, name: p.name || 'Player', score: typeof p.score === 'number' ? p.score : 0, isSelf: false });
      }
    }
    const leaderboardPlayers = Array.from(leaderboardMap.values());
    leaderboardPlayers.sort((a, b) => b.score - a.score);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width - 240, 20, 220, 36 + 32 * Math.min(5, leaderboardPlayers.length));
    ctx.globalAlpha = 1;
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', canvas.width - 225, 44);
    for (let i = 0; i < Math.min(5, leaderboardPlayers.length); i++) {
      const p = leaderboardPlayers[i];
      ctx.font = p.isSelf ? 'bold 18px sans-serif' : '18px sans-serif';
      ctx.fillStyle = p.isSelf ? '#0cf' : (i === 0 ? 'gold' : '#fff');
      const crown = i === 0 ? '👑 ' : '';
      ctx.fillText(`${crown}${p.name.slice(0, 12)}`, canvas.width - 225, 76 + i * 32);
      ctx.textAlign = 'right';
      ctx.fillText(String(p.score), canvas.width - 30, 76 + i * 32);
      ctx.textAlign = 'left';
    }
    ctx.restore();
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
    
    // Draw semi-transparent grey background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
    
    // Draw border around the background
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
    
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
  ctx.translate(-cameraX, -cameraY);
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
let jumpCooldown = 0; // Cooldown for continuous jumping
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// --- Mobile Controls ---
// This function is now redundant as onscreen controls are always shown
// function setupMobileControls() {
//   const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
//   if (!isMobile) return;
//   const btnLeft = document.getElementById('btn-left');
//   const btnRight = document.getElementById('btn-right');
//   const btnJump = document.getElementById('btn-jump');
//   if (btnLeft && btnRight && btnJump) {
//     btnLeft.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; });
//     btnLeft.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowLeft'] = false; });
//     btnRight.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; });
//     btnRight.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowRight'] = false; });
//     btnJump.addEventListener('touchstart', e => { e.preventDefault(); keys['Space'] = true; });
//     btnJump.addEventListener('touchend', e => { e.preventDefault(); keys['Space'] = false; });
//   }
// }
// setupMobileControls();

// Initialize multiplayer (optional)
if (multiplayerEnabled) {
  (async () => {
    try {
      // The multiplayer manager will auto-detect the correct server URL
      const enabled = await multiplayerManager.initialize();
      if (enabled) {
        console.log('Multiplayer enabled!');
        // Set up multiplayer event handlers
        multiplayerManager.onGameStateUpdate((gameState) => {
          // Update other players' positions
          otherPlayers.clear();
          gameState.players.forEach((playerData: any) => {
            if (playerData.id !== multiplayerManager.currentPlayerId) {
              otherPlayers.set(playerData.id, playerData);
            } else {
              // Update your own name and score from server
              if (playerData.name && playerData.name !== playerName) {
                playerName = playerData.name;
                localStorage.setItem('playerName', playerName);
                if (playerNameInput) playerNameInput.value = playerName;
              }
              if (typeof playerData.score === 'number') {
                score = playerData.score;
              }
            }
          });
        });
        multiplayerManager.onPlayerJoined((playerId) => {
          console.log(`Player ${playerId} joined the game!`);
        });
        multiplayerManager.onPlayerLeft((playerId) => {
          console.log(`Player ${playerId} left the game`);
          otherPlayers.delete(playerId);
        });
        multiplayerManager.onPlayerUpdate((playerId, position, scoreFromServer, nameFromServer) => {
          if (otherPlayers.has(playerId)) {
            const player = otherPlayers.get(playerId);
            Object.assign(player, position);
            if (typeof scoreFromServer === 'number') player.score = scoreFromServer;
            if (typeof nameFromServer === 'string') player.name = nameFromServer;
          } else {
            otherPlayers.set(playerId, { id: playerId, ...position, score: scoreFromServer, name: nameFromServer });
          }
          // If this is you, update your score and name
          if (playerId === multiplayerManager.currentPlayerId) {
            if (typeof scoreFromServer === 'number') score = scoreFromServer;
            if (typeof nameFromServer === 'string' && nameFromServer !== playerName) {
              playerName = nameFromServer;
              localStorage.setItem('playerName', playerName);
              if (playerNameInput) playerNameInput.value = playerName;
            }
          }
        });
      } else {
        console.log('Running in single-player mode');
      }
    } catch (error) {
      console.log('Multiplayer initialization failed, continuing in single-player mode');
    }
  })();
} else {
  console.log('Running in single-player mode');
}

gameLoop(); 

// --- Bonus Level Generation ---
function generateBonusVerticalLevel() {
  // Clear all arrays
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;

  // Solid floor
  platforms.push({ x: 0, y: LEVEL_HEIGHT, width: canvas.width, height: 50 });

  // Fill the level with coins (grid)
  const coinSpacingX = 60;
  const coinSpacingY = 60;
  for (let y = LEVEL_HEIGHT - 100; y > 0; y -= coinSpacingY) {
    for (let x = 20; x < canvas.width - 20; x += coinSpacingX) {
      collectibles.push({ x, y, width: 20, height: 20, collected: false, type: 'coin', id: generateCollectibleId('coin') });
    }
  }

  // Only moving platforms, close to each other, including lower and middle platforms
  const platWidth = 80;
  const platHeight = 20;
  const verticalGap = 60;
  const startY = LEVEL_HEIGHT - 60; // start closer to the floor
  const endY = 80;
  const horizontalGaps = [40, canvas.width / 2 - platWidth / 2, canvas.width - platWidth - 40];
  let platIndex = 0;
  for (let y = startY; y > endY; y -= verticalGap) {
    // More platforms per row in the lower and middle part of the level
    let xs;
    if (y > LEVEL_HEIGHT - 300) {
      // Near the floor, add 3 platforms per row
      xs = horizontalGaps;
    } else if (y > LEVEL_HEIGHT / 2) {
      // Middle, add 3 platforms per row for more density
      xs = horizontalGaps;
    } else {
      // Higher up, alternate left/right
      xs = [40 + (platIndex % 2) * (canvas.width - platWidth - 80)];
    }
    for (const x of xs) {
      movingPlatforms.push({ x, y, width: platWidth, height: platHeight, dx: platIndex % 2 === 0 ? 2 : -2, range: 120, startX: x });
      platIndex++;
    }
  }

  // Add a very large stable beam at the top for the flag
  const JUMP_POWER = 13;
  const jumpLength = JUMP_POWER * 8; // 104
  const topBeamHeight = 50;
  const topBeamY = 40 + jumpLength; // Lowered by one jump length from the top
  const topBeam = { x: 0, y: topBeamY, width: canvas.width, height: topBeamHeight };
  platforms.push(topBeam); // Add to the end so the floor is still platforms[0]
  finishFlag.x = canvas.width / 2 - finishFlag.width / 2;
  finishFlag.y = topBeamY - 80 + topBeamHeight;

  // Set player at the floor (bottom of the level) - left side instead of center
  player.x = 50; // Start near the left edge with some padding
  player.y = LEVEL_HEIGHT - player.height - 10;
  player.vx = 0;
  player.vy = 0;
  setPlayerSizeByGrowLevel();
  cameraY = Math.max(0, LEVEL_HEIGHT - canvas.height);
  levelType = 'vertical';
  
  // Debug logging
  // console.log('Bonus level generated:');
  // console.log('Player position:', { x: player.x, y: player.y, width: player.width, height: player.height });
  // console.log('Finish flag position:', { x: finishFlag.x, y: finishFlag.y, width: finishFlag.width, height: finishFlag.height });
  // console.log('Camera Y:', cameraY);
  // console.log('Level type:', levelType);
  // console.log('Platforms array:', platforms.map((p, i) => ({ index: i, x: p.x, y: p.y, width: p.width, height: p.height })));
  // console.log('Platform[0]:', platforms[0]);
}

// Exportable version for tests (does not mutate global state)
export function generateBonusVerticalLevelForTest(canvasWidth: number) {
  const LEVEL_HEIGHT = 3200;
  const platforms = [{ x: 0, y: LEVEL_HEIGHT, width: canvasWidth, height: 50 }];
  const boxes: any[] = [];
  const spikes: any[] = [];
  const movingPlatforms: any[] = [];
  const collectibles: any[] = [];
  // Fill the level with coins (grid)
  const coinSpacingX = 60;
  const coinSpacingY = 60;
  for (let y = LEVEL_HEIGHT - 100; y > 0; y -= coinSpacingY) {
    for (let x = 20; x < canvasWidth - 20; x += coinSpacingX) {
      collectibles.push({ x, y, width: 20, height: 20, collected: false, type: 'coin', id: `testcoin_${x}_${y}` });
    }
  }
  // Only moving platforms, close to each other, including lower and middle platforms
  const platWidth = 80;
  const platHeight = 20;
  const verticalGap = 60;
  const startY = LEVEL_HEIGHT - 60;
  const endY = 80;
  const horizontalGaps = [40, canvasWidth / 2 - platWidth / 2, canvasWidth - platWidth - 40];
  let platIndex = 0;
  for (let y = startY; y > endY; y -= verticalGap) {
    let xs;
    if (y > LEVEL_HEIGHT - 300) {
      xs = horizontalGaps;
    } else if (y > LEVEL_HEIGHT / 2) {
      xs = [40, canvasWidth - platWidth - 40];
    } else {
      xs = [40 + (platIndex % 2) * (canvasWidth - platWidth - 80)];
    }
    for (const x of xs) {
      movingPlatforms.push({ x, y, width: platWidth, height: platHeight, dx: platIndex % 2 === 0 ? 2 : -2, range: 120, startX: x });
      platIndex++;
    }
  }
  const finishFlag = { x: canvasWidth / 2 - 12, y: 40, width: 24, height: 80 };
  return { platforms, boxes, collectibles, spikes, movingPlatforms, finishFlag };
}

// function addStartBonusLevelButton() {
//   let btn = document.getElementById('start-bonus-level-btn');
//   if (!btn) {
//     btn = document.createElement('button');
//     btn.id = 'start-bonus-level-btn';
//     btn.textContent = 'Start Bonus Level';
//     btn.style.position = 'fixed';
//     btn.style.left = '16px';
//     btn.style.bottom = '16px';
//     btn.style.zIndex = '10001';
//     btn.style.padding = '10px 20px';
//     btn.style.background = '#0cf';
//     btn.style.color = '#fff';
//     btn.style.border = 'none';
//     btn.style.borderRadius = '8px';
//     btn.style.fontSize = '1em';
//     btn.style.cursor = 'pointer';
//     btn.onclick = () => {
//       generateBonusVerticalLevel();
//       gameOver = false;
//       nextLevelPending = false;
//       respawnTimer = 0;
//       lives = 3;
//       score = 0;
//       level = 1;
//       // Don't call resetPlayer() since generateBonusVerticalLevel() already positions the player correctly
//     };
//     document.body.appendChild(btn);
//   }
// }
// addStartBonusLevelButton();
