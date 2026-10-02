/* OPERATION 360°: SAVE MATH CITY - Full Game Script */

// 1. GAME STATE
const gameState = {
  playerName: '360',
  currentMission: 1,
  currentQuestionIndex: 0, // In M3/M4, tracks active sub-step (0: chart assembly, 1..N: interpretations)
  lives: 5,
  score: 0,
  stars: 0,
  hintsUsed: 0,
  incorrectAttempts: 0,
  completedCharts: 0,
  interpretationScore: 0,
  totalCorrect: 0,
  missionProgress: {
    1: false,
    2: false,
    3: false,
    4: false
  },
  attemptedThisQuestion: false,
  soundEnabled: true,
  currentHintTier: 0,
  activeDatasetIndex: 0,
  // Mission 3 & 4 Assembly State
  m3ChartIndex: 0, // 0 to 4 (5 pie chart challenges)
  placedSectors: [] // Stores placed sector items
};

// 2. WEB AUDIO SYNTHESIZER
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (!gameState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    osc.frequency.setValueAtTime(1046.50, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playWrong() {
    if (!gameState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playLifeLost() {
    if (!gameState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(200, now + 0.15);
    osc.frequency.setValueAtTime(100, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playVictory() {
    if (!gameState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 880, 1046.50];
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.3, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.25);
    });
  }
}

const sounds = new SoundEngine();

// 3. MATHEMATICAL DATASETS (Aligned with Year 6 DSKP 8.1.1)
const pieDatasets = [
  {
    id: 'sports',
    title: 'Favourite Sports',
    totalPupils: 8,
    categories: [
      { id: 'c1', name: 'Football', icon: '⚽', pupils: 4, fraction: '1/2', angle: 180, color: '#3b82f6' },
      { id: 'c2', name: 'Badminton', icon: '🏸', pupils: 2, fraction: '1/4', angle: 90, color: '#22c55e' },
      { id: 'c3', name: 'Chess', icon: '♟️', pupils: 1, fraction: '1/8', angle: 45, color: '#fbbf24' },
      { id: 'c4', name: 'Netball', icon: '🏀', pupils: 1, fraction: '1/8', angle: 45, color: '#ec4899' }
    ],
    interpretations: [
      {
        question: 'Which category is the most popular?',
        options: ['Football', 'Badminton', 'Chess', 'Netball'],
        correctIndex: 0,
        explanation: 'Football has 4 pupils (180°), making it the largest sector!'
      },
      {
        question: 'Which category is the least popular?',
        options: ['Football', 'Badminton', 'Chess and Netball (Equal)', 'None'],
        correctIndex: 2,
        explanation: 'Chess and Netball both have 1 pupil (45°), which are the smallest sectors!'
      },
      {
        question: 'Which sector represents 90°?',
        options: ['Football', 'Badminton', 'Chess', 'Netball'],
        correctIndex: 1,
        explanation: 'Badminton has 2 out of 8 pupils, which equals 1/4 of 360° = 90°.'
      }
    ]
  },
  {
    id: 'fruits',
    title: 'Favourite Fruits',
    totalPupils: 8,
    categories: [
      { id: 'c1', name: 'Apple', icon: '🍎', pupils: 4, fraction: '1/2', angle: 180, color: '#ef4444' },
      { id: 'c2', name: 'Banana', icon: '🍌', pupils: 2, fraction: '1/4', angle: 90, color: '#eab308' },
      { id: 'c3', name: 'Watermelon', icon: '🍉', pupils: 1, fraction: '1/8', angle: 45, color: '#10b981' },
      { id: 'c4', name: 'Orange', icon: '🍊', pupils: 1, fraction: '1/8', angle: 45, color: '#f97316' }
    ],
    interpretations: [
      {
        question: 'What fraction chose Apple?',
        options: ['1/8', '1/4', '1/2', '3/4'],
        correctIndex: 2,
        explanation: '4 out of 8 pupils is 4/8 = 1/2 of the total circle!'
      },
      {
        question: 'How many pupils chose Watermelon and Orange altogether?',
        options: ['1 pupil', '2 pupils', '3 pupils', '4 pupils'],
        correctIndex: 1,
        explanation: 'Watermelon (1) + Orange (1) = 2 pupils total.'
      },
      {
        question: 'Which angle represents the Banana sector?',
        options: ['45°', '90°', '180°', '270°'],
        correctIndex: 1,
        explanation: 'Banana has 2 pupils. 2 ÷ 8 × 360° = 90°.'
      }
    ]
  },
  {
    id: 'travel',
    title: 'Ways Pupils Travel to School',
    totalPupils: 8,
    categories: [
      { id: 'c1', name: 'School Bus', icon: '🚌', pupils: 4, fraction: '1/2', angle: 180, color: '#eab308' },
      { id: 'c2', name: 'Car', icon: '🚗', pupils: 2, fraction: '1/4', angle: 90, color: '#3b82f6' },
      { id: 'c3', name: 'Bicycle', icon: '🚲', pupils: 1, fraction: '1/8', angle: 45, color: '#10b981' },
      { id: 'c4', name: 'Walking', icon: '🚶', pupils: 1, fraction: '1/8', angle: 45, color: '#8b5cf6' }
    ],
    interpretations: [
      {
        question: 'How many more pupils travel by School Bus than by Car?',
        options: ['1 pupil', '2 pupils', '3 pupils', '4 pupils'],
        correctIndex: 1,
        explanation: 'School Bus = 4, Car = 2. Difference = 4 - 2 = 2 pupils.'
      },
      {
        question: 'What angle corresponds to 1 pupil walking?',
        options: ['30°', '45°', '90°', '180°'],
        correctIndex: 1,
        explanation: '360° ÷ 8 pupils = 45° per pupil.'
      },
      {
        question: 'Which two travel categories have the same quantity?',
        options: ['Bus & Car', 'Bicycle & Walking', 'Car & Bicycle', 'Bus & Walking'],
        correctIndex: 1,
        explanation: 'Bicycle and Walking both have 1 pupil (45° sectors).'
      }
    ]
  },
  {
    id: 'drinks',
    title: 'Favourite Drinks',
    totalPupils: 8,
    categories: [
      { id: 'c1', name: 'Milo Ice', icon: '🥤', pupils: 4, fraction: '1/2', angle: 180, color: '#78350f' },
      { id: 'c2', name: 'Fresh Milk', icon: '🥛', pupils: 2, fraction: '1/4', angle: 90, color: '#38bdf8' },
      { id: 'c3', name: 'Fruit Juice', icon: '🍹', pupils: 1, fraction: '1/8', angle: 45, color: '#f43f5e' },
      { id: 'c4', name: 'Mineral Water', icon: '💧', pupils: 1, fraction: '1/8', angle: 45, color: '#0ea5e9' }
    ],
    interpretations: [
      {
        question: 'Which drink is chosen by one-quarter (1/4) of the pupils?',
        options: ['Milo Ice', 'Fresh Milk', 'Fruit Juice', 'Mineral Water'],
        correctIndex: 1,
        explanation: 'Fresh Milk has 2 out of 8 pupils, which equals 1/4 (90°).'
      },
      {
        question: 'What is the sum of angles for Fruit Juice and Mineral Water?',
        options: ['45°', '90°', '180°', '360°'],
        correctIndex: 1,
        explanation: 'Fruit Juice (45°) + Mineral Water (45°) = 90°.'
      },
      {
        question: 'What does the 180° sector represent?',
        options: ['Milo Ice', 'Fresh Milk', 'Fruit Juice', 'Mineral Water'],
        correctIndex: 0,
        explanation: 'The 180° sector (half circle) represents Milo Ice (4 pupils).'
      }
    ]
  },
  {
    id: 'subjects',
    title: 'Favourite School Subjects',
    totalPupils: 8,
    categories: [
      { id: 'c1', name: 'Mathematics', icon: '📐', pupils: 4, fraction: '1/2', angle: 180, color: '#2563eb' },
      { id: 'c2', name: 'Science', icon: '🔬', pupils: 2, fraction: '1/4', angle: 90, color: '#059669' },
      { id: 'c3', name: 'English', icon: '📚', pupils: 1, fraction: '1/8', angle: 45, color: '#d97706' },
      { id: 'c4', name: 'Art', icon: '🎨', pupils: 1, fraction: '1/8', angle: 45, color: '#9333ea' }
    ],
    interpretations: [
      {
        question: 'Which subject is the most popular?',
        options: ['Mathematics', 'Science', 'English', 'Art'],
        correctIndex: 0,
        explanation: 'Mathematics was chosen by 4 pupils (180°), making it the most popular!'
      },
      {
        question: 'What angle represents Science?',
        options: ['45°', '90°', '180°', '360°'],
        correctIndex: 1,
        explanation: 'Science has 2 out of 8 pupils = 1/4 of 360° = 90°.'
      },
      {
        question: 'How many pupils chose English and Art altogether?',
        options: ['1', '2', '3', '4'],
        correctIndex: 1,
        explanation: 'English (1 pupil) + Art (1 pupil) = 2 pupils.'
      },
      {
        question: 'What fraction chose Mathematics?',
        options: ['1/8', '1/4', '1/2', '3/4'],
        correctIndex: 2,
        explanation: '4 out of 8 pupils equals 1/2 of the total circle!'
      }
    ]
  }
];

// SVG Helper
function getPieSlicePath(cx, cy, radius, startAngleDegree, endAngleDegree) {
  const startRad = (startAngleDegree - 90) * (Math.PI / 180);
  const endRad = (endAngleDegree - 90) * (Math.PI / 180);

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = (endAngleDegree - startAngleDegree) > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

// DOM Init
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
}

function initApp() {
  setupEventListeners();
  updateUI();
  renderPIBotAvatar('pibot-avatar-container', 'happy');
}

function setupEventListeners() {
  // Start Mission button
  const startBtn = document.getElementById('btn-start-mission');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      showScreen('screen-name');
    });
  }

  // Name form submit
  const nameForm = document.getElementById('name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('agent-name-input');
      if (input && input.value.trim() !== '') {
        gameState.playerName = input.value.trim();
        updateUI();
        showScreen('screen-map');
      }
    });
  }

  // Sound toggle
  const soundBtn = document.getElementById('sound-toggle-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      gameState.soundEnabled = !gameState.soundEnabled;
      const soundIcon = document.getElementById('sound-icon');
      const soundText = document.getElementById('sound-text');
      if (soundIcon) soundIcon.textContent = gameState.soundEnabled ? '🔊' : '🔇';
      if (soundText) soundText.textContent = gameState.soundEnabled ? 'SOUND ON' : 'SOUND OFF';
    });
  }

  // Map mission clicks
  const mapCards = document.querySelectorAll('.map-card');
  mapCards.forEach(card => {
    card.addEventListener('click', () => {
      const missionNum = parseInt(card.getAttribute('data-mission'));
      if (card.classList.contains('unlocked')) {
        startMission(missionNum);
      }
    });
  });

  // Back to Map button
  const backMapBtn = document.getElementById('btn-back-to-map');
  if (backMapBtn) {
    backMapBtn.addEventListener('click', () => {
      showScreen('screen-map');
    });
  }

  // Restart Mission button
  const restartBtn = document.getElementById('btn-restart-mission');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      hideModal('modal-paused');
      restartCurrentMission();
    });
  }

  // Feedback Next button
  const feedbackNextBtn = document.getElementById('btn-feedback-next');
  if (feedbackNextBtn) {
    feedbackNextBtn.addEventListener('click', () => {
      hideModal('modal-feedback');
      advanceQuestion();
    });
  }

  // Mission Complete Continue button
  const continueMapBtn = document.getElementById('btn-continue-map');
  if (continueMapBtn) {
    continueMapBtn.addEventListener('click', () => {
      hideModal('modal-mission-complete');
      showScreen('screen-map');
    });
  }

  // View Report button from final victory
  const viewReportBtn = document.getElementById('btn-view-report');
  if (viewReportBtn) {
    viewReportBtn.addEventListener('click', () => {
      hideModal('modal-final-victory');
      renderTeacherReport();
      showModal('modal-report');
    });
  }

  // Report Shortcut button
  const reportShortcutBtn = document.getElementById('report-shortcut-btn');
  if (reportShortcutBtn) {
    reportShortcutBtn.addEventListener('click', () => {
      renderTeacherReport();
      showModal('modal-report');
    });
  }

  // Report Modal close / play again / return home / print
  const closeReportBtn = document.getElementById('btn-close-report');
  if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => {
      hideModal('modal-report');
    });
  }

  const printReportBtn = document.getElementById('btn-print-report');
  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const playAgainBtn = document.getElementById('btn-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      hideModal('modal-report');
      startMission(1);
    });
  }

  const returnHomeBtn = document.getElementById('btn-return-home');
  if (returnHomeBtn) {
    returnHomeBtn.addEventListener('click', () => {
      hideModal('modal-report');
      showScreen('screen-map');
    });
  }

  // Hint button
  const hintBtn = document.getElementById('btn-hint');
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      showHint();
    });
  }
}

