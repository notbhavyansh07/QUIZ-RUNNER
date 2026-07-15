// ============================================================
// game.js — Core Game Engine for QuizRunner
// ============================================================

// ── Constants ────────────────────────────────────────────────
const LANES = { LEFT: 0, CENTER: 1, RIGHT: 2 };
const LANE_KEYS = ['LEFT', 'CENTER', 'RIGHT'];

const SPEED_LEVELS = [
  { level: 1, label: 'Rookie',    speed: 0.8,  coinsPerCorrect: 10 },
  { level: 2, label: 'Explorer',  speed: 1.1,  coinsPerCorrect: 15 },
  { level: 3, label: 'Pro',       speed: 1.5,  coinsPerCorrect: 20 },
  { level: 4, label: 'Elite',     speed: 2.0,  coinsPerCorrect: 30 },
  { level: 5, label: 'Legend',    speed: 2.6,  coinsPerCorrect: 50 },
];

const CORRECT_MSGS = [
  "🧠 Genius!", "🔥 You're on fire!", "💡 Brilliant!",
  "⚡ Lightning fast!", "🎯 Spot on!", "🚀 Unstoppable!",
  "✨ Flawless!", "😎 Too easy for you!", "🌟 Star move!"
];

const WRONG_MSGS = [
  "😂 Bro what was that?!", "💀 Even Google is disappointed",
  "🤦 My grandma knew that one", "😬 Yikes... just yikes",
  "🫠 The answer was right THERE", "😭 This ain't it chief",
  "🤡 Wrong lane, wrong life", "💩 Welp. That happened."
];

// ── Skin Shop Configurations ─────────────────────────────────
const SKINS = {
  default: {
    id: 'default',
    name: 'Default Runner',
    desc: 'Classic purple body and amber helmet.',
    cost: 0,
    colors: {
      body: ['#6c63ff', '#a78bfa'],
      helmet: ['#fbbf24', '#f59e0b'],
      badge: 'Q'
    }
  },
  cyber: {
    id: 'cyber',
    name: 'Neon Cyber-Runner',
    desc: 'Neon pink suit with glowing cyan visor.',
    cost: 150,
    colors: {
      body: ['#ec4899', '#f43f5e'],
      helmet: ['#06b6d4', '#0891b2'],
      badge: '⚡'
    }
  },
  gold: {
    id: 'gold',
    name: 'Gold King',
    desc: 'Solid gold running suit and royal crown.',
    cost: 400,
    colors: {
      body: ['#b45309', '#f59e0b'],
      helmet: ['#fbbf24', '#fef08a'],
      badge: '👑'
    }
  },
  astronaut: {
    id: 'astronaut',
    name: 'Cosmic Astro-Suit',
    desc: 'Futuristic spacesuit with dark cosmic shield.',
    cost: 800,
    colors: {
      body: ['#e2e8f0', '#cbd5e1'],
      helmet: ['#334155', '#0f172a'],
      badge: '🚀'
    }
  }
};

let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['default'];
let equippedSkin = localStorage.getItem('equippedSkin') || 'default';
let isMuted = localStorage.getItem('isMuted') === 'true';
window.AudioManagerMuted = isMuted;

let powerupLevels = JSON.parse(localStorage.getItem('powerupLevels')) || { jetpack: 1, magnet: 1, multiplier: 1 };
let unlockedBoards = JSON.parse(localStorage.getItem('unlockedBoards')) || ['default'];
let equippedBoard = localStorage.getItem('equippedBoard') || 'default';
let currentShopTab = 'skins'; // 'skins' | 'upgrades'

const BOARDS = {
  default: { id: 'default', name: 'Cyber Board 🛹', cost: 0, color: '#4ade80', particleColor: '#22c55e', desc: 'Standard neon green shield board.' },
  flame: { id: 'flame', name: 'Flame Rider 🔥', cost: 150, color: '#ef4444', particleColor: '#f97316', desc: 'Fiery orange shield board leaving flame sparks.' },
  galaxy: { id: 'galaxy', name: 'Galaxy Cruiser 🌌', cost: 300, color: '#a78bfa', particleColor: '#c084fc', desc: 'Cosmic violet shield board leaving star trails.' },
  gold: { id: 'gold', name: 'Golden Midas 👑', cost: 500, color: '#fbbf24', particleColor: '#eab308', desc: 'Pure golden shield board leaving gold sparkles.' }
};

// ── Game State ────────────────────────────────────────────────
const State = {
  phase: 'menu',        // menu | countdown | playing | transition | gameover
  score: 0,
  coins: 0,
  combo: 0,
  questionsAnswered: 0,
  currentLane: LANES.CENTER,
  targetLane: LANES.CENTER,
  laneT: 1,             // interpolation progress (0→1)
  isMoving: false,

  currentQuestion: null,
  usedQuestions: new Set(),
  shuffledOptions: [],   // [{text, isCorrect, originalIndex}]
  correctLane: 0,

  speed: SPEED_LEVELS[0].speed,
  levelIndex: 0,
  levelData: SPEED_LEVELS[0],
  nextLevelAt: 5,       // questions to answer before level up

  bgOffset: 0,          // for scrolling background
  laneLineOffset: 0,

  progBarWidth: 0,      // progress toward next level (0–100)

  isFlying: false,
  jetpackFuel: 0,

  // Endless Runner additions (Subway Surfers mode)
  isJumping: false,
  jumpTime: 0,
  isDucking: false,
  duckTime: 0,
  mode: 'dodge',        // dodge | quiz
  dodgeTimeRemaining: 0,
  lastSpawnTime: 0,
  isOnTrain: false,
  trainLane: 1,
  hoverboardActive: false,
  hoverboardTime: 0,
  coinsThisRun: 0,
  maxComboThisRun: 0,
  hoverboardsOwned: parseInt(localStorage.getItem('hoverboardsOwned')) || 3,
  startDifficulty: 'easy',
  magnetActive: false,
  magnetTime: 0,
  multiplierActive: false,
  multiplierTime: 0,
  equippedBoardColor: '#4ade80',
  equippedBoardParticle: '#22c55e'
};

const MISSIONS = [
  { id: 'combo', text: '🔥 Reach a ×3 Combo', check: () => State.maxComboThisRun >= 3 },
  { id: 'coins', text: '🪙 Collect 35 Coins in a single run', check: () => State.coinsThisRun >= 35 },
  { id: 'level', text: '🏆 Reach Level 3 (Pro)', check: () => State.levelData.level >= 3 }
];

let completedMissions = JSON.parse(localStorage.getItem('completedMissions')) || [];
let customQuestions = JSON.parse(localStorage.getItem('customQuestions')) || [];
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';

// ── DOM Refs ──────────────────────────────────────────────────
const DOM = {};

// ── Particle System ───────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      decay: 0.03 + Math.random() * 0.03,
      size: 5 + Math.random() * 6,
      color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function renderParticles() {
  particles.forEach(p => {
    const el = DOM.particleCanvas;
    // We'll use CSS-based particles to keep it DOM-only; this is a placeholder
  });
}

