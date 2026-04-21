import { multiplayerManager } from './multiplayer.js';
import { WebRTCDirect } from './webrtc-direct.js';
import {
  t,
  setLanguage,
  getCurrentLanguage,
  type TranslationData,
} from './translations.js';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// URL parameter parsing for background text
const urlParams = new URLSearchParams(window.location.search);
const backgroundText = urlParams.get('text') || '';

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
interface Collectible extends Rect {
  collected: boolean;
  type: 'coin' | 'heart' | 'doublejump' | 'grow';
  id: string;
}
interface MovingPlatform extends Rect {
  dx: number;
  range: number;
  startX: number;
}
interface Enemy extends Rect {
  dx: number;
  dy: number; // Add vertical velocity for jumping out
  range: number;
  startX: number;
  alive: boolean;
  id: string;
  isJumpingOut: boolean; // Track if enemy is in jumping animation
  type: 'square' | 'circle'; // Add enemy type
}
interface Tube extends Rect {
  id: string;
  hasSpawnedEnemy: boolean;
}
interface RemotePlayerState extends Rect {
  id: string;
  growLevel?: number;
  name?: string;
  score?: number;
}

// Unique collectible id generator
let collectibleIdCounter = 0;
function generateCollectibleId(type: string) {
  return `${type}_${Date.now()}_${collectibleIdCounter++}`;
}

// Unique enemy id generator
let enemyIdCounter = 0;
function generateEnemyId() {
  return `enemy_${Date.now()}_${enemyIdCounter++}`;
}

// Unique tube id generator
let tubeIdCounter = 0;
function generateTubeId() {
  return `tube_${Date.now()}_${tubeIdCounter++}`;
}

const collectibles: Collectible[] = [];
const spikes: Rect[] = [];
const movingPlatforms: MovingPlatform[] = [];
const enemies: Enemy[] = [];
const tubes: Tube[] = [];

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
  eatenEnemy: null as Enemy | null, // Track eaten enemy
};

// Rope animation state
interface RopeAnimation {
  type: 'none' | 'eating' | 'spitting' | 'targeting';
  progress: number; // 0-1
  duration: number; // in milliseconds
  startTime: number;
  targetEnemy: Enemy | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const ropeAnimation: RopeAnimation = {
  type: 'none',
  progress: 0,
  duration: 1000, // 1 second animation
  startTime: 0,
  targetEnemy: null,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
};

// Multiplayer state
let otherPlayers: Map<string, RemotePlayerState> = new Map();
let multiplayerEnabled = localStorage.getItem('multiplayerEnabled') === 'true';
let webRTCEnabled = localStorage.getItem('webRTCEnabled') !== 'false';
let lastPositionUpdate = 0;
/** Separate throttle timestamp for the Direct P2P position updates. */
let lastP2PPositionUpdate = 0;
let playerName = localStorage.getItem('playerName') || '';
let playerNameInput: HTMLInputElement | null = null;

// Direct P2P state (serverless WebRTC — works on GitHub Pages)
const webrtcDirect = WebRTCDirect.isSupported()
  ? new WebRTCDirect({
      onMessage: (data: unknown) => handleP2PMessage(data),
      onConnected: () => {
        console.log('Direct P2P connected!');
        updateP2PUI();
      },
      onDisconnected: () => {
        console.log('Direct P2P disconnected');
        otherPlayers.clear();
        updateP2PUI();
      },
      onError: (err: Error) => {
        console.warn('Direct P2P error:', err.message);
        updateP2PUI();
      },
    })
  : null;

/** Generate a stable player ID for direct P2P mode. */
const p2pLocalPlayerId = (() => {
  let id = localStorage.getItem('p2pPlayerId');
  if (!id) {
    id = 'p2p_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('p2pPlayerId', id);
  }
  return id;
})();

/** Handle a message received from the P2P peer. */
function handleP2PMessage(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const msg = data as Record<string, unknown>;
  if (msg.type === 'playerUpdate') {
    const pid = typeof msg.playerId === 'string' ? msg.playerId : '';
    const rawPosition =
      msg.position && typeof msg.position === 'object'
        ? (msg.position as Record<string, unknown>)
        : undefined;
    const position: Partial<RemotePlayerState> | undefined = rawPosition
      ? {
          x: typeof rawPosition.x === 'number' ? rawPosition.x : undefined,
          y: typeof rawPosition.y === 'number' ? rawPosition.y : undefined,
          width:
            typeof rawPosition.width === 'number'
              ? rawPosition.width
              : undefined,
          height:
            typeof rawPosition.height === 'number'
              ? rawPosition.height
              : undefined,
          growLevel:
            typeof rawPosition.growLevel === 'number'
              ? rawPosition.growLevel
              : undefined,
        }
      : undefined;
    if (!pid || pid === p2pLocalPlayerId) return;
    if (otherPlayers.has(pid)) {
      const player = otherPlayers.get(pid);
      if (!player) return;
      if (position) Object.assign(player, position);
      if (typeof msg.score === 'number') player.score = msg.score;
      if (typeof msg.name === 'string') player.name = msg.name;
    } else {
      otherPlayers.set(pid, {
        id: pid,
        x: position?.x ?? 0,
        y: position?.y ?? 0,
        width: position?.width ?? 40,
        height: position?.height ?? 50,
        growLevel: position?.growLevel,
        score: typeof msg.score === 'number' ? msg.score : undefined,
        name: typeof msg.name === 'string' ? msg.name : undefined,
      });
    }
  } else if (msg.type === 'itemCollected') {
    // In P2P mode each player manages their own score locally — no server authority.
    // We still reflect the peer's score if they send it.
    const pid = typeof msg.playerId === 'string' ? msg.playerId : '';
    if (pid && pid !== p2pLocalPlayerId && otherPlayers.has(pid)) {
      const player = otherPlayers.get(pid);
      if (player && typeof msg.score === 'number') player.score = msg.score;
    }
  }
}

/** Update the Direct P2P UI panels to reflect the current connection state. */
function updateP2PUI(): void {
  const statusEl = document.getElementById('p2p-status');
  const disconnectBtn = document.getElementById(
    'p2p-disconnect-btn'
  ) as HTMLButtonElement | null;
  const createBtn = document.getElementById(
    'p2p-create-btn'
  ) as HTMLButtonElement | null;
  const joinBtn = document.getElementById(
    'p2p-join-btn'
  ) as HTMLButtonElement | null;

  if (!webrtcDirect) {
    if (statusEl)
      statusEl.textContent = 'WebRTC not supported in this browser.';
    return;
  }

  const state = webrtcDirect.state;
  if (statusEl) {
    if (state === 'connected') {
      statusEl.textContent = t('p2pConnected');
      statusEl.style.color = '#4f4';
    } else if (state === 'gathering') {
      statusEl.textContent = t('p2pGathering');
      statusEl.style.color = '#fa0';
    } else if (state === 'waiting-for-answer') {
      statusEl.textContent = t('p2pWaitingAnswer');
      statusEl.style.color = '#fa0';
    } else if (state === 'waiting-for-connection') {
      statusEl.textContent = t('p2pGathering');
      statusEl.style.color = '#fa0';
    } else if (state === 'failed') {
      statusEl.textContent = 'Connection failed. Please try again.';
      statusEl.style.color = '#f44';
    } else {
      statusEl.textContent = '';
      statusEl.style.color = '#aaa';
    }
  }

  const connected = state === 'connected';
  if (disconnectBtn)
    disconnectBtn.style.display = connected ? 'inline-block' : 'none';
  if (createBtn) createBtn.style.display = connected ? 'none' : 'inline-block';
  if (joinBtn) joinBtn.style.display = connected ? 'none' : 'inline-block';

  // Hide offer/join panels once connected
  if (connected) {
    const offerPanel = document.getElementById('p2p-offer-panel');
    const joinPanel = document.getElementById('p2p-join-panel');
    if (offerPanel) offerPanel.style.display = 'none';
    if (joinPanel) joinPanel.style.display = 'none';
  }
}

// Platform types
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface SlopePlatform {
  x: number;
  y: number; // left Y
  width: number;
  height: number;
  endY: number; // right Y
  isSlope: true;
  willHaveEnemies?: boolean; // Optional flag for enemy spawning
}
interface RegularPlatform extends Rect {
  willHaveEnemies?: boolean; // Optional flag for enemy spawning
}
type Platform = RegularPlatform | SlopePlatform;

const platforms: Platform[] = [];
const boxes: Rect[] = [];

// --- Level Type Toggle ---
const storedLevelType = localStorage.getItem('levelType');
let levelType: 'horizontal' | 'vertical' =
  storedLevelType === 'vertical' ? 'vertical' : 'horizontal';
let manualLevelType: boolean =
  localStorage.getItem('manualLevelType') === 'true';
let manualLevelTypeValue: 'horizontal' | 'vertical' =
  (localStorage.getItem('manualLevelTypeValue') as 'horizontal' | 'vertical') ||
  levelType;

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
  enemies.length = 0;
  tubes.length = 0;
  let _heartPlaced = false;
  let _doubleJumpPlaced = false;
  let _growPlaced = false;
  const platformCenters: { x: number; y: number }[] = [];
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
      width =
        minPlatformWidth +
        Math.random() * (maxPlatformWidth - minPlatformWidth);
      // Randomize horizontal position, but ensure overlap with previous
      let minX = Math.max(0, lastX - width + 40);
      let maxX = Math.min(canvas.width - width, lastX + width - 40);
      if (minX > maxX) {
        minX = maxX = lastX;
      }
      x = minX + Math.random() * (maxX - minX);
    }
    platforms.push({ x, y, width, height: platformHeight });
    platformCenters.push({ x: x + width / 2, y: y - 30 });
    // Add coin collectibles on some platforms
    if (Math.random() < 0.5) {
      collectibles.push({
        x: x + width / 2 - 10,
        y: y - 30,
        width: 20,
        height: 20,
        collected: false,
        type: 'coin',
        id: generateCollectibleId('coin'),
      });
    }
    // Add spikes on some platforms
    if (Math.random() < 0.3 && y < LEVEL_HEIGHT - platformSpacing) {
      spikes.push({
        x: x + width / 2 - 20,
        y: y + platformHeight - 15,
        width: 40,
        height: 15,
      });
    }
    // Add moving platforms
    if (Math.random() < 0.2 && y < LEVEL_HEIGHT - platformSpacing) {
      movingPlatforms.push({
        x: x - 60,
        y: y - 100,
        width: 80,
        height: 20,
        dx: 2,
        range: 120,
        startX: x - 60,
      });
    }
    // Note: Enemies are disabled in vertical levels as requested
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
    collectibles.push({
      x: pos.x - 10,
      y: pos.y,
      width: 20,
      height: 20,
      collected: false,
      type: 'heart',
      id: generateCollectibleId('heart'),
    });
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
      collectibles.some(
        (c) =>
          c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y
      )
    );
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({
        x: pos.x - 10,
        y: pos.y - 30,
        width: 20,
        height: 20,
        collected: false,
        type: 'doublejump',
        id: generateCollectibleId('doublejump'),
      });
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
      attempts < maxAttempts &&
      (collectibles.some(
        (c) =>
          c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y
      ) ||
        collectibles.some(
          (c) =>
            c.x === platformCenters[idx].x - 10 &&
            c.y === platformCenters[idx].y - 30
        ))
    );
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({
        x: pos.x - 10,
        y: pos.y - 60,
        width: 20,
        height: 20,
        collected: false,
        type: 'grow',
        id: generateCollectibleId('grow'),
      });
    }
  }
  // Ensure a platform at the player spawn point (y = LEVEL_HEIGHT)
  const spawnY = LEVEL_HEIGHT;
  const hasSpawnBlock = platforms.some(
    (plat) => plat.y <= spawnY && plat.y + plat.height >= spawnY - 40
  );
  if (!hasSpawnBlock) {
    platforms.unshift({
      x: 100,
      y: LEVEL_HEIGHT,
      width:
        minPlatformWidth +
        Math.random() * (maxPlatformWidth - minPlatformWidth),
      height: platformHeight,
    });
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
        body: JSON.stringify({
          collectibles: collectibles.map((c) => ({
            id: c.id,
            type: c.type,
          })),
        }),
      });
    } catch (_e) {
      /* ignore */
    }
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
  // Clear all arrays for horizontal level generation
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  enemies.length = 0;
  tubes.length = 0;

  let x = 0;
  let _heartPlaced = false;
  let _doubleJumpPlaced = false;
  let _growPlaced = false;
  const platformCenters: { x: number; y: number }[] = [];
  let platformIndex = 0;
  while (x < LEVEL_WIDTH) {
    // Determine if this platform will have enemies
    const isFirstPlatform = platformIndex === 0;
    const spawnPlatform = x <= 100 && x + 400 >= 100; // Check if spawn point (x=100) would be on this platform
    const willHaveEnemies =
      !isFirstPlatform && !spawnPlatform && Math.random() < 0.2; // 20% chance for enemy platforms, but never on first or spawn platform

    // Make enemy platforms smaller (half the original size to reduce visual clutter)
    // Regular platforms: 160-320, Enemy platforms: 480-600 (half of original 960-1200)
    const platformWidth = willHaveEnemies
      ? 480 + Math.random() * 120 // Enemy platforms: 480-600px (half of original size)
      : Math.random() < 0.2
        ? 320
        : 160 + Math.random() * 160; // Regular platforms: 160-320px

    let plat: Platform;
    if (Math.random() < 0.25) {
      // 25% chance for a slope
      // Slope up or down, max ±40px over the width
      const slopeDelta =
        (Math.random() < 0.5 ? 1 : -1) * (20 + Math.random() * 20);
      plat = {
        x,
        y: GROUND_Y,
        width: platformWidth,
        height: 50,
        endY: GROUND_Y + slopeDelta,
        isSlope: true,
        willHaveEnemies, // Add flag to track which platforms should have enemies
      };
    } else {
      plat = {
        x,
        y: GROUND_Y,
        width: platformWidth,
        height: 50,
        willHaveEnemies, // Add flag to track which platforms should have enemies
      };
    }
    platforms.push(plat);
    // Save platform center for possible heart placement
    platformCenters.push({ x: x + platformWidth / 2, y: GROUND_Y - 30 });
    // Add coin collectibles on some platforms
    if (Math.random() < 0.5) {
      collectibles.push({
        x: x + platformWidth / 2 - 10,
        y: GROUND_Y - 30,
        width: 20,
        height: 20,
        collected: false,
        type: 'coin',
        id: generateCollectibleId('coin'),
      });
    }
    // Add spikes in some gaps
    if (Math.random() < 0.3 && x > 0) {
      spikes.push({ x: x - 40, y: GROUND_Y + 35, width: 40, height: 15 });
    }
    // Add moving platforms
    if (Math.random() < 0.2 && x > 0) {
      movingPlatforms.push({
        x: x - 60,
        y: GROUND_Y - 100,
        width: 80,
        height: 20,
        dx: 2,
        range: 120,
        startX: x - 60,
      });
    }
    // Add spawn tubes only on platforms designated for enemies
    if (plat.willHaveEnemies && platformWidth > 200) {
      const tubeWidth = 40; // Larger tube
      const tubeHeight = 80; // Longer tube - extends from below platform up through it

      // Calculate random position within the platform, with some padding to avoid edges
      const padding = 40; // Minimum distance from platform edges
      const minTubeX = x + padding;
      const maxTubeX = x + platformWidth - tubeWidth - padding;
      const tubeX = minTubeX + Math.random() * Math.max(0, maxTubeX - minTubeX);

      const tubeY = GROUND_Y - 60; // Position tube to start deeper below floor for longer appearance

      // Add the spawn tube
      tubes.push({
        x: tubeX,
        y: tubeY,
        width: tubeWidth,
        height: tubeHeight,
        id: generateTubeId(),
        hasSpawnedEnemy: false,
      });
    }
    x += platformWidth;
    const gap = 60 + Math.random() * 80;
    x += gap;
    if (Math.random() < 0.5 && x < LEVEL_WIDTH - 50) {
      boxes.push({ x: x + 10, y: GROUND_Y - 40, width: 40, height: 40 });
    }
    platformIndex++;
  }
  // Place a heart collectible on a random platform (at most 1 per level)
  if (platformCenters.length > 0) {
    const idx: number = Math.floor(Math.random() * platformCenters.length);
    const pos = platformCenters[idx];
    collectibles.push({
      x: pos.x - 10,
      y: pos.y,
      width: 20,
      height: 20,
      collected: false,
      type: 'heart',
      id: generateCollectibleId('heart'),
    });
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
      collectibles.some(
        (c) =>
          c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y
      )
    );

    // Only place if we found a valid spot
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({
        x: pos.x - 10,
        y: pos.y - 30,
        width: 20,
        height: 20,
        collected: false,
        type: 'doublejump',
        id: generateCollectibleId('doublejump'),
      });
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
      attempts < maxAttempts &&
      (collectibles.some(
        (c) =>
          c.x === platformCenters[idx].x - 10 && c.y === platformCenters[idx].y
      ) ||
        collectibles.some(
          (c) =>
            c.x === platformCenters[idx].x - 10 &&
            c.y === platformCenters[idx].y - 30
        ))
    );

    // Only place if we found a valid spot
    if (attempts < maxAttempts) {
      const pos = platformCenters[idx];
      collectibles.push({
        x: pos.x - 10,
        y: pos.y - 60,
        width: 20,
        height: 20,
        collected: false,
        type: 'grow',
        id: generateCollectibleId('grow'),
      });
    }
  }
  // Ensure a platform at the player spawn point (x=100)
  const spawnX = 100;
  const hasSpawnBlock = platforms.some(
    (plat) => plat.x <= spawnX && plat.x + plat.width >= spawnX + 40
  );
  if (!hasSpawnBlock) {
    platforms.unshift({ x: 60, y: GROUND_Y, width: 80, height: 50 });
  }
  // Place finish flag at the end of the last platform
  const lastPlat = platforms[platforms.length - 1];
  let flagX = lastPlat.x + lastPlat.width - 32;
  let flagY =
    'isSlope' in lastPlat && lastPlat.isSlope
      ? lastPlat.endY - finishFlag.height
      : lastPlat.y - finishFlag.height;
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
        body: JSON.stringify({
          collectibles: collectibles.map((c) => ({
            id: c.id,
            type: c.type,
          })),
        }),
      });
    } catch (_e) {
      /* ignore */
    }
  }
}

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
let purchasedUpgrades: Record<string, boolean> = JSON.parse(
  localStorage.getItem('purchasedUpgrades') || '{}'
);
// Track which purchased upgrades are currently enabled (default: all purchased upgrades are enabled)
let enabledUpgrades: Record<string, boolean> = JSON.parse(
  localStorage.getItem('enabledUpgrades') || '{}'
);