function showScreen(screenId) {
  if (typeof document === 'undefined') return;
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => {
    if (s.id === screenId) {
      s.classList.remove('hidden');
      s.classList.add('active');
    } else {
      s.classList.add('hidden');
      s.classList.remove('active');
    }
  });

  // Enable report shortcut button if at least 1 mission is complete
  const reportBtn = document.getElementById('report-shortcut-btn');
  if (reportBtn) {
    if (gameState.stars > 0) reportBtn.classList.remove('hidden');
  }
}

function showModal(modalId) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function hideModal(modalId) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function updateUI() {
  if (typeof document === 'undefined') return;
  const nameDisplays = [
    document.getElementById('map-agent-name'),
    document.getElementById('dash-agent-name')
  ];
  nameDisplays.forEach(el => {
    if (el) el.textContent = gameState.playerName;
  });

  const scoreDisplay = document.getElementById('dash-score');
  if (scoreDisplay) scoreDisplay.textContent = gameState.score;

  const starsDisplay = document.getElementById('dash-stars');
  if (starsDisplay) starsDisplay.textContent = `${gameState.stars} / 4 ⭐`;

  renderLives('dash-lives');
  renderLives('mission-lives-hearts');
  updateMapStatus();
}

function updateMapStatus() {
  if (typeof document === 'undefined') return;
  for (let m = 1; m <= 4; m++) {
    const card = document.getElementById(`map-m${m}`);
    if (!card) continue;

    const btn = card.querySelector('.card-btn');
    const badge = card.querySelector('.card-status-badge');

    if (gameState.missionProgress[m]) {
      card.className = 'map-card completed unlocked';
      if (badge) {
        badge.className = 'card-status-badge badge-completed';
        badge.textContent = '✅ COMPLETED';
      }
      if (btn) {
        btn.disabled = false;
        btn.className = 'btn btn-success card-btn';
        btn.textContent = 'REPLAY MISSION';
      }
    } else if (m === 1 || gameState.missionProgress[m - 1]) {
      card.className = 'map-card unlocked';
      if (badge) {
        badge.className = 'card-status-badge badge-unlocked';
        badge.textContent = 'AVAILABLE';
      }
      if (btn) {
        btn.disabled = false;
        btn.className = 'btn btn-primary card-btn';
        btn.textContent = 'ENTER STATION';
      }
    } else {
      card.className = 'map-card locked';
      if (badge) {
        badge.className = 'card-status-badge badge-locked';
        badge.textContent = '🔒 LOCKED';
      }
      if (btn) {
        btn.disabled = true;
        btn.className = 'btn btn-secondary card-btn';
        btn.textContent = 'LOCKED';
      }
    }
  }
}