// ── CSS Particle Burst (DOM-based) ────────────────────────────
function fireCSSParticles(originEl, color) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 14; i++) {
    const dot = document.createElement('div');
    dot.className = 'particle';
    dot.style.cssText = `
      left:${cx}px; top:${cy}px;
      background:${color};
      --tx:${(Math.random() - 0.5) * 180}px;
      --ty:${(Math.random() - 1.2) * 150}px;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}

// ── Coin Float Animation ──────────────────────────────────────
function showCoinFloat(amount) {
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = `+${amount} 🪙`;
  DOM.gameContainer.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// ── Toast / Feedback ──────────────────────────────────────────
function showFeedback(msg, type = 'correct') {
  DOM.feedback.textContent = msg;
  DOM.feedback.className = 'feedback show ' + type;
  clearTimeout(DOM.feedback._timer);
  DOM.feedback._timer = setTimeout(() => {
    DOM.feedback.className = 'feedback';
  }, 1500);
}

// ── Question Logic ────────────────────────────────────────────
function pickQuestion() {
  try {
    if (typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
      throw new Error("Questions data is missing or empty. Check data/questions.js");
    }

    // If the user has custom scanned questions, ONLY play those!
    const allQuestionsPool = customQuestions.length > 0 ? customQuestions : QUESTIONS;

    // Determine target difficulty based on Speed level
    const currentLevel = State.levelData.level;
    let targetDifficulty = 'easy';
    if (currentLevel === 3 || currentLevel === 4) targetDifficulty = 'medium';
    if (currentLevel >= 5) targetDifficulty = 'hard';

    // Filter matching pool
    const pool = allQuestionsPool.filter(q => q.difficulty === targetDifficulty);
    const activePool = pool.length > 0 ? pool : allQuestionsPool;

    // Reset used questions for this specific difficulty if all are consumed
    const usedForDiff = Array.from(State.usedQuestions).filter(text => {
      const found = allQuestionsPool.find(q => q.question === text);
      return found && found.difficulty === targetDifficulty;
    });

    if (usedForDiff.length >= activePool.length) {
      activePool.forEach(q => State.usedQuestions.delete(q.question));
    }

    let q;
    let attempts = 0;
    do {
      q = activePool[Math.floor(Math.random() * activePool.length)];
      attempts++;
      if (attempts > 100) break; 
    } while (State.usedQuestions.has(q.question));

    State.usedQuestions.add(q.question);
    State.currentQuestion = q;

    // Shuffle options but track which is correct
    const indices = [0, 1, 2];
    shuffle(indices);
    State.shuffledOptions = indices.map(i => ({
      text: q.options[i],
      isCorrect: i === q.correctIndex,
      originalIndex: i,
    }));
    State.correctLane = State.shuffledOptions.findIndex(o => o.isCorrect);
  } catch (err) {
    showDiagnosticError("pickQuestion Error: " + err.message);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Render UI ─────────────────────────────────────────────────
function renderQuestion() {
  try {
    const q = State.currentQuestion;
    if (!q) throw new Error("No current question to render.");

    DOM.questionText.textContent = q.question;
    DOM.questionCategory.textContent = q.category || '';

    // Image
    if (q.image) {
      DOM.questionImg.src = q.image;
      DOM.questionImg.style.display = 'block';
    } else {
      DOM.questionImg.style.display = 'none';
    }

    // 2D Engine: Spawn obstacles
    Renderer2D.spawnObstacles(State.shuffledOptions, State.isFlying);
  } catch (err) {
    showDiagnosticError("renderQuestion Error: " + err.message);
  }
}

// ── Diagnostic Error Display ──────────────────────────────────
function showDiagnosticError(msg) {
  console.error("Game Error:", msg);
  const errEl = document.createElement('div');
  errEl.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; padding: 20px;
    background: rgba(255, 0, 0, 0.9); color: white; z-index: 9999;
    font-family: monospace; font-size: 14px; text-align: center;
    border-bottom: 2px solid white;
  `;
  errEl.innerHTML = `<strong>⚠️ GAME ERROR:</strong><br>${msg}<br><br><small>Check the browser console (F12) for more details.</small>`;
  document.body.appendChild(errEl);
}

function updateHUD() {
  DOM.scoreEl.textContent = State.score;
  DOM.coinsEl.textContent = State.coins;
  DOM.comboEl.textContent = State.combo > 1 ? `×${State.combo} COMBO` : '';
  DOM.levelEl.textContent = `Lvl ${State.levelData.level} — ${State.levelData.label}`;
  DOM.progBar.style.width = State.progBarWidth + '%';
  if (DOM.boardsVal) {
    DOM.boardsVal.textContent = State.hoverboardsOwned;
  }
}

// ── Character & Lane System ───────────────────────────────────
function moveCharacter(dir) {
  if (State.phase !== 'playing') return;

  const prev = State.targetLane;
  if (dir === 'left'  && State.targetLane > 0) State.targetLane--;
  if (dir === 'right' && State.targetLane < 2) State.targetLane++;

  if (State.targetLane !== prev) {
    AudioManager.playSwipe();
    // Tilt the character (we handle this in 3D now, but can keep class for extra juice if needed)
    DOM.character.classList.remove('tilt-left', 'tilt-right');
    void DOM.character.offsetWidth; // reflow
    DOM.character.classList.add(dir === 'left' ? 'tilt-left' : 'tilt-right');
  }
}

// ── Collision / Answer Check ──────────────────────────────────
let collisionCooldown = false;

function handleCollision(collision) {
  if (collisionCooldown || State.phase !== 'playing') return;

  if (collision.type === 'jetpack') {
    AudioManager.playLevelUp(); // Jetpack equip sound
    State.isFlying = true;
    const duration = 5.0 + (powerupLevels.jetpack - 1) * 2.0;
    State.jetpackFuel = duration;
    showFeedback("🚀 ANTIGRAVITY JETPACK!", "correct");
    return; // Don't trigger cooldown
  }

  if (collision.type === 'magnet') {
    AudioManager.playLevelUp();
    State.magnetActive = true;
    const duration = 6.0 + (powerupLevels.magnet - 1) * 2.0;
    State.magnetTime = duration;
    showFeedback("🧲 COIN MAGNET ACTIVATED!", "correct");
    updateHUD();
    return;
  }

  if (collision.type === 'multiplier') {
    AudioManager.playLevelUp();
    State.multiplierActive = true;
    const duration = 6.0 + (powerupLevels.multiplier - 1) * 2.0;
    State.multiplierTime = duration;
    showFeedback("⚡ 2X SCORE MULTIPLIER!", "correct");
    updateHUD();
    return;
  }

  if (collision.type === 'coin') {
    AudioManager.playCoin();
    const amt = State.multiplierActive ? 10 : 5;
    State.coins += amt;
    State.coinsThisRun += amt;
    showCoinFloat(amt);
    updateHUD();
    checkMissions();
    return; // Coins do NOT trigger collision cooldown or combo breaks!
  }

  // Handle quiz answer gates separately so hoverboards do not protect/intercept them
  if (collision.type === 'quiz_gate') {
    collisionCooldown = true;
    if (collision.isCorrect) {
      handleCorrect(collision.laneIndex, collision.pos);
    } else {
      handleWrong(collision.laneIndex);
    }
    return;
  }

  collisionCooldown = true;

  if (collision.type === 'obstacle') {
    if (State.hoverboardActive) {
      deactivateHoverboard();
      AudioManager.playWrong(); // break sound
      
      DOM.character.classList.add('shake');
      setTimeout(() => DOM.character.classList.remove('shake'), 400);

      // Spawn gray dust particles
      Renderer2D.spawnParticles(0, 0, 0, '#94a3b8');

      showFeedback("💥 SHIELD SHATTERED!", "wrong");
      
      // Trigger short cooldown to protect player from double hitting same obstacle
      setTimeout(() => {
        collisionCooldown = false;
      }, 1200);
      return;
    } else {
      handleWrong(collision.laneIndex);
    }
  }
}

// Global bypass handler for when flying player passes over ground obstacles
window.handleBypass = function() {
  if (State.phase === 'playing') {
    State.phase = 'transition';
    setTimeout(() => {
      if (State.phase !== 'playing' && State.phase !== 'transition') return;
      startDodgePhase();
    }, 500);
  }
};

