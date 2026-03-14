/**
 * Ping Pong Scorer Logic
 * Both Small Hole and Big Hole can be scored in the same round.
 * Distance is locked at setup; hole type is chosen per-tap during the game.
 */

// --- CONFIGURATION ---
// Edit these values if the instructor changes the scoring rules.
const SCORING_PRESETS = {
    '5ft': {
        bigHole: 3,
        smallHole: 6,
        miss: -1
    },
    '7ft': {
        bigHole: 4,
        smallHole: 8,
        miss: -1
    }
};

const ROUND_TIME_SECONDS = 120; // 2 minutes

// --- STATE MANAGEMENT ---
let setup = {
    distance: '5ft'
};

let game = {
    active: false,
    timeLeft: ROUND_TIME_SECONDS,
    timerInterval: null,
    score: 0,
    bigCount: 0,
    smallCount: 0,
    missCount: 0,
    history: [] // Each entry: { type: 'big'|'small'|'miss', pts, prevScore }
};

// --- DOM ELEMENTS ---
const els = {
    // Screens
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),

    // Setup controls
    distanceBtns: document.querySelectorAll('[data-setting="distance"]'),
    setupPtsSmall: document.getElementById('setup-pts-small'),
    setupPtsBig: document.getElementById('setup-pts-big'),
    btnStart: document.getElementById('btn-start'),

    // Game scoreboard
    timerDisplay: document.getElementById('timer-display'),
    gameScore: document.getElementById('game-score'),
    statBig: document.getElementById('stat-big'),
    statSmall: document.getElementById('stat-small'),
    statMiss: document.getElementById('stat-miss'),

    // Game buttons
    btnSmall: document.getElementById('btn-small'),
    btnBig: document.getElementById('btn-big'),
    btnMiss: document.getElementById('btn-miss'),
    btnUndo: document.getElementById('btn-undo'),
    btnEnd: document.getElementById('btn-end'),
    ptsSmallLabel: document.getElementById('pts-small'),
    ptsBigLabel: document.getElementById('pts-big'),

    // Results screen
    resultsConfig: document.getElementById('results-config'),
    resultsScore: document.getElementById('results-score'),
    resultsBig: document.getElementById('results-big'),
    resultsSmall: document.getElementById('results-small'),
    resultsMiss: document.getElementById('results-miss'),
    resultsTotal: document.getElementById('results-total'),
    resultsAccuracy: document.getElementById('results-accuracy'),
    btnNewRound: document.getElementById('btn-new-round'),

    // Confirm modal
    confirmOverlay: document.getElementById('confirm-overlay'),
    confirmYes: document.getElementById('confirm-yes'),
    confirmCancel: document.getElementById('confirm-cancel')
};

// --- INITIALIZATION ---
function init() {
    updateSetupUI();
    setupEventListeners();
}

// --- SETUP PHASE ---

function toggleDistance(value) {
    if (setup.distance === value) return;
    setup.distance = value;

    els.distanceBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === value);
    });

    updateSetupUI();
}

function updateSetupUI() {
    const preset = SCORING_PRESETS[setup.distance];
    els.setupPtsSmall.textContent = `+${preset.smallHole}`;
    els.setupPtsBig.textContent = `+${preset.bigHole}`;
}

// --- GAME PHASE ---

function startGame() {
    const preset = SCORING_PRESETS[setup.distance];

    game.active = true;
    game.timeLeft = ROUND_TIME_SECONDS;
    game.score = 0;
    game.bigCount = 0;
    game.smallCount = 0;
    game.missCount = 0;
    game.history = [];

    // Set button labels to current preset values
    els.ptsBigLabel.textContent = `+${preset.bigHole}`;
    els.ptsSmallLabel.textContent = `+${preset.smallHole}`;

    els.timerDisplay.classList.remove('warning');
    updateGameUI();
    formatTimer(game.timeLeft);

    switchScreen(els.setupScreen, els.gameScreen);

    clearInterval(game.timerInterval);
    game.timerInterval = setInterval(gameTick, 1000);
}

function stopGame() {
    game.active = false;
    clearInterval(game.timerInterval);
    showResults();
}