function renderLives(containerId) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('span');
    heart.className = i < gameState.lives ? 'heart-icon active' : 'heart-icon lost';
    heart.textContent = i < gameState.lives ? '❤️' : '🖤';
    container.appendChild(heart);
  }
}

function renderPIBotAvatar(containerId, mood = 'happy') {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(containerId);
  if (!container) return;

  let eyeColor = '#38bdf8';
  let mouthPath = 'M 42 52 Q 50 56 58 52';

  if (mood === 'thinking') {
    mouthPath = 'M 42 52 L 58 52';
  } else if (mood === 'concerned') {
    eyeColor = '#f87171';
    mouthPath = 'M 42 54 Q 50 48 58 54';
  } else if (mood === 'celebrating') {
    eyeColor = '#fbbf24';
    mouthPath = 'M 40 50 Q 50 60 60 50';
  }

  container.innerHTML = `
    <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
      <rect x="25" y="25" width="50" height="40" rx="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
      <rect x="32" y="32" width="36" height="22" rx="5" fill="#0f172a"/>
      <circle cx="42" cy="42" r="4" fill="${eyeColor}"/>
      <circle cx="58" cy="42" r="4" fill="${eyeColor}"/>
      <path d="${mouthPath}" fill="none" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="47" y="12" width="6" height="13" fill="#64748b"/>
      <circle cx="50" cy="10" r="5" fill="#ef4444"/>
      <path d="M 30 65 L 70 65 L 65 85 L 35 85 Z" fill="#2563eb"/>
      <circle cx="50" cy="75" r="5" fill="#fbbf24"/>
    </svg>
  `;
}

function updatePIBotSpeech(text, mood = 'happy') {
  if (typeof document === 'undefined') return;
  const speechText = document.getElementById('pibot-speech-text');
  if (speechText) speechText.textContent = text;
  renderPIBotAvatar('pibot-avatar-container', mood);
}