// Helper function to check if an upgrade is both purchased and enabled
function isUpgradeActive(upgradeId: string): boolean {
  return Boolean(
    purchasedUpgrades[upgradeId] && enabledUpgrades[upgradeId] !== false
  );
}

// Function to toggle an upgrade's enabled state
function toggleUpgradeEnabled(upgradeId: string): void {
  if (purchasedUpgrades[upgradeId]) {
    enabledUpgrades[upgradeId] = !enabledUpgrades[upgradeId];
    localStorage.setItem('enabledUpgrades', JSON.stringify(enabledUpgrades));
  }
}

// Initialize game after loading upgrades - apply upgrades after everything is set up
generateLevel()
  .then(() => {
    resetPlayer();
  })
  .then(() => {
    // Apply purchased upgrades to starting lives (after all initialization is complete)
    if (isUpgradeActive('extra_life')) {
      lives = 4;
    } else if (isUpgradeActive('tough_skin')) {
      lives = 5;
    }
    // Apply other starting upgrades
    if (isUpgradeActive('double_jump_start')) {
      player.hasDoubleJump = true;
    }
  });

// Available upgrades and their costs
const UPGRADES = {
  characters: [
    {
      id: 'yellow_square',
      emoji: 'SQUARE',
      name: 'Yellow Square',
      cost: 0,
      unlocked: true,
    },
    { id: 'yellow_circle', emoji: '🟡', name: 'Yellow Circle', cost: 10 },
    { id: 'red_circle', emoji: '🔴', name: 'Red Circle', cost: 50 },
    { id: 'blue_circle', emoji: '🔵', name: 'Blue Circle', cost: 50 },
    { id: 'green_circle', emoji: '🟢', name: 'Green Circle', cost: 50 },
    { id: 'smiley', emoji: '😊', name: 'Smiley Face', cost: 100 },
    { id: 'grinning', emoji: '😃', name: 'Grinning Face', cost: 125 },
    { id: 'cool', emoji: '😎', name: 'Cool Face', cost: 150 },
    { id: 'beaming', emoji: '😁', name: 'Beaming Face', cost: 175 },
    { id: 'star', emoji: '⭐', name: 'Star', cost: 200 },
    { id: 'rofl', emoji: '🤣', name: 'ROFL Face', cost: 225 },
    { id: 'crown', emoji: '👑', name: 'Crown', cost: 300 },
    { id: 'hugging', emoji: '🤗', name: 'Hugging Face', cost: 350 },
    { id: 'party', emoji: '🥳', name: 'Party Face', cost: 400 },
    { id: 'rocket', emoji: '🚀', name: 'Rocket', cost: 500 },
    { id: 'cherry_blossom', emoji: '🌸', name: 'Cherry Blossom', cost: 600 },
    { id: 'hearts', emoji: '💞', name: 'Revolving Hearts', cost: 650 },
    { id: 'alien', emoji: '👽', name: 'Alien', cost: 750 },
    { id: 'koala', emoji: '🐨', name: 'Koala', cost: 800 },
  ],
  gameplay: [
    {
      id: 'extra_life',
      name: 'Start with Extra Life',
      cost: 100,
      description: 'Begin each game with 4 lives instead of 3',
    },
    {
      id: 'double_jump_start',
      name: 'Start with Double Jump',
      cost: 200,
      description: 'Begin each level with double jump ability',
    },
    {
      id: 'speed_boost',
      name: 'Permanent Speed Boost',
      cost: 300,
      description: '1.5x movement speed permanently',
    },
    {
      id: 'lucky_coins',
      name: 'Lucky Coins',
      cost: 400,
      description: 'Coins are worth 2 points each',
    },
    {
      id: 'tough_skin',
      name: 'Tough Skin',
      cost: 500,
      description: 'Start each game with 5 lives instead of 3',
    },
  ],
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
  enabledUpgrades[upgradeId] = true; // Enable newly purchased upgrades by default
  localStorage.setItem('purchasedUpgrades', JSON.stringify(purchasedUpgrades));
  localStorage.setItem('enabledUpgrades', JSON.stringify(enabledUpgrades));

  // Handle character purchases
  if (UPGRADES.characters.some((c) => c.id === upgradeId)) {
    const character = UPGRADES.characters.find((c) => c.id === upgradeId);
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

    UPGRADES.characters.forEach((char) => {
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
        border:2px solid ${isSelected ? '#ffd700' : isOwned ? '#0cf' : '#666'};
        background:${isSelected ? 'rgba(255,215,0,0.1)' : isOwned ? 'rgba(0,204,255,0.1)' : '#333'};
        cursor:pointer;
        transition:all 0.2s;
      `;

      charDiv.innerHTML = `
        <div style="font-size:2em;margin-bottom:8px;">${char.emoji === 'SQUARE' ? '🟨' : char.emoji}</div>
        <div style="font-size:0.9em;text-align:center;margin-bottom:4px;">${getCharacterName(char.id)}</div>
        <div style="font-size:0.8em;color:${isOwned ? '#0cf' : canAfford ? '#ffd700' : '#999'};">
          ${isOwned ? (isSelected ? t('selected') : t('owned')) : `${char.cost} ${t('points')}`}
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

    UPGRADES.gameplay.forEach((upgrade) => {
      const isOwned = purchasedUpgrades[upgrade.id];
      const canAfford = totalPoints >= upgrade.cost;
      const isEnabled = enabledUpgrades[upgrade.id] !== false; // Default to true if not set

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

      if (isOwned) {
        // Show toggle switch for owned upgrades
        upgradeDiv.innerHTML = `
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${getUpgradeName(upgrade.id)}</div>
            <div style="font-size:0.9em;color:#ccc;">${getUpgradeDescription(upgrade.id)}</div>
          </div>
          <div style="text-align:right;display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.9em;color:${isEnabled ? '#0cf' : '#999'};">
              ${isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <label style="position:relative;display:inline-block;width:40px;height:20px;">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} style="opacity:0;width:0;height:0;">
              <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${isEnabled ? '#0cf' : '#666'};border-radius:20px;transition:.4s;">
                <span style="position:absolute;content:'';height:16px;width:16px;left:${isEnabled ? '22px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:.4s;"></span>
              </span>
            </label>
          </div>
        `;

        // Add toggle functionality
        const toggle = upgradeDiv.querySelector('input[type="checkbox"]');
        if (toggle) {
          toggle.addEventListener('change', () => {
            toggleUpgradeEnabled(upgrade.id);
            updateShopDisplay(); // Refresh display to show new state
          });
        }
      } else {
        // Show purchase option for unowned upgrades
        upgradeDiv.innerHTML = `
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${getUpgradeName(upgrade.id)}</div>
            <div style="font-size:0.9em;color:#ccc;">${getUpgradeDescription(upgrade.id)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.2em;color:${canAfford ? '#ffd700' : '#999'};">
              ${upgrade.cost} ${t('points')}
            </div>
          </div>
        `;

        if (canAfford) {
          upgradeDiv.addEventListener('click', () => {
            if (purchaseUpgrade(upgrade.id)) {
              updateShopDisplay();
            }
          });
        }
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
  if (isUpgradeActive('extra_life')) {
    lives = 4;
  }
  if (isUpgradeActive('tough_skin')) {
    lives = 5;
  }
  localStorage.setItem('levelType', 'horizontal');
  gameOver = false;
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  enemies.length = 0;
  tubes.length = 0;
  // Do not reset manualLevelType or manualLevelTypeValue here
  if (manualLevelType) {
    levelType = manualLevelTypeValue;
  } else {
    levelType = 'horizontal';
  }
  generateLevel();

  // Apply purchased upgrades
  if (isUpgradeActive('double_jump_start')) {
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
    const widest = Math.max(...platforms.map((p) => p.width));
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
  // Note: eatenEnemy persists across levels unless explicitly reset
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

function _spitOutEnemy() {
  if (!player.eatenEnemy) return;

  // Create a new enemy in front of the player
  const spitDirection = player.vx >= 0 ? 1 : -1; // Spit in direction player was moving, default right
  const spitX = player.x + (spitDirection > 0 ? player.width + 10 : -40);
  const spitY = player.y + 10;

  // Find a safe position on a platform
  let finalX = spitX;
  let finalY = spitY;

  // Try to place on current platform or ground
  for (const plat of platforms) {
    if ('isSlope' in plat && plat.isSlope) {
      // Handle slope platforms
      if (spitX + 15 > plat.x && spitX + 15 < plat.x + plat.width) {
        const t = (spitX + 15 - plat.x) / plat.width;
        const yAtX = plat.y + (plat.endY - plat.y) * t;
        if (Math.abs(player.y + player.height - yAtX) < 20) {
          finalY = yAtX - 30;
          break;
        }
      }
    } else {
      // Handle flat platforms
      if (
        spitX + 15 > plat.x &&
        spitX + 15 < plat.x + plat.width &&
        Math.abs(player.y + player.height - plat.y) < 20
      ) {
        finalY = plat.y - 30;
        break;
      }
    }
  }

  // Add the spit enemy back to the world
  const spitEnemy: Enemy = {
    x: finalX,
    y: finalY,
    width: 30,
    height: 30,
    dx: spitDirection * (2 + Math.random()), // Random speed in spit direction
    dy: 0,
    range: 120,
    startX: finalX,
    alive: true,
    id: generateEnemyId(),
    isJumpingOut: false,
    type: player.eatenEnemy.type,
  };

  enemies.push(spitEnemy);
  player.eatenEnemy = null;
}

// Calculate eating distance based on player size
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

// Find nearby circle enemy that can be eaten
function findNearbyCircleEnemy(): Enemy | null {
  const EATING_DISTANCE = getEatingDistance();

  for (const enemy of enemies) {
    if (!enemy.alive || enemy.type !== 'circle') continue;

    // Calculate distance between player center and enemy center
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

function startRopeEatingAnimation(enemy: Enemy) {
  ropeAnimation.type = 'eating';
  ropeAnimation.progress = 0;
  ropeAnimation.startTime = Date.now();
  ropeAnimation.targetEnemy = enemy;
  ropeAnimation.startX = enemy.x + enemy.width / 2;
  ropeAnimation.startY = enemy.y + enemy.height / 2;
  // Note: endX and endY are now calculated dynamically from current player position
}

function startRopeSpittingAnimation() {
  if (!player.eatenEnemy) return;

  ropeAnimation.type = 'spitting';
  ropeAnimation.progress = 0;
  ropeAnimation.startTime = Date.now();

  // Calculate direction and screen edge position (use world coordinates consistently)
  const spitDirection = player.vx >= 0 ? 1 : -1;
  const screenEdgeX = spitDirection > 0 ? canvas.width + cameraX : cameraX - 50;
  ropeAnimation.endX = screenEdgeX;
  ropeAnimation.endY = player.y + player.height / 2;

  // Create a temporary enemy for animation (starting from current player position)
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

function startRopeTargetingAnimation() {
  const _eatingDistance = getEatingDistance();

  ropeAnimation.type = 'targeting';
  ropeAnimation.progress = 0;
  ropeAnimation.duration = 300; // Short 300ms animation for targeting line
  ropeAnimation.startTime = Date.now();
  ropeAnimation.targetEnemy = null;

  // For targeting animation, we don't need to store coordinates since we calculate them dynamically
  ropeAnimation.startX = 0;
  ropeAnimation.startY = 0;
  ropeAnimation.endX = 0;
  ropeAnimation.endY = 0;
}

function updateRopeAnimation(_deltaTime: number) {
  if (ropeAnimation.type === 'none') return;

  const elapsed = Date.now() - ropeAnimation.startTime;
  ropeAnimation.progress = Math.min(elapsed / ropeAnimation.duration, 1);

  if (ropeAnimation.type === 'eating' && ropeAnimation.targetEnemy) {
    // Move enemy toward current player position (not fixed start position)
    const currentPlayerCenterX = player.x + player.width / 2;
    const currentPlayerCenterY = player.y + player.height / 2;

    const enemyX =
      ropeAnimation.startX +
      (currentPlayerCenterX - ropeAnimation.startX) * ropeAnimation.progress;
    const enemyY =
      ropeAnimation.startY +
      (currentPlayerCenterY - ropeAnimation.startY) * ropeAnimation.progress;

    ropeAnimation.targetEnemy.x = enemyX - ropeAnimation.targetEnemy.width / 2;
    ropeAnimation.targetEnemy.y = enemyY - ropeAnimation.targetEnemy.height / 2;

    if (ropeAnimation.progress >= 1) {
      // Animation complete - finish eating
      player.eatenEnemy = { ...ropeAnimation.targetEnemy };
      ropeAnimation.targetEnemy.alive = false;
      ropeAnimation.type = 'none';
      ropeAnimation.targetEnemy = null;
    }
  } else if (ropeAnimation.type === 'spitting' && ropeAnimation.targetEnemy) {
    // Move enemy toward screen edge from current player position
    const currentPlayerCenterX = player.x + player.width / 2;
    const currentPlayerCenterY = player.y + player.height / 2;

    const enemyX =
      currentPlayerCenterX +
      (ropeAnimation.endX - currentPlayerCenterX) * ropeAnimation.progress;
    const enemyY =
      currentPlayerCenterY +
      (ropeAnimation.endY - currentPlayerCenterY) * ropeAnimation.progress;

    ropeAnimation.targetEnemy.x = enemyX - ropeAnimation.targetEnemy.width / 2;
    ropeAnimation.targetEnemy.y = enemyY - ropeAnimation.targetEnemy.height / 2;

    if (ropeAnimation.progress >= 1) {
      // Animation complete - enemy is gone
      player.eatenEnemy = null;
      ropeAnimation.type = 'none';
      ropeAnimation.targetEnemy = null;
    }
  } else if (ropeAnimation.type === 'targeting') {
    // Targeting animation - just wait for completion
    if (ropeAnimation.progress >= 1) {
      ropeAnimation.type = 'none';
      ropeAnimation.targetEnemy = null;
    }
  }
}

function drawRopeAnimation() {
  if (ropeAnimation.type === 'none') return;

  if (ropeAnimation.type === 'targeting') {
    // For targeting line, use world coordinates since canvas is already translated
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const eatingDistance = getEatingDistance();
    const endX = playerCenterX + eatingDistance;
    const endY = playerCenterY;

    // Draw rope as a line with some visual flair
    ctx.strokeStyle = '#8B4513'; // Brown rope color
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]); // Dashed line for rope texture
    ctx.beginPath();
    ctx.moveTo(playerCenterX, playerCenterY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    return;
  }

  // For other animations, use world coordinates since canvas is already translated
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  if (!ropeAnimation.targetEnemy) return;

  let enemyCenterX, enemyCenterY;

  if (ropeAnimation.type === 'eating') {
    // For eating animation, calculate enemy position dynamically based on current player position
    // This ensures the rope always connects to the current player position
    const currentPlayerWorldX = player.x + player.width / 2;
    const currentPlayerWorldY = player.y + player.height / 2;

    // Interpolate from original enemy position to current player position (using world coordinates)
    const enemyWorldX =
      ropeAnimation.startX +
      (currentPlayerWorldX - ropeAnimation.startX) * ropeAnimation.progress;
    const enemyWorldY =
      ropeAnimation.startY +
      (currentPlayerWorldY - ropeAnimation.startY) * ropeAnimation.progress;

    // Use world coordinates directly since canvas is already translated
    enemyCenterX = enemyWorldX;
    enemyCenterY = enemyWorldY;
  } else {
    // For spitting animation, use the updated enemy position (world coordinates)
    enemyCenterX =
      ropeAnimation.targetEnemy.x + ropeAnimation.targetEnemy.width / 2;
    enemyCenterY =
      ropeAnimation.targetEnemy.y + ropeAnimation.targetEnemy.height / 2;
  }

  // Draw rope as a line with some visual flair
  ctx.strokeStyle = '#8B4513'; // Brown rope color
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 3]); // Dashed line for rope texture
  ctx.beginPath();
  ctx.moveTo(playerCenterX, playerCenterY);
  ctx.lineTo(enemyCenterX, enemyCenterY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Draw the enemy during animation
  if (ropeAnimation.targetEnemy.type === 'circle') {
    ctx.fillStyle = '#f06'; // Pink color for circle enemies
    ctx.beginPath();
    ctx.arc(
      enemyCenterX,
      enemyCenterY,
      ropeAnimation.targetEnemy.width / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    // Add simple eyes
    ctx.fillStyle = '#000';
    const eyeSize = 3;
    ctx.fillRect(enemyCenterX - 8, enemyCenterY - 3, eyeSize, eyeSize);
    ctx.fillRect(enemyCenterX + 5, enemyCenterY - 3, eyeSize, eyeSize);
  } else {
    ctx.fillStyle = '#f90'; // Orange color for square enemies
    ctx.fillRect(
      enemyCenterX - ropeAnimation.targetEnemy.width / 2,
      enemyCenterY - ropeAnimation.targetEnemy.height / 2,
      ropeAnimation.targetEnemy.width,
      ropeAnimation.targetEnemy.height
    );
    // Add simple eyes
    ctx.fillStyle = '#000';
    const eyeSize = 3;
    ctx.fillRect(enemyCenterX - 8, enemyCenterY - 3, eyeSize, eyeSize);
    ctx.fillRect(enemyCenterX + 5, enemyCenterY - 3, eyeSize, eyeSize);
  }
}

function respawnPlayer() {
  lives--;
  if (lives <= 0) {
    setTopScore(score);
    gameOver = true;
    showRestartButton();
    showShareButton();
    return;
  }
  // Reset power-ups on death
  player.hasDoubleJump = false;
  player.growLevel = 0;
  player.canDoubleJump = false;
  player.eatenEnemy = null; // Reset eaten enemy on death
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
    btn.style.transform = 'translateX(-50%)';
    btn.style.fontSize = '2em';
    btn.style.padding = '16px 32px';
    btn.style.zIndex = '100';
    btn.style.background = '#222';
    btn.style.color = '#fff';
    btn.style.border = '2px solid #0cf';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';

    // Responsive positioning - side by side on mobile to prevent overlap
    if (window.innerWidth <= 768) {
      btn.style.top = 'calc(50% + 140px)'; // Same vertical level as share button
      btn.style.left = 'calc(50% + 80px)'; // Position farther to the right
      btn.style.transform = 'translateX(0)'; // Don't center transform
      btn.style.fontSize = '1.2em';
      btn.style.padding = '10px 16px';
    } else {
      btn.style.top = 'calc(50% + 160px)';
      btn.style.left = '50%';
      btn.style.transform = 'translateX(-50%)';
    }

    btn.onclick = () => {
      btn?.remove();
      hideShareButton();
      resetGame();
    };
    document.body.appendChild(btn);
  } else if (btn) {
    btn.style.display = 'block';
    // Update position on resize - side by side on mobile
    if (window.innerWidth <= 768) {
      btn.style.top = 'calc(50% + 140px)';
      btn.style.left = 'calc(50% + 80px)'; // Farther to the right
      btn.style.transform = 'translateX(0)';
      btn.style.fontSize = '1.2em';
      btn.style.padding = '10px 16px';
    } else {
      btn.style.top = 'calc(50% + 160px)';
      btn.style.left = '50%';
      btn.style.transform = 'translateX(-50%)';
      btn.style.fontSize = '2em';
      btn.style.padding = '16px 32px';
    }
  }
}

function showShareButton() {
  let btn = document.getElementById('share-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'share-btn';
    btn.textContent = '📤 Share Progress';
    btn.style.position = 'fixed';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.fontSize = '1.8em';
    btn.style.padding = '12px 24px';
    btn.style.zIndex = '100';
    btn.style.background = '#0cf';
    btn.style.color = '#fff';
    btn.style.border = '2px solid #0cf';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';

    // Responsive positioning - side by side on mobile to prevent overlap
    if (window.innerWidth <= 768) {
      btn.style.top = 'calc(50% + 140px)'; // Same vertical level as restart button
      btn.style.left = 'calc(50% - 160px)'; // Position farther to the left
      btn.style.transform = 'translateX(0)'; // Don't center transform
      btn.style.fontSize = '1.2em';
      btn.style.padding = '10px 16px';
    } else {
      btn.style.top = 'calc(50% + 120px)';
      btn.style.left = '50%';
      btn.style.transform = 'translateX(-50%)';
    }

    btn.onclick = () => {
      openShareModal();
    };
    document.body.appendChild(btn);
  } else if (btn) {
    btn.style.display = 'block';
    // Update position on resize - side by side on mobile
    if (window.innerWidth <= 768) {
      btn.style.top = 'calc(50% + 140px)';
      btn.style.left = 'calc(50% - 160px)'; // Farther to the left
      btn.style.transform = 'translateX(0)';
      btn.style.fontSize = '1.2em';
      btn.style.padding = '10px 16px';
    } else {
      btn.style.top = 'calc(50% + 120px)';
      btn.style.left = '50%';
      btn.style.transform = 'translateX(-50%)';
      btn.style.fontSize = '1.8em';
      btn.style.padding = '12px 24px';
    }
  }
}

function hideShareButton() {
  const btn = document.getElementById('share-btn');
  if (btn) btn.style.display = 'none';
}

function hideRestartButton() {
  const btn = document.getElementById('restart-btn');
  if (btn) btn.style.display = 'none';
}

// Social Media Share functionality
function captureGameScreenshot(): string {
  // Create a temporary canvas to capture the game area
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;

  // Set canvas size
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Copy the current game canvas to temporary canvas
  tempCtx.drawImage(canvas, 0, 0);

  // Add game info overlay
  tempCtx.save();
  tempCtx.globalAlpha = 0.8;
  tempCtx.fillStyle = '#000';
  tempCtx.fillRect(0, canvas.height - 120, canvas.width, 120);

  tempCtx.globalAlpha = 1;
  tempCtx.fillStyle = '#fff';
  tempCtx.font = 'bold 24px sans-serif';
  tempCtx.textAlign = 'center';
  tempCtx.fillText(
    'Side-Scrolling Platformer',
    canvas.width / 2,
    canvas.height - 90
  );

  tempCtx.font = '18px sans-serif';
  tempCtx.fillText(
    `Level ${level} • Score ${score}`,
    canvas.width / 2,
    canvas.height - 65
  );
  tempCtx.fillText(
    'Play at: github.com/commjoen/generated-game-experiment',
    canvas.width / 2,
    canvas.height - 40
  );

  if (gameOver) {
    tempCtx.fillStyle = '#e33';
    tempCtx.font = 'bold 20px sans-serif';
    tempCtx.fillText('Final Score!', canvas.width / 2, canvas.height - 15);
  } else if (level >= 25) {
    tempCtx.fillStyle = '#0cf';
    tempCtx.font = 'bold 20px sans-serif';
    tempCtx.fillText(
      'Victory! Level 25 Reached!',
      canvas.width / 2,
      canvas.height - 15
    );
  }

  tempCtx.restore();

  return tempCanvas.toDataURL('image/png');
}

function generateShareText(): string {
  if (gameOver) {
    return `Just played Side-Scrolling Platformer! 🎮 Final score: ${score} points on level ${level}! Can you beat it?`;
  } else if (level >= 25) {
    return `Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${score} points! Amazing game!`;
  } else {
    return `Playing Side-Scrolling Platformer! 🎮 Currently on level ${level} with ${score} points!`;
  }
}

function openShareModal() {
  // Remove existing modal if present
  const existingModal = document.getElementById('share-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const shareModal = document.createElement('div');
  shareModal.id = 'share-modal';
  shareModal.style.cssText = `
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  `;

  // Better mobile handling for small screens
  if (window.innerWidth <= 768) {
    shareModal.style.padding = '8px';
    shareModal.style.alignItems = 'flex-start';
    shareModal.style.paddingTop = '10px';
  }

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: #222;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    max-width: 500px;
    width: 100%;
    max-height: min(90vh, 600px);
    color: #fff;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 10px;
  `;

  // Improved responsive styles for mobile devices
  if (window.innerWidth <= 768) {
    modalContent.style.maxHeight = 'min(90vh, 500px)';
    modalContent.style.margin = '2px';
    modalContent.style.borderRadius = '12px';
  }

  // For very small screens
  if (window.innerWidth <= 480) {
    modalContent.style.maxHeight = '95vh';
    modalContent.style.margin = '0px';
    modalContent.style.borderRadius = '8px';
  }

  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px 32px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `;

  // Adjust header padding for mobile devices
  if (window.innerWidth <= 768) {
    header.style.padding = '16px 20px';
  }

  if (window.innerWidth <= 480) {
    header.style.padding = '12px 16px';
  }

  const title = document.createElement('h2');
  title.textContent = '📤 Share Your Progress';
  title.style.cssText = 'margin: 0; font-size: 1.5em; color: #0cf;';

  // Smaller title on mobile
  if (window.innerWidth <= 480) {
    title.style.fontSize = '1.3em';
  }

  const closeButton = document.createElement('button');
  closeButton.textContent = '✖️';
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: #fff;
    font-size: 1.2em;
    cursor: pointer;
    padding: 4px;
  `;
  closeButton.onclick = () => shareModal.remove();

  header.appendChild(title);
  header.appendChild(closeButton);

  const content = document.createElement('div');
  content.style.cssText = `
    padding: 24px 32px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  `;

  // Adjust padding for mobile devices
  if (window.innerWidth <= 768) {
    content.style.padding = '16px 20px';
  }

  if (window.innerWidth <= 480) {
    content.style.padding = '12px 16px';
  }

  // Preview section
  const previewSection = document.createElement('div');
  previewSection.style.cssText = 'margin-bottom: 24px;';

  const previewTitle = document.createElement('h3');
  previewTitle.textContent = 'Preview:';
  previewTitle.style.cssText =
    'margin: 0 0 12px 0; color: #0cf; font-size: 1.2em;';

  const shareText = document.createElement('p');
  shareText.textContent = generateShareText();
  shareText.style.cssText = `
    margin: 0 0 12px 0;
    padding: 12px;
    background: #333;
    border-radius: 8px;
    line-height: 1.4;
  `;

  const repoLink = document.createElement('p');
  repoLink.innerHTML =
    '🔗 <a href="https://github.com/commjoen/generated-game-experiment" target="_blank" style="color: #0cf; text-decoration: underline;">github.com/commjoen/generated-game-experiment</a>';
  repoLink.style.cssText = 'margin: 0 0 8px 0; font-size: 0.9em; color: #ccc;';

  // Screenshot tip
  const screenshotTip = document.createElement('p');
  screenshotTip.innerHTML =
    'share' in navigator
      ? '💡 <strong>Tip:</strong> Use "Share+📷" to include the screenshot automatically, or use any social media button below to open the share dialog <em>and</em> download the screenshot.'
      : '💡 <strong>Tip:</strong> When you click any social media button below, the screenshot will be automatically downloaded and the share dialog will open. Just attach the downloaded image to your post!';
  screenshotTip.style.cssText = `
    margin: 0;
    padding: 8px 12px;
    background: rgba(12, 255, 255, 0.1);
    border-left: 3px solid #0cf;
    border-radius: 4px;
    font-size: 0.85em;
    color: #ccc;
    line-height: 1.3;
  `;

  previewSection.appendChild(previewTitle);
  previewSection.appendChild(shareText);
  previewSection.appendChild(repoLink);
  previewSection.appendChild(screenshotTip);

  // Share buttons section
  const shareSection = document.createElement('div');
  shareSection.style.cssText = 'margin-bottom: 16px;';

  const shareTitle = document.createElement('h3');
  shareTitle.textContent = 'Share to:';
  shareTitle.style.cssText =
    'margin: 0 0 16px 0; color: #0cf; font-size: 1.2em;';

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
  `;

  // Adjust grid layout for mobile devices
  if (window.innerWidth <= 480) {
    buttonsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    buttonsContainer.style.gap = '8px';
  } else if (window.innerWidth <= 768) {
    buttonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    buttonsContainer.style.gap = '8px';
  }

  // Create share buttons for different platforms
  const platforms = [
    {
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      action: (_event: Event) => shareToTwitter(),
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      action: (_event: Event) => shareToFacebook(),
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: '#0A66C2',
      action: (_event: Event) => shareToLinkedIn(),
    },
    {
      name: 'Reddit',
      icon: '🔶',
      color: '#FF4500',
      action: (_event: Event) => shareToReddit(),
    },
    {
      name: 'Bluesky',
      icon: '☁️',
      color: '#0085ff',
      action: (_event: Event) => shareToBluesky(),
    },
    {
      name: 'Mastodon',
      icon: '🐘',
      color: '#563acc',
      action: (_event: Event) => shareToMastodon(),
    },
    // Add Web Share API button for mobile devices
    ...('share' in navigator
      ? [
          {
            name: 'Share+📷',
            icon: '📤',
            color: '#28a745',
            action: (_event: Event) => shareWithWebAPI(),
          },
        ]
      : []),
    {
      name: 'Copy Text',
      icon: '📋',
      color: '#666',
      action: (event: Event) => copyToClipboard(event),
    },
    {
      name: 'Download📷',
      icon: '💾',
      color: '#0cf',
      action: (_event: Event) => downloadScreenshot(),
    },
  ];

  platforms.forEach((platform) => {
    const button = document.createElement('button');
    button.innerHTML = `<span style="font-size: 1.2em; margin-right: 4px;">${platform.icon}</span>${platform.name}`;
    button.style.cssText = `
      background: ${platform.color};
      color: white;
      border: none;
      padding: 12px 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
      text-align: center;
      min-height: 44px;
      word-wrap: break-word;
      hyphens: auto;
    `;

    // Adjust button styles for mobile devices
    if (window.innerWidth <= 480) {
      button.style.fontSize = '0.8em';
      button.style.padding = '10px 6px';
      button.style.minHeight = '40px';
    }

    button.onclick = (event: Event) => platform.action(event);
    button.onmouseenter = () => (button.style.opacity = '0.8');
    button.onmouseleave = () => (button.style.opacity = '1');

    buttonsContainer.appendChild(button);
  });

  shareSection.appendChild(shareTitle);
  shareSection.appendChild(buttonsContainer);

  content.appendChild(previewSection);
  content.appendChild(shareSection);

  modalContent.appendChild(header);
  modalContent.appendChild(content);
  shareModal.appendChild(modalContent);

  document.body.appendChild(shareModal);

  // Close modal when clicking outside
  shareModal.onclick = (e) => {
    if (e.target === shareModal) {
      shareModal.remove();
    }
  };
}

function shareToTwitter() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const text = encodeURIComponent(generateShareText());
  const url = encodeURIComponent(
    'https://github.com/commjoen/generated-game-experiment'
  );
  const hashtags = encodeURIComponent(
    'indiegaming,webgames,platformer,javascript'
  );

  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`,
    '_blank',
    'width=550,height=420'
  );
}

function shareToFacebook() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const url = encodeURIComponent(
    'https://github.com/commjoen/generated-game-experiment'
  );
  const quote = encodeURIComponent(generateShareText());

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
    '_blank',
    'width=580,height=400'
  );
}

function shareToLinkedIn() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const text = encodeURIComponent(generateShareText());
  const url = encodeURIComponent(
    'https://github.com/commjoen/generated-game-experiment'
  );
  const title = encodeURIComponent(
    gameOver
      ? 'My final score in Side-Scrolling Platformer!'
      : 'Check out my progress in Side-Scrolling Platformer!'
  );

  window.open(
    `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${text}`,
    '_blank',
    'width=570,height=570'
  );
}

function shareToReddit() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const title = encodeURIComponent(
    gameOver
      ? 'My final score in Side-Scrolling Platformer!'
      : 'Reached level 25 in this amazing browser game!'
  );
  const text = encodeURIComponent(
    generateShareText() +
      '\n\nPlay at: https://github.com/commjoen/generated-game-experiment'
  );

  window.open(
    `https://www.reddit.com/submit?title=${title}&text=${text}`,
    '_blank',
    'width=600,height=500'
  );
}

function shareToBluesky() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const text = encodeURIComponent(
    generateShareText() +
      '\n\nPlay at: https://github.com/commjoen/generated-game-experiment'
  );

  window.open(
    `https://bsky.app/intent/compose?text=${text}`,
    '_blank',
    'width=600,height=500'
  );
}

function shareToMastodon() {
  // Download screenshot first so user has it for manual attachment
  downloadScreenshot();

  const text = encodeURIComponent(
    generateShareText() +
      '\n\nPlay at: https://github.com/commjoen/generated-game-experiment'
  );

  // Open a modal to let user choose their Mastodon instance
  const mastodonModal = document.createElement('div');
  mastodonModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  mastodonModal.innerHTML = `
    <div style="
      background: #222;
      color: #fff;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    ">
      <h3 style="margin: 0 0 16px 0; color: #0cf;">Share to Mastodon</h3>
      <p style="margin: 0 0 16px 0; color: #ccc; font-size: 0.9em;">
        Enter your Mastodon instance (e.g., mastodon.social):
      </p>
      <input
        type="text"
        id="mastodon-instance"
        placeholder="mastodon.social"
        style="
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 16px;
          border: 1px solid #666;
          border-radius: 4px;
          background: #333;
          color: #fff;
          font-size: 1em;
        "
      />
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()"
          style="
            padding: 8px 16px;
            background: #666;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Cancel</button>
        <button id="mastodon-share-btn"
          style="
            padding: 8px 16px;
            background: #0cf;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Share</button>
      </div>
    </div>
  `;

  document.body.appendChild(mastodonModal);

  const instanceInput = document.getElementById(
    'mastodon-instance'
  ) as HTMLInputElement;
  const shareBtn = document.getElementById('mastodon-share-btn');

  if (shareBtn && instanceInput) {
    shareBtn.onclick = () => {
      let instance = instanceInput.value.trim();
      if (!instance) instance = 'mastodon.social';

      // Remove protocol if user included it
      instance = instance.replace(/^https?:\/\//, '');

      window.open(
        `https://${instance}/share?text=${text}`,
        '_blank',
        'width=600,height=500'
      );
      mastodonModal.remove();
    };

    instanceInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        shareBtn.click();
      }
    });
  }

  // Close modal when clicking outside
  mastodonModal.onclick = (e) => {
    if (e.target === mastodonModal) {
      mastodonModal.remove();
    }
  };
}

async function shareWithWebAPI() {
  if (navigator.share) {
    try {
      // Get screenshot as blob for sharing
      const screenshot = captureGameScreenshot();
      const response = await fetch(screenshot);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `platformer-level-${level}-score-${score}.png`,
        {
          type: 'image/png',
        }
      );

      await navigator.share({
        title: gameOver
          ? 'My Side-Scrolling Platformer Score!'
          : 'Victory in Side-Scrolling Platformer!',
        text: generateShareText(),
        url: 'https://github.com/commjoen/generated-game-experiment',
        files: [file],
      });
    } catch (err) {
      console.error('Web Share API failed:', err);
      // Fallback to copying text
      await copyToClipboard();
    }
  } else {
    // Fallback for browsers without Web Share API
    await copyToClipboard();
  }
}

async function copyToClipboard(event?: Event) {
  const textToCopy =
    generateShareText() +
    '\n\nPlay at: https://github.com/commjoen/generated-game-experiment' +
    '\n\n📎 Tip: The screenshot was automatically downloaded when you clicked any social media button above!';

  try {
    await navigator.clipboard.writeText(textToCopy);

    // Show success message
    const button = event?.target as HTMLButtonElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML =
        '<span style="font-size: 1.2em; margin-right: 4px;">✅</span>Copied!';
      button.style.background = '#28a745';
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '#666';
      }, 2000);
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);

    // Fallback: Show text in a modal for manual copy
    const fallbackModal = document.createElement('div');
    fallbackModal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #222;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      z-index: 1001;
      max-width: 90vw;
    `;

    fallbackModal.innerHTML = `
      <h3>Copy this text:</h3>
      <textarea readonly style="width: 300px; height: 80px; background: #333; color: #fff; border: 1px solid #666; padding: 8px;">${textToCopy}</textarea>
      <br><button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 8px 16px; background: #0cf; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `;

    document.body.appendChild(fallbackModal);
    const textarea = fallbackModal.querySelector(
      'textarea'
    ) as HTMLTextAreaElement;
    textarea.select();
  }
}

function downloadScreenshot() {
  const screenshot = captureGameScreenshot();
  const link = document.createElement('a');
  link.download = `platformer-game-level-${level}-score-${score}.png`;
  link.href = screenshot;
  link.click();
}

function showVictoryScreen() {
  // Add total points for completing the game
  addTotalPoints(score + 500); // Bonus points for victory
  setTopScore(score);

  // Create victory modal
  const victoryModal = document.createElement('div');
  victoryModal.id = 'victory-modal';
  victoryModal.style.cssText = `
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 999;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: linear-gradient(135deg, #222, #333);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    max-width: 600px;
    width: 100%;
    color: #fff;
    position: relative;
    text-align: center;
    padding: 40px 20px;
    border: 2px solid #ffd700;
  `;

  modalContent.innerHTML = `
    <h1 style="margin: 0 0 16px 0; font-size: 3em; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏆 VICTORY! 🏆</h1>
    <h2 style="margin: 0 0 20px 0; font-size: 1.8em; color: #0cf;">Congratulations!</h2>
    <p style="margin: 0 0 16px 0; font-size: 1.3em; line-height: 1.4;">
      You've reached <strong>Level 25</strong> and conquered the platformer!
    </p>
    <p style="margin: 0 0 24px 0; font-size: 1.2em; color: #ccc;">
      Final Score: <span style="color: #ffd700; font-weight: bold;">${score} points</span>
    </p>
    <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 32px;">
      <button id="victory-share-btn" style="
        background: #0cf;
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
      ">
        📤 Share Victory
      </button>
      <button id="victory-continue-btn" style="
        background: #28a745;
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        transition: background 0.2s;
      ">
        Continue Playing
      </button>
      <button id="victory-restart-btn" style="
        background: #222;
        color: #fff;
        border: 2px solid #0cf;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        transition: all 0.2s;
      ">
        New Game
      </button>
    </div>
  `;

  victoryModal.appendChild(modalContent);
  document.body.appendChild(victoryModal);

  // Add event listeners
  const shareBtn = document.getElementById('victory-share-btn');
  const continueBtn = document.getElementById('victory-continue-btn');
  const restartBtn = document.getElementById('victory-restart-btn');

  if (shareBtn) {
    shareBtn.onclick = () => {
      openShareModal();
    };
    shareBtn.onmouseenter = () => (shareBtn.style.background = '#0a9fd9');
    shareBtn.onmouseleave = () => (shareBtn.style.background = '#0cf');
  }

  if (continueBtn) {
    continueBtn.onclick = () => {
      victoryModal.remove();
      // Continue to level 26 and beyond
      level = 25; // Keep at 25, but continue generating new levels
      (async () => {
        await generateLevel();
        resetPlayer();
        launchConfetti();
        nextLevelPending = false;
        nextLevelTimer = 0;
      })();
    };
    continueBtn.onmouseenter = () => (continueBtn.style.background = '#218838');
    continueBtn.onmouseleave = () => (continueBtn.style.background = '#28a745');
  }

  if (restartBtn) {
    restartBtn.onclick = () => {
      victoryModal.remove();
      resetGame();
    };
    restartBtn.onmouseenter = () => {
      restartBtn.style.background = '#0cf';
      restartBtn.style.color = '#222';
    };
    restartBtn.onmouseleave = () => {
      restartBtn.style.background = '#222';
      restartBtn.style.color = '#fff';
    };
  }

  // Launch confetti for victory
  launchConfetti();
}

function generateNewLevel() {
  platforms.length = 0;
  boxes.length = 0;
  collectibles.length = 0;
  spikes.length = 0;
  movingPlatforms.length = 0;
  enemies.length = 0;
  tubes.length = 0;
  level++;

  // Check if player reached level 25 - victory condition
  if (level >= 25) {
    showVictoryScreen();
    return;
  }

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
    levelTypeToggle.checked =
      manualLevelType && manualLevelTypeValue === 'vertical';
  }
  generateLevel();
  // console.log('About to call resetPlayer() at line 528 - this should not happen after bonus level');
  resetPlayer();

  // Change background per level
  if (fixedGradient) {
    fixedGradientColors = randomGradientColors();
    localStorage.setItem(
      'fixedGradientColors',
      JSON.stringify(fixedGradientColors)
    );
  } else if (scrollGradient) {
    scrollGradientColors = randomGradientColors();
    localStorage.setItem(
      'scrollGradientColors',
      JSON.stringify(scrollGradientColors)
    );
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

  // Update rope animation
  updateRopeAnimation(deltaTime);

  // Horizontal movement (frame-rate independent)
  player.vx = 0;
  const speedMultiplier =
    currentSpeedMultiplier * (isUpgradeActive('speed_boost') ? 1.5 : 1);
  if (keys['ArrowLeft'] || keys['KeyA'])
    player.vx = -MOVE_SPEED * speedMultiplier * deltaTime * 60;
  if (keys['ArrowRight'] || keys['KeyD'])
    player.vx = MOVE_SPEED * speedMultiplier * deltaTime * 60;

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
  _prevJumpKey = jumpKey;

  // Speed toggle (only on new key press)
  const speedToggleKey = keys['KeyT'];
  if (speedToggleKey && !prevSpeedToggleKey) {
    speedUnlocked = !speedUnlocked;
    localStorage.setItem('speedUnlocked', String(speedUnlocked));
    currentSpeedMultiplier = speedUnlocked ? 2 : 1;
  }
  prevSpeedToggleKey = speedToggleKey;

  // Action key for eat/spit (only on new key press)
  const actionKey = keys['KeyE'];
  if (actionKey && !prevActionKey) {
    if (player.eatenEnemy && ropeAnimation.type === 'none') {
      // Start rope spitting animation
      startRopeSpittingAnimation();
    } else if (ropeAnimation.type === 'none') {
      // Try to eat a nearby circle enemy
      const nearbyEnemy = findNearbyCircleEnemy();
      if (nearbyEnemy) {
        // Start rope eating animation (replace any existing eaten enemy)
        startRopeEatingAnimation(nearbyEnemy);
        // Add some score for eating enemy
        if (multiplayerEnabled) {
          addTotalPoints(1);
        } else {
          score++;
          addTotalPoints(1);
          setTopScore(score);
        }
      } else {
        // No enemy nearby - show targeting line
        startRopeTargetingAnimation();
      }
    }
  }
  prevActionKey = actionKey;

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

  // Check for tube visibility and spawn enemies
  for (const tube of tubes) {
    if (!tube.hasSpawnedEnemy) {
      // Check if tube is visible on screen
      const tubeVisible =
        levelType === 'horizontal'
          ? // Tube is visible if it's within the camera view horizontally
            tube.x + tube.width > cameraX && tube.x < cameraX + canvas.width
          : // For vertical levels, check if tube is within camera view vertically
            tube.y + tube.height > cameraY && tube.y < cameraY + canvas.height;

      if (tubeVisible) {
        // Find the platform that contains this tube
        const platformUnderTube = platforms.find(
          (p) =>
            p.x <= tube.x + tube.width / 2 &&
            p.x + p.width >= tube.x + tube.width / 2 &&
            Math.abs(p.y - GROUND_Y) < 10 // Make sure we find the main platforms at ground level
        );

        if (platformUnderTube) {
          // Randomly choose enemy type (50% chance for each)
          const enemyType: 'square' | 'circle' =
            Math.random() < 0.5 ? 'square' : 'circle';

          enemies.push({
            x: tube.x + tube.width / 2 - 15, // Center enemy on tube
            y: tube.y + 10, // Start enemy inside the tube, near the bottom
            width: 30,
            height: 30,
            dx: 1 + Math.random() * 2, // Random speed between 1-3
            dy: -8, // Jump out with upward velocity
            range: Math.min(platformUnderTube.width - 80, 120), // Stay within platform bounds
            startX: tube.x + tube.width / 2 - 15,
            alive: true,
            id: generateEnemyId(),
            isJumpingOut: true,
            type: enemyType,
          });
          tube.hasSpawnedEnemy = true;
        }
      }
    }
  }

  // Move enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    // Handle jumping out animation
    if (enemy.isJumpingOut) {
      enemy.y += enemy.dy;
      enemy.dy += 0.5; // Gravity effect during jump

      // Check if enemy has landed on platform (look specifically for ground platforms)
      for (const plat of platforms) {
        if (
          enemy.y + enemy.height >= plat.y &&
          enemy.y + enemy.height <= plat.y + plat.height &&
          enemy.x + enemy.width > plat.x &&
          enemy.x < plat.x + plat.width &&
          Math.abs(plat.y - GROUND_Y) < 10
        ) {
          // Make sure it's a ground platform
          enemy.y = plat.y - enemy.height;
          enemy.dy = 0;
          enemy.isJumpingOut = false;
          break;
        }
      }
    } else {
      // Normal horizontal movement
      enemy.x += enemy.dx;
      if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX) {
        enemy.dx *= -1;
      }
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
        multiplayerManager.collectItem(c.id);
      }
      if (c.type === 'coin') {
        const coinValue = isUpgradeActive('lucky_coins') ? 2 : 1;
        if (multiplayerEnabled) {
          // In multiplayer mode, only update total points locally.
          // Score will be updated by the server through multiplayer events.
          addTotalPoints(coinValue);
        } else {
          // In single-player mode (or Direct P2P), update both score and total points locally.
          score += coinValue;
          addTotalPoints(coinValue);
          setTopScore(score);
        }
        // Notify P2P peer about item collection so they can update our score
        if (webrtcDirect?.isConnected) {
          webrtcDirect.send({
            type: 'itemCollected',
            playerId: p2pLocalPlayerId,
            collectibleId: c.id,
            score,
            timestamp: Date.now(),
          });
        }
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
  // Enemy collision
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    // Skip collision if player has invincibility frames or enemy is being eaten
    if (respawnTimer > 0 || ropeAnimation.targetEnemy === enemy) continue;
    if (rectsCollide(player, enemy)) {
      if (enemy.type === 'square') {
        // Square enemies: check if player is landing on top (can jump on them)
        if (player.vy > 0 && player.y < enemy.y) {
          // Player jumped on square enemy - kill enemy and bounce player
          enemy.alive = false;
          player.vy = -8; // Small bounce
          // Add some score for killing enemy
          if (multiplayerEnabled) {
            addTotalPoints(1);
          } else {
            score++;
            addTotalPoints(1);
            setTopScore(score);
          }
        } else {
          // Player touched square enemy from side - handle damage based on size
          if (player.growLevel > 0) {
            // Big player hit - shrink without losing life
            player.growLevel = 0;
            setPlayerSizeByGrowLevel();

            // Add brief invincibility frames to prevent immediate re-collision
            respawnTimer = 30; // Reuse respawn timer for invincibility
          } else {
            // Small player hit - lose a life
            respawnPlayer();
          }
          break;
        }
      } else if (enemy.type === 'circle') {
        // Circle enemy collision - check if player is red circle for love behavior
        if (playerCharacter === '🔴') {
          // Red circle player touching red circle enemy - show love!
          showLoveHeart(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          // No damage - just love!
        } else {
          // Other players - handle damage based on player size
          if (player.growLevel > 0) {
            // Big player hit - shrink without losing life
            player.growLevel = 0;
            setPlayerSizeByGrowLevel();

            // Add brief invincibility frames to prevent immediate re-collision
            respawnTimer = 30; // Reuse respawn timer for invincibility
          } else {
            // Small player hit - lose a life
            respawnPlayer();
          }
        }
        break;
      }
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
    if (
      !nextLevelPending &&
      player.x + player.width > finishFlag.x &&
      player.x < finishFlag.x + finishFlag.width &&
      player.y + player.height > finishFlag.y &&
      player.y < finishFlag.y + finishFlag.height
    ) {
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
    const widest = Math.max(...platforms.map((p) => p.width));
    const levelW = Math.max(canvas.width, widest);
    const _scale = canvas.width / levelW;
    // Clamp player.x so they cannot move off screen
    player.x = Math.max(0, Math.min(player.x, levelW - player.width));
  } else {
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > LEVEL_WIDTH)
      player.x = LEVEL_WIDTH - player.width;
  }

  // Send multiplayer updates (throttled)
  if (multiplayerEnabled && Date.now() - lastPositionUpdate > 50) {
    // Update every 50ms
    multiplayerManager.updatePlayerPosition(
      player.x,
      player.y,
      player.width,
      player.height,
      player.growLevel
    );
    lastPositionUpdate = Date.now();
  }

  // Send Direct P2P position update (throttled, independent of server multiplayer)
  if (webrtcDirect?.isConnected && Date.now() - lastP2PPositionUpdate > 50) {
    webrtcDirect.send({
      type: 'playerUpdate',
      playerId: p2pLocalPlayerId,
      position: {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height,
        growLevel: player.growLevel,
      },
      score,
      name: playerName,
      timestamp: Date.now(),
    });
    lastP2PPositionUpdate = Date.now();
  }
}

// --- Tesla Detection and Onscreen Controls Logic ---
function isTeslaBrowser() {
  // Tesla browser user agent contains 'Tesla' or 'QtCarBrowser'
  return /Tesla|QtCarBrowser/i.test(navigator.userAgent);
}
let teslaMode = localStorage.getItem('teslaMode') === 'true';
function shouldShowOnscreenControls() {
  return (
    isTeslaBrowser() ||
    teslaMode ||
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    )
  );
}

// --- Settings Menu Logic ---
let fixedGradient = localStorage.getItem('fixedGradient') === 'true';
let scrollGradient = localStorage.getItem('scrollGradient') === 'true';
let fixedGradientColors: [string, string] =
  JSON.parse(localStorage.getItem('fixedGradientColors') || 'null') ||
  randomGradientColors();
let scrollGradientColors: [string, string] =
  JSON.parse(localStorage.getItem('scrollGradientColors') || 'null') ||
  randomGradientColors();
let imageBg = localStorage.getItem('imageBg') === 'true';
let imageBgUrl: string | null = localStorage.getItem('imageBgUrl') || null;
let imageBgObj: HTMLImageElement | null = null;
let imageBgLoaded = false;

function fetchRandomLandscapeImage() {
  // Pixabay example (replace with your API key)
  const API_KEY = '51252753-0f1aa9c83b326091b3ad96f88';
  const url = `https://pixabay.com/api/?key=${API_KEY}&q=landscape&image_type=photo&orientation=horizontal&safesearch=true&per_page=50`;
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
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
  imageBgObj.onload = () => {
    imageBgLoaded = true;
  };
  imageBgObj.onerror = () => {
    imageBgLoaded = false;
  };
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
  localStorage.setItem(
    'fixedGradientColors',
    JSON.stringify(fixedGradientColors)
  );
  localStorage.setItem(
    'scrollGradientColors',
    JSON.stringify(scrollGradientColors)
  );
  if (!imageBg) {
    localStorage.removeItem('imageBgUrl');
    imageBgUrl = null;
    imageBgObj = null;
    imageBgLoaded = false;
  }
}

// Version injection globals
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'unknown';
const COMMITHASH =
  typeof __COMMITHASH__ !== 'undefined' ? __COMMITHASH__ : 'unknown';
const BRANCH = typeof __BRANCH__ !== 'undefined' ? __BRANCH__ : 'unknown';
const GITTAG = typeof __GITTAG__ !== 'undefined' ? __GITTAG__ : 'none';
const BUILDDATE =
  typeof __BUILDDATE__ !== 'undefined' ? __BUILDDATE__ : 'unknown';

// --- Translation Helper Functions ---
function updateUITranslations() {
  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      if (element.innerHTML.includes('<strong>')) {
        // Handle special cases with HTML tags like keyboard controls
        const translation = t(key as keyof TranslationData);
        if (translation.includes('<strong>')) {
          element.innerHTML = translation;
        } else {
          element.textContent = translation;
        }
      } else {
        element.textContent = t(key as keyof TranslationData);
      }
    }
  });

  // Update shop if it's open
  updateShopDisplay();
}