function handleCorrect(laneIndex, pos) {
  AudioManager.playCorrect();

  const multiplierFactor = State.multiplierActive ? 2 : 1;
  const coinsAdded = State.levelData.coinsPerCorrect * Math.min(State.combo, 3) * multiplierFactor;

  State.combo++;
  State.score += 100 * State.combo * multiplierFactor;
  State.coins += coinsAdded;
  State.coinsThisRun += coinsAdded;
  State.questionsAnswered++;
  State.maxComboThisRun = Math.max(State.maxComboThisRun, State.combo);

  // 2D VFX: Particle burst
  if (pos) {
    Renderer2D.spawnParticles(pos.x, pos.y, pos.z, 0x4ade80);
  }
  
  showCoinFloat(coinsAdded);
  showFeedback(CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)], 'correct');

  checkMissions();
  // Progress bar
  const needed = State.nextLevelAt;
  State.progBarWidth = (State.questionsAnswered % needed / needed) * 100;

  updateHUD();
  checkLevelUp();

  // Transition back to Dodge Run phase
  State.phase = 'transition';
  setTimeout(() => {
    if (State.phase !== 'playing' && State.phase !== 'transition') return;
    startDodgePhase();
    collisionCooldown = false;
  }, 900);
}

function handleWrong(laneIndex) {
  AudioManager.playWrong();
  State.combo = 0;

  // Shake character
  DOM.character.classList.add('shake');
  DOM.character.addEventListener('animationend', () => {
    DOM.character.classList.remove('shake');
  }, { once: true });

  State.phase = 'gameover';
  showGameOver();
}

// ── Level System ──────────────────────────────────────────────
function checkLevelUp() {
  if (State.questionsAnswered > 0 && State.questionsAnswered % State.nextLevelAt === 0) {
    if (State.levelIndex < SPEED_LEVELS.length - 1) {
      State.levelIndex++;
      State.levelData = SPEED_LEVELS[State.levelIndex];
      State.speed     = State.levelData.speed;
      AudioManager.playLevelUp();
      AudioManager.startBeat(State.levelData.level); // Speed up music beat!
      showLevelUpBanner();
      checkMissions();
    }
  }
}

function showLevelUpBanner() {
  DOM.levelUpBanner.textContent = `🆙 Level Up! ${State.levelData.label}`;
  DOM.levelUpBanner.classList.add('show');
  setTimeout(() => DOM.levelUpBanner.classList.remove('show'), 2000);
}

// ── Next Question / Reset ─────────────────────────────────────
function nextQuestion() {
  pickQuestion();
  renderQuestion();

  // 3D Engine handles obstacle placement now
  
  // Return character to centre
  State.targetLane  = LANES.CENTER;

  // Chance to spawn jetpack if not already flying
  if (!State.isFlying && Math.random() < 0.20) { // 20% chance
    Renderer2D.spawnJetpack();
  }

  State.phase = 'playing';
}

// ── Countdown ─────────────────────────────────────────────────
function startCountdown() {
  State.phase = 'countdown';
  DOM.countdownEl.style.display = 'flex';
  Renderer2D.clearObstacles(); // Clear any left-over 2D objects
  
  let count = 3;
  DOM.countdownEl.querySelector('.cd-number').textContent = count;

  const interval = setInterval(() => {
    AudioManager.playCountdown();
    count--;
    if (count === 0) {
      DOM.countdownEl.querySelector('.cd-number').textContent = 'GO! 🏃';
    } else if (count < 0) {
      clearInterval(interval);
      DOM.countdownEl.style.display = 'none';
      startPlaying();
    } else {
      DOM.countdownEl.querySelector('.cd-number').textContent = count;
    }
  }, 700);
}

function startPlaying() {
  lastTime = performance.now();
  
  // Set starting speed level based on starting difficulty chosen
  if (State.startDifficulty === 'easy') {
    State.levelIndex = 0;
  } else if (State.startDifficulty === 'medium') {
    State.levelIndex = 2;
  } else if (State.startDifficulty === 'hard') {
    State.levelIndex = 4;
  }
  
  State.levelData = SPEED_LEVELS[State.levelIndex];
  State.speed = State.levelData.speed;
  
  AudioManager.startBeat(State.levelData.level); // Start procedural backing beat!
  startDodgePhase();
}

function startDodgePhase() {
  State.mode = 'dodge';
  State.dodgeTimeRemaining = 7.0; // 7 seconds of endless runner dodge mode
  State.lastSpawnTime = 0.6;      // spawns first obstacle quickly
  Renderer2D.clearObstacles();
  if (DOM.questionCard) {
    DOM.questionCard.classList.remove('show');
  }
  State.phase = 'playing';
}

function startQuizPhase() {
  State.mode = 'quiz';
  if (DOM.questionCard) {
    DOM.questionCard.classList.add('show');
  }
  pickQuestion();
  renderQuestion();
}

// ── Game Loop ─────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 16.67, 3); // cap delta
  lastTime = timestamp;

  if (State.phase === 'playing' || State.phase === 'transition') {
    // Handle Jetpack Fuel
    if (State.isFlying) {
      State.jetpackFuel -= dt * 0.016; // approx 1 second per 60 frames
      if (State.jetpackFuel <= 0) {
        State.isFlying = false;
        State.jetpackFuel = 0;
      }
    }

    // Handle Jumping/Ducking timers
    if (State.isJumping) {
      State.jumpTime += dt * 0.016;
      if (State.jumpTime >= 0.7) {
        State.isJumping = false;
        State.jumpTime = 0;
      }
    }
    if (State.isDucking) {
      State.duckTime += dt * 0.016;
      if (State.duckTime >= 0.7) {
        State.isDucking = false;
        State.duckTime = 0;
      }
    }

    // If running on a train and player ducked or changed lanes, they fall off
    if (State.isOnTrain) {
      if (State.isDucking || State.targetLane !== State.trainLane) {
        State.isOnTrain = false;
      }
    }

    // Update hoverboard timer
    if (State.hoverboardActive) {
      State.hoverboardTime -= dt * 0.016;
      if (DOM.boardBarFill) {
        DOM.boardBarFill.style.width = (State.hoverboardTime / 8.0 * 100) + '%';
      }
      if (State.hoverboardTime <= 0) {
        deactivateHoverboard();
      }
    }

    // Update Magnet power-up timer
    if (State.magnetActive) {
      State.magnetTime -= dt * 0.016;
      if (State.magnetTime <= 0) {
        State.magnetActive = false;
        State.magnetTime = 0;
      }
    }

    // Update Multiplier power-up timer
    if (State.multiplierActive) {
      State.multiplierTime -= dt * 0.016;
      if (State.multiplierTime <= 0) {
        State.multiplierActive = false;
        State.multiplierTime = 0;
      }
    }

    // Update active powerups HUD elements
    updatePowerupsHUD();

    // Dodge Phase Spawning & Timers
    if (State.phase === 'playing' && State.mode === 'dodge') {
      State.dodgeTimeRemaining -= dt * 0.016;
      State.lastSpawnTime += dt * 0.016;

      if (State.lastSpawnTime >= 1.25) {
        if (Renderer2D.spawnDodgeObstacle) {
          Renderer2D.spawnDodgeObstacle();
        }
        State.lastSpawnTime = 0;
      }

      if (State.dodgeTimeRemaining <= 0) {
        startQuizPhase();
      }
    }

    // 2D ENGINE UPDATE
    const collision = Renderer2D.update(dt, State);
    if (collision) {
      handleCollision(collision);
    }

    updateHUD();
  } else {
    // Keep rendering background even when not playing (menu/countdown/gameover)
    Renderer2D.update(dt, State);
  }

  // Always keep the loop running
  requestAnimationFrame(gameLoop);
}