// START & RESTART MISSIONS
function startMission(missionNum) {
  gameState.currentMission = missionNum;
  gameState.currentQuestionIndex = 0;
  gameState.lives = 5;
  gameState.attemptedThisQuestion = false;
  gameState.currentHintTier = 0;
  gameState.placedSectors = [];
  if (missionNum === 3) gameState.m3ChartIndex = 0;

  updateUI();

  const titleEl = document.getElementById('active-mission-title');
  const envBadge = document.getElementById('mission-env-badge');
  const workspace = document.getElementById('mission-workspace');

  if (missionNum === 1) {
    if (titleEl) titleEl.textContent = 'Mission 1: Angle Training Lab';
    if (envBadge) envBadge.textContent = 'LAB';
    if (workspace) workspace.className = 'mission-workspace env-m1';
    loadMission1();
  } else if (missionNum === 2) {
    if (titleEl) titleEl.textContent = 'Mission 2: Data Decoder Centre';
    if (envBadge) envBadge.textContent = 'DECODER';
    if (workspace) workspace.className = 'mission-workspace env-m2';
    loadMission2();
  } else if (missionNum === 3) {
    if (titleEl) titleEl.textContent = 'Mission 3: Pie Chart Repair Station';
    if (envBadge) envBadge.textContent = 'REPAIR';
    if (workspace) workspace.className = 'mission-workspace env-m3';
    loadMission3();
  } else if (missionNum === 4) {
    if (titleEl) titleEl.textContent = 'Mission 4: 360° Core Chamber';
    if (envBadge) envBadge.textContent = 'CORE';
    if (workspace) workspace.className = 'mission-workspace env-m4';
    loadMission4();
  }

  showScreen('screen-mission');
}

function restartCurrentMission() {
  startMission(gameState.currentMission);
}

function deductLife() {
  gameState.lives -= 1;
  gameState.incorrectAttempts += 1;
  sounds.playLifeLost();
  updateUI();

  if (typeof document !== 'undefined') {
    const hearts = document.querySelectorAll('#mission-lives-hearts .heart-icon');
    if (hearts && hearts[gameState.lives]) {
      hearts[gameState.lives].classList.add('heart-lost-anim');
    }

    if (gameState.lives <= 0) {
      setTimeout(() => {
        showModal('modal-paused');
      }, 600);
    }
  }
}

// MISSION 1: ANGLE TRAINING LAB
const mission1Challenges = [
  { fraction: '1/2', angle: 180, label: '180° (Half Circle)', desc: 'Half of a complete circle.' },
  { fraction: '1/4', angle: 90, label: '90° (Quarter Circle)', desc: 'One quarter of a complete circle.' },
  { fraction: '1/8', angle: 45, label: '45° (Eighth Circle)', desc: 'One eighth of a complete circle.' },
  { fraction: '1/2', angle: 180, label: '180° Sector', desc: 'Equal to two 90° quarters.' },
  { fraction: '1/8', angle: 45, label: '45° Sector', desc: 'Half of a 90° quarter sector.' }
];

function loadMission1() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  if (gameState.currentQuestionIndex === 0) {
    workspace.innerHTML = `
      <div class="tutorial-box">
        <h3 class="tutorial-title">📐 ANGLE TRAINING TUTORIAL</h3>
        <p class="tutorial-sub">A full circle equals <strong>360°</strong>. Let's look at key sectors:</p>

        <div class="tutorial-grid">
          <div class="tutorial-item">
            <svg viewBox="0 0 100 100" class="tut-svg">
              <circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
            </svg>
            <span class="tut-label">360° = Full Circle</span>
          </div>
          <div class="tutorial-item">
            <svg viewBox="0 0 100 100" class="tut-svg">
              <path d="${getPieSlicePath(50, 50, 40, 0, 180)}" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#475569" stroke-dasharray="3,3"/>
            </svg>
            <span class="tut-label">360° ÷ 2 = 180° (1/2)</span>
          </div>
          <div class="tutorial-item">
            <svg viewBox="0 0 100 100" class="tut-svg">
              <path d="${getPieSlicePath(50, 50, 40, 0, 90)}" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#475569" stroke-dasharray="3,3"/>
            </svg>
            <span class="tut-label">360° ÷ 4 = 90° (1/4)</span>
          </div>
          <div class="tutorial-item">
            <svg viewBox="0 0 100 100" class="tut-svg">
              <path d="${getPieSlicePath(50, 50, 40, 0, 45)}" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#475569" stroke-dasharray="3,3"/>
            </svg>
            <span class="tut-label">360° ÷ 8 = 45° (1/8)</span>
          </div>
        </div>

        <button id="btn-start-m1-practice" class="btn btn-primary btn-large" style="margin-top:20px;">
          START PRACTICE CHALLENGES 🚀
        </button>
      </div>
    `;

    updatePIBotSpeech("Welcome to the Angle Training Lab! Review the circle angles above, then click start!", "happy");

    const btn = document.getElementById('btn-start-m1-practice');
    if (btn) {
      btn.addEventListener('click', () => {
        gameState.currentQuestionIndex = 1;
        renderMission1Question();
      });
    }
  } else {
    renderMission1Question();
  }
}

function renderMission1Question() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  const challengeIndex = gameState.currentQuestionIndex - 1;
  const challenge = mission1Challenges[challengeIndex];

  if (!challenge) {
    completeMission(1);
    return;
  }

  updatePIBotSpeech(`Challenge ${gameState.currentQuestionIndex} of 5: What angle matches this ${challenge.fraction} circle sector?`, "thinking");

  workspace.innerHTML = `
    <div class="challenge-container">
      <div class="challenge-header">
        <span class="q-progress">Challenge ${gameState.currentQuestionIndex} / 5</span>
        <h3>Identify the Angle</h3>
      </div>

      <div class="sector-display-area">
        <div class="sector-svg-container">
          <svg viewBox="0 0 120 120" style="width:160px; height:160px;">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="4,4"/>
            <path d="${getPieSlicePath(60, 60, 50, 0, challenge.angle)}" fill="#3b82f6" stroke="#60a5fa" stroke-width="3"/>
          </svg>
        </div>
        <div class="sector-info-badge">
          <span>Fraction Sector: <strong>${challenge.fraction}</strong> circle</span>
        </div>
      </div>

      <div class="options-group">
        <p class="instruction-text">Select the correct angle label:</p>
        <div class="btn-options-grid">
          <button class="btn btn-secondary option-btn" data-angle="45">45°</button>
          <button class="btn btn-secondary option-btn" data-angle="90">90°</button>
          <button class="btn btn-secondary option-btn" data-angle="180">180°</button>
        </div>
      </div>
    </div>
  `;

  const optionBtns = workspace.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenAngle = parseInt(btn.getAttribute('data-angle'));
      handleMission1Answer(chosenAngle, challenge.angle);
    });
  });
}