function updateWebRTCHelpText(helpEl: HTMLElement | null): void {
  if (!helpEl) return;
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  helpEl.textContent = isGitHubPages
    ? t('webrtcHelpGithubPages')
    : t('webrtcHelpGeneral');
}

/**
 * Wire up all the Direct P2P UI elements in the settings modal.
 * This sets up the "Create Room" / "Join Room" button flow that lets
 * two players establish a server-free WebRTC connection by exchanging
 * base64-encoded SDP codes via any out-of-band channel.
 */
function setupDirectP2PUI(): void {
  // If WebRTC is not supported we leave the section visible but disable the buttons.
  const createBtn = document.getElementById(
    'p2p-create-btn'
  ) as HTMLButtonElement | null;
  const joinBtn = document.getElementById(
    'p2p-join-btn'
  ) as HTMLButtonElement | null;
  const disconnectBtn = document.getElementById(
    'p2p-disconnect-btn'
  ) as HTMLButtonElement | null;
  const offerPanel = document.getElementById('p2p-offer-panel');
  const joinPanel = document.getElementById('p2p-join-panel');
  const offerCodeEl = document.getElementById(
    'p2p-offer-code'
  ) as HTMLTextAreaElement | null;
  const answerInput = document.getElementById(
    'p2p-answer-input'
  ) as HTMLTextAreaElement | null;
  const acceptAnswerBtn = document.getElementById(
    'p2p-accept-answer-btn'
  ) as HTMLButtonElement | null;
  const offerInput = document.getElementById(
    'p2p-offer-input'
  ) as HTMLTextAreaElement | null;
  const processOfferBtn = document.getElementById(
    'p2p-process-offer-btn'
  ) as HTMLButtonElement | null;
  const answerPanel = document.getElementById('p2p-answer-panel');
  const answerCodeEl = document.getElementById(
    'p2p-answer-code'
  ) as HTMLTextAreaElement | null;
  const copyOfferBtn = document.getElementById(
    'p2p-copy-offer-btn'
  ) as HTMLButtonElement | null;
  const copyAnswerBtn = document.getElementById(
    'p2p-copy-answer-btn'
  ) as HTMLButtonElement | null;

  if (!webrtcDirect) {
    // Hide controls when WebRTC is unavailable
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.title = 'WebRTC not supported';
    }
    if (joinBtn) {
      joinBtn.disabled = true;
      joinBtn.title = 'WebRTC not supported';
    }
    return;
  }

  // Helper: copy text to clipboard with visual feedback
  function copyToClipboard(text: string, btn: HTMLButtonElement) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const orig = btn.textContent;
        btn.textContent = t('p2pCopied');
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      })
      .catch(() => {
        // Fallback for browsers without the Clipboard API (e.g. older Safari, HTTP origins).
        // document.execCommand('copy') is deprecated but still widely supported as a fallback.
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy'); // intentional deprecated fallback
        document.body.removeChild(ta);
        const orig = btn.textContent;
        btn.textContent = t('p2pCopied');
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      });
  }

  // ── Create Room ─────────────────────────────────────────────────────────────
  createBtn?.addEventListener('click', async () => {
    if (!offerPanel || !offerCodeEl) return;
    // Hide join panel, reset state
    if (joinPanel) joinPanel.style.display = 'none';
    if (answerInput) answerInput.value = '';
    offerCodeEl.value = '';
    offerPanel.style.display = 'block';
    updateP2PUI();

    try {
      const offerCode = await webrtcDirect.createOffer();
      offerCodeEl.value = offerCode;
      updateP2PUI();
    } catch (err) {
      console.error('Failed to create P2P offer:', err);
      const statusEl = document.getElementById('p2p-status');
      if (statusEl) {
        statusEl.textContent =
          'Failed to create offer. Check browser permissions.';
        statusEl.style.color = '#f44';
      }
    }
  });

  // ── Accept Answer (initiator step 3) ────────────────────────────────────────
  acceptAnswerBtn?.addEventListener('click', async () => {
    const code = answerInput?.value.trim();
    if (!code) return;
    try {
      await webrtcDirect.acceptAnswer(code);
      updateP2PUI();
    } catch (err) {
      const statusEl = document.getElementById('p2p-status');
      if (statusEl) {
        statusEl.textContent =
          err instanceof Error ? err.message : 'Invalid answer code.';
        statusEl.style.color = '#f44';
      }
    }
  });

  // ── Join Room ───────────────────────────────────────────────────────────────
  joinBtn?.addEventListener('click', () => {
    if (!joinPanel) return;
    // Hide offer panel, reset state
    if (offerPanel) offerPanel.style.display = 'none';
    joinPanel.style.display = 'block';
    if (answerPanel) answerPanel.style.display = 'none';
    if (offerInput) offerInput.value = '';
    updateP2PUI();
  });

  // ── Process Offer (responder step 2) ────────────────────────────────────────
  processOfferBtn?.addEventListener('click', async () => {
    const code = offerInput?.value.trim();
    if (!code) return;
    if (!answerPanel || !answerCodeEl) return;

    answerPanel.style.display = 'none';
    answerCodeEl.value = '';
    updateP2PUI();

    try {
      const answerCode = await webrtcDirect.acceptOffer(code);
      answerCodeEl.value = answerCode;
      answerPanel.style.display = 'block';
      updateP2PUI();
    } catch (err) {
      const statusEl = document.getElementById('p2p-status');
      if (statusEl) {
        statusEl.textContent =
          err instanceof Error ? err.message : 'Invalid offer code.';
        statusEl.style.color = '#f44';
      }
    }
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  disconnectBtn?.addEventListener('click', () => {
    webrtcDirect.cleanup();
    otherPlayers.clear();
    updateP2PUI();
  });

  // ── Copy buttons ─────────────────────────────────────────────────────────────
  copyOfferBtn?.addEventListener('click', () => {
    if (offerCodeEl && copyOfferBtn)
      copyToClipboard(offerCodeEl.value, copyOfferBtn);
  });
  copyAnswerBtn?.addEventListener('click', () => {
    if (answerCodeEl && copyAnswerBtn)
      copyToClipboard(answerCodeEl.value, copyAnswerBtn);
  });

  // Set initial UI state
  updateP2PUI();
}

// Helper function to get translated character name
function getCharacterName(charId: string): string {
  const mapping: Record<string, keyof TranslationData> = {
    yellow_square: 'yellowSquare',
    yellow_circle: 'yellowCircle',
    red_circle: 'redCircle',
    blue_circle: 'blueCircle',
    green_circle: 'greenCircle',
    smiley: 'smileyFace',
    grinning: 'grinningFace',
    cool: 'coolFace',
    beaming: 'beamingFace',
    star: 'star',
    rofl: 'roflFace',
    crown: 'crown',
    hugging: 'huggingFace',
    party: 'partyFace',
    rocket: 'rocket',
    cherry_blossom: 'cherryBlossom',
    hearts: 'revolvingHearts',
    alien: 'alien',
    koala: 'koala',
  };
  return t(mapping[charId] || 'yellowSquare');
}

// Helper function to get translated upgrade name
function getUpgradeName(upgradeId: string): string {
  const mapping: Record<string, keyof TranslationData> = {
    extra_life: 'extraLife',
    double_jump_start: 'doubleJumpStart',
    speed_boost: 'speedBoost',
    lucky_coins: 'coinValue',
    tough_skin: 'megaLife',
  };
  return t(mapping[upgradeId] || 'extraLife');
}

// Helper function to get translated upgrade description
function getUpgradeDescription(upgradeId: string): string {
  const mapping: Record<string, keyof TranslationData> = {
    extra_life: 'extraLifeDesc',
    double_jump_start: 'doubleJumpStartDesc',
    speed_boost: 'speedBoostDesc',
    lucky_coins: 'coinValueDesc',
    tough_skin: 'megaLifeDesc',
  };
  return t(mapping[upgradeId] || 'extraLifeDesc');
}

window.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const fixedGradientToggle = document.getElementById(
    'fixed-gradient-toggle'
  ) as HTMLInputElement;
  const scrollGradientToggle = document.getElementById(
    'scroll-gradient-toggle'
  ) as HTMLInputElement;
  const imageBgToggle = document.getElementById(
    'image-bg-toggle'
  ) as HTMLInputElement;
  const speedUnlockToggle = document.getElementById(
    'speed-unlock-toggle'
  ) as HTMLInputElement;
  const fpsCounterToggle = document.getElementById(
    'fps-counter-toggle'
  ) as HTMLInputElement;
  const teslaModeToggle = document.getElementById(
    'tesla-mode-toggle'
  ) as HTMLInputElement;
  const multiplayerToggle = document.getElementById(
    'multiplayer-toggle'
  ) as HTMLInputElement;
  const webRTCToggle = document.getElementById(
    'webrtc-toggle'
  ) as HTMLInputElement;
  const webRTCHelp = document.getElementById('webrtc-help') as HTMLElement;
  playerNameInput = document.getElementById(
    'player-name-input'
  ) as HTMLInputElement;
  levelTypeToggle = document.getElementById(
    'level-type-toggle'
  ) as HTMLInputElement;
  const languageSelect = document.getElementById(
    'language-select'
  ) as HTMLSelectElement;
  if (
    settingsBtn &&
    settingsModal &&
    closeSettings &&
    fixedGradientToggle &&
    scrollGradientToggle &&
    imageBgToggle &&
    speedUnlockToggle &&
    fpsCounterToggle &&
    teslaModeToggle &&
    multiplayerToggle &&
    webRTCToggle &&
    playerNameInput &&
    levelTypeToggle &&
    languageSelect
  ) {
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
      webRTCToggle.checked = webRTCEnabled;
      webRTCToggle.disabled = !multiplayerManager.webRTCSupported;
      updateWebRTCHelpText(webRTCHelp);
      if (playerNameInput) playerNameInput.value = playerName;
      // Set the level type toggle state
      if (levelTypeToggle)
        levelTypeToggle.checked =
          manualLevelType && manualLevelTypeValue === 'vertical';
      // Set the language selector state
      if (languageSelect) languageSelect.value = getCurrentLanguage();
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
    webRTCToggle.addEventListener('change', () => {
      webRTCEnabled = webRTCToggle.checked;
      localStorage.setItem('webRTCEnabled', String(webRTCEnabled));
      window.location.reload(); // Reload to re-init transport strategy
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

    // Language selector handler
    if (languageSelect) {
      languageSelect.addEventListener('change', () => {
        setLanguage(languageSelect.value);
        updateUITranslations();
        updateWebRTCHelpText(webRTCHelp);
      });
    }
  }

  // ── Direct P2P UI handlers ──────────────────────────────────────────────────
  setupDirectP2PUI();

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
  const versionEl = document.querySelector(
    '.version-string, #version, .version, #version-string'
  ) as HTMLElement;
  if (versionEl) {
    versionEl.textContent = `Version: ${VERSION} (tag: ${GITTAG}, ${BRANCH}, ${COMMITHASH}, built: ${BUILDDATE})`;
  }
  updateOnscreenControlsVisibility();

  // Initialize translations
  updateUITranslations();
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
  const btnAction = document.getElementById('btn-action');
  if (btnLeft && btnRight && btnJump && btnAction) {
    btnLeft.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = true;
      },
      { passive: false }
    );
    btnLeft.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
      },
      { passive: false }
    );
    btnRight.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        keys['ArrowRight'] = true;
      },
      { passive: false }
    );
    btnRight.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        keys['ArrowRight'] = false;
      },
      { passive: false }
    );
    btnJump.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        keys['Space'] = true;
      },
      { passive: false }
    );
    btnJump.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        keys['Space'] = false;
      },
      { passive: false }
    );
    // Also support mouse for Tesla browser
    btnLeft.addEventListener('mousedown', (e) => {
      e.preventDefault();
      keys['ArrowLeft'] = true;
    });
    btnLeft.addEventListener('mouseup', (e) => {
      e.preventDefault();
      keys['ArrowLeft'] = false;
    });
    btnRight.addEventListener('mousedown', (e) => {
      e.preventDefault();
      keys['ArrowRight'] = true;
    });
    btnRight.addEventListener('mouseup', (e) => {
      e.preventDefault();
      keys['ArrowRight'] = false;
    });
    btnJump.addEventListener('mousedown', (e) => {
      e.preventDefault();
      keys['Space'] = true;
    });
    btnJump.addEventListener('mouseup', (e) => {
      e.preventDefault();
      keys['Space'] = false;
    });

    // Action button events
    btnAction.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        keys['KeyE'] = true;
      },
      { passive: false }
    );
    btnAction.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        keys['KeyE'] = false;
      },
      { passive: false }
    );
    btnAction.addEventListener('mousedown', (e) => {
      e.preventDefault();
      keys['KeyE'] = true;
    });
    btnAction.addEventListener('mouseup', (e) => {
      e.preventDefault();
      keys['KeyE'] = false;
    });
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
      spin: (Math.random() - 0.5) * 0.2,
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
  confettiParticles = confettiParticles.filter(
    (p) => p.life > 0 && p.y < canvas.height + 40
  );
  if (confettiTimer > 0) confettiTimer--;
}
function drawConfetti() {
  for (const p of confettiParticles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
    ctx.restore();
  }
}