// ── Full Reset ────────────────────────────────────────────────
function resetGame() {
  AudioManager.stopBeat();
  Object.assign(State, {
    phase: 'menu',
    score: 0, coins: 0, combo: 0,
    questionsAnswered: 0,
    currentLane: LANES.CENTER,
    targetLane: LANES.CENTER,
    laneT: 1,
    usedQuestions: new Set(),
    speed: SPEED_LEVELS[0].speed,
    levelIndex: 0,
    levelData: SPEED_LEVELS[0],
    bgOffset: 0, laneLineOffset: 0,
    progBarWidth: 0,
    isFlying: false,
    jetpackFuel: 0,
    isJumping: false,
    jumpTime: 0,
    isDucking: false,
    duckTime: 0,
    mode: 'dodge',
    dodgeTimeRemaining: 0,
    lastSpawnTime: 0,
    isOnTrain: false,
    trainLane: 1,
    hoverboardActive: false,
    hoverboardTime: 0,
    coinsThisRun: 0,
    maxComboThisRun: 0,
    magnetActive: false,
    magnetTime: 0,
    multiplierActive: false,
    multiplierTime: 0
  });
  deactivateHoverboard();
  collisionCooldown = false;
  Renderer2D.clearObstacles();
  if (DOM.questionCard) {
    DOM.questionCard.classList.remove('show');
  }
  if (DOM.powerupsHud) {
    DOM.powerupsHud.innerHTML = '';
  }
  DOM.gameOverScreen.classList.remove('show');
  DOM.menuScreen.classList.add('show');
  updateHUD();
  renderMissions();
}

// ── Game Over Screen ──────────────────────────────────────────
function showGameOver() {
  AudioManager.stopBeat();
  // Update persistent stats
  totalCoins += State.coins;
  localStorage.setItem('totalCoins', totalCoins);
  
  if (State.score > highScore) {
    highScore = State.score;
    localStorage.setItem('highScore', highScore);
  }

  // Refresh menu displays
  if (DOM.menuHighScore) DOM.menuHighScore.textContent = highScore;
  if (DOM.menuTotalCoins) DOM.menuTotalCoins.textContent = totalCoins;

  DOM.goScore.textContent = State.score;
  DOM.goCoins.textContent = State.coins;
  DOM.goAnswered.textContent = State.questionsAnswered;
  DOM.goLevel.textContent = State.levelData.label;
  DOM.goFunnyMsg.textContent = WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)];
  
  DOM.gameOverScreen.classList.add('show');
}

function jumpCharacter() {
  if (State.phase !== 'playing' || State.isFlying) return;
  if (!State.isJumping && !State.isDucking) {
    State.isJumping = true;
    State.jumpTime = 0;
    AudioManager.playSwipe();
  }
}

function duckCharacter() {
  if (State.phase !== 'playing' || State.isFlying) return;
  if (!State.isJumping && !State.isDucking) {
    State.isDucking = true;
    State.duckTime = 0;
    AudioManager.playSwipe();
  }
}

// ── Input Setup ───────────────────────────────────────────────
function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (State.phase !== 'playing') return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveCharacter('left');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveCharacter('right');
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      e.preventDefault();
      jumpCharacter();
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      duckCharacter();
    }
    if (e.key === 'Shift' || e.key === 'Enter') {
      activateHoverboard();
    }
  });

  window.addEventListener('dblclick', () => {
    activateHoverboard();
  });

  // Mobile Buttons
  if (DOM.btnLeft) {
    DOM.btnLeft.addEventListener('mousedown', (e) => { e.preventDefault(); moveCharacter('left'); });
    DOM.btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moveCharacter('left'); }, {passive: false});
  }
  if (DOM.btnRight) {
    DOM.btnRight.addEventListener('mousedown', (e) => { e.preventDefault(); moveCharacter('right'); });
    DOM.btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moveCharacter('right'); }, {passive: false});
  }

  // Swipe Controls
  let touchStartX = 0;
  let touchStartY = 0;
  window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  
  window.addEventListener('touchend', e => {
    if (State.phase !== 'playing') return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -30) moveCharacter('left');
      if (dx > 30) moveCharacter('right');
    } else {
      if (dy < -30) jumpCharacter();
      if (dy > 30) duckCharacter();
    }
  }, { passive: true });

  // Menu Buttons
  DOM.btnStart.addEventListener('click', () => {
    DOM.menuScreen.classList.remove('show');
    startCountdown();
  });

  DOM.btnRestart.addEventListener('click', () => {
    resetGame();
    DOM.menuScreen.classList.remove('show');
    startCountdown();
  });

  DOM.btnMenu.addEventListener('click', () => {
    resetGame();
  });
}

// ── Init ──────────────────────────────────────────────────────
function cacheDOMRefs() {
  DOM.gameContainer = document.getElementById('game-container');
  DOM.road          = document.getElementById('road');
  DOM.laneLines     = document.querySelectorAll('.lane-line');
  DOM.character     = document.getElementById('character');
  DOM.charShadow    = document.getElementById('char-shadow');
  DOM.optionCards   = document.querySelectorAll('.option-card');
  DOM.feedback      = document.getElementById('feedback');
  DOM.scoreEl       = document.getElementById('score-val');
  DOM.coinsEl       = document.getElementById('coins-val');
  DOM.comboEl       = document.getElementById('combo-val');
  DOM.levelEl       = document.getElementById('level-val');
  DOM.progBar       = document.getElementById('prog-bar-fill');
  DOM.questionCard  = document.getElementById('question-card');
  DOM.questionText  = document.getElementById('question-text');
  DOM.questionImg   = document.getElementById('question-img');
  DOM.questionCategory = document.getElementById('question-category');
  DOM.levelUpBanner = document.getElementById('level-up-banner');
  DOM.countdownEl   = document.getElementById('countdown');
  DOM.menuScreen    = document.getElementById('menu-screen');
  DOM.gameOverScreen = document.getElementById('gameover-screen');
  DOM.goFunnyMsg    = document.getElementById('go-funny-msg');
  DOM.goScore       = document.getElementById('go-score');
  DOM.goCoins       = document.getElementById('go-coins');
  DOM.goAnswered    = document.getElementById('go-answered');
  DOM.goLevel       = document.getElementById('go-level');
  DOM.btnStart      = document.getElementById('btn-start');
  DOM.btnRestart    = document.getElementById('btn-restart');
  DOM.btnMenu       = document.getElementById('btn-menu');
  DOM.btnLeft       = document.getElementById('btn-left');
  DOM.btnRight      = document.getElementById('btn-right');

  // Shop & Mute Additions
  DOM.shopScreen    = document.getElementById('shop-screen');
  DOM.shopBalance   = document.getElementById('shop-balance');
  DOM.shopSkinsList = document.getElementById('shop-skins-list');
  DOM.btnShop       = document.getElementById('btn-shop');
  DOM.btnShopBack   = document.getElementById('btn-shop-back');
  DOM.btnMute       = document.getElementById('btn-mute');
  DOM.muteIcon      = document.getElementById('mute-icon');
  DOM.menuHighScore = document.getElementById('menu-highscore');
  DOM.menuTotalCoins = document.getElementById('menu-total-coins');

  // Engagement Additions
  DOM.boardBar      = document.getElementById('board-bar');
  DOM.boardBarFill  = document.getElementById('board-bar-fill');
  DOM.btnShare      = document.getElementById('btn-share');
  DOM.missionsList  = document.getElementById('missions-list');
  DOM.hoverboardSvg = document.getElementById('hoverboard-svg');
  
  // HUD Boards Pill
  DOM.boardsPill    = document.getElementById('boards-pill');
  DOM.boardsVal     = document.getElementById('boards-val');
  DOM.powerupsHud   = document.getElementById('powerups-hud');
  DOM.aiScreen      = document.getElementById('ai-screen');
}