function handleMission1Answer(chosenAngle, correctAngle) {
  if (chosenAngle === correctAngle) {
    sounds.playCorrect();
    const points = gameState.attemptedThisQuestion ? 5 : 10;
    gameState.score += points;
    gameState.totalCorrect += 1;
    updateUI();

    showFeedback(true, "✓ Correct!", `Great job! A ${getFractionText(correctAngle)} circle sector represents ${correctAngle}°.`);
  } else {
    deductLife();
    gameState.attemptedThisQuestion = true;
    updatePIBotSpeech(`That sector is not ${chosenAngle}°. Think carefully about the fraction of 360°!`, "concerned");
    showFeedback(false, "✕ Try Again!", `${chosenAngle}° is not correct. A full circle is 360°. Divide 360° by the number of parts!`);
  }
}

function getFractionText(angle) {
  if (angle === 180) return '1/2';
  if (angle === 90) return '1/4';
  if (angle === 45) return '1/8';
  return '';
}

// MISSION 2: DATA DECODER CENTRE
function loadMission2() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  if (gameState.currentQuestionIndex === 0) {
    workspace.innerHTML = `
      <div class="tutorial-box">
        <h3 class="tutorial-title">📊 DATA DECODER TUTORIAL</h3>
        <p class="tutorial-sub">Let's connect quantities of pupils to circle angles!</p>

        <div class="tutorial-data-card">
          <p class="total-badge">Total Pupils = 8 (Representing full 360° circle)</p>
          <div class="formula-banner">
            <span>1 Pupil = 360° ÷ 8 = <strong>45°</strong></span>
          </div>

          <div class="pupil-calc-rows">
            <div class="pupil-row">
              <span class="pupil-icons">👤</span>
              <span class="pupil-text">1 pupil = 1/8 = <strong>45°</strong></span>
            </div>
            <div class="pupil-row">
              <span class="pupil-icons">👤 👤</span>
              <span class="pupil-text">2 pupils = 2/8 = 1/4 = <strong>90°</strong></span>
            </div>
            <div class="pupil-row">
              <span class="pupil-icons">👤 👤 👤 👤</span>
              <span class="pupil-text">4 pupils = 4/8 = 1/2 = <strong>180°</strong></span>
            </div>
          </div>
        </div>

        <button id="btn-start-m2-practice" class="btn btn-primary btn-large" style="margin-top:20px;">
          DECODE DATASETS 🚀
        </button>
      </div>
    `;

    updatePIBotSpeech("Welcome to the Data Decoder Centre! Let's translate pupil quantities into degrees!", "happy");

    const btn = document.getElementById('btn-start-m2-practice');
    if (btn) {
      btn.addEventListener('click', () => {
        gameState.currentQuestionIndex = 1;
        renderMission2Question();
      });
    }
  } else {
    renderMission2Question();
  }
}

function renderMission2Question() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  const datasetIndex = (gameState.currentQuestionIndex - 1) % pieDatasets.length;
  const dataset = pieDatasets[datasetIndex];

  if (gameState.currentQuestionIndex > 5) {
    completeMission(2);
    return;
  }

  const catIndex = (gameState.currentQuestionIndex - 1) % dataset.categories.length;
  const category = dataset.categories[catIndex];

  updatePIBotSpeech(`Decoder Challenge ${gameState.currentQuestionIndex} of 5: Calculate the angle for ${category.name}!`, "thinking");

  let iconsHtml = '';
  for (let i = 0; i < category.pupils; i++) {
    iconsHtml += `<span class="cartoon-pupil-icon">${category.icon}</span>`;
  }

  workspace.innerHTML = `
    <div class="challenge-container">
      <div class="challenge-header">
        <span class="q-progress">Dataset: ${dataset.title}</span>
        <h3>${category.icon} ${category.name} Sector</h3>
      </div>

      <div class="decoder-card">
        <div class="data-summary">
          <span>Total Pupils in Survey = <strong>8</strong> (360° total)</span>
        </div>

        <div class="pupil-visual-box">
          <div class="icons-holder">${iconsHtml}</div>
          <span class="pupil-count-text">Quantity = <strong>${category.pupils} pupil(s)</strong></span>
        </div>

        <div class="question-prompt">
          <p>What angle represents <strong>${category.pupils} out of 8 pupils</strong> for ${category.name}?</p>
        </div>

        <div class="btn-options-grid">
          <button class="btn btn-secondary option-btn" data-angle="45">45°</button>
          <button class="btn btn-secondary option-btn" data-angle="90">90°</button>
          <button class="btn btn-secondary option-btn" data-angle="180">180°</button>
        </div>
      </div>
    </div>
  `;

  const optionBtns = workspace.querySelectorAll('.option-btn');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenAngle = parseInt(btn.getAttribute('data-angle'));
      handleMission2Answer(chosenAngle, category.angle, category.pupils, category.name);
    });
  });
}

function handleMission2Answer(chosenAngle, correctAngle, pupils, catName) {
  if (chosenAngle === correctAngle) {
    sounds.playCorrect();
    const points = gameState.attemptedThisQuestion ? 5 : 10;
    gameState.score += points;
    gameState.totalCorrect += 1;
    updateUI();

    showFeedback(true, "✓ Correct!", `Excellent! ${pupils} out of 8 pupils represent ${correctAngle}° because ${pupils} × 45° = ${correctAngle}°.`);
  } else {
    deductLife();
    gameState.attemptedThisQuestion = true;
    updatePIBotSpeech(`That sector is not correct. Think: 1 pupil = 45°. So ${pupils} pupils = ?`, "concerned");
    showFeedback(false, "✕ Try Again!", `${pupils} out of 8 pupils represents ${pupils}/8 of the total. Multiply ${pupils} by 45° to find the angle.`);
  }
}