// --- Love Heart Animation ---
interface LoveHeart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}
let loveHearts: LoveHeart[] = [];

function showLoveHeart(x: number, y: number) {
  // Create multiple hearts floating upward
  for (let i = 0; i < 3; i++) {
    loveHearts.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life: 90 + Math.random() * 30,
      maxLife: 120,
      size: 20 + Math.random() * 10,
    });
  }
}

function updateLoveHearts() {
  for (const heart of loveHearts) {
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.vy += 0.02; // Slight gravity
    heart.life--;
  }
  loveHearts = loveHearts.filter((heart) => heart.life > 0);
}

function drawLoveHearts() {
  for (const heart of loveHearts) {
    const alpha = heart.life / heart.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(heart.x - cameraX, heart.y - cameraY);
    ctx.scale(heart.size / 20, heart.size / 20);

    // Draw heart shape
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, 0, -10, 0, -10, 6);
    ctx.bezierCurveTo(-10, 12, 0, 16, 0, 20);
    ctx.bezierCurveTo(0, 16, 10, 12, 10, 6);
    ctx.bezierCurveTo(10, 0, 0, 0, 0, 6);
    ctx.closePath();
    ctx.fillStyle = '#ff1493'; // Deep pink for love hearts
    ctx.fill();

    // Add a white highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.bezierCurveTo(-5, 0, -8, 0, -8, 3);
    ctx.bezierCurveTo(-8, 6, -5, 8, -5, 10);
    ctx.bezierCurveTo(-5, 8, -2, 6, -2, 3);
    ctx.bezierCurveTo(-2, 0, -5, 0, -5, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Helper functions for 2.5D visual effects
function drawRect3D(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  depth: number = 8
) {
  // Draw main face
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // Draw right side (darker)
  const sideColor = darkenColor(color, 0.3);
  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(x + width, y);
  ctx.lineTo(x + width + depth, y - depth);
  ctx.lineTo(x + width + depth, y + height - depth);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();

  // Draw top side (lighter)
  const topColor = lightenColor(color, 0.2);
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth);
  ctx.lineTo(x + width + depth, y - depth);
  ctx.lineTo(x + width, y);
  ctx.closePath();
  ctx.fill();
}

function drawShadow(
  x: number,
  y: number,
  width: number,
  height: number,
  offsetX: number = 3,
  offsetY: number = 3
) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x + offsetX, y + offsetY, width, height);
  ctx.restore();
}