function showResults() {
    const total = game.bigCount + game.smallCount + game.missCount;
    const inCount = game.bigCount + game.smallCount;
    const accuracy = total > 0 ? Math.round((inCount / total) * 100) : 0;
    const distanceLabel = setup.distance === '5ft' ? '5 ft' : '7 ft';

    els.resultsConfig.textContent = distanceLabel;
    els.resultsScore.textContent = game.score;
    els.resultsBig.textContent = game.bigCount;
    els.resultsSmall.textContent = game.smallCount;
    els.resultsMiss.textContent = game.missCount;
    els.resultsTotal.textContent = total;
    els.resultsAccuracy.textContent = `${accuracy}%`;

    switchScreen(els.gameScreen, els.resultsScreen);
}

function backToSetup() {
    switchScreen(els.resultsScreen, els.setupScreen);
}

function switchScreen(from, to) {
    from.classList.remove('view-active');
    from.classList.add('view-hidden');
    to.classList.remove('view-hidden');
    to.classList.add('view-active');
}

function gameTick() {
    if (game.timeLeft > 0) {
        game.timeLeft--;
        formatTimer(game.timeLeft);

        if (game.timeLeft <= 10 && !els.timerDisplay.classList.contains('warning')) {
            els.timerDisplay.classList.add('warning');
        }
    } else {
        game.active = false;
        clearInterval(game.timerInterval);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        showResults();
    }
}

function formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    els.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// type: 'big' | 'small' | 'miss'
function recordEvent(type) {
    if (!game.active && game.timeLeft <= 0) return;

    if (navigator.vibrate) navigator.vibrate(40);

    const preset = SCORING_PRESETS[setup.distance];
    let pts;
    if (type === 'big') pts = preset.bigHole;
    else if (type === 'small') pts = preset.smallHole;
    else pts = preset.miss;

    game.history.push({ type, pts, prevScore: game.score });

    game.score += pts;
    if (type === 'big') game.bigCount++;
    else if (type === 'small') game.smallCount++;
    else game.missCount++;

    updateGameUI();
}

function undoLast() {
    if (game.history.length === 0) return;
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const last = game.history.pop();
    game.score = last.prevScore;
    if (last.type === 'big') game.bigCount--;
    else if (last.type === 'small') game.smallCount--;
    else game.missCount--;

    updateGameUI();
}

function updateGameUI() {
    els.gameScore.textContent = game.score;
    els.statBig.textContent = game.bigCount;
    els.statSmall.textContent = game.smallCount;
    els.statMiss.textContent = game.missCount;
    els.btnUndo.disabled = game.history.length === 0;
}

// --- EVENT BINDING ---

let lastTapTime = 0;
function handleTap(e, callback) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTapTime < 150) return;
    lastTapTime = now;

    const el = e.currentTarget;
    const isCircle = el.classList.contains('circle-btn');
    el.style.transform = `scale(${isCircle ? 0.94 : 0.96})`;
    setTimeout(() => { if (el) el.style.transform = 'scale(1)'; }, 100);

    callback();
}

function setupEventListeners() {
    // Setup
    els.distanceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => toggleDistance(e.target.dataset.val));
    });
    els.btnStart.addEventListener('click', startGame);

    // Game — use pointerdown for snappy mobile taps
    let tapEvent = window.PointerEvent ? 'pointerdown' : 'touchstart';

    els.btnSmall.addEventListener(tapEvent, (e) => handleTap(e, () => recordEvent('small')));
    els.btnBig.addEventListener(tapEvent, (e) => handleTap(e, () => recordEvent('big')));
    els.btnMiss.addEventListener(tapEvent, (e) => handleTap(e, () => recordEvent('miss')));

    // Desktop fallback
    if (tapEvent !== 'click') {
        els.btnSmall.addEventListener('click', (e) => { e.preventDefault(); if (Date.now() - lastTapTime > 300) recordEvent('small'); });
        els.btnBig.addEventListener('click', (e) => { e.preventDefault(); if (Date.now() - lastTapTime > 300) recordEvent('big'); });
        els.btnMiss.addEventListener('click', (e) => { e.preventDefault(); if (Date.now() - lastTapTime > 300) recordEvent('miss'); });
    }

    els.btnUndo.addEventListener('click', undoLast);

    // End round — custom confirm modal
    els.btnEnd.addEventListener('click', () => {
        els.confirmOverlay.classList.remove('hidden');
    });
    els.confirmYes.addEventListener('click', () => {
        els.confirmOverlay.classList.add('hidden');
        stopGame();
    });
    els.confirmCancel.addEventListener('click', () => {
        els.confirmOverlay.classList.add('hidden');
    });

    // Results
    els.btnNewRound.addEventListener('click', backToSetup);
}

// Start application
document.addEventListener('DOMContentLoaded', init);