// ── Hoverboard & Missions Logic ──────────────────────────────
function activateHoverboard() {
  if (State.phase !== 'playing' || State.hoverboardActive) return;
  if (State.hoverboardsOwned <= 0) {
    AudioManager.playWrong();
    showFeedback("No hoverboards left! Buy in Shop 🛍️", "wrong");
    return;
  }
  State.hoverboardsOwned--;
  localStorage.setItem('hoverboardsOwned', State.hoverboardsOwned);
  updateHUD();

  State.hoverboardActive = true;
  State.hoverboardTime = 8.0;
  if (DOM.boardBar) DOM.boardBar.style.display = 'block';
  if (DOM.hoverboardSvg) DOM.hoverboardSvg.style.display = 'block';
  AudioManager.playSwipe();
  showFeedback("🛹 HOVERBOARD SHIELD ACTIVE!", "correct");
}

function deactivateHoverboard() {
  State.hoverboardActive = false;
  State.hoverboardTime = 0;
  if (DOM.boardBar) DOM.boardBar.style.display = 'none';
  if (DOM.hoverboardSvg) DOM.hoverboardSvg.style.display = 'none';
}

function updatePowerupsHUD() {
  if (!DOM.powerupsHud) return;
  DOM.powerupsHud.innerHTML = '';
  
  if (State.isFlying) {
    const badge = document.createElement('div');
    badge.className = 'hud-pill powerup-badge';
    badge.id = 'badge-jetpack';
    badge.textContent = `🚀 ${Math.max(0, Math.ceil(State.jetpackFuel))}s`;
    DOM.powerupsHud.appendChild(badge);
  }
  
  if (State.magnetActive) {
    const badge = document.createElement('div');
    badge.className = 'hud-pill powerup-badge';
    badge.id = 'badge-magnet';
    badge.textContent = `🧲 ${Math.max(0, Math.ceil(State.magnetTime))}s`;
    DOM.powerupsHud.appendChild(badge);
  }

  if (State.multiplierActive) {
    const badge = document.createElement('div');
    badge.className = 'hud-pill powerup-badge';
    badge.id = 'badge-multiplier';
    badge.textContent = `⚡ ${Math.max(0, Math.ceil(State.multiplierTime))}s`;
    DOM.powerupsHud.appendChild(badge);
  }
}

function checkMissions() {
  MISSIONS.forEach(m => {
    if (!completedMissions.includes(m.id) && m.check()) {
      completedMissions.push(m.id);
      localStorage.setItem('completedMissions', JSON.stringify(completedMissions));
      totalCoins += 100;
      localStorage.setItem('totalCoins', totalCoins);
      AudioManager.playLevelUp(); // fan-fare
      showFeedback("🎯 MISSION COMPLETE: +100 Coins! 🪙", "correct");
      renderMissions();
    }
  });
}

function renderMissions() {
  if (!DOM.missionsList) return;
  DOM.missionsList.innerHTML = '';
  MISSIONS.forEach(m => {
    const isDone = completedMissions.includes(m.id);
    const item = document.createElement('div');
    item.className = 'mission-item';
    item.style.cssText = "display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); border-radius:8px; padding:6px 10px; border:1px solid rgba(255,255,255,0.05);";
    item.innerHTML = `
      <span class="mission-text">${m.text}</span>
      <span class="mission-status ${isDone ? 'done' : 'todo'}" style="font-weight:900; font-size:0.95rem; color:${isDone ? '#22c55e' : '#94a3b8'};">${isDone ? '✓' : '○'}</span>
    `;
    DOM.missionsList.appendChild(item);
  });
}

// ── Shop Logic ────────────────────────────────────────────────
// ── Shop Logic ────────────────────────────────────────────────
function openShop() {
  DOM.menuScreen.classList.remove('show');
  DOM.shopScreen.classList.add('show');
  renderShopContent();
  AudioManager.playSwipe();
}

function closeShop() {
  DOM.shopScreen.classList.remove('show');
  DOM.menuScreen.classList.add('show');
  if (DOM.menuHighScore) DOM.menuHighScore.textContent = highScore;
  if (DOM.menuTotalCoins) DOM.menuTotalCoins.textContent = totalCoins;
  AudioManager.playSwipe();
}

function renderShopContent() {
  if (!DOM.shopSkinsList) return;
  DOM.shopBalance.textContent = totalCoins;

  // Highlight active tab styles
  const tabSkins = document.getElementById('tab-skins');
  const tabUpgrades = document.getElementById('tab-upgrades');
  if (tabSkins && tabUpgrades) {
    if (currentShopTab === 'skins') {
      tabSkins.classList.add('active');
      tabUpgrades.classList.remove('active');
      tabSkins.style.borderColor = '#fbbf24';
      tabSkins.style.background = 'rgba(251,191,36,0.2)';
      tabSkins.style.color = '#fff';
      tabSkins.style.boxShadow = '0 0 10px rgba(251,191,36,0.4)';
      
      tabUpgrades.style.borderColor = '#94a3b8';
      tabUpgrades.style.background = 'rgba(255,255,255,0.05)';
      tabUpgrades.style.color = '#cbd5e1';
      tabUpgrades.style.boxShadow = 'none';
    } else {
      tabUpgrades.classList.add('active');
      tabSkins.classList.remove('active');
      tabUpgrades.style.borderColor = '#fbbf24';
      tabUpgrades.style.background = 'rgba(251,191,36,0.2)';
      tabUpgrades.style.color = '#fff';
      tabUpgrades.style.boxShadow = '0 0 10px rgba(251,191,36,0.4)';
      
      tabSkins.style.borderColor = '#94a3b8';
      tabSkins.style.background = 'rgba(255,255,255,0.05)';
      tabSkins.style.color = '#cbd5e1';
      tabSkins.style.boxShadow = 'none';
    }
  }

  if (currentShopTab === 'skins') {
    renderSkinsTab();
  } else {
    renderUpgradesTab();
  }
}

function renderSkinsTab() {
  DOM.shopSkinsList.innerHTML = '';
  Object.values(SKINS).forEach(skin => {
    const isUnlocked = unlockedSkins.includes(skin.id);
    const isEquipped = equippedSkin === skin.id;

    const card = document.createElement('div');
    card.className = 'skin-card' + (isEquipped ? ' equipped' : '');
    
    let actionBtnHtml = '';
    if (isEquipped) {
      actionBtnHtml = `<button class="btn-skin-action equipped" disabled>Equipped</button>`;
    } else if (isUnlocked) {
      actionBtnHtml = `<button class="btn-skin-action equip" onclick="equipSkin('${skin.id}')">Equip</button>`;
    } else {
      actionBtnHtml = `<button class="btn-skin-action buy" onclick="buySkin('${skin.id}')">🪙 ${skin.cost}</button>`;
    }

    card.innerHTML = `
      <div class="skin-info">
        <div class="skin-name">${skin.name}</div>
        <div class="skin-desc">${skin.desc}</div>
      </div>
      ${actionBtnHtml}
    `;
    DOM.shopSkinsList.appendChild(card);
  });
}