function drawSlopeShadow(
  x: number,
  y: number,
  width: number,
  height: number,
  endY: number,
  offsetX: number = 3,
  offsetY: number = 3
) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(x + offsetX, y + offsetY);
  ctx.lineTo(x + width + offsetX, endY + offsetY);
  ctx.lineTo(x + width + offsetX, endY + height + offsetY);
  ctx.lineTo(x + offsetX, y + height + offsetY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function darkenColor(color: string, factor: number): string {
  if (color.startsWith('#')) {
    // Handle hex colors
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
  }
  // Return as-is for named colors or rgb colors - we'll handle the main cases
  return color;
}

function lightenColor(color: string, factor: number): string {
  if (color.startsWith('#')) {
    // Handle hex colors
    const hex = color.slice(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgb(${Math.floor(r + (255 - r) * factor)}, ${Math.floor(g + (255 - g) * factor)}, ${Math.floor(b + (255 - b) * factor)})`;
  }
  // Return as-is for named colors or rgb colors
  return color;
}

function drawCoin3D(x: number, y: number, radius: number) {
  // Draw shadow first
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3, radius * 0.8, radius * 0.3, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Draw coin with gradient
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    0,
    x,
    y,
    radius
  );
  gradient.addColorStop(0, '#4df');
  gradient.addColorStop(0.7, '#0cf');
  gradient.addColorStop(1, '#0af');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Add highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
  ctx.fill();
}

function draw() {
  // Draw background
  if (imageBg && imageBgLoaded && imageBgObj) {
    // Parallax/scrolling background
    const img = imageBgObj;
    const scale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );
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
    const grad = ctx.createLinearGradient(
      -cameraX,
      0,
      LEVEL_WIDTH - cameraX,
      canvas.height
    );
    grad.addColorStop(0, scrollGradientColors[0]);
    grad.addColorStop(1, scrollGradientColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  if (levelType === 'vertical') {
    // Zoom out to fit the full horizontal level
    const widest = Math.max(...platforms.map((p) => p.width));
    const levelW = Math.max(canvas.width, widest);
    const scale = canvas.width / levelW;
    // Center cameraX on player, but clamp so player stays visible
    cameraX = Math.max(
      0,
      Math.min(
        player.x + player.width / 2 - canvas.width / (2 * scale),
        levelW - canvas.width / scale
      )
    );
    // Clamp cameraY as before
    cameraY = Math.max(
      0,
      Math.min(
        player.y + player.height / 2 - canvas.height / (2 * scale),
        LEVEL_HEIGHT - canvas.height / scale
      )
    );
    ctx.scale(scale, scale);
  }
  ctx.translate(-cameraX, -cameraY);

  // Draw background text from URL parameter (after camera transforms for proper positioning)
  if (backgroundText) {
    ctx.save();
    const fontSize = Math.min(canvas.width, canvas.height) / 8; // Responsive font size
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Create semi-transparent text with outline for better visibility
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Position text in the middle of the level for players to pass by
    const centerX = LEVEL_WIDTH / 2; // Position text in center of level (1600px)
    const centerY = canvas.height / 2;

    // Draw text with stroke (outline) and fill
    ctx.strokeText(backgroundText, centerX, centerY);
    ctx.fillText(backgroundText, centerX, centerY);

    ctx.restore();
  }

  // Draw platforms with 3D effect
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
      // Draw shadow for slope platforms with matching diagonal shape
      drawSlopeShadow(plat.x, plat.y, plat.width, plat.height, plat.endY);

      // Draw slope platform with gradient
      const gradient = ctx.createLinearGradient(
        plat.x,
        plat.y,
        plat.x,
        plat.y + plat.height
      );
      gradient.addColorStop(0, '#8b6f47');
      gradient.addColorStop(1, '#654321');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.width, plat.endY);
      ctx.lineTo(plat.x + plat.width, plat.endY + plat.height);
      ctx.lineTo(plat.x, plat.y + plat.height);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw shadow first
      drawShadow(plat.x, plat.y, plat.width, plat.height);

      // Draw 3D platform
      drawRect3D(plat.x, plat.y, plat.width, plat.height, '#654321', 6);
    }
    // Draw up-arrow on the visually lowest platform in vertical mode
    if (levelType === 'vertical' && i === lowestPlatformIndex) {
      ctx.save();
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      ctx.fillText('↑', plat.x + plat.width / 2, plat.y + plat.height / 2);
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
  // Draw moving platforms with 3D effect
  for (const plat of movingPlatforms) {
    drawShadow(plat.x, plat.y, plat.width, plat.height);
    drawRect3D(plat.x, plat.y, plat.width, plat.height, '#888', 4);
  }
  // Draw boxes with 3D effect
  for (const box of boxes) {
    drawShadow(box.x, box.y, box.width, box.height);
    drawRect3D(box.x, box.y, box.width, box.height, '#b5651d', 5);
  }
  // Draw collectibles with 3D effects
  for (const c of collectibles) {
    if (!c.collected) {
      if (c.type === 'coin') {
        drawCoin3D(c.x + c.width / 2, c.y + c.height / 2, 10);
      } else if (c.type === 'heart') {
        // Draw a heart shape
        ctx.save();
        ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
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
        ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
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
        ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
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
  // Draw spikes with 3D effect
  for (const spike of spikes) {
    // Draw shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(spike.x + 2, spike.y + spike.height + 2);
    ctx.lineTo(spike.x + spike.width / 2 + 2, spike.y + 2);
    ctx.lineTo(spike.x + spike.width + 2, spike.y + spike.height + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw spike with gradient
    const gradient = ctx.createLinearGradient(
      spike.x,
      spike.y,
      spike.x + spike.width,
      spike.y + spike.height
    );
    gradient.addColorStop(0, '#f55');
    gradient.addColorStop(0.5, '#e33');
    gradient.addColorStop(1, '#c22');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y + spike.height);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();

    // Add highlight
    ctx.strokeStyle = '#f77';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width / 4, spike.y + spike.height / 2);
    ctx.stroke();
  }
  // Draw spawn tubes with 3D effect
  for (const tube of tubes) {
    // Draw shadow
    drawShadow(tube.x, tube.y, tube.width, tube.height);

    // Draw tube body with 3D effect
    drawRect3D(tube.x, tube.y, tube.width, tube.height, '#0a8000', 3);

    // Draw tube opening (darker green) - larger opening for bigger tubes at the TOP where it meets the platform
    const gradient = ctx.createRadialGradient(
      tube.x + tube.width / 2,
      Math.max(tube.y, GROUND_Y - 15) + 7,
      0,
      tube.x + tube.width / 2,
      Math.max(tube.y, GROUND_Y - 15) + 7,
      tube.width / 2
    );
    gradient.addColorStop(0, '#064000');
    gradient.addColorStop(1, '#032000');
    ctx.fillStyle = gradient;
    const openingY = Math.max(tube.y, GROUND_Y - 15);
    ctx.fillRect(tube.x + 4, openingY, tube.width - 8, 15);

    // Draw pipe details (light green lines) - adjusted for longer tubes
    ctx.fillStyle = '#0c8000';
    ctx.fillRect(tube.x + 8, tube.y + 8, 3, tube.height - 16);
    ctx.fillRect(tube.x + tube.width - 11, tube.y + 8, 3, tube.height - 16);

    // Add more horizontal bands for longer tubes with gradient
    const bandGradient = ctx.createLinearGradient(
      tube.x,
      0,
      tube.x + tube.width,
      0
    );
    bandGradient.addColorStop(0, '#0c8000');
    bandGradient.addColorStop(0.5, '#0e9000');
    bandGradient.addColorStop(1, '#0c8000');
    ctx.fillStyle = bandGradient;
    ctx.fillRect(tube.x + 4, tube.y + tube.height / 4, tube.width - 8, 2);
    ctx.fillRect(tube.x + 4, tube.y + tube.height / 2, tube.width - 8, 2);
    ctx.fillRect(tube.x + 4, tube.y + (3 * tube.height) / 4, tube.width - 8, 2);
  }
  // Draw enemies with 3D effects
  for (const enemy of enemies) {
    if (enemy.alive && ropeAnimation.targetEnemy !== enemy) {
      // Draw shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(
        enemy.x + enemy.width / 2 + 2,
        enemy.y + enemy.height + 2,
        enemy.width * 0.4,
        enemy.height * 0.2,
        0,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.restore();

      if (enemy.type === 'circle') {
        // Draw circle enemies with 3D gradient
        const gradient = ctx.createRadialGradient(
          enemy.x + enemy.width / 2 - enemy.width * 0.2,
          enemy.y + enemy.height / 2 - enemy.height * 0.2,
          0,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.width / 2
        );
        gradient.addColorStop(0, '#f8a');
        gradient.addColorStop(0.7, '#f06');
        gradient.addColorStop(1, '#d04');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.width / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(
          enemy.x + enemy.width / 2 - enemy.width * 0.25,
          enemy.y + enemy.height / 2 - enemy.height * 0.25,
          enemy.width * 0.15,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // Add simple eyes to make it look more enemy-like
        ctx.fillStyle = '#000';
        const eyeSize = 3;
        ctx.fillRect(enemy.x + 8, enemy.y + 8, eyeSize, eyeSize);
        ctx.fillRect(enemy.x + enemy.width - 11, enemy.y + 8, eyeSize, eyeSize);
      } else {
        // Draw square enemies with 3D effect
        drawRect3D(enemy.x, enemy.y, enemy.width, enemy.height, '#f90', 3);

        // Add simple eyes to make it look more enemy-like
        ctx.fillStyle = '#000';
        const eyeSize = 4;
        ctx.fillRect(enemy.x + 6, enemy.y + 8, eyeSize, eyeSize);
        ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 8, eyeSize, eyeSize);
      }
    }
  }

  // Draw rope animation if active
  drawRopeAnimation();

  // Draw player (flash if respawning)
  ctx.restore();
  if (respawnTimer > 0 && Math.floor(respawnTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  } else {
    ctx.globalAlpha = 1;
  }

  // Draw player character (original square or custom emoji)
  ctx.save();

  // Draw player shadow first
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(
    player.x - cameraX + 3,
    player.y - cameraY + player.height - 2,
    player.width,
    8
  );
  ctx.restore();

  if (playerCharacter === 'SQUARE') {
    // Draw original yellow rectangle with 3D effect
    drawRect3D(
      player.x - cameraX,
      player.y - cameraY,
      player.width,
      player.height,
      '#ff0',
      4
    );
  } else {
    // Draw custom emoji character
    ctx.font = `${Math.min(player.width, player.height)}px serif`;
    ctx.textAlign = 'center';

    // Check if this is a circle character that should "roll" on platforms
    const isCircleCharacter = ['🟡', '🔴', '🔵', '🟢'].includes(
      playerCharacter
    );

    if (isCircleCharacter) {
      // For circle characters, position them to sit on the platform surface
      // Use 'middle' baseline but adjust Y position downward to account for emoji rendering
      // Scale the offset proportionally with character size to handle growth levels
      const offset = Math.round(player.height * 0.4);
      ctx.textBaseline = 'middle';
      ctx.fillText(
        playerCharacter,
        player.x - cameraX + player.width / 2,
        player.y - cameraY + player.height - offset
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
    } else if (
      typeof other.score === 'number' &&
      other.score === highestScore
    ) {
      highestPlayerIds.push(other.id);
    }
  }
  if (score === highestScore) highestPlayerIds.push('self');
  for (const other of otherPlayers.values()) {
    ctx.fillRect(
      other.x - cameraX,
      other.y - cameraY,
      other.width,
      other.height
    );
    // Draw name and crown above player only in multiplayer mode
    if (
      (multiplayerEnabled || webrtcDirect?.isConnected) &&
      otherPlayers.size > 0 &&
      other.name
    ) {
      ctx.save();
      ctx.font = '16px sans-serif';
      if (highestPlayerIds.includes(other.id)) {
        ctx.fillStyle = 'gold';
        ctx.fillText('👑', other.x - cameraX + other.width / 2, other.y - 22);
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.textAlign = 'center';
      ctx.fillText(
        other.name,
        other.x - cameraX + other.width / 2,
        other.y - 8
      );
      ctx.restore();
    }
  }
  ctx.restore();
  // Draw your own name
  if (
    (multiplayerEnabled || webrtcDirect?.isConnected) &&
    otherPlayers.size > 0
  ) {
    ctx.save();
    ctx.font = '16px sans-serif';
    if (highestPlayerIds.includes('self')) {
      ctx.fillStyle = 'gold';
      ctx.fillText('👑', player.x - cameraX + player.width / 2, player.y - 22);
    } else {
      ctx.fillStyle = '#fff';
    }
    ctx.textAlign = 'center';
    ctx.fillText(
      playerName || 'Player',
      player.x - cameraX + player.width / 2,
      player.y - 8
    );
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
  if (
    (multiplayerEnabled || webrtcDirect?.isConnected) &&
    otherPlayers.size > 0
  ) {
    // --- Leaderboard ---
    // Deduplicate by player id (self and others)
    const selfPlayerId = webrtcDirect?.isConnected
      ? p2pLocalPlayerId
      : multiplayerManager.currentPlayerId;
    const leaderboardMap = new Map();
    // Add self
    leaderboardMap.set(selfPlayerId, {
      id: selfPlayerId,
      name: playerName || 'Player',
      score,
      isSelf: true,
    });
    // Add others, but skip if id matches self
    for (const p of otherPlayers.values()) {
      if (p.id !== selfPlayerId) {
        leaderboardMap.set(p.id, {
          id: p.id,
          name: p.name || 'Player',
          score: typeof p.score === 'number' ? p.score : 0,
          isSelf: false,
        });
      }
    }
    const leaderboardPlayers = Array.from(leaderboardMap.values());
    leaderboardPlayers.sort((a, b) => b.score - a.score);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.fillRect(
      canvas.width - 240,
      20,
      220,
      36 + 32 * Math.min(5, leaderboardPlayers.length)
    );
    ctx.globalAlpha = 1;
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', canvas.width - 225, 44);
    for (let i = 0; i < Math.min(5, leaderboardPlayers.length); i++) {
      const p = leaderboardPlayers[i];
      ctx.font = p.isSelf ? 'bold 18px sans-serif' : '18px sans-serif';
      ctx.fillStyle = p.isSelf ? '#0cf' : i === 0 ? 'gold' : '#fff';
      const crown = i === 0 ? '👑 ' : '';
      ctx.fillText(
        `${crown}${p.name.slice(0, 12)}`,
        canvas.width - 225,
        76 + i * 32
      );
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
  // Show eaten enemy indicator
  if (player.eatenEnemy) {
    ctx.save();
    ctx.translate(iconX, 120);
    if (player.eatenEnemy.type === 'circle') {
      // Show small circle icon
      ctx.fillStyle = '#f06';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, 2 * Math.PI);
      ctx.fill();
      // Add border to show it's "stored"
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
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
    ctx.fillText(
      `Top Score: ${topScore}`,
      canvas.width / 2,
      canvas.height / 2 + 40
    );
    if (score > Number(localStorage.getItem('topScore') || '0')) {
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = '#0cf';
      ctx.fillText(
        'You beat your own top score!',
        canvas.width / 2,
        canvas.height / 2 + 90
      );
      if (confettiTimer === 0) launchConfetti();
    }
    ctx.restore();
    showRestartButton();
  } else {
    hideRestartButton();
    hideShareButton();
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
  // Draw confetti and love hearts last so they appear on top
  drawConfetti();
  drawLoveHearts();
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
    if (frameCount % 60 === 0) {
      // Update FPS display every 60 frames
      fpsDisplay = Math.round(1000 / (deltaTime / 60));
    }

    update(deltaTime / 1000); // Pass actual delta time in seconds
    updateConfetti();
    updateLoveHearts();
    lastFrameTime = currentTime;
  }
  requestAnimationFrame(gameLoop);
}

// Input state
const keys: Record<string, boolean> = {};
let _prevJumpKey = false;
let prevSpeedToggleKey = false;
let prevActionKey = false;
let jumpCooldown = 0; // Cooldown for continuous jumping
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

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
multiplayerManager.setWebRTCEnabled(webRTCEnabled);
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
          gameState.players.forEach((playerData) => {
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
                setTopScore(score);
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
        multiplayerManager.onPlayerUpdate(
          (playerId, position, scoreFromServer, nameFromServer) => {
            if (otherPlayers.has(playerId)) {
              const player = otherPlayers.get(playerId);
              if (!player) return;
              Object.assign(player, position);
              if (typeof scoreFromServer === 'number')
                player.score = scoreFromServer;
              if (typeof nameFromServer === 'string')
                player.name = nameFromServer;
            } else {
              otherPlayers.set(playerId, {
                id: playerId,
                x: position.x ?? 0,
                y: position.y ?? 0,
                width: position.width ?? 40,
                height: position.height ?? 50,
                growLevel: position.growLevel,
                score: scoreFromServer,
                name: nameFromServer,
              });
            }
            // If this is you, update your score and name
            if (playerId === multiplayerManager.currentPlayerId) {
              if (typeof scoreFromServer === 'number') {
                score = scoreFromServer;
                setTopScore(score);
              }
              if (
                typeof nameFromServer === 'string' &&
                nameFromServer !== playerName
              ) {
                playerName = nameFromServer;
                localStorage.setItem('playerName', playerName);
                if (playerNameInput) playerNameInput.value = playerName;
              }
            }
          }
        );
      } else {
        console.log('Running in single-player mode');
      }
    } catch (_error) {
      console.log(
        'Multiplayer initialization failed, continuing in single-player mode'
      );
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
  enemies.length = 0;
  tubes.length = 0;

  // Solid floor
  platforms.push({ x: 0, y: LEVEL_HEIGHT, width: canvas.width, height: 50 });

  // Fill the level with coins (grid)
  const coinSpacingX = 60;
  const coinSpacingY = 60;
  for (let y = LEVEL_HEIGHT - 100; y > 0; y -= coinSpacingY) {
    for (let x = 20; x < canvas.width - 20; x += coinSpacingX) {
      collectibles.push({
        x,
        y,
        width: 20,
        height: 20,
        collected: false,
        type: 'coin',
        id: generateCollectibleId('coin'),
      });
    }
  }

  // Only moving platforms, close to each other, including lower and middle platforms
  const platWidth = 80;
  const platHeight = 20;
  const verticalGap = 60;
  const startY = LEVEL_HEIGHT - 60; // start closer to the floor
  const endY = 80;
  const horizontalGaps = [
    40,
    canvas.width / 2 - platWidth / 2,
    canvas.width - platWidth - 40,
  ];
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
      movingPlatforms.push({
        x,
        y,
        width: platWidth,
        height: platHeight,
        dx: platIndex % 2 === 0 ? 2 : -2,
        range: 120,
        startX: x,
      });
      platIndex++;
    }
  }

  // Add a very large stable beam at the top for the flag
  const JUMP_POWER = 13;
  const jumpLength = JUMP_POWER * 8; // 104
  const topBeamHeight = 50;
  const topBeamY = 40 + jumpLength; // Lowered by one jump length from the top
  const topBeam = {
    x: 0,
    y: topBeamY,
    width: canvas.width,
    height: topBeamHeight,
  };
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

  // Register all collectibles with the server for multiplayer
  if (multiplayerEnabled && collectibles.length > 0) {
    const backendUrl =
      window.location.port === '5173'
        ? 'http://localhost:3001/register-collectibles'
        : '/register-collectibles';
    try {
      fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectibles: collectibles.map((c) => ({
            id: c.id,
            type: c.type,
          })),
        }),
      });
    } catch (_e) {
      /* ignore */
    }
  }

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
  const boxes: Rect[] = [];
  const spikes: Rect[] = [];
  const movingPlatforms: MovingPlatform[] = [];
  const collectibles: Collectible[] = [];
  // Fill the level with coins (grid)
  const coinSpacingX = 60;
  const coinSpacingY = 60;
  for (let y = LEVEL_HEIGHT - 100; y > 0; y -= coinSpacingY) {
    for (let x = 20; x < canvasWidth - 20; x += coinSpacingX) {
      collectibles.push({
        x,
        y,
        width: 20,
        height: 20,
        collected: false,
        type: 'coin',
        id: `testcoin_${x}_${y}`,
      });
    }
  }
  // Only moving platforms, close to each other, including lower and middle platforms
  const platWidth = 80;
  const platHeight = 20;
  const verticalGap = 60;
  const startY = LEVEL_HEIGHT - 60;
  const endY = 80;
  const horizontalGaps = [
    40,
    canvasWidth / 2 - platWidth / 2,
    canvasWidth - platWidth - 40,
  ];
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
      movingPlatforms.push({
        x,
        y,
        width: platWidth,
        height: platHeight,
        dx: platIndex % 2 === 0 ? 2 : -2,
        range: 120,
        startX: x,
      });
      platIndex++;
    }
  }
  const finishFlag = { x: canvasWidth / 2 - 12, y: 40, width: 24, height: 80 };
  return {
    platforms,
    boxes,
    collectibles,
    spikes,
    movingPlatforms,
    finishFlag,
  };
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

// Handle window resize to update button positions on mobile devices
window.addEventListener('resize', () => {
  const shareBtn = document.getElementById('share-btn');
  const restartBtn = document.getElementById('restart-btn');

  if (shareBtn && shareBtn.style.display !== 'none') {
    if (window.innerWidth <= 768) {
      shareBtn.style.top = 'calc(50% + 140px)';
      shareBtn.style.left = 'calc(50% - 160px)'; // Farther to the left
      shareBtn.style.transform = 'translateX(0)';
      shareBtn.style.fontSize = '1.2em';
      shareBtn.style.padding = '10px 16px';
    } else {
      shareBtn.style.top = 'calc(50% + 120px)';
      shareBtn.style.left = '50%';
      shareBtn.style.transform = 'translateX(-50%)';
      shareBtn.style.fontSize = '1.8em';
      shareBtn.style.padding = '12px 24px';
    }
  }

  if (restartBtn && restartBtn.style.display !== 'none') {
    if (window.innerWidth <= 768) {
      restartBtn.style.top = 'calc(50% + 140px)';
      restartBtn.style.left = 'calc(50% + 80px)'; // Farther to the right
      restartBtn.style.transform = 'translateX(0)';
      restartBtn.style.fontSize = '1.2em';
      restartBtn.style.padding = '10px 16px';
    } else {
      restartBtn.style.top = 'calc(50% + 160px)';
      restartBtn.style.left = '50%';
      restartBtn.style.transform = 'translateX(-50%)';
      restartBtn.style.fontSize = '2em';
      restartBtn.style.padding = '16px 32px';
    }
  }
});