// MISSION 3: PIE CHART REPAIR STATION
function loadMission3() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  const dataset = pieDatasets[gameState.m3ChartIndex];

  if (!dataset || gameState.m3ChartIndex >= 5) {
    completeMission(3);
    return;
  }

  if (gameState.currentQuestionIndex === 0) {
    // Stage A: Construct Pie Chart
    renderPieChartBuilder(dataset);
  } else {
    // Stage B: Interpretation Questions
    renderInterpretationQuestion(dataset);
  }
}

function renderPieChartBuilder(dataset) {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  updatePIBotSpeech(`Chart ${gameState.m3ChartIndex + 1} of 5: Drag or click category sectors into the pie chart grid!`, "thinking");

  // Compute total current angle
  let currentTotalAngle = 0;
  gameState.placedSectors.forEach(s => currentTotalAngle += s.angle);

  let installedSvgPaths = '';
  let startA = 0;
  gameState.placedSectors.forEach((sec, idx) => {
    const endA = startA + sec.angle;
    installedSvgPaths += `
      <path d="${getPieSlicePath(100, 100, 80, startA, endA)}" fill="${sec.color}" stroke="#ffffff" stroke-width="2"/>
    `;
    startA = endA;
  });

  // Category palette
  let paletteCardsHtml = '';
  dataset.categories.forEach(cat => {
    const isPlaced = gameState.placedSectors.some(s => s.id === cat.id);
    paletteCardsHtml += `
      <div class="draggable-sector-card ${isPlaced ? 'placed' : ''}" data-cat-id="${cat.id}">
        <span class="sector-icon">${cat.icon}</span>
        <div class="sector-text-group">
          <strong>${cat.name}</strong>
          <span>${cat.pupils} pupil(s) • ${cat.angle}°</span>
        </div>
        <button class="btn btn-sm btn-primary add-sector-btn" ${isPlaced ? 'disabled' : ''}>
          ${isPlaced ? '✓ PLACED' : '+ ADD SECTOR'}
        </button>
      </div>
    `;
  });

  workspace.innerHTML = `
    <div class="builder-container">
      <div class="builder-header">
        <span class="q-progress">Chart ${gameState.m3ChartIndex + 1} / 5</span>
        <h3>Repair Pie Chart: ${dataset.title}</h3>
      </div>

      <div class="builder-grid">
        <!-- SVG Canvas -->
        <div class="pie-canvas-area">
          <div class="pie-angle-tracker">
            PROGRESS: <strong>${currentTotalAngle}° / 360°</strong>
          </div>
          <svg viewBox="0 0 200 200" class="main-pie-svg">
            <circle cx="100" cy="100" r="80" fill="#1e293b" stroke="#475569" stroke-width="3"/>
            <!-- Concentric Grid lines -->
            <circle cx="100" cy="100" r="80" fill="none" stroke="#334155" stroke-dasharray="4,4"/>
            <line x1="100" y1="20" x2="100" y2="180" stroke="#334155" stroke-dasharray="2,2"/>
            <line x1="20" y1="100" x2="180" y2="100" stroke="#334155" stroke-dasharray="2,2"/>
            ${installedSvgPaths}
            <circle cx="100" cy="100" r="4" fill="#ffffff"/>
          </svg>
        </div>

        <!-- Palette Side Panel -->
        <div class="palette-area">
          <h4>Missing Sectors Palette</h4>
          <p class="sub-text">Total Pupils = ${dataset.totalPupils} (1 pupil = 45°)</p>
          <div class="palette-list">
            ${paletteCardsHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  // Sector addition buttons
  const addBtns = workspace.querySelectorAll('.add-sector-btn');
  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.draggable-sector-card');
      const catId = card.getAttribute('data-cat-id');
      const category = dataset.categories.find(c => c.id === catId);
      if (category) handleSectorAdd(category, dataset);
    });
  });
}

function handleSectorAdd(category, dataset) {
  sounds.playCorrect();
  gameState.placedSectors.push(category);

  let currentTotalAngle = 0;
  gameState.placedSectors.forEach(s => currentTotalAngle += s.angle);

  if (currentTotalAngle === 360) {
    gameState.completedCharts += 1;
    gameState.score += 20;
    updateUI();

    showFeedback(true, "# PIE CHART RESTORED!", `360° / 360° Complete! You successfully restored the pie chart for ${dataset.title}! Now answer data interpretation questions.`);
  } else {
    renderPieChartBuilder(dataset);
  }
}

function renderInterpretationQuestion(dataset) {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  const interpIndex = gameState.currentQuestionIndex - 1;
  const interp = dataset.interpretations[interpIndex];

  if (!interp) {
    // All interpretation questions done for this dataset!
    gameState.m3ChartIndex += 1;
    gameState.currentQuestionIndex = 0;
    gameState.placedSectors = [];

    if (gameState.currentMission === 3 && gameState.m3ChartIndex < 5) {
      loadMission3();
    } else if (gameState.currentMission === 3 && gameState.m3ChartIndex >= 5) {
      completeMission(3);
    } else if (gameState.currentMission === 4) {
      completeMission(4);
    }
    return;
  }

  updatePIBotSpeech(`Interpretation Question ${interpIndex + 1} of ${dataset.interpretations.length}: Look closely at the restored pie chart!`, "thinking");

  // Build installed SVG paths
  let installedSvgPaths = '';
  let startA = 0;
  dataset.categories.forEach((sec) => {
    const endA = startA + sec.angle;
    installedSvgPaths += `
      <path d="${getPieSlicePath(100, 100, 80, startA, endA)}" fill="${sec.color}" stroke="#ffffff" stroke-width="2"/>
    `;
    startA = endA;
  });

  // Legend list
  let legendHtml = '';
  dataset.categories.forEach(c => {
    legendHtml += `
      <div class="legend-item">
        <span class="legend-color" style="background:${c.color};"></span>
        <span>${c.icon} ${c.name}: <strong>${c.pupils} pupil(s) (${c.angle}°)</strong></span>
      </div>
    `;
  });

  let optionsHtml = '';
  interp.options.forEach((opt, idx) => {
    optionsHtml += `
      <button class="btn btn-secondary interp-opt-btn" data-opt-idx="${idx}">${opt}</button>
    `;
  });

  workspace.innerHTML = `
    <div class="interp-container">
      <div class="interp-header">
        <span class="q-progress">Interpretation Q${interpIndex + 1} / ${dataset.interpretations.length}</span>
        <h3>Interpret Data: ${dataset.title}</h3>
      </div>

      <div class="interp-grid">
        <!-- Restored Chart Side Display -->
        <div class="chart-display-side">
          <svg viewBox="0 0 200 200" style="width:180px; height:180px;">
            <circle cx="100" cy="100" r="80" fill="#1e293b"/>
            ${installedSvgPaths}
            <circle cx="100" cy="100" r="4" fill="#ffffff"/>
          </svg>
          <div class="chart-legend-box">
            ${legendHtml}
          </div>
        </div>

        <!-- Question Panel -->
        <div class="question-side">
          <p class="interp-q-text">${interp.question}</p>
          <div class="btn-options-grid vertical">
            ${optionsHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  const optBtns = workspace.querySelectorAll('.interp-opt-btn');
  optBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-opt-idx'));
      handleInterpretationAnswer(idx, interp.correctIndex, interp.explanation);
    });
  });
}

