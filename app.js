/**
 * Ping Pong Scorer Logic - Configuration First Flow
 */

// --- CONFIGURATION ---
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
    distance: '5ft',
    target: 'bigHole'
};

let game = {
    active: false,
    timeLeft: ROUND_TIME_SECONDS,
    timerInterval: null,
    score: 0,
    inCount: 0,
    missCount: 0,
    currentPtsForIn: 0,
    history: []
};

// --- DOM ELEMENTS ---
const els = {
    // Screens
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultsScreen: document.getElementById('results-screen'),

    // Setup controls
    distanceBtns: document.querySelectorAll('[data-setting="distance"]'),
    targetBtns: document.querySelectorAll('[data-setting="target"]'),
    setupPointsPreview: document.getElementById('setup-points-preview'),
    btnStart: document.getElementById('btn-start'),

    // Game scoreboard
    timerDisplay: document.getElementById('timer-display'),
    gameScore: document.getElementById('game-score'),
    statIn: document.getElementById('stat-in'),
    statMiss: document.getElementById('stat-miss'),

    // Game controls
    btnIn: document.getElementById('btn-in'),
    btnMiss: document.getElementById('btn-miss'),
    btnUndo: document.getElementById('btn-undo'),
    btnEnd: document.getElementById('btn-end'),
    ptsInLabel: document.getElementById('pts-in'),

    // Results screen
    resultsConfig: document.getElementById('results-config'),
    resultsScore: document.getElementById('results-score'),
    resultsIn: document.getElementById('results-in'),

    resultsMiss: document.getElementById('results-miss'),
    resultsTotal: document.getElementById('results-total'),
    resultsAccuracy: document.getElementById('results-accuracy'),
    resultsPtsIn: document.getElementById('results-pts-in'),
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

// --- SETUP PHASE LOGIC ---
function toggleSetup(setting, value) {
    if (setup[setting] === value) return; // Unchanged

    setup[setting] = value;

    // Update visual toggles
    const btns = setting === 'distance' ? els.distanceBtns : els.targetBtns;
    btns.forEach(btn => {
        if (btn.dataset.val === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateSetupUI();
}

function updateSetupUI() {
    // Calculate preview points
    const pts = SCORING_PRESETS[setup.distance][setup.target];
    els.setupPointsPreview.textContent = pts > 0 ? `+${pts}` : pts;

    // Also prep the game button label
    els.ptsInLabel.textContent = pts > 0 ? `+${pts}` : pts;
}

// --- GAME PHASE LOGIC ---

function startGame() {
    game.active = true;
    game.timeLeft = ROUND_TIME_SECONDS;
    game.score = 0;
    game.inCount = 0;
    game.missCount = 0;
    game.history = [];
    game.currentPtsForIn = SCORING_PRESETS[setup.distance][setup.target];

    // UI Resets
    els.timerDisplay.classList.remove('warning');
    updateGameUI();
    formatTimer(game.timeLeft);

    // Switch screens
    els.setupScreen.classList.remove('view-active');
    els.setupScreen.classList.add('view-hidden');
    els.gameScreen.classList.remove('view-hidden');
    els.gameScreen.classList.add('view-active');

    // Start countdown
    clearInterval(game.timerInterval);
    game.timerInterval = setInterval(gameTick, 1000);
}

function stopGame() {
    game.active = false;
    clearInterval(game.timerInterval);
    showResults();
}

function showResults() {
    const total = game.inCount + game.missCount;
    const accuracy = total > 0 ? Math.round((game.inCount / total) * 100) : 0;
    const distanceLabel = setup.distance === '5ft' ? '5 ft' : '7 ft';
    const targetLabel = setup.target === 'bigHole' ? 'Big Hole' : 'Small Hole';

    els.resultsConfig.textContent = `${distanceLabel} · ${targetLabel}`;
    els.resultsScore.textContent = game.score;
    els.resultsIn.textContent = game.inCount;
    els.resultsMiss.textContent = game.missCount;
    els.resultsTotal.textContent = total;
    els.resultsAccuracy.textContent = `${accuracy}%`;
    els.resultsPtsIn.textContent = `+${game.currentPtsForIn}`;

    // Switch from game → results
    els.gameScreen.classList.remove('view-active');
    els.gameScreen.classList.add('view-hidden');
    els.resultsScreen.classList.remove('view-hidden');
    els.resultsScreen.classList.add('view-active');
}

function backToSetup() {
    els.resultsScreen.classList.remove('view-active');
    els.resultsScreen.classList.add('view-hidden');
    els.setupScreen.classList.remove('view-hidden');
    els.setupScreen.classList.add('view-active');
}

function gameTick() {
    if (game.timeLeft > 0) {
        game.timeLeft--;
        formatTimer(game.timeLeft);

        // Add visual warning for last 10 seconds
        if (game.timeLeft <= 10 && !els.timerDisplay.classList.contains('warning')) {
            els.timerDisplay.classList.add('warning');
        }
    } else {
        // Time's up
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

function recordEvent(type) {
    if (!game.active && game.timeLeft <= 0) return; // Prevent logging if game is completely over but not explicitly closed

    if (navigator.vibrate) navigator.vibrate(40);

    const ptsAdded = type === 'in' ? game.currentPtsForIn : -1;

    game.history.push({
        type: type,
        prevScore: game.score
    });

    game.score += ptsAdded;
    if (type === 'in') game.inCount++;
    else game.missCount++;

    updateGameUI();
}

function undoLast() {
    if (game.history.length === 0) return;
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const lastEvent = game.history.pop();

    game.score = lastEvent.prevScore;
    if (lastEvent.type === 'in') game.inCount--;
    else game.missCount--;

    updateGameUI();
}

function updateGameUI() {
    els.gameScore.textContent = game.score;
    els.statIn.textContent = game.inCount;
    els.statMiss.textContent = game.missCount;

    els.btnUndo.disabled = game.history.length === 0;
}

// --- EVENT BINDING ---

let lastTapTime = 0;
function handleTap(e, callback) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTapTime < 150) return; // Debounce slightly
    lastTapTime = now;

    // Scale animation
    const el = e.currentTarget;
    const isCircle = el.classList.contains('circle-btn');
    el.style.transform = `scale(${isCircle ? 0.94 : 0.96})`;
    setTimeout(() => {
        if (el) el.style.transform = 'scale(1)';
    }, 100);

    callback();
}

function setupEventListeners() {
    // Setup Screen Toggles
    els.distanceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => toggleSetup('distance', e.target.dataset.val));
    });

    els.targetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => toggleSetup('target', e.target.dataset.val));
    });

    els.btnStart.addEventListener('click', startGame);

    // Game Controls
    let tapEvent = window.PointerEvent ? 'pointerdown' : 'touchstart';

    els.btnIn.addEventListener(tapEvent, (e) => handleTap(e, () => recordEvent('in')));
    els.btnMiss.addEventListener(tapEvent, (e) => handleTap(e, () => recordEvent('miss')));

    // Fallback for desktop clicks
    if (tapEvent !== 'click') {
        els.btnIn.addEventListener('click', (e) => { e.preventDefault(); if (Date.now() - lastTapTime > 300) recordEvent('in'); });
        els.btnMiss.addEventListener('click', (e) => { e.preventDefault(); if (Date.now() - lastTapTime > 300) recordEvent('miss'); });
    }

    els.btnUndo.addEventListener('click', undoLast);
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

    // Results screen
    els.btnNewRound.addEventListener('click', backToSetup);
}

// Start application
document.addEventListener('DOMContentLoaded', init);