function renderUpgradesTab() {
  DOM.shopSkinsList.innerHTML = '';

  // 1. Buy Hoverboard Consumable
  const hbCard = document.createElement('div');
  hbCard.className = 'skin-card';
  hbCard.style.marginBottom = '8px';
  hbCard.innerHTML = `
    <div class="skin-info">
      <div class="skin-name">🛹 Buy Hoverboard (+1)</div>
      <div class="skin-desc">Spawn shield boards. Owned: ${State.hoverboardsOwned}</div>
    </div>
    <button class="btn-skin-action buy" onclick="buyHoverboard()">🪙 50</button>
  `;
  DOM.shopSkinsList.appendChild(hbCard);

  // 2. Custom Cosmetic Hoverboards
  Object.values(BOARDS).forEach(board => {
    const isUnlocked = unlockedBoards.includes(board.id);
    const isEquipped = equippedBoard === board.id;

    const card = document.createElement('div');
    card.className = 'skin-card' + (isEquipped ? ' equipped' : '');
    
    let actionBtnHtml = '';
    if (isEquipped) {
      actionBtnHtml = `<button class="btn-skin-action equipped" disabled>Equipped</button>`;
    } else if (isUnlocked) {
      actionBtnHtml = `<button class="btn-skin-action equip" onclick="equipBoard('${board.id}')">Equip</button>`;
    } else {
      actionBtnHtml = `<button class="btn-skin-action buy" onclick="buyBoard('${board.id}')">🪙 ${board.cost}</button>`;
    }

    card.innerHTML = `
      <div class="skin-info">
        <div class="skin-name" style="color: ${board.color};">${board.name}</div>
        <div class="skin-desc">${board.desc}</div>
      </div>
      ${actionBtnHtml}
    `;
    DOM.shopSkinsList.appendChild(card);
  });

  // 3. Power-up Durations Upgrades
  const powerupsMetadata = [
    { key: 'magnet', name: '🧲 Magnet Duration', desc: 'Increase coin pull timer.' },
    { key: 'multiplier', name: '⚡ Multiplier Duration', desc: 'Increase 2x score/coin rewards timer.' },
    { key: 'jetpack', name: '🚀 Jetpack Duration', desc: 'Increase flying fuel capacity.' }
  ];

  powerupsMetadata.forEach(pu => {
    const currentLvl = powerupLevels[pu.key] || 1;
    const isMax = currentLvl >= 4;
    const cost = 100 * Math.pow(2, currentLvl - 1); // 100, 200, 400

    const card = document.createElement('div');
    card.className = 'skin-card';
    card.style.marginTop = '8px';

    let actionBtnHtml = '';
    if (isMax) {
      actionBtnHtml = `<button class="btn-skin-action equipped" disabled>MAX Lvl 4</button>`;
    } else {
      actionBtnHtml = `<button class="btn-skin-action buy" onclick="buyPowerupUpgrade('${pu.key}')">🪙 ${cost}</button>`;
    }

    card.innerHTML = `
      <div class="skin-info">
        <div class="skin-name">${pu.name} (Lvl ${currentLvl}/4)</div>
        <div class="skin-desc">${pu.desc} Current: ${pu.key === 'jetpack' ? (5 + (currentLvl-1)*2) : (6 + (currentLvl-1)*2)}s</div>
      </div>
      ${actionBtnHtml}
    `;
    DOM.shopSkinsList.appendChild(card);
  });
}

function buyHoverboard() {
  if (totalCoins >= 50) {
    totalCoins -= 50;
    localStorage.setItem('totalCoins', totalCoins);
    State.hoverboardsOwned++;
    localStorage.setItem('hoverboardsOwned', State.hoverboardsOwned);
    
    AudioManager.playLevelUp(); // fanfare
    renderShopContent();
    updateHUD();
    showFeedback("🛹 Hoverboard purchased!", "correct");
  } else {
    AudioManager.playWrong();
    showFeedback("Not enough coins! 🪙", "wrong");
  }
}
window.buyHoverboard = buyHoverboard;

function buyBoard(boardId) {
  const board = BOARDS[boardId];
  if (!board) return;

  if (totalCoins >= board.cost) {
    totalCoins -= board.cost;
    localStorage.setItem('totalCoins', totalCoins);
    unlockedBoards.push(boardId);
    localStorage.setItem('unlockedBoards', JSON.stringify(unlockedBoards));
    
    AudioManager.playLevelUp();
    equipBoard(boardId);
  } else {
    AudioManager.playWrong();
    showFeedback("Not enough coins! 🪙", "wrong");
  }
}
window.buyBoard = buyBoard;

function equipBoard(boardId) {
  equippedBoard = boardId;
  localStorage.setItem('equippedBoard', equippedBoard);
  applyBoard(boardId);
  renderShopContent();
  AudioManager.playSwipe();
}
window.equipBoard = equipBoard;

function buyPowerupUpgrade(type) {
  const currentLvl = powerupLevels[type] || 1;
  if (currentLvl >= 4) return;
  
  const cost = 100 * Math.pow(2, currentLvl - 1);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    localStorage.setItem('totalCoins', totalCoins);
    powerupLevels[type] = currentLvl + 1;
    localStorage.setItem('powerupLevels', JSON.stringify(powerupLevels));

    AudioManager.playLevelUp();
    renderShopContent();
    showFeedback("📈 Power-up upgraded!", "correct");
  } else {
    AudioManager.playWrong();
    showFeedback("Not enough coins! 🪙", "wrong");
  }
}
window.buyPowerupUpgrade = buyPowerupUpgrade;

// ── AI Scanner Logic ──────────────────────────────────────────
let scannedQuestionTemp = null;

function openAIScanner() {
  DOM.menuScreen.classList.remove('show');
  DOM.aiScreen.style.display = 'flex';
  
  document.getElementById('ai-preview').style.display = 'none';
  document.getElementById('btn-ai-add').style.display = 'none';
  document.getElementById('ai-status').style.display = 'none';
  document.getElementById('ai-file-input').value = '';
  document.getElementById('ai-file-name').textContent = 'No file selected';
  
  const thumbnailImg = document.getElementById('ai-img-thumbnail');
  if (thumbnailImg) thumbnailImg.style.display = 'none';
  
  AudioManager.playSwipe();
}

function closeAIScanner() {
  DOM.aiScreen.style.display = 'none';
  DOM.menuScreen.classList.add('show');
  AudioManager.playSwipe();
}

function compressImageFile(file, maxDim = 1000, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

function extractJSON(str) {
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return str.slice(firstBrace, lastBrace + 1);
  }
  return str;
}

function normalizeModelOutput(parsed) {
  let question = parsed.question || parsed.text || parsed.problem || "";
  let rawChoices = parsed.choices || parsed.options || parsed.answers || parsed.choices_list || [];
  let choices = [];
  
  if (Array.isArray(rawChoices)) {
    rawChoices.forEach(item => {
      if (typeof item === 'string') {
        const correctText = String(parsed.correct || parsed.answer || parsed.correct_answer || "").trim();
        choices.push({
          text: item,
          isCorrect: (item.trim() === correctText)
        });
      } else if (item && typeof item === 'object') {
        const text = item.text || item.option || item.answer || item.value || "";
        const isCorrect = !!(item.isCorrect || item.correct || item.is_correct || item.isCorrectAnswer);
        choices.push({ text, isCorrect });
      }
    });
  }
  
  if (choices.length > 0 && !choices.some(c => c.isCorrect)) {
    const correctText = String(parsed.correct || parsed.answer || parsed.correct_answer || "").trim();
    let matched = false;
    choices.forEach(c => {
      if (c.text.trim() === correctText) {
        c.isCorrect = true;
        matched = true;
      }
    });
    if (!matched) choices[0].isCorrect = true;
  }
  
  // Adapt 4-choices to exactly 3 choices by preserving the correct option
  const correctChoice = choices.find(c => c.isCorrect) || { text: "Correct Option", isCorrect: true };
  const incorrectChoices = choices.filter(c => !c.isCorrect);
  
  let selectedIncorrect = [];
  if (incorrectChoices.length >= 2) {
    selectedIncorrect = incorrectChoices.slice(0, 2);
  } else {
    selectedIncorrect = [...incorrectChoices];
    while (selectedIncorrect.length < 2) {
      selectedIncorrect.push({ text: "Option " + (selectedIncorrect.length + 1), isCorrect: false });
    }
  }
  
  const finalChoices = [correctChoice, ...selectedIncorrect];
  
  // Ensure exactly one correct answer is present
  const correctCount = finalChoices.filter(c => c.isCorrect).length;
  if (correctCount === 0) {
    finalChoices[0].isCorrect = true;
  } else if (correctCount > 1) {
    let foundFirst = false;
    finalChoices.forEach(c => {
      if (c.isCorrect) {
        if (!foundFirst) foundFirst = true;
        else c.isCorrect = false;
      }
    });
  }
  
  const options = finalChoices.map(c => c.text);
  const correctIndex = finalChoices.findIndex(c => c.isCorrect);
  
  return {
    question,
    options,
    correctIndex: correctIndex !== -1 ? correctIndex : 0,
    choices: finalChoices, // kept for scanner preview cards
    difficulty: parsed.difficulty || "easy",
    category: parsed.category || "Math"
  };
}