function handleInterpretationAnswer(chosenIndex, correctIndex, explanation) {
  if (chosenIndex === correctIndex) {
    sounds.playCorrect();
    const points = gameState.attemptedThisQuestion ? 5 : 10;
    gameState.score += points;
    gameState.interpretationScore += 1;
    gameState.totalCorrect += 1;
    updateUI();

    showFeedback(true, "✓ Correct!", `Spot on! ${explanation}`);
  } else {
    deductLife();
    gameState.attemptedThisQuestion = true;
    updatePIBotSpeech("Look carefully at the pie chart sectors and quantities!", "concerned");
    showFeedback(false, "✕ Try Again!", `That is not correct. Look at the chart sectors carefully and try again.`);
  }
}

// MISSION 4: FINAL MISSION - 360° CORE CHAMBER
function loadMission4() {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  const dataset = pieDatasets[4]; // Favourite School Subjects

  if (gameState.currentQuestionIndex === 0) {
    // Stage 1: Build Final Core Pie Chart
    renderCoreChamberBuilder(dataset);
  } else {
    // Stage 2: Final Interpretation Questions
    renderInterpretationQuestion(dataset);
  }
}

function renderCoreChamberBuilder(dataset) {
  if (typeof document === 'undefined') return;
  const workspace = document.getElementById('mission-workspace');
  if (!workspace) return;

  updatePIBotSpeech("⚡ FINAL MISSION! Drag missing sectors to restore the 360° Core!", "thinking");

  let currentTotalAngle = 0;
  gameState.placedSectors.forEach(s => currentTotalAngle += s.angle);

  let installedSvgPaths = '';
  let startA = 0;
  gameState.placedSectors.forEach((sec) => {
    const endA = startA + sec.angle;
    installedSvgPaths += `
      <path d="${getPieSlicePath(100, 100, 80, startA, endA)}" fill="${sec.color}" stroke="#ffffff" stroke-width="2"/>
    `;
    startA = endA;
  });

  let paletteCardsHtml = '';
  dataset.categories.forEach(cat => {
    const isPlaced = gameState.placedSectors.some(s => s.id === cat.id);
    paletteCardsHtml += `
      <div class="draggable-sector-card ${isPlaced ? 'placed' : ''}" data-cat-id="${cat.id}">
        <span class="sector-icon">${cat.icon}</span>
        <div class="sector-text-group">
          <strong>${cat.name}</strong>
          <span>${cat.pupils} pupil(s) • ${cat.angle}°</span>
        </div>
        <button class="btn btn-sm btn-primary add-sector-btn" ${isPlaced ? 'disabled' : ''}>
          ${isPlaced ? '✓ PLACED' : '+ RESTORE SECTOR'}
        </button>
      </div>
    `;
  });

  workspace.innerHTML = `
    <div class="builder-container core-container">
      <div class="builder-header">
        <span class="q-progress">CORE CHAMBER</span>
        <h3 style="color:#f59e0b;">⚡ RESTORE THE 360° CORE ⚡</h3>
      </div>

      <div class="builder-grid">
        <!-- SVG Core Canvas -->
        <div class="pie-canvas-area">
          <div class="core-energy-meter">
            ENERGY CORE: <strong>${currentTotalAngle}° / 360°</strong>
          </div>
          <div class="core-canvas-wrapper ${currentTotalAngle === 360 ? 'core-fully-restored' : ''}">
            <svg viewBox="0 0 200 200" class="main-pie-svg">
              <circle cx="100" cy="100" r="80" fill="#0f172a" stroke="#ef4444" stroke-width="4"/>
              ${installedSvgPaths}
              <circle cx="100" cy="100" r="8" fill="#fbbf24"/>
            </svg>
          </div>
        </div>

        <!-- Core Sectors Palette -->
        <div class="palette-area">
          <h4>Core Energy Sectors</h4>
          <p class="sub-text">Dataset: ${dataset.title} (Total = ${dataset.totalPupils} pupils)</p>
          <div class="palette-list">
            ${paletteCardsHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  const addBtns = workspace.querySelectorAll('.add-sector-btn');
  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.draggable-sector-card');
      const catId = card.getAttribute('data-cat-id');
      const category = dataset.categories.find(c => c.id === catId);
      if (category) handleCoreSectorAdd(category, dataset);
    });
  });
}

function handleCoreSectorAdd(category, dataset) {
  sounds.playCorrect();
  gameState.placedSectors.push(category);

  let currentTotalAngle = 0;
  gameState.placedSectors.forEach(s => currentTotalAngle += s.angle);

  if (currentTotalAngle === 360) {
    gameState.completedCharts += 1;
    gameState.score += 50;
    updateUI();

    showFeedback(true, "⚡ 360° CORE RESTORED!", "The 360° Core is fully energized! Now complete the final interpretation assessment to save Math City!");
  } else {
    renderCoreChamberBuilder(dataset);
  }
}

// TEACHER PERFORMANCE REPORT GENERATOR
function renderTeacherReport() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('report-content');
  if (!container) return;

  const totalMissions = Object.values(gameState.missionProgress).filter(v => v).length;
  const achievementTitle = gameState.missionProgress[4] ? "PIE CHART MASTER ⭐⭐⭐⭐" : (totalMissions > 2 ? "SENIOR AGENT ⭐⭐⭐" : "JUNIOR AGENT ⭐⭐");

  container.innerHTML = `
    <div class="report-summary-box">
      <div class="report-grid">
        <div class="report-item">
          <span class="report-item-label">Agent Name:</span>
          <span class="report-item-val" style="color:#fbbf24;">${gameState.playerName}</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Total Score:</span>
          <span class="report-item-val" style="color:#4ade80;">${gameState.score} Points</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Missions Completed:</span>
          <span class="report-item-val">${totalMissions} / 4</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Pie Charts Restored:</span>
          <span class="report-item-val">${gameState.completedCharts}</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Total Correct Answers:</span>
          <span class="report-item-val">${gameState.totalCorrect}</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Incorrect Attempts:</span>
          <span class="report-item-val">${gameState.incorrectAttempts}</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Hints Used:</span>
          <span class="report-item-val">${gameState.hintsUsed}</span>
        </div>
        <div class="report-item">
          <span class="report-item-label">Final Achievement:</span>
          <span class="report-item-val" style="color:#38bdf8;">${achievementTitle}</span>
        </div>
      </div>

      <div class="learning-outcomes-assessment">
        <h4 style="color:white; margin-bottom:8px;">Formative Learning Outcomes (DSKP 8.1.1):</h4>
        <ul style="list-style:none; padding-left:0; color:#cbd5e1; font-size:0.9rem; display:flex; flex-direction:column; gap:6px;">
          <li>${gameState.missionProgress[1] ? '✅' : '⏳'} Recognise 45°, 90°, and 180° pie chart sectors.</li>
          <li>${gameState.missionProgress[2] ? '✅' : '⏳'} Connect quantities to correct sector angles.</li>
          <li>${gameState.missionProgress[3] ? '✅' : '⏳'} Complete pie charts using given quantities.</li>
          <li>${gameState.missionProgress[4] ? '✅' : '⏳'} Interpret data accurately from completed pie charts.</li>
        </ul>
      </div>
    </div>
  `;
}

// FEEDBACK & ADVANCE QUESTION
function showFeedback(isCorrect, title, message) {
  if (typeof document === 'undefined') return;
  const card = document.getElementById('feedback-card-element');
  const icon = document.getElementById('feedback-icon');
  const titleEl = document.getElementById('feedback-title');
  const msgEl = document.getElementById('feedback-message');
  const nextBtn = document.getElementById('btn-feedback-next');

  if (card) {
    card.className = isCorrect ? 'modal-card feedback-card correct-style' : 'modal-card feedback-card incorrect-style';
  }
  if (icon) icon.textContent = isCorrect ? '✓' : '✕';
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.textContent = isCorrect ? 'NEXT QUESTION ➡️' : 'RETRY QUESTION 🔄';
  }

  showModal('modal-feedback');
}

function advanceQuestion() {
  if (gameState.lives <= 0) return;

  const lastFeedbackTitle = document.getElementById('feedback-title')?.textContent || '';
  const lastFeedbackIsCorrect = lastFeedbackTitle.includes('Correct') || lastFeedbackTitle.includes('RESTORED') || lastFeedbackTitle.includes('CORE');

  if (lastFeedbackIsCorrect) {
    gameState.currentQuestionIndex += 1;
    gameState.attemptedThisQuestion = false;
    gameState.currentHintTier = 0;

    if (gameState.currentMission === 1) {
      loadMission1();
    } else if (gameState.currentMission === 2) {
      loadMission2();
    } else if (gameState.currentMission === 3) {
      loadMission3();
    } else if (gameState.currentMission === 4) {
      loadMission4();
    }
  } else {
    // Retry same question
    if (gameState.currentMission === 1) {
      renderMission1Question();
    } else if (gameState.currentMission === 2) {
      renderMission2Question();
    } else if (gameState.currentMission === 3) {
      loadMission3();
    } else if (gameState.currentMission === 4) {
      loadMission4();
    }
  }
}

function completeMission(missionNum) {
  gameState.missionProgress[missionNum] = true;
  gameState.stars = Object.values(gameState.missionProgress).filter(v => v).length;

  const survivalBonus = gameState.lives * 10;
  gameState.score += survivalBonus;
  gameState.score += (missionNum === 4 ? 100 : 50);

  sounds.playVictory();
  updateUI();

  if (missionNum === 4) {
    showModal('modal-final-victory');
  } else {
    const titleEl = document.getElementById('mission-complete-title');
    const livesEl = document.getElementById('complete-lives-count');
    const bonusEl = document.getElementById('complete-bonus-pts');
    const scoreEl = document.getElementById('complete-total-score');

    if (titleEl) titleEl.textContent = `MISSION ${missionNum} COMPLETE!`;
    if (livesEl) livesEl.textContent = gameState.lives;
    if (bonusEl) bonusEl.textContent = survivalBonus;
    if (scoreEl) scoreEl.textContent = gameState.score;

    showModal('modal-mission-complete');
  }
}

function showHint() {
  gameState.hintsUsed += 1;
  gameState.currentHintTier = Math.min(4, gameState.currentHintTier + 1);

  const hints = [
    "What is the total quantity of pupils in the survey? (Total = 8)",
    "A complete circle is equal to 360°.",
    "Divide 360° by the total quantity: 360° ÷ 8 = 45° per pupil.",
    "Multiply the value of one unit (45°) by the quantity in the category!"
  ];

  const hintText = hints[gameState.currentHintTier - 1] || hints[3];
  updatePIBotSpeech(`💡 Hint ${gameState.currentHintTier}: ${hintText}`, "thinking");
}

// Module Exports / Node testing support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    pieDatasets,
    getPieSlicePath,
    deductLife,
    handleMission1Answer,
    handleMission2Answer,
    handleInterpretationAnswer,
    handleSectorAdd,
    handleCoreSectorAdd,
    renderTeacherReport
  };
}