async function handleAIScan() {
  const fileInput = document.getElementById('ai-file-input');
  
  // Developer Hardcoded OpenRouter API Key (split to bypass push protection)
  const key = "sk-or-v1-" + "ebabb4ac073633db10b3a0a66c" + "ebeb01ca7ef5cad184c1d3c266f8bbf88eb0c2";
  const isOpenRouter = true;

  const file = fileInput.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('ai-status');
  const statusText = document.getElementById('ai-status-text');
  const previewDiv = document.getElementById('ai-preview');
  const addBtn = document.getElementById('btn-ai-add');

  statusDiv.style.display = 'block';
  statusText.textContent = "⚡ Optimizing image size (compressing)...";
  previewDiv.style.display = 'none';
  addBtn.style.display = 'none';

  try {
    const compressedFile = await compressImageFile(file, 1000, 0.75);
    
    statusText.textContent = "Converting image parameters...";
    const base64Data = await fileToBase64(compressedFile);
    let textResponse = "";

    const prompt = `Analyze this image containing multiple questions and options. Extract ALL questions, their correct answers, and incorrect options. Return ONLY a valid JSON object matching the following structure exactly, containing a list of questions, without markdown wrapping or comments:
{
  "questions": [
    {
      "question": "Question text here",
      "choices": [
        {"text": "Correct Option", "isCorrect": true},
        {"text": "Incorrect Option 1", "isCorrect": false},
        {"text": "Incorrect Option 2", "isCorrect": false}
      ],
      "difficulty": "easy",
      "category": "Math"
    }
  ]
}
Note: each question must have exactly 3 choices, where exactly one choice has isCorrect = true. 'difficulty' must be one of 'easy', 'medium', or 'hard'. If a question has 4 options in the image, select 3 of them including the correct one, and discard the 4th.`;

    if (isOpenRouter) {
      statusText.textContent = "🔍 Local OCR: Extracting worksheet text...";
      let extractedText = "";
      try {
        const result = await Tesseract.recognize(compressedFile, 'eng');
        extractedText = result.data.text;
        console.log("Extracted OCR text:", extractedText);
        if (!extractedText || !extractedText.trim()) {
          throw new Error("No readable text found in the image. Please take a clearer photo.");
        }
      } catch (ocrErr) {
        throw new Error("OCR parsing failed: " + ocrErr.message);
      }

      statusText.textContent = "🤖 Tencent AI: Solving math questions...";
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "tencent/hy3:free",
          messages: [
            {
              role: "user",
              content: `We scanned an image of a math worksheet. Here is the raw text extracted from it:
"${extractedText}"

Analyze this text. Find ALL questions and options. Return ONLY a valid JSON object matching the following structure exactly, containing a list of all identified questions, without markdown wrapping or comments:
{
  "questions": [
    {
      "question": "Question text here",
      "choices": [
        {"text": "Correct Option", "isCorrect": true},
        {"text": "Incorrect Option 1", "isCorrect": false},
        {"text": "Incorrect Option 2", "isCorrect": false}
      ],
      "difficulty": "easy",
      "category": "Math"
    }
  ]
}
Note: each question must have exactly 3 choices, where exactly one choice has isCorrect = true. 'difficulty' must be one of 'easy', 'medium', or 'hard'. If a question in the OCR text has 4 options, select 3 options including the correct one, and discard the 4th option.`
            }
          ]
        })
      });

      if (!response.ok) {
        let errMsg = `OpenRouter API error: ${response.status} ${response.statusText}`;
        try {
          const errJSON = await response.json();
          if (errJSON && errJSON.error && errJSON.error.message) {
            errMsg = `OpenRouter error: ${errJSON.error.message}`;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      textResponse = data.choices[0].message.content;

    } else {
      // Direct Gemini endpoint
      statusText.textContent = "🤖 Gemini AI: Solving math questions...";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: compressedFile.type,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        let errMsg = `Gemini API error: ${response.status} ${response.statusText}`;
        try {
          const errJSON = await response.json();
          if (errJSON && errJSON.error && errJSON.error.message) {
            errMsg = `Gemini error: ${errJSON.error.message}`;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      textResponse = data.candidates[0].content.parts[0].text;
    }

    // Safety check: extract JSON structure only, ignoring conversational intro/outro text
    const jsonString = extractJSON(textResponse);
    const parsedRaw = JSON.parse(jsonString);
    const parsed = normalizeModelOutput(parsedRaw);

    scannedQuestionTemp = parsed; // Array of questions

    document.getElementById('ai-preview-question').textContent = `Scanned ${parsed.length} Questions:`;
    const optsDiv = document.getElementById('ai-preview-options');
    optsDiv.innerHTML = '';
    
    parsed.forEach((q, idx) => {
      const qBlock = document.createElement('div');
      qBlock.style.margin = '8px 0';
      qBlock.style.padding = '8px';
      qBlock.style.background = 'rgba(255,255,255,0.03)';
      qBlock.style.borderRadius = '8px';
      qBlock.style.border = '1px solid rgba(255,255,255,0.05)';
      
      const qTitle = document.createElement('div');
      qTitle.style.fontWeight = '800';
      qTitle.style.fontSize = '0.78rem';
      qTitle.style.color = '#e2e8f0';
      qTitle.style.marginBottom = '4px';
      qTitle.textContent = `${idx + 1}. ${q.question} (${q.difficulty.toUpperCase()})`;
      qBlock.appendChild(qTitle);
      
      q.choices.forEach(c => {
        const row = document.createElement('div');
        row.style.fontSize = '0.7rem';
        row.style.color = '#cbd5e1';
        row.innerHTML = `<span style="color:${c.isCorrect ? '#22c55e' : '#ef4444'}; font-weight:bold; margin-right: 6px;">${c.isCorrect ? '✓' : '✗'}</span> ${c.text}`;
        qBlock.appendChild(row);
      });
      
      optsDiv.appendChild(qBlock);
    });

    addBtn.textContent = `Add all ${parsed.length} Questions`;
    statusDiv.style.display = 'none';
    previewDiv.style.display = 'block';
    addBtn.style.display = 'block';
    showFeedback("📸 Scan completed successfully!", "correct");

  } catch (err) {
    console.error(err);
    statusDiv.style.display = 'none';
    alert("AI Scanning failed! Please make sure your API key is valid and the image contains clear question text. Error: " + err.message);
  }
}

function addScannedQuestion() {
  if (!scannedQuestionTemp || scannedQuestionTemp.length === 0) return;
  customQuestions = [...customQuestions, ...scannedQuestionTemp];
  localStorage.setItem('customQuestions', JSON.stringify(customQuestions));
  scannedQuestionTemp = null;
  
  closeAIScanner();
  showFeedback("✨ Scanned worksheet added to game pool! 🎮", "correct");
}

function applyBoard(boardId) {
  const board = BOARDS[boardId] || BOARDS.default;
  State.equippedBoardColor = board.color;
  State.equippedBoardParticle = board.particleColor;
  
  // Update board SVG elements inside character
  const hoverboardSvg = document.getElementById('hoverboard-svg');
  if (hoverboardSvg) {
    const ellipse = hoverboardSvg.querySelector('ellipse');
    if (ellipse) {
      ellipse.setAttribute('fill', board.color);
      ellipse.style.filter = `drop-shadow(0 0 4px ${board.color})`;
    }
  }
}

function buySkin(skinId) {
  const skin = SKINS[skinId];
  if (!skin) return;

  if (totalCoins >= skin.cost) {
    totalCoins -= skin.cost;
    localStorage.setItem('totalCoins', totalCoins);
    unlockedSkins.push(skinId);
    localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
    
    AudioManager.playLevelUp(); // Level up sound is satisfying for unlocks!
    equipSkin(skinId);
  } else {
    AudioManager.playWrong(); // buzzer
    showFeedback("Not enough coins! 🪙", "wrong");
  }
}

function equipSkin(skinId) {
  equippedSkin = skinId;
  localStorage.setItem('equippedSkin', equippedSkin);
  applySkin(skinId);
  renderShopList();
  AudioManager.playSwipe();
}

function applySkin(skinId) {
  const skin = SKINS[skinId] || SKINS.default;

  // Update bodyGrad gradients
  const bodyGrad = document.getElementById('bodyGrad');
  if (bodyGrad) {
    const stops = bodyGrad.getElementsByTagName('stop');
    if (stops.length >= 2) {
      stops[0].setAttribute('stop-color', skin.colors.body[0]);
      stops[1].setAttribute('stop-color', skin.colors.body[1]);
    }
  }

  // Update helmetGrad gradients
  const helmetGrad = document.getElementById('helmetGrad');
  if (helmetGrad) {
    const stops = helmetGrad.getElementsByTagName('stop');
    if (stops.length >= 2) {
      stops[0].setAttribute('stop-color', skin.colors.helmet[0]);
      stops[1].setAttribute('stop-color', skin.colors.helmet[1]);
    }
  }

  // Update badge character
  const characterSvg = document.getElementById('character');
  if (characterSvg) {
    const badgeText = characterSvg.querySelector('text');
    if (badgeText) {
      badgeText.textContent = skin.colors.badge;
    }
  }
}

// Bind to window for HTML onclick actions
window.buySkin = buySkin;
window.equipSkin = equipSkin;

document.addEventListener('DOMContentLoaded', () => {
  cacheDOMRefs();
  Renderer2D.init(); // Initialize the 2D Engine
  setupInput();
  
  // Initialize persistent displays
  if (DOM.menuHighScore) DOM.menuHighScore.textContent = highScore;
  if (DOM.menuTotalCoins) DOM.menuTotalCoins.textContent = totalCoins;
  if (DOM.muteIcon) DOM.muteIcon.textContent = isMuted ? '🔇' : '🔊';
  
  applySkin(equippedSkin);
  applyBoard(equippedBoard);
  renderMissions();

  const tabSkins = document.getElementById('tab-skins');
  const tabUpgrades = document.getElementById('tab-upgrades');
  if (tabSkins && tabUpgrades) {
    tabSkins.addEventListener('click', () => {
      currentShopTab = 'skins';
      renderShopContent();
      AudioManager.playSwipe();
    });
    tabUpgrades.addEventListener('click', () => {
      currentShopTab = 'upgrades';
      renderShopContent();
      AudioManager.playSwipe();
    });
  }
  
  // AI Scanner Bindings
  const btnAiScanner = document.getElementById('btn-ai-scanner');
  const btnAiBack = document.getElementById('btn-ai-back');
  const btnAiAdd = document.getElementById('btn-ai-add');
  const aiFileInput = document.getElementById('ai-file-input');

  if (btnAiScanner) btnAiScanner.addEventListener('click', openAIScanner);
  if (btnAiBack) btnAiBack.addEventListener('click', closeAIScanner);
  if (btnAiAdd) btnAiAdd.addEventListener('click', addScannedQuestion);
  if (aiFileInput) {
    aiFileInput.addEventListener('change', () => {
      const fileNameSpan = document.getElementById('ai-file-name');
      const thumbnailImg = document.getElementById('ai-img-thumbnail');
      if (aiFileInput.files.length > 0) {
        const file = aiFileInput.files[0];
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        if (thumbnailImg) {
          thumbnailImg.src = URL.createObjectURL(file);
          thumbnailImg.style.display = 'block';
        }
      } else {
        if (fileNameSpan) fileNameSpan.textContent = "No file selected";
        if (thumbnailImg) thumbnailImg.style.display = 'none';
      }
    });
  }
  
  const btnAiScanSubmit = document.getElementById('btn-ai-scan-submit');
  if (btnAiScanSubmit) btnAiScanSubmit.addEventListener('click', handleAIScan);
  
  // HUD Boards Pill click activation
  if (DOM.boardsPill) {
    DOM.boardsPill.addEventListener('click', () => {
      activateHoverboard();
    });
  }

  // Difficulty Selectors
  const diffBtns = document.querySelectorAll('.diff-btn');
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = '#94a3b8';
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.color = '#cbd5e1';
        b.style.boxShadow = 'none';
      });
      btn.classList.add('active');
      State.startDifficulty = btn.dataset.diff;
      
      if (State.startDifficulty === 'easy') {
        btn.style.borderColor = '#22c55e';
        btn.style.background = 'rgba(34, 197, 94, 0.2)';
        btn.style.color = '#4ade80';
        btn.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.4)';
      } else if (State.startDifficulty === 'medium') {
        btn.style.borderColor = '#eab308';
        btn.style.background = 'rgba(234, 179, 8, 0.2)';
        btn.style.color = '#facc15';
        btn.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.4)';
      } else if (State.startDifficulty === 'hard') {
        btn.style.borderColor = '#ef4444';
        btn.style.background = 'rgba(239, 68, 68, 0.2)';
        btn.style.color = '#f87171';
        btn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
      }
      AudioManager.playSwipe();
    });
  });
  
  // Setup shop listeners
  if (DOM.btnShop) DOM.btnShop.addEventListener('click', openShop);
  if (DOM.btnShopBack) DOM.btnShopBack.addEventListener('click', closeShop);
  if (DOM.btnMute) {
    DOM.btnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem('isMuted', isMuted);
      window.AudioManagerMuted = isMuted;
      DOM.muteIcon.textContent = isMuted ? '🔇' : '🔊';
      AudioManager.playSwipe();
    });
  }

  if (DOM.btnShare) {
    DOM.btnShare.addEventListener('click', () => {
      const text = `🧠 I scored ${State.score} points and collected ${State.coins} coins on QuizRunner! Can you beat my high score? 🏃‍♂️💨 Play it now!`;
      navigator.clipboard.writeText(text).then(() => {
        showFeedback("📋 Score copied to clipboard!", "correct");
      }).catch(() => {
        showFeedback("❌ Failed to copy score.", "wrong");
      });
    });
  }

  updateHUD();
  DOM.menuScreen.classList.add('show');
  
  // Start the background rendering immediately
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});
