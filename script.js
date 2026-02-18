// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNkHKbA26KzoP5JkboXUPfj3THuws-OvVSOowWgNce0TUQOZmAV-5UbTz9ZjFzxUhX0Q/exec"; 
const TOTAL_CELLS = 20;

// Firebase Placeholder Config (USER MUST UPDATE THIS)
const firebaseConfig = {
    apiKey: "AIzaSyAFWnl4j7FO_lDP2UgQV3wOOPWeqVREwZo",
    authDomain: "percentopolis.firebaseapp.com",
    databaseURL: "https://percentopolis-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "percentopolis",
    storageBucket: "percentopolis.firebasestorage.app",
    messagingSenderId: "150378785304",
    appId: "1:150378785304:web:90d334cb30ed57bd1f716d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
let currentUserUid = null;

// Sign in anonymously on page load
auth.signInAnonymously().catch(err => {
    console.error('Firebase Auth error:', err);
});

auth.onAuthStateChanged(user => {
    if (user) {
        currentUserUid = user.uid;
        console.log('Authenticated anonymously:', user.uid);
    }
});

// --- ERROR HANDLING & NOTIFICATIONS ---
function showError(message) {
    const toast = createToast(message, 'error');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
    console.error('[PERCENTOPOLIS ERROR]', message);
}

function showWarning(message) {
    const toast = createToast(message, 'warning');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
    console.warn('[PERCENTOPOLIS WARNING]', message);
}

function showSuccess(message) {
    const toast = createToast(message, 'success');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 15px 20px; border-radius: 12px; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px;
        animation: slideIn 0.3s ease-out;
        font-size: 0.9rem; line-height: 1.4;
    `;
    const colors = {
        error: 'background: #fee2e2; color: #991b1b; border: 2px solid #fca5a5;',
        warning: 'background: #fef3c7; color: #92400e; border: 2px solid #fbbf24;',
        success: 'background: #d1fae5; color: #065f46; border: 2px solid #34d399;'
    };
    toast.style.cssText += colors[type] || colors.error;
    toast.innerText = message;
    return toast;
}

// --- SECURITY: HTML Escaping ---
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// --- CUSTOM CONFIRM MODAL (replaces native confirm()) ---
function showConfirmModal(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:20000;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:20px;padding:30px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <p style="font-size:1rem;font-weight:700;color:#1e293b;margin:0 0 20px 0;line-height:1.5;">${escapeHtml(message)}</p>
                <div style="display:flex;gap:10px;">
                    <button id="confirm-no" style="flex:1;padding:12px;border:2px solid #e2e8f0;border-radius:12px;background:white;font-weight:800;cursor:pointer;color:#475569;font-size:0.95rem;">НЕ</button>
                    <button id="confirm-yes" style="flex:1;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-weight:800;cursor:pointer;font-size:0.95rem;">ДА</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); resolve(true); };
        overlay.querySelector('#confirm-no').onclick = () => { overlay.remove(); resolve(false); };
    });
}

// Connection monitoring
let isOnline = true;
db.ref('.info/connected').on('value', (snap) => {
    const wasOnline = isOnline;
    isOnline = snap.val() === true;
    if (!isOnline && wasOnline) {
        showWarning('⚠️ Нема интернет конекција. Се обидувам да се поврзам...');
        // Disable action buttons when offline
        document.querySelectorAll('#roll-btn, #shop-btn, #trade-btn, #buy-prop, #pay-rent').forEach(btn => {
            if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
        });
    } else if (isOnline && !wasOnline) {
        showSuccess('✅ Конекцијата е вратена!');
        document.querySelectorAll('#roll-btn, #shop-btn, #trade-btn').forEach(btn => {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        });
    }
});

// Loading overlay management
let currentLoader = null;

function showLoader(message, subtext = '') {
    hideLoader();
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
        ${subtext ? `<div class="loading-subtext">${subtext}</div>` : ''}
    `;
    document.body.appendChild(overlay);
    currentLoader = overlay;
    return overlay;
}

function hideLoader() {
    if (currentLoader) {
        currentLoader.remove();
        currentLoader = null;
    }
}

function setButtonLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.dataset.originalText = btn.innerText;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        if (btn.dataset.originalText) {
            btn.innerText = btn.dataset.originalText;
        }
    }
}

// --- TIME SYNC ---
let serverOffset = 0;
db.ref(".info/serverTimeOffset").on("value", (snap) => {
    serverOffset = snap.val() || 0;
});
function getServerTime() { return Date.now() + serverOffset; }

// --- INPUT VALIDATION & SANITIZATION ---
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '').slice(0, 100);
}

function validatePlayerName(name) {
    const sanitized = sanitizeInput(name);
    if (sanitized.length < 3) {
        return { valid: false, error: 'Името мора да има минимум 3 карактери' };
    }
    if (sanitized.length > 30) {
        return { valid: false, error: 'Името мора да има максимум 30 карактери' };
    }
    return { valid: true, sanitized };
}

function validateRoomCode(code) {
    const sanitized = sanitizeInput(code).toUpperCase();
    if (sanitized.length < 3 || sanitized.length > 20) {
        return { valid: false, error: 'Кодот мора да биде помеѓу 3 и 20 карактери' };
    }
    if (!/^[A-Z0-9\-]+$/.test(sanitized)) {
        return { valid: false, error: 'Кодот може да содржи само букви, броеви и цртички' };
    }
    return { valid: true, sanitized };
}

// === PHASE 2: ONBOARDING TUTORIAL SYSTEM ===
let currentTutorialStep = 0;
const tutorialSteps = [
    {
        icon: '🎮',
        title: 'Добредојде во ПроцентОполис!',
        subtitle: 'Најдобрата математичка игра',
        content: `<p>Ова е образовна игра каде <strong>учиш проценти додека се забавуваш!</strong></p>
                  <div class="tutorial-highlight">
                      <strong>🎯 ЦЕЛ:</strong> Собери најголемо богатство со решавање математички задачи!
                  </div>
                  <p>Играта е слична на Монопол, но наместо пари користиш <strong>математички вештини</strong> за да станеш најбогат играч!</p>`
    },
    {
        icon: '🎲',
        title: 'Како да играш?',
        subtitle: 'Основни правила',
        content: `<p>Играта е едноставна:</p>
                  <ol style="line-height: 2; margin-left: 20px;">
                      <li><strong>Фрли коцка</strong> со копчето "🎲 ФРЛИ"</li>
                      <li><strong>Движи се</strong> по табла автоматски</li>
                      <li><strong>Застани на поле</strong> и добиј задача</li>
                      <li><strong>Реши задача</strong> за да купиш имот</li>
                  </ol>
                  <div class="tutorial-highlight">
                      <strong>⏱️ ВАЖНО:</strong> Имаш <strong>30 секунди</strong> за секој потег!
                  </div>`
    },
    {
        icon: '🏠',
        title: 'Купување имоти',
        subtitle: 'Градење на богатство',
        content: `<p>Кога ќе застанеш на празно поле:</p>
                  <div class="tutorial-highlight">
                      <strong>✅ ТОЧЕН ОДГОВОР:</strong> Купуваш го имотот за полна цена<br>
                      <strong>❌ ГРЕШКА:</strong> Го губиш имотот и се враќаш на старта
                  </div>
                  <p style="margin-top: 20px;">Кога другите играчи ќе застанат на <strong>твој имот</strong>, тие мора да платат <strong>кирија!</strong></p>
                  <p><strong>💰 Повеќе имоти = Поголемо богатство!</strong></p>`
    },
    {
        icon: '💸',
        title: 'Плаќање кирија',
        subtitle: 'Пресметување на рента',
        content: `<p>Ако застанеш на туѓо поле, мора да платиш кирија!</p>
                  <div class="tutorial-highlight">
                      <strong>✅ ТОЧНО ПРЕСМЕТАШ:</strong> Плаќаш нормална кирија<br>
                      <strong>❌ ПОГРЕШНО ПРЕСМЕТАШ:</strong> Плаќаш <strong>ДУПЛО!</strong> 😱
                  </div>
                  <p style="margin-top: 20px;">Затоа внимавај и секогаш <strong>пресметај точно!</strong></p>`
    },
    {
        icon: '🛒',
        title: 'Продавница за моќи',
        subtitle: 'Стратешки предности',
        content: `<p>Со копчето "🛒 ПРОДАВНИЦА" можеш да купиш <strong>специјални моќи:</strong></p>
                  <ul style="line-height: 2; margin-left: 20px;">
                      <li><strong>⚖️ Адвокат</strong> - Заштита од данок (300д)</li>
                      <li><strong>🛡️ Златен Штит</strong> - Не плаќаш кирија (250д)</li>
                      <li><strong>🚀 Нитро Коцка</strong> - Дупло фрлање (150д)</li>
                      <li><strong>🕵️ Инсајдер</strong> - Имот за 1 денар (500д)</li>
                  </ul>
                  <div class="tutorial-highlight">
                      <strong>💡 СОВЕТ:</strong> Користи ги паметно за да победиш!
                  </div>`
    },
    {
        icon: '🎨',
        title: 'Whiteboard помош',
        subtitle: 'Цртај и пресметувај',
        content: `<p>За секоја задача имаш <strong>whiteboard</strong> каде можеш:</p>
                  <ul style="line-height: 2; margin-left: 20px;">
                      <li>✏️ Да црташ и пресметуваш</li>
                      <li>🎨 Да користиш различни бои</li>
                      <li>🖼️ Да бараш визуелна помош (hint)</li>
                  </ul>
                  <div class="tutorial-highlight">
                      <strong>🎨 СОВЕТ:</strong> Користи го whiteboard за да не грешиш!
                  </div>`
    },
    {
        icon: '🏆',
        title: 'Подготвен си!',
        subtitle: 'Време е да играш',
        content: `<p style="font-size: 1.2rem; text-align: center; margin: 30px 0;">
                      <strong>🎉 Одлично! Сега знаеш сè!</strong>
                  </p>
                  <div class="tutorial-highlight">
                      <strong>🎯 ЗАПОМНИ:</strong><br>
                      • Решавај точно за да купуваш имоти<br>
                      • Внимавај на времето (30 секунди)<br>
                      • Користи ги моќите паметно<br>
                      • Забавувај се и учи! 📚
                  </div>
                  <p style="text-align: center; margin-top: 25px; font-size: 1.1rem;">
                      <strong>Среќно! 🚀</strong>
                  </p>`
    }
];

function showTutorial() {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('percentopolis_tutorial_completed');
    if (hasSeenTutorial) return;

    currentTutorialStep = 0;
    renderTutorialStep();
    document.getElementById('tutorial-overlay').style.display = 'flex';
}

function renderTutorialStep() {
    const step = tutorialSteps[currentTutorialStep];
    document.getElementById('tutorial-icon').innerText = step.icon;
    document.getElementById('tutorial-title').innerText = step.title;
    document.getElementById('tutorial-subtitle').innerText = step.subtitle;
    document.getElementById('tutorial-content').innerHTML = step.content;
    document.getElementById('tutorial-progress').innerText = `Чекор ${currentTutorialStep + 1} од ${tutorialSteps.length}`;

    // Update button on last step
    const nextBtn = document.getElementById('tutorial-next-btn');
    if (currentTutorialStep === tutorialSteps.length - 1) {
        nextBtn.innerText = '🚀 Започни игра!';
        nextBtn.className = 'tutorial-btn tutorial-btn-start';
    } else {
        nextBtn.innerText = 'Следно →';
        nextBtn.className = 'tutorial-btn tutorial-btn-next';
    }
}

function nextTutorialStep() {
    if (currentTutorialStep < tutorialSteps.length - 1) {
        currentTutorialStep++;
        renderTutorialStep();
    } else {
        completeTutorial();
    }
}

function skipTutorial() {
    showConfirmModal('Сигурен си дека сакаш да го прескокнеш упатството?').then(yes => {
        if (yes) completeTutorial();
    });
}

function completeTutorial() {
    localStorage.setItem('percentopolis_tutorial_completed', 'true');
    document.getElementById('tutorial-overlay').style.display = 'none';
    showSuccess('✅ Добредојде во играта! Среќно! 🎮');
}

// === PHASE 2: CONFETTI CELEBRATION SYSTEM ===
function celebrateWithConfetti(duration = 3000) {
    const container = document.getElementById('confetti-container');
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = '0s';
            container.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * (duration / confettiCount));
    }
}

// === PHASE 2: ACHIEVEMENT SYSTEM ===
const achievements = {
    firstProperty: { icon: '🏠', title: 'Прв имот!', description: 'Купи го првиот имот' },
    perfectAnswer: { icon: '🎯', title: 'Совршено!', description: 'Одговори точно на прв обид' },
    streak3: { icon: '🔥', title: 'Во оган!', description: '3 точни одговори по ред' },
    streak5: { icon: '⚡', title: 'Непобедлив!', description: '5 точни одговори по ред' },
    richPlayer: { icon: '💰', title: 'Богат играч!', description: 'Имаш над 1500 денари' },
    shopMaster: { icon: '🛒', title: 'Шопинг мајстор!', description: 'Купи моќ од продавницата' },
    speedster: { icon: '⚡', title: 'Брзинец!', description: 'Одговори за помалку од 10 секунди' },
    comeback: { icon: '💪', title: 'Враќање!', description: 'Точен одговор после грешка' }
};

let unlockedAchievements = new Set();

function unlockAchievement(achievementKey) {
    if (unlockedAchievements.has(achievementKey)) return;

    unlockedAchievements.add(achievementKey);
    const achievement = achievements[achievementKey];

    // Show achievement toast
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
        </div>
    `;
    document.body.appendChild(toast);

    // Celebrate with confetti
    celebrateWithConfetti(2000);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// === PHASE 2: CELEBRATION TRIGGERS ===
let lastAnswerWasCorrect = false;
let answerTimeStart = 0;

function triggerCelebration(type, data = {}) {
    switch(type) {
        case 'correctAnswer':
            celebrateWithConfetti(1500);
            if (!lastAnswerWasCorrect) {
                unlockAchievement('comeback');
            }
            lastAnswerWasCorrect = true;

            // Check for speed achievement
            if (answerTimeStart && (Date.now() - answerTimeStart) < 10000) {
                unlockAchievement('speedster');
            }
            break;

        case 'wrongAnswer':
            lastAnswerWasCorrect = false;
            break;

        case 'propertyPurchased':
            if (data.isFirst) {
                unlockAchievement('firstProperty');
            }
            celebrateWithConfetti(2000);
            break;

        case 'streak':
            if (data.count === 3) {
                unlockAchievement('streak3');
            } else if (data.count === 5) {
                unlockAchievement('streak5');
            }
            break;

        case 'richPlayer':
            unlockAchievement('richPlayer');
            break;

        case 'shopPurchase':
            unlockAchievement('shopMaster');
            break;

        case 'gameWin':
            celebrateWithConfetti(5000);
            break;
    }
}

// --- VARIABLES ---
let studentName = "", studentOdd = "", studentCorrect = 0, studentWrong = 0;
let usedQuestionIds = [], remainingTime = 40 * 60, players = [], currentPlayerIndex = 0, gameBoard = [], isRolling = false;
let myPlayerId = null;
let roomId = null;
let isCreator = false;
let timerInterval, turnTimerInterval, localTurnTicker;
let canvas, ctx, isDrawing = false, lastX = 0, lastY = 0;
let penColor = '#000000';
let penWidth = 3;
let diceRotationCounter = 0;
let currentDifficultyLevel = 1; 
let correctStreak = 0;
let currentTaskData = null;
let turnRemainingTime = 30;
let myTokenEmoji = "👤";

// --- DATA ---
function shuffleArray(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const allTasks=[];
for(let i=0;i<220;i++){
    let diff=(i%3)+1; 
    let rate=5+(i%15)*5; 
    let base=50+(i*10);
    
    // Level 1 logic
    if(diff===1){
        rate=[10,20,25,50][i%4]; 
        base=[100,200,500,80,120,400][i%6];
    }
    
    let cv=(base*rate)/100; 
    let cs=cv%1===0?cv.toString():cv.toFixed(1);
    
    // Advanced Distractor Logic
    let distractors = new Set();
    let numAns = parseFloat(cs);
    
    // 1. Decimal slip error (very common)
    distractors.add((numAns * 10).toString());
    distractors.add((numAns / 10).toString());
    distractors.add((numAns * 2).toString()); // Double error
    
    // 2. Addition error (base + rate) - common when confusing % with absolute value
    distractors.add((base + rate).toString());
    
    // 3. Just the rate or just the base
    distractors.add(rate.toString());
    distractors.add(base.toString());
    
    // 4. Complementary percentage error (e.g. 20% vs 80%)
    let comp = (base * (100 - rate)) / 100;
    distractors.add(comp % 1 === 0 ? comp.toString() : comp.toFixed(1));

    // 5. Half/Double of the answer
    distractors.add((numAns / 2).toFixed(1));
    
    // 6. Misplaced decimal (e.g. 2.5% instead of 25%)
    distractors.add((base * rate / 10).toFixed(1));

    let opts = Array.from(distractors).filter(d => d !== cs && d !== "0.0" && d !== "0" && parseFloat(d) > 0);
    shuffleArray(opts);
    let finalOptions = opts.slice(0, 3);
    finalOptions.push(cs);
    
    let hint=`💡 Размисли: ${rate}% од ${base} е исто што и дел од него. Подели го ${base} на 100 еднакви делови и земи ${rate} од нив.`;
    if(rate===25) hint="💡 Совет: 25% е исто што и една четвртина (четврт дел од бројот).";
    if(rate===50) hint="💡 Совет: 50% е половина од бројот.";
    if(rate===10) hint="💡 Совет: 10% е десетти дел од бројот.";
    if(rate===75) hint="💡 Совет: 75% се три четвртини од бројот (пресметај 25% па помножи со 3).";
    
    let expl=`💡 Постапка: ${rate}% од ${base} се пресметува како (${rate} ÷ 100) × ${base} = ${cs}.`;
    
    allTasks.push({
        id:100+i, 
        difficulty:diff, 
        question:`Пресметај ${rate}% од ${base}.`, 
        correct_answer:cs, 
        options:shuffleArray(finalOptions), 
        raw:{rate,base}, 
        explanation:expl, 
        hint:hint
    });
}

const hardProperties = [4, 9, 14, 19];
const boardConfig = [
    {name:"СТАРТ",type:"start",color:"#ecf0f1"}, {name:"Улица Децимала",type:"property",group:"south",color:"#3498db"}, {name:"Парк на Дропки",type:"property",group:"south",color:"#3498db"}, {name:"Плоштад 10%",type:"property",group:"south",color:"#3498db"}, {name:"Булевар Еуклид",type:"property",group:"south",color:"#3498db"},
    {name:"ЗАТВОР / ОДМОР",type:"jail",color:"#7f8c8d"}, {name:"Авенија Алгебра",type:"property",group:"east",color:"#27ae60"}, {name:"Њутн Маало",type:"property",group:"east",color:"#27ae60"}, {name:"Пазар за Проценти",type:"property",group:"east",color:"#27ae60"}, {name:"Кула на Питагора",type:"property",group:"east",color:"#27ae60"},
    {name:"ШАНСА",type:"chance",color:"#f39c12"}, {name:"Банка за Камати",type:"property",group:"north",color:"#e74c3c"}, {name:"Гаус Хајтс",type:"property",group:"north",color:"#e74c3c"}, {name:"Статистичка Зона",type:"property",group:"north",color:"#e74c3c"}, {name:"Финансиски Центар",type:"property",group:"north",color:"#e74c3c"},
    {name:"ДАНОК",type:"tax",color:"#34495e"}, {name:"Кружен Тек 'Пи'",type:"property",group:"west",color:"#f1c40f"}, {name:"Лимит Лејн",type:"property",group:"west",color:"#f1c40f"}, {name:"Вектор Вју",type:"property",group:"west",color:"#f1c40f"}, {name:"Матрица Маркет",type:"property",group:"west",color:"#f1c40f"}
];

// --- AUDIO ---
const AudioController = {
    ctx: null,
    init: function() { window.AudioContext = window.AudioContext||window.webkitAudioContext; this.ctx = new AudioContext(); },
    play: function(type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.connect(gain); gain.connect(this.ctx.destination); const now = this.ctx.currentTime;
        if (type === 'roll') { osc.type='triangle'; osc.frequency.setValueAtTime(100,now); osc.frequency.exponentialRampToValueAtTime(600,now+0.3); gain.gain.setValueAtTime(0.3,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.3); osc.start(now); osc.stop(now+0.3); }
        else if (type === 'step') { osc.type='square'; osc.frequency.setValueAtTime(400,now); gain.gain.setValueAtTime(0.1,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.05); osc.start(now); osc.stop(now+0.05); }
        else if (type === 'success') { this.playTone(523.25,now,0.1); this.playTone(659.25,now+0.1,0.1); this.playTone(783.99,now+0.2,0.3); }
        else if (type === 'failure') { osc.type='sawtooth'; osc.frequency.setValueAtTime(150,now); osc.frequency.linearRampToValueAtTime(100,now+0.4); gain.gain.setValueAtTime(0.3,now); gain.gain.linearRampToValueAtTime(0.01,now+0.4); osc.start(now); osc.stop(now+0.4); }
        else if (type === 'money') { osc.type='sine'; osc.frequency.setValueAtTime(1200,now); gain.gain.setValueAtTime(0.3,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.5); osc.start(now); osc.stop(now+0.5); }
    },
    playTone: function(f,t,d) { const o=this.ctx.createOscillator(); const g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='sine'; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.01,t+d); o.start(t); o.stop(t+d); }
};

// --- EFFECTS ---
function triggerConfetti() {
    const c=['#e74c3c','#3498db','#f1c40f','#27ae60','#9b59b6'];
    for(let i=0;i<50;i++){
        const p=document.createElement('div'); p.className='confetti-piece'; p.style.backgroundColor=c[Math.floor(Math.random()*c.length)];
        p.style.left=Math.random()*100+'vw'; p.style.top='-10px'; p.style.width=Math.random()*10+5+'px'; p.style.height=Math.random()*5+5+'px';
        const d=Math.random()*2+1; p.style.transition=`top ${d}s ease-in, transform ${d}s linear, opacity ${d}s ease-in`; p.style.opacity=1;
        document.body.appendChild(p); setTimeout(()=>{p.style.top='100vh'; p.style.transform=`rotate(${Math.random()*360}deg)`; p.style.opacity=0;},50);
        setTimeout(()=>{document.body.removeChild(p);},d*1000);
    }
}

// --- LOBBY LOGIC ---
let currentRole = 'student';

window.onload = () => {
    document.getElementById('player-name-input').oninput = checkLoginValid;
    document.getElementById('room-id-input').oninput = checkLoginValid;

    document.getElementById('login-btn').onclick = joinRoom;
    document.getElementById('teacher-dashboard-btn').onclick = openTeacherDashDirectly;
    document.getElementById('start-game-btn-multi').onclick = requestStartGame;
    setupCanvas();

    // Check for existing session
    const saved = localStorage.getItem('percentopolis_session');
    if (saved) {
        const session = JSON.parse(saved);
        document.getElementById('player-name-input').value = session.name;
        if (session.role === 'student') {
            document.getElementById('room-id-input').value = session.roomId;
        }
    }
};

function selectToken(emoji, btn) {
    myTokenEmoji = emoji;
    document.querySelectorAll('.token-choice').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function checkLoginValid() {
    const nameVal = document.getElementById('player-name-input').value.trim();
    const roomVal = document.getElementById('room-id-input').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const teacherDashBtn = document.getElementById('teacher-dashboard-btn');
    const nameError = document.getElementById('name-error');
    const roomError = document.getElementById('room-error');

    // Validate name
    let nameValid = true;
    if (nameVal.length === 0) {
        nameError.innerText = '❌ Внесете име';
        nameError.style.display = 'block';
        nameValid = false;
    } else if (nameVal.length < 3) {
        nameError.innerText = '❌ Името мора да има минимум 3 карактери';
        nameError.style.display = 'block';
        nameValid = false;
    } else if (nameVal.length > 30) {
        nameError.innerText = '❌ Името мора да има максимум 30 карактери';
        nameError.style.display = 'block';
        nameValid = false;
    } else {
        nameError.style.display = 'none';
    }

    // Validate room code (only for students)
    let roomValid = true;
    if (currentRole === 'student') {
        if (roomVal.length === 0) {
            roomError.innerText = '❌ Внесете код на соба';
            roomError.style.display = 'block';
            roomValid = false;
        } else if (roomVal.length < 3) {
            roomError.innerText = '❌ Кодот мора да има минимум 3 карактери';
            roomError.style.display = 'block';
            roomValid = false;
        } else {
            roomError.style.display = 'none';
        }
    }

    // Enable/disable buttons
    if (currentRole === 'teacher') {
        teacherDashBtn.disabled = !nameValid;
    } else {
        loginBtn.disabled = !nameValid || !roomValid;
    }
}

function openTeacherDashDirectly() {
    studentName = document.getElementById('player-name-input').value.trim();

    if (studentName.length < 3) {
        showError('❌ Внесете валидно име (минимум 3 карактери)');
        return;
    }

    // Save teacher info to localStorage
    localStorage.setItem('percentopolis_teacher_name', studentName);
    localStorage.setItem('percentopolis_session', JSON.stringify({
        name: studentName,
        role: 'teacher'
    }));

    // Hide login, show dashboard
    document.getElementById('login-overlay').style.display = 'none';

    // Open Teacher Dashboard directly
    openTeacherDash();
}

function setRole(role) {
    currentRole = role;
    const sBtn = document.getElementById('role-student');
    const tBtn = document.getElementById('role-teacher');
    const studentFields = document.getElementById('student-only-fields');
    const studentClassBox = document.getElementById('student-class-box');
    const studentRoomBox = document.getElementById('student-room-box');
    const loginBtn = document.getElementById('login-btn');
    const teacherDashBtn = document.getElementById('teacher-dashboard-btn');
    const roomsContainer = document.getElementById('available-rooms-container');

    if (role === 'teacher') {
        sBtn.classList.remove('active');
        tBtn.classList.add('active');
        studentFields.style.display = 'none';
        studentClassBox.style.display = 'none';
        studentRoomBox.style.display = 'none';
        roomsContainer.style.display = 'none';
        loginBtn.style.display = 'none';
        teacherDashBtn.style.display = 'block';
    } else {
        tBtn.classList.remove('active');
        sBtn.classList.add('active');
        studentFields.style.display = 'block';
        studentClassBox.style.display = 'block';
        studentRoomBox.style.display = 'block';
        roomsContainer.style.display = 'block';
        loginBtn.style.display = 'block';
        teacherDashBtn.style.display = 'none';
        fetchAvailableRooms();
    }
    checkLoginValid();
}

function fetchAvailableRooms() {
    const list = document.getElementById('available-rooms-list');
    list.innerHTML = '<p style="font-size:0.7rem; color:#94a3b8;">Се вчитуваат активни соби...</p>';
    
    db.ref('rooms').once('value', snapshot => {
        const rooms = snapshot.val();
        list.innerHTML = '';
        if (!rooms) {
            list.innerHTML = '<p style="font-size:0.7rem; color:#94a3b8;">Нема активни соби.</p>';
            return;
        }

        let count = 0;
        Object.keys(rooms).forEach(rid => {
            const r = rooms[rid];
            if (r.status === 'waiting') {
                count++;
                const btn = document.createElement('button');
                btn.innerText = rid;
                btn.style.cssText = "padding:5px 10px; background:#eff6ff; border:1px solid #3b82f6; border-radius:15px; cursor:pointer; font-weight:bold; color:#1e40af; font-size:0.8rem;";
                btn.onclick = () => {
                    document.getElementById('room-id-input').value = rid;
                    checkLoginValid();
                };
                list.appendChild(btn);
            }
        });

        if (count === 0) {
            list.innerHTML = '<p style="font-size:0.7rem; color:#94a3b8;">Нема соби кои чекаат играчи.</p>';
        }
    });
}

async function joinRoom() {
    // SECURITY: Require authentication
    if (!currentUserUid) {
        showError('Се поврзувам... Обидете се повторно.');
        return;
    }
    // SECURITY: Validate and sanitize all inputs
    const nameValidation = validatePlayerName(document.getElementById('player-name-input').value);
    if (!nameValidation.valid) { showError(nameValidation.error); return; }
    studentName = nameValidation.sanitized;
    studentOdd = (currentRole === 'teacher') ? "Наставник" : sanitizeInput(document.getElementById('player-odd-input').value);

    if (currentRole === 'student') {
        const roomValidation = validateRoomCode(document.getElementById('room-id-input').value);
        if (!roomValidation.valid) { showError(roomValidation.error); return; }
        roomId = roomValidation.sanitized;
    } else {
        let rawRoom = document.getElementById('room-id-input').value.trim().toUpperCase();
        roomId = rawRoom || "ROOM" + Math.floor(1000 + Math.random() * 9000);
    }

    showLoader('Се поврзувам...', 'Влегувам во соба ' + roomId);
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('lobby-section').style.display = 'block';
    document.getElementById('current-room-display').innerText = roomId;

    // PHASE 2: Show tutorial for students on first join
    if (currentRole === 'student') {
        setTimeout(() => showTutorial(), 500);
    }
    
    const roomRef = db.ref('rooms/' + roomId);
    
    roomRef.once('value', snapshot => {
        if (!snapshot.exists()) {
            isCreator = true;
            const diffLevel = document.getElementById('room-difficulty-select').value;
            roomRef.set({
                status: 'waiting',
                players: [],
                currentPlayerIndex: 0,
                remainingTime: 40 * 60,
                gameEndTime: getServerTime() + (40 * 60 * 1000),
                turnStartTime: getServerTime(),
                difficultyMode: diffLevel,
                teacherUid: currentUserUid,
                gameBoard: boardConfig.map((c, i) => {
                    let diff = (i < 5) ? 1 : (i < 15) ? 2 : 3;
                    if (hardProperties.includes(i)) diff = 3;
                    return { ...c, index: i, owner: null, buildings: 0, price: 150 + (i * 40), difficulty: diff, rentPercent: 10 * diff };
                })
            });
        }
        
        const playersRef = roomRef.child('players');
        playersRef.once('value', pSnap => {
            const currentPlayers = pSnap.val() || [];
            
            if (currentRole === 'teacher') {
                myPlayerId = -1; // Teacher is a spectator
                roomRef.update({ teacherName: studentName, teacherUid: currentUserUid });
                
                // Track created rooms for teacher
                let myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
                if (!myRooms.includes(roomId)) {
                    myRooms.push(roomId);
                    localStorage.setItem('percentopolis_teacher_rooms', JSON.stringify(myRooms));
                }
                showTeacherRoomList();
            } else {
                // Check for existing session (reconnection)
                let existingPid = -1;
                currentPlayers.forEach((p, idx) => {
                    if (p && p.uid === currentUserUid) existingPid = idx;
                });

                if (existingPid !== -1) {
                    myPlayerId = existingPid;
                    const pData = currentPlayers[existingPid];
                    studentCorrect = pData.correct || 0;
                    studentWrong = pData.wrong || 0;
                } else {
                    if (currentPlayers.length >= 6) {
                        showError("Собата е полна!");
                        setTimeout(() => location.reload(), 2000);
                        return;
                    }
                    myPlayerId = currentPlayers.length;
                    const newPlayer = {
                        id: myPlayerId,
                        uid: currentUserUid,
                        name: studentName,
                        odd: studentOdd,
                        role: 'student',
                        money: 1000,
                        pos: 0,
                        streak: 0,
                        emoji: myTokenEmoji,
                        color: `var(--p${myPlayerId}-color)`,
                        powerups: { lawyer: false, shield: false, nitro: false, bribe: false },
                        hasLoan: false,
                        jailTurns: 0
                    };
                    playersRef.child(myPlayerId).set(newPlayer);
                }
            }

            // Save session
            localStorage.setItem('percentopolis_session', JSON.stringify({
                name: studentName,
                roomId: roomId,
                playerId: myPlayerId,
                role: currentRole,
                uid: currentUserUid
            }));

            hideLoader();
            roomRef.off('value', handleRoomUpdate); // Prevent duplicate listeners
            roomRef.on('value', handleRoomUpdate);
            listenForTradeOffers();
        });
    });
}

function showTeacherRoomList() {
    if (currentRole !== 'teacher') return;
    const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
    const container = document.getElementById('teacher-rooms-list');
    if (!container) return;
    
    container.innerHTML = '<p style="font-size:0.7rem; color:#64748b; margin-top:10px;">ВАШИ АКТИВНИ СОБИ:</p>';
    myRooms.forEach(rid => {
        const btn = document.createElement('button');
        btn.innerText = rid;
        btn.style.margin = "5px";
        btn.style.padding = "5px 10px";
        btn.style.borderRadius = "15px";
        btn.style.border = (rid === roomId) ? "2px solid #2563eb" : "1px solid #ddd";
        btn.style.background = (rid === roomId) ? "#eff6ff" : "white";
        btn.style.cursor = "pointer";
        btn.onclick = () => {
            document.getElementById('room-id-input').value = rid;
            joinRoom();
        };
        container.appendChild(btn);
    });
}

function handleRoomUpdate(snapshot) {
    const data = snapshot.val();
    if (!data) return;
    
    window.roomDifficultyMode = data.difficultyMode || 'standard';
    players = data.players || [];
    gameBoard = data.gameBoard || [];
    currentPlayerIndex = data.currentPlayerIndex || 0;

    // Update Class Timer UI from gameEndTime (robust sync)
    const classTimerEl = document.getElementById('class-timer');
    if (classTimerEl && data.gameEndTime) {
        if (window.mainGameTicker) clearInterval(window.mainGameTicker);
        window.mainGameTicker = setInterval(() => {
            const serverTimeNow = getServerTime();
            const remMs = data.gameEndTime - serverTimeNow;
            remainingTime = Math.max(0, Math.floor(remMs / 1000));
            
            const m = Math.floor(remainingTime / 60);
            const s = remainingTime % 60;
            classTimerEl.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
            
            if (remainingTime <= 0 && data.status === 'playing') {
                clearInterval(window.mainGameTicker);
                triggerGameOver("Времето истече!");
            }
        }, 1000);
    }
    
    // Turn Timer Logic - FIXED: Always update timer, not just on turnStartTime change
    const updateTimerDisplay = () => {
        const serverTimeNow = getServerTime();

        // Ensure turnStartTime is valid and from the server
        if (!data.turnStartTime || data.turnStartTime <= 0 || data.turnStartTime > serverTimeNow + 60000) {
            const timerEl = document.getElementById('turn-timer');
            if(timerEl) timerEl.innerText = `Подготовка...`;
            return;
        }

        const elapsed = Math.floor((serverTimeNow - data.turnStartTime) / 1000);

        const turnLimit = 30; // Changed from 45s to 30s for faster gameplay
        turnRemainingTime = Math.max(0, turnLimit - elapsed);
        const displayTime = turnRemainingTime;

        const timerEl = document.getElementById('turn-timer');
        if(timerEl) {
            timerEl.innerText = `Потег: ${displayTime}s`;
            if (displayTime <= 5) { timerEl.style.color = '#ef4444'; timerEl.style.fontWeight = '900'; timerEl.style.animation = 'pulse 0.5s ease-in-out infinite'; }
            else if (displayTime <= 10) { timerEl.style.color = '#f59e0b'; timerEl.style.fontWeight = 'bold'; timerEl.style.animation = ''; }
            else { timerEl.style.color = '#3498db'; timerEl.style.fontWeight = 'bold'; timerEl.style.animation = ''; }
        }

        // BUGFIX: Only auto-skip if elapsed >= 30 AND < 35 to prevent race condition
        // This prevents new player from auto-skipping when they see old turnStartTime
        if (turnRemainingTime === 0 && elapsed >= 30 && elapsed < 35 && currentPlayerIndex === myPlayerId && !isRolling && currentRole !== 'teacher') {
            clearInterval(localTurnTicker);
            log("Времето истече! Потегот се префрла.");
            endTurnMulti();
        }
    };

    // Restart timer interval when turn changes
    if (data.turnStartTime && data.turnStartTime !== window.lastTurnStartTime) {
        window.lastTurnStartTime = data.turnStartTime;
        clearInterval(localTurnTicker);
        updateTimerDisplay();
        localTurnTicker = setInterval(updateTimerDisplay, 1000);
    } else if (data.status === 'playing' && !localTurnTicker) {
        // Ensure timer is always running during gameplay
        updateTimerDisplay();
        localTurnTicker = setInterval(updateTimerDisplay, 1000);
    }

    updateLobbyUI();
    
    if (data.status === 'playing' && document.getElementById('login-overlay').style.display !== 'none') {
        initMultiplayerGame();
    }
    
    if (data.status === 'playing') {
        syncGameState();
        // Trigger game over when time is up
        if (remainingTime <= 0) {
            triggerGameOver("Времето истече!");
        }
    }

    // Display emoji if any
    if (data.lastEmoji && data.lastEmoji.timestamp > (Date.now() - 3000)) {
        showEmojiOnToken(data.lastEmoji.pid, data.lastEmoji.emoji);
    }
}

function showEmojiOnToken(pid, emoji) {
    const token = document.getElementById(`token-${pid}`);
    if (!token) return;
    
    // Check if emoji already exists to avoid duplicates
    if (token.querySelector('.emoji-bubble')) return;

    const bubble = document.createElement('div');
    bubble.className = 'emoji-bubble';
    bubble.innerText = emoji;
    bubble.style.position = 'absolute';
    bubble.style.top = '-30px';
    bubble.style.left = '50%';
    bubble.style.transform = 'translateX(-50%)';
    bubble.style.fontSize = '1.5rem';
    bubble.style.animation = 'fadeOutUp 2s forwards';
    token.appendChild(bubble);
    setTimeout(() => { if(bubble.parentElement) bubble.parentElement.removeChild(bubble); }, 2000);
}

function sendEmoji(emoji) {
    if (myPlayerId === null) return;
    db.ref(`rooms/${roomId}/lastEmoji`).set({
        pid: myPlayerId,
        emoji: emoji,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

function updateLobbyUI() {
    const ul = document.getElementById('lobby-players-ul');
    if (!ul) return;
    ul.innerHTML = '';
    players.forEach(p => {
        if (!p) return;
        const li = document.createElement('li');
        li.style.cssText = "background:white; padding:8px 12px; border-radius:10px; border:1px solid #e2e8f0; font-size:0.85rem; display:flex; align-items:center; gap:8px;";
        li.innerHTML = `<span style="font-size:1.2rem;">${p.emoji || '👤'}</span> <span style="font-weight:700; color:#1e293b;">${escapeHtml(p.name)}</span>`;
        ul.appendChild(li);
    });
    
    const startBtn = document.getElementById('start-game-btn-multi');
    const teacherControls = document.getElementById('teacher-lobby-controls');
    
    if (isCreator || currentRole === 'teacher') {
        if (startBtn) startBtn.style.display = isCreator ? 'block' : 'none';
        if (teacherControls) teacherControls.style.display = 'flex';
        
        const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
        document.getElementById('start-all-rooms-btn').style.display = (myRooms.length > 1) ? 'block' : 'none';
        document.getElementById('create-another-btn').style.display = 'block';
        document.getElementById('open-dash-direct-btn').style.display = 'block';
    } else {
        if (startBtn) startBtn.style.display = 'none';
        if (teacherControls) teacherControls.style.display = 'none';
    }
}

async function createMultipleRooms() {
    const count = parseInt(document.getElementById('multi-room-count').value) || 1;
    const name = document.getElementById('player-name-input').value.trim() || "Наставник";
    const diffLevel = document.getElementById('room-difficulty-select').value;

    const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");

    // If there are many old rooms, ask to clear them
    if (myRooms.length > 0) {
        const clearOld = await showConfirmModal("Имате веќе креирано соби. Дали сакате прво да ги ИЗБРИШЕТЕ старите?");
        if (clearOld) {
            myRooms.length = 0;
            localStorage.setItem('percentopolis_teacher_rooms', "[]");
        }
    }

    showSuccess(`⏳ Креирам ${count} нови соби...`);

    for (let i = 1; i <= count; i++) {
        const newRoomId = (100 + i).toString();

        if (!myRooms.includes(newRoomId)) {
            myRooms.push(newRoomId);

            await db.ref('rooms/' + newRoomId).set({
                status: 'waiting',
                players: [],
                currentPlayerIndex: 0,
                gameEndTime: getServerTime() + (40 * 60 * 1000),
                turnStartTime: 0,
                difficultyMode: diffLevel,
                teacherName: name,
                gameBoard: boardConfig.map((c, idx) => {
                    let diff = (idx < 5) ? 1 : (idx < 15) ? 2 : 3;
                    if (hardProperties.includes(idx)) diff = 3;
                    return { ...c, index: idx, owner: null, buildings: 0, price: 150 + (idx * 40), difficulty: diff, rentPercent: 10 * diff };
                })
            });
        }
    }

    localStorage.setItem('percentopolis_teacher_rooms', JSON.stringify(myRooms));
    showTeacherRoomList();
    if (document.getElementById('teacher-modal').style.display === 'flex') openTeacherDash();
    showSuccess("✅ Собите се успешно креирани!");
}

async function clearAllMyRooms() {
    const yes = await showConfirmModal("Дали сте сигурни дека сакате да ги избришете СИТЕ ваши соби од листата?");
    if (!yes) return;
    localStorage.setItem('percentopolis_teacher_rooms', "[]");
    activeDashRoomId = null;
    if (dashRoomListener) {
        db.ref(`rooms`).off();
        dashRoomListener = null;
    }
    openTeacherDash();
    showSuccess("✅ Листата е исчистена.");
}

async function startAllMyRooms() {
    const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
    if (myRooms.length === 0) return;
    
    const yes = await showConfirmModal(`Дали сте сигурни дека сакате да ги стартувате СИТЕ ${myRooms.length} соби одеднаш?`);
    if (!yes) return;

    for (const rid of myRooms) {
        const roomRef = db.ref('rooms/' + rid);
        const snap = await roomRef.once('value');
        const data = snap.val();
        
        if (data && data.status === 'waiting') {
            const players = data.players || [];
            let firstStudent = 0;
            while(players[firstStudent] && players[firstStudent].role !== 'student' && firstStudent < players.length) {
                firstStudent++;
            }
            
            if (players.length > 0) {
                await roomRef.update({ 
                    status: 'playing',
                    currentPlayerIndex: firstStudent, 
                    turnStartTime: firebase.database.ServerValue.TIMESTAMP,
                    gameEndTime: getServerTime() + (40 * 60 * 1000)
                });
            }
        }
    }
    showSuccess("✅ Сите соби со играчи се стартувани!");
}

function requestStartGame() {
    if (!isCreator) return;
    if (players.filter(p => p && p.role === 'student').length === 0) {
        showError("Потребен е барем еден ученик за да започне играта!");
        return;
    }
    
    // Find first valid student index
    let firstStudent = 0;
    while(players[firstStudent] && players[firstStudent].role !== 'student' && firstStudent < players.length) {
        firstStudent++;
    }

    db.ref('rooms/' + roomId).update({ 
        status: 'playing',
        currentPlayerIndex: firstStudent, 
        turnStartTime: firebase.database.ServerValue.TIMESTAMP,
        gameEndTime: getServerTime() + (40 * 60 * 1000)
    });
}

function initMultiplayerGame() {
    AudioController.init();
    document.getElementById('player-display-name').innerText = (currentRole === 'teacher' ? 'Наставник: ' : 'Играч: ') + studentName;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('game-wrapper').classList.remove('blur-filter');
    
    if (isCreator || currentRole === 'teacher') {
        document.getElementById('teacher-dash-btn-fixed').style.display = 'block';
    }

    const statsPanel = document.getElementById('stats-panel-multi');
    statsPanel.innerHTML = '';
    players.filter(p => p).forEach(p => {
        const div = document.createElement('div');
        div.id = `stat-${p.id}`;
        div.className = 'player-stat';
        div.innerHTML = `<span>${escapeHtml(p.name)}</span><span id="score-${p.id}">${p.money}д</span><div id="powerups-${p.id}" class="active-powerups"></div>`;
        statsPanel.appendChild(div);
        
        const t = document.getElementById(`token-${p.id}`);
        if (t) t.style.display = 'flex';
    });
    
    renderBoard();
    updateUI();

    // NOTE: Removed auto-resync - Firebase listeners handle updates automatically
    // Using only Firebase real-time listeners for better performance

    document.getElementById('roll-btn').onclick = playTurnMulti;
}

function syncGameState() {
    updateTokenPositionsMulti();
    updateUI();
    updateBoardVisuals();
    
    const isMyTurn = currentPlayerIndex === myPlayerId;
    document.getElementById('roll-btn').disabled = !isMyTurn || isRolling;
}

function updateTokenPositionsMulti() {
    players.filter(p => p).forEach(p => {
        const t = document.getElementById(`token-${p.id}`);
        if(!t) return;
        
        // Hide teacher token
        if(p.role === 'teacher') {
            t.style.display = 'none';
            return;
        }

        const c = document.getElementById(`cell-${p.pos}`);
        if (!c) return;
        
        t.style.display = 'flex';
        t.innerText = p.emoji || "👤";
        const r = c.getBoundingClientRect();
        const cr = document.getElementById('game-board-container').getBoundingClientRect();
        const offsetX = (p.id % 3) * 8 - 8;
        const offsetY = Math.floor(p.id / 3) * 8 - 8;
        t.style.left = (r.left - cr.left + r.width / 2 - 15 + offsetX) + 'px';
        t.style.top = (r.top - cr.top + r.height / 2 - 15 + offsetY) + 'px';
    });
}

function updateBoardVisuals() {
    gameBoard.forEach((c, i) => {
        if (c.owner !== null) {
            updateVisualOwnership(i, c.owner);
        }
        const bld = document.getElementById(`bld-${i}`);
        if (bld) {
            bld.innerHTML = '🏠'.repeat(c.buildings || 0);
        }
    });
}

async function playTurnMulti(){
    if(myPlayerId === -1 || isRolling || currentPlayerIndex !== myPlayerId) return;
    isRolling = true;
    document.getElementById('roll-btn').disabled = true;

    const p = players[myPlayerId];
    if (!p) { isRolling = false; return; }

    if (p.jailTurns > 0) {
        log(`⏳ ${p.name} е на одмор/затвор. Пропушта потег (Уште ${p.jailTurns}).`);
        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ jailTurns: p.jailTurns - 1 });
        endTurnMulti();
        return;
    }

    const token = document.getElementById(`token-${myPlayerId}`);
    if(token) token.classList.add('walking');

    const roll = await rollDiceAnimation();
    log(`${p.name} фрли ${roll}.`);
    
    let steps = roll;
    if(p.powerups && p.powerups.nitro){
        steps *= 2;
        p.powerups.nitro = false;
        log("🚀 НИТРО! Дупло движење!");
    }

    let passedStart = false;
    for(let k=0; k<steps; k++){
        p.pos = (p.pos + 1) % TOTAL_CELLS;
        if(p.pos === 0) passedStart = true;
        
        // Sync each step to Firebase so others see movement
        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ pos: p.pos });
        
        updateTokenPositionsMulti();
        AudioController.play('step');
        await new Promise(r => setTimeout(r, 450)); // Slightly slower for better visibility
    }
    
    if(token) token.classList.remove('walking');

    // Sync powerups at the end
    db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });

    if(passedStart){
        const b = Math.floor(p.money * 0.15);
        const t = getUniqueTask(0);
        const ok = await askQuestion("СТАРТ БОНУС", `За ${b}д (15%), реши:\n${t.question}`, t.correct_answer, t.options, true, t.explanation);
        if(ok) updateMoneyMulti(myPlayerId, b);
    }

    const c = gameBoard[p.pos];
    if (c) {
        await showLandingCardMulti(p, c);
    }

    endTurnMulti();
}

async function updateMoneyMulti(pid, amt){
    if(pid === -1) return;
    if(amt === 0) return;
    const p = players[pid];
    if (!p) return;
    let newMoney = p.money + amt;
    
    if (newMoney < 0 && pid === myPlayerId) {
        // Step 1: Offer Loan if available
        if (!p.hasLoan) {
            log("⚠️ КРИЗА! Немаш доволно пари. Банката ти нуди КРЕДИТ.");
            const t = getUniqueTask(3);
            const ok = await askQuestion("🏦 БАНКАРСКИ КРЕДИТ", `Реши ја задачата за 1500д кредит, инаку ГУБИШ! \n\n ${t.question}`, t.correct_answer, [], true, t.explanation, t.hint);
            
            if (ok) {
                newMoney += 1500;
                p.money = newMoney;
                p.hasLoan = true;
                await db.ref(`rooms/${roomId}/players/${pid}`).update({ money: newMoney, hasLoan: true });
                log("✅ Кредитот е одобрен!");
            }
        }

        // Step 2: If still in debt, check if has properties to sell
        if (newMoney < 0) {
            const myProps = gameBoard.filter(c => c.owner === pid);
            if (myProps.length > 0) {
                log("⚠️ Сè уште си во минус! Мора да продадеш имот за да преживееш.");
                await showSellPropertyModal(pid, newMoney);
                return; // Modal will handle further logic
            } else {
                // Final Bankruptcy
                db.ref(`rooms/${roomId}/players/${pid}`).update({ money: -1, isEliminated: true });
                triggerGameOver("Банкрот! Немаш повеќе пари ниту имоти.");
                return;
            }
        }
    } else {
        db.ref(`rooms/${roomId}/players/${pid}`).update({ money: newMoney });

        // PHASE 2: Check for rich player achievement
        if (pid === myPlayerId && newMoney >= 1500 && p.money < 1500) {
            triggerCelebration('richPlayer');
        }
    }
    
    AudioController.play('money');
    showFloatingTextMulti(amt, pid);
}

async function showSellPropertyModal(pid, currentDebt) {
    return new Promise(resolve => {
        const o = document.getElementById('card-overlay');
        o.style.display = 'flex';
        o.innerHTML = '';
        
        const myProps = gameBoard.filter(c => c.owner === pid);
        let debt = Math.abs(currentDebt);

        const container = document.createElement('div');
        container.className = 'modal-mini';
        container.style.display = 'block';
        container.style.width = '500px';
        container.innerHTML = `
            <h2 style="color:#e74c3c">🆘 ПРИНУДНА ПРОДАЖБА</h2>
            <p>Ти фалат уште <b>${debt}д</b>. Продај некој од твоите имоти за 50% од цената.</p>
            <div id="sell-list" style="margin:20px 0; max-height:200px; overflow-y:auto; text-align:left;"></div>
        `;

        const list = container.querySelector('#sell-list');
        myProps.forEach(prop => {
            const sellValue = Math.floor(prop.price * 0.5);
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.style.marginBottom = '10px';
            btn.innerHTML = `🏙️ ${prop.name} (Земи ${sellValue}д)`;
            btn.onclick = async () => {
                // Update Firebase: remove owner
                await db.ref(`rooms/${roomId}/gameBoard/${prop.index}`).update({ owner: null, buildings: 0 });
                // Update Local money
                let p = players[pid];
                p.money += sellValue;
                await db.ref(`rooms/${roomId}/players/${pid}`).update({ money: p.money });
                
                log(`💸 Го продаде ${prop.name} за ${sellValue}д.`);
                o.style.display = 'none';
                
                // Recursively check if still in debt
                updateMoneyMulti(pid, 0); 
                resolve();
            };
            list.appendChild(btn);
        });

        o.appendChild(container);
    });
}


function showFloatingTextMulti(amount, pid) {
    if(amount===0)return; const pt=document.getElementById(`token-${pid}`); if(!pt)return;
    const r=pt.getBoundingClientRect(); const t=document.createElement('div'); t.className='floating-text';
    
    if (typeof amount === 'string') {
        t.innerText = amount;
        t.style.color = '#9b59b6'; // Purple for rewards
    } else {
        t.innerText=(amount>0?'+':'')+amount+'д'; t.style.color=amount>0?'#27ae60':'#e74c3c';
    }
    
    t.style.left=r.left+'px'; t.style.top=r.top+'px';
    document.body.appendChild(t); setTimeout(()=>{document.body.removeChild(t);},1500);
}

async function showLandingCardMulti(p, c){
    if (!p || !c) return;
    return new Promise(resolve => {
        const o = document.getElementById('card-overlay');
        o.style.display = 'flex';
        o.innerHTML = '';
        const rc = (res) => { o.style.display = 'none'; resolve(res); };

        // BUGFIX: Prevent accidental closing - only close if explicitly clicking a button
        o.onclick = (e) => {
            // Only allow clicks on the card itself, not the overlay background
            if (e.target === o) {
                e.stopPropagation();
                return false; // Prevent closing when clicking outside
            }
        };
        
        if(c.type === 'chance'){
            const amt = [150, 100, -50, -100, 200][Math.floor(Math.random() * 5)];
            const isPos = amt > 0;
            o.innerHTML = `<div class="flip-card" id="cc"><div class="flip-card-inner"><div class="flip-card-front"><h1>❓</h1><h2>ШАНСА</h2></div><div class="flip-card-back"><h1>${isPos?'💰':'💸'}</h1><h2 style="color:${isPos?'green':'red'}">${isPos?'+':''}${amt}д</h2><button class="action-btn btn-build" id="btc" style="display:none;">${isPos?'Реши за да ДОБИЕШ':'Реши за да ИЗБЕГНЕШ'}</button></div></div></div>`;
            document.getElementById('cc').onclick = async function() {
                this.classList.add('flipped');
                setTimeout(() => {
                    const btc = document.getElementById('btc');
                    if(btc) btc.style.display = 'block';
                    if(btc) btc.onclick = async (e) => {
                        e.stopPropagation();
                        const t = getUniqueTask(1);
                        const ok = await askQuestion("ШАНСА", t.question, t.correct_answer, t.options, true, t.explanation, t.hint);
                        if(ok) updateMoneyMulti(myPlayerId, isPos ? amt : 0);
                        else if(!isPos) updateMoneyMulti(myPlayerId, amt);
                        rc();
                    };
                }, 800);
            };
        } else if(c.type === 'tax'){
            const tax = Math.floor(p.money * 0.1);
            o.innerHTML = `<div class="card-view"><div class="card-header" style="background:#34495e">ДАНOК</div><div class="card-body"><p>Инспекција! Реши ја задачата за да избегнеш 10% данок.</p><h2>Казна: ${tax}д</h2></div><div class="card-actions"><button class="action-btn btn-rent" id="pay-tax-task">РЕШИ ЗАДАЧА</button>${p.powerups.lawyer?'<button class="action-btn btn-buy" id="use-lawyer">АДВОКАТ (⚖️)</button>':''}</div></div>`;
            
            document.getElementById('pay-tax-task').onclick = async () => {
                const t = getUniqueTask(2);
                o.style.display = 'none';
                const ok = await askQuestion("ДАНOЧНА ИНСПЕКЦИЈА", `Реши точно за да не платиш ${tax}д данок!\n\n${t.question}`, t.correct_answer, t.options, true, t.explanation, t.hint);
                if(!ok) {
                    updateMoneyMulti(myPlayerId, -tax);
                    log(`❌ Не ја реши задачата и плати ${tax}д данок.`);
                } else {
                    log(`✅ Ја реши задачата и го избегна данокот!`);
                }
                resolve();
            };
            
            if(p.powerups.lawyer) document.getElementById('use-lawyer').onclick = () => {
                p.powerups.lawyer = false;
                db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                log("⚖️ Адвокатот те спаси од инспекција!");
                rc();
            };
        } else if(c.type === 'jail'){
            o.innerHTML = `<div class="card-view"><div class="card-header" style="background:#7f8c8d">ЗАТВОР / ОДМОР</div><div class="card-body"><p>Одмараш 1 потег.</p></div><div class="card-actions"><button class="action-btn btn-pass" id="jail-ok">ДОБРО</button></div></div>`;
            document.getElementById('jail-ok').onclick = () => {
                db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ jailTurns: 1 });
                rc();
            };
        } else if(c.type === 'property'){
            const rent = Math.floor(c.price * (c.rentPercent / 100));
            if(c.owner == null){ // Matches null and undefined
                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><div class="card-row"><span>Цена:</span><span>${c.price}д</span></div><div class="card-row"><span>Кирија:</span><span>${rent}д</span></div></div><div class="card-actions"><button class="action-btn btn-buy" id="buy-prop">КУПИ (РEШИ ЗАДАЧА)</button><button class="action-btn btn-pass" id="pass-prop">ПОМИНУВАЈ</button></div></div>`;
                document.getElementById('buy-prop').onclick = async () => {
                    const isHard = c.difficulty === 3;
                    const t = getUniqueTask(c.difficulty);
                    // Hide the card overlay immediately to show the question clearly
                    o.style.display = 'none';
                    const ok = await askQuestion("КУПУВАЊЕ", t.question, t.correct_answer, isHard ? [] : t.options, true, t.explanation, t.hint);
                    if(ok){
                        let finalPrice = c.price;
                        if(p.powerups.bribe){ finalPrice = 1; p.powerups.bribe = false; }
                        db.ref(`rooms/${roomId}/gameBoard/${c.index}`).update({ owner: myPlayerId });
                        updateMoneyMulti(myPlayerId, -finalPrice);
                        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                        AudioController.play('success');

                        // PHASE 2: Check if this is first property
                        const myProperties = gameBoard.filter(prop => prop.owner === myPlayerId);
                        const isFirstProperty = myProperties.length === 0; // Will be 1 after update
                        triggerCelebration('propertyPurchased', { isFirst: isFirstProperty });
                    }
                    resolve();
                };
                document.getElementById('pass-prop').onclick = () => rc();
            } else if(c.owner !== myPlayerId){
                const ownerName = (players[c.owner] && players[c.owner].name) ? escapeHtml(players[c.owner].name) : "Противник";
                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><p>Сопственик: ${ownerName}</p><h2>Кирија: ${rent}д</h2></div><div class="card-actions"><button class="action-btn btn-rent" id="pay-rent">ПЛАТИ</button>${p.powerups.shield?'<button class="action-btn btn-buy" id="use-shield">ШТИТ (🛡️)</button>':''}</div></div>`;
                document.getElementById('pay-rent').onclick = async () => {
                    const t = getUniqueTask(c.difficulty);
                    // Hide the card overlay immediately
                    o.style.display = 'none';
                    const ok = await askQuestion("КИРИЈА", `Точен одговор за ${rent}д, инаку ${rent*2}д!\n\n${t.question}`, t.correct_answer, t.options, true, t.explanation, t.hint);
                    const finalRent = ok ? rent : rent * 2;
                    updateMoneyMulti(myPlayerId, -finalRent);
                    updateMoneyMulti(c.owner, finalRent);
                    resolve();
                };
                if(p.powerups.shield) document.getElementById('use-shield').onclick = () => {
                    p.powerups.shield = false;
                    db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                    rc();
                };
            } else {
                const groupProps = gameBoard.filter(prop => prop.group === c.group);
                const ownsAll = groupProps.every(prop => prop.owner === myPlayerId);
                
                let buildActionHtml = '';
                if (c.buildings < 3) {
                    if (ownsAll) {
                        buildActionHtml = `<button class="action-btn btn-build" id="build-btn">ГРАДИ (${Math.floor(c.price*0.4)}д)</button>`;
                    } else {
                        buildActionHtml = `<p style="font-size:0.8rem; color:#e67e22;">⚠️ Потребен е монопол (сите од оваа боја) за градење.</p>`;
                    }
                }

                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><p>Твој имот</p></div><div class="card-actions">${buildActionHtml} <button class="action-btn btn-pass" id="pass-prop">ЗАТВОРИ</button></div></div>`;
                
                const bldBtn = document.getElementById('build-btn');
                if(bldBtn) bldBtn.onclick = async () => {
                    const t = getUniqueTask(3);
                    // Hide the card overlay immediately
                    o.style.display = 'none';
                    const ok = await askQuestion("ГРАДЕЊЕ", t.question, t.correct_answer, [], true, t.explanation, t.hint);
                    if(ok){
                        const cost = Math.floor(c.price * 0.4);
                        db.ref(`rooms/${roomId}/gameBoard/${c.index}`).update({ buildings: c.buildings + 1, rentPercent: c.rentPercent + 15 });
                        updateMoneyMulti(myPlayerId, -cost);
                        AudioController.play('success');
                    }
                    resolve();
                };
                document.getElementById('pass-prop').onclick = () => rc();
            }
        } else rc();

        // Safety fallback: if nothing was rendered in 500ms, close overlay
        setTimeout(() => { if(o.innerHTML === '') rc(); }, 500);
    });
}

function endTurnMulti(){
    isRolling = false;
    if (players.length === 0) return;
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Skip null/undefined players, teachers, and eliminated players in turn rotation
    let safety = 0;
    while((!players[nextPlayerIndex] || players[nextPlayerIndex].role === 'teacher' || players[nextPlayerIndex].isEliminated) && safety < 10){
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
        safety++;
    }

    // Double check if we landed on a valid student player who is not eliminated
    if (players[nextPlayerIndex] && players[nextPlayerIndex].role !== 'teacher' && !players[nextPlayerIndex].isEliminated) {
        db.ref(`rooms/${roomId}`).update({ 
            currentPlayerIndex: nextPlayerIndex,
            turnStartTime: firebase.database.ServerValue.TIMESTAMP 
        });
    }
}

function updateUI(){
    players.forEach(p => {
        if (!p) return;
        const statEl = document.getElementById(`stat-${p.id}`);
        if(statEl){
            // Hide teacher from stats or show differently
            if(p.role === 'teacher') statEl.style.display = 'none';
            else {
                statEl.style.display = 'flex';
                const scoreEl = document.getElementById(`score-${p.id}`);
                if(scoreEl) scoreEl.innerText = `${p.money}д`;
                
                if(currentPlayerIndex === p.id) statEl.classList.add('active-turn');
                else statEl.classList.remove('active-turn');
                
                if(p.isThinking) statEl.style.borderRight = "4px solid #f1c40f";
                else statEl.style.borderRight = "none";
            }
        }
        
        const powerupsEl = document.getElementById(`powerups-${p.id}`);
        if(powerupsEl){
            powerupsEl.innerHTML = '';
            if(p.powerups.lawyer) powerupsEl.innerHTML += '⚖️';
            if(p.powerups.shield) powerupsEl.innerHTML += '🛡️';
            if(p.powerups.nitro) powerupsEl.innerHTML += '🚀';
            if(p.powerups.bribe) powerupsEl.innerHTML += '🕵️';
        }
    });
}

function openShop() { 
    if(currentPlayerIndex !== myPlayerId || isRolling) return; 
    document.getElementById('shop-modal').style.display='flex'; 
}

let activeDashRoomId = null;
let dashRoomListener = null;
let gridListeners = {}; // Track grid view listeners for cleanup

function closeTeacherDash() {
    // Hide the modal completely
    const modal = document.getElementById('teacher-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Remove blur from game wrapper
    const gameWrapper = document.getElementById('game-wrapper');
    if (gameWrapper) {
        gameWrapper.classList.remove('blur-filter');
    }

    // Remove any overlay blocking elements
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        if (overlay.id !== 'teacher-modal') {
            overlay.style.display = 'none';
        }
    });

    // Re-enable body scrolling and interaction
    document.body.style.overflow = 'auto';
    document.body.style.pointerEvents = 'auto';

    // Clear backdrop filters on known elements (targeted, not global)
    const boardCenter = document.getElementById('board-center');
    if (boardCenter) {
        boardCenter.style.backdropFilter = '';
        boardCenter.style.webkitBackdropFilter = '';
    }

    // Ensure the reopen button is visible
    const reopenBtn = document.getElementById('teacher-dash-btn-fixed');
    if (reopenBtn) {
        reopenBtn.style.display = 'block';
    }
}

function switchDashTab(tabName) {
    // Hide all panels
    document.querySelectorAll('.dash-tab-panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
    // Deactivate all tabs
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    // Show selected panel and activate tab
    const panel = document.getElementById('dash-panel-' + tabName);
    const tab = document.getElementById('dash-tab-' + tabName);
    if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
    if (tab) tab.classList.add('active');
}

function openTeacherDash() {
    const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
    const list = document.getElementById('dash-rooms-list');
    list.innerHTML = '';

    if (myRooms.length === 0) {
        // Show empty state with create room prompt
        list.innerHTML = `
            <div style="padding:40px 20px; text-align:center; color:#94a3b8;">
                <div style="font-size:3rem; margin-bottom:15px;">📚</div>
                <h3 style="color:#475569; margin:0 0 10px 0;">Нема креирани соби</h3>
                <p style="font-size:0.8rem; margin:0; line-height:1.5;">Креирајте ваша прва соба за да почнете<br>да следите напредок на учениците.</p>
            </div>
        `;
        document.getElementById('teacher-modal').style.display = 'flex';
        showCreateRoomInterface();
        return;
    }

    myRooms.forEach(rid => {
        const btn = document.createElement('div');
        btn.className = 'dash-room-item';
        btn.style.cssText = `
            padding: 15px; margin-bottom: 10px; border-radius: 12px; cursor: pointer;
            background: ${rid === activeDashRoomId ? '#3b82f6' : 'rgba(255,255,255,0.05)'};
            transition: 0.2s; border: 1px solid ${rid === activeDashRoomId ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
        `;
        btn.innerHTML = `
            <div style="font-weight:bold; font-size:0.9rem;">${rid}</div>
            <div id="dash-status-${rid}" style="font-size:0.7rem; color:${rid === activeDashRoomId ? '#dbeafe' : '#94a3b8'};">Проверувам...</div>
        `;
        btn.onclick = () => switchDashRoom(rid);
        list.appendChild(btn);

        // Quick status preview
        db.ref(`rooms/${rid}/status`).once('value', s => {
            const statusEl = document.getElementById(`dash-status-${rid}`);
            if (statusEl) statusEl.innerText = s.val() === 'playing' ? '🟢 ВО ТЕК' : '🟡 ЧЕКАЊЕ';
        });
    });

    if (!activeDashRoomId && myRooms.length > 0) {
        switchDashRoom(myRooms[0]);
    }

    const modal = document.getElementById('teacher-modal');
    modal.style.display = 'flex';

    // Ensure proper modal display
    document.body.style.overflow = 'hidden';
}

function showCreateRoomInterface() {
    // BUGFIX: Clear active room and stop listening to previous room
    if (dashRoomListener && activeDashRoomId) {
        db.ref(`rooms/${activeDashRoomId}`).off('value', dashRoomListener);
        dashRoomListener = null;
    }
    activeDashRoomId = null;

    // Hide all other views, show create container
    document.getElementById('dash-single-room-container').style.display = 'none';
    document.getElementById('dash-grid-container').style.display = 'none';
    document.getElementById('dash-back-to-list').style.display = 'none';

    // Update UI
    document.getElementById('dash-active-room-title').innerText = 'КРЕИРАЈ НОВА СОБА';
    document.getElementById('dash-start-btn').style.display = 'none';
    document.getElementById('dash-download-btn').style.display = 'none';

    // Deselect all room buttons in sidebar
    document.querySelectorAll('.dash-room-item').forEach(el => {
        el.style.background = 'rgba(255,255,255,0.05)';
        el.style.borderColor = 'rgba(255,255,255,0.1)';
    });

    // Get next room number for preview
    const nextRoomNum = (parseInt(localStorage.getItem('percentopolis_room_counter') || '100') + 1).toString();

    const container = document.getElementById('dash-create-room-container');
    container.style.display = 'block';
    container.innerHTML = `
        <div style="max-width:750px; margin:0 auto; padding:25px; background:white; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <h2 style="margin:0 0 8px 0; color:#1e293b; font-size:1.6rem;">✨ Креирај нова соба</h2>
            <p style="color:#64748b; margin:0 0 20px 0; font-size:0.9rem;">Следната соба ќе биде: <strong style="color:#8b5cf6; font-size:1.1rem;">${nextRoomNum}</strong></p>

            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:700; margin-bottom:6px; color:#475569; font-size:0.9rem;">📊 Тежина:</label>
                <select id="new-room-difficulty" style="width:100%; padding:10px; border:2px solid #e2e8f0; border-radius:8px; font-size:0.95rem;">
                    <option value="easy">ЛЕСНО</option>
                    <option value="standard" selected>СТАНДАРДНО</option>
                    <option value="hard">НАПРЕДНО</option>
                </select>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button onclick="createSingleRoom()" style="flex:1; padding:14px; background:#8b5cf6; color:white; border:none; border-radius:10px; font-weight:800; cursor:pointer; font-size:0.95rem;">🚀 КРЕИРАЈ СОБА ${nextRoomNum}</button>
            </div>

            <div style="padding-top:20px; border-top:1px solid #e2e8f0;">
                <p style="font-size:0.85rem; color:#64748b; margin:0 0 10px 0; font-weight:600;">Или креирај повеќе соби одеднаш:</p>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="number" id="dash-multi-room-count" value="4" min="1" max="10" style="width:80px; padding:10px; border:2px solid #e2e8f0; border-radius:8px;">
                    <button onclick="createMultipleRoomsFromDash()" style="flex:1; padding:11px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">⚡ КРЕИРАЈ ПОВЕЌЕ</button>
                </div>
            </div>
        </div>
    `;
}

// Restore tab view when switching from create-room back to a room
function restoreDashTabs() {
    document.getElementById('dash-create-room-container').style.display = 'none';
    document.getElementById('dash-single-room-container').style.display = 'block';
}

function switchDashRoom(rid) {
    // Detach old listener BEFORE changing activeDashRoomId
    if (dashRoomListener && activeDashRoomId) {
        db.ref(`rooms/${activeDashRoomId}`).off('value', dashRoomListener);
        dashRoomListener = null;
    }

    activeDashRoomId = rid;
    toggleGridView(false); // Ensure we show single room view when switching from sidebar

    // UI update for sidebar
    document.querySelectorAll('.dash-room-item').forEach(el => {
        const isSelected = el.innerText.includes(rid);
        el.style.background = isSelected ? '#3b82f6' : 'rgba(255,255,255,0.05)';
        el.style.borderColor = isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)';
    });

    document.getElementById('dash-active-room-title').innerText = `СОБА: ${rid}`;

    // Restore tab structure if it was replaced by create room interface
    restoreDashTabs();

    dashRoomListener = db.ref(`rooms/${rid}`).on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;

        updateDashStats(data);
    });
}

function toggleGridView(showGrid) {
    const single = document.getElementById('dash-single-room-container');
    const grid = document.getElementById('dash-grid-container');
    const create = document.getElementById('dash-create-room-container');
    const backBtn = document.getElementById('dash-back-to-list');
    const title = document.getElementById('dash-active-room-title');

    if (showGrid) {
        single.style.display = 'none';
        grid.style.display = 'grid';
        create.style.display = 'none';
        backBtn.style.display = 'block';
        title.innerText = "ПРЕГЛЕД НА СИТЕ СОБИ";
        renderDashGrid();
    } else {
        // Clean up grid listeners when switching back to single view
        Object.keys(gridListeners).forEach(rid => {
            db.ref(`rooms/${rid}`).off('value', gridListeners[rid]);
        });
        gridListeners = {};

        single.style.display = 'block';
        grid.style.display = 'none';
        create.style.display = 'none';
        backBtn.style.display = 'none';
        if (activeDashRoomId) title.innerText = `СОБА: ${activeDashRoomId}`;
    }
}

function renderDashGrid() {
    const container = document.getElementById('dash-grid-container');
    container.innerHTML = '';

    // Clean up old listeners before creating new ones
    Object.keys(gridListeners).forEach(rid => {
        db.ref(`rooms/${rid}`).off('value', gridListeners[rid]);
    });
    gridListeners = {};

    const myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");

    myRooms.forEach(rid => {
        const card = document.createElement('div');
        card.style.cssText = "background:white; border-radius:15px; padding:20px; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.02); cursor:pointer;";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <h3 style="margin:0; font-size:1.5rem; font-weight:900;">${rid}</h3>
                <span id="grid-status-${rid}" style="font-size:0.7rem; font-weight:bold; padding:4px 10px; border-radius:10px;">...</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div style="background:#f8fafc; padding:10px; border-radius:10px; text-align:center;">
                    <div style="font-size:0.7rem; color:#64748b;">УЧЕНИЦИ</div>
                    <div id="grid-players-${rid}" style="font-size:1.2rem; font-weight:bold;">0</div>
                </div>
                <div style="background:#f8fafc; padding:10px; border-radius:10px; text-align:center;">
                    <div style="font-size:0.7rem; color:#64748b;">УСПЕШНОСТ</div>
                    <div id="grid-success-${rid}" style="font-size:1.2rem; font-weight:bold;">0%</div>
                </div>
            </div>
            <button style="width:100%; margin-top:15px; padding:10px; background:#f1f5f9; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">ДЕТАЛИ ➡️</button>
        `;
        card.onclick = () => switchDashRoom(rid);
        container.appendChild(card);

        // Listen for live updates on this card - STORE reference for cleanup
        const listener = snap => {
            const data = snap.val();
            if (!data) return;
            const players = (data.players || []).filter(p => p && p.role !== 'teacher');
            const totalCorrect = players.reduce((sum, p) => sum + (p.correct || 0), 0);
            const totalAttempted = players.reduce((sum, p) => sum + (p.correct || 0) + (p.wrong || 0), 0);
            const success = totalAttempted === 0 ? 0 : Math.round((totalCorrect / totalAttempted) * 100);
            
            const statusEl = document.getElementById(`grid-status-${rid}`);
            if (statusEl) {
                statusEl.innerText = data.status === 'playing' ? 'АКТИВНА' : 'ЧЕКАЊЕ';
                statusEl.style.background = data.status === 'playing' ? '#dcfce7' : '#fef3c7';
                statusEl.style.color = data.status === 'playing' ? '#166534' : '#92400e';
            }
            const playersEl = document.getElementById(`grid-players-${rid}`);
            if (playersEl) playersEl.innerText = players.length;
            const successEl = document.getElementById(`grid-success-${rid}`);
            if (successEl) successEl.innerText = success + '%';
        };

        // Store listener reference and attach it
        gridListeners[rid] = listener;
        db.ref(`rooms/${rid}`).on('value', listener);
    });
}

function updateDashStats(data) {
    const tbody = document.getElementById('teacher-stats-tbody');
    const emptyState = document.getElementById('dash-empty-state');
    const players = data.players || [];
    const statusText = document.getElementById('dash-room-status');
    const startBtn = document.getElementById('dash-start-btn');
    const downloadBtn = document.getElementById('dash-download-btn');

    statusText.innerText = data.status === 'playing' ? '🟢 Активна игра' : '🟡 Во исчекување на ученици';
    startBtn.style.display = (data.status === 'waiting') ? 'block' : 'none';

    // Store data globally for report generation
    window.lastDashData = data;
    downloadBtn.style.display = (players.length > 0) ? 'block' : 'none';

    startBtn.onclick = () => {
        let firstStudent = 0;
        while(players[firstStudent] && players[firstStudent].role !== 'student' && firstStudent < players.length) {
            firstStudent++;
        }
        db.ref(`rooms/${activeDashRoomId}`).update({ 
            status: 'playing',
            currentPlayerIndex: firstStudent, 
            turnStartTime: firebase.database.ServerValue.TIMESTAMP,
            gameEndTime: getServerTime() + (40 * 60 * 1000)
        });
    };

    tbody.innerHTML = '';
    let totalCorrect = 0, totalAttempted = 0, activePlayers = 0;

    const filteredPlayers = players.filter(p => p && p.role !== 'teacher');
    
    if (filteredPlayers.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('dash-player-count').innerText = "0";
        document.getElementById('dash-total-correct').innerText = "0";
        document.getElementById('dash-avg-success').innerText = "0%";
        return;
    }

    emptyState.style.display = 'none';

    filteredPlayers.forEach(p => {
        activePlayers++;
        totalCorrect += (p.correct || 0);
        totalAttempted += (p.correct || 0) + (p.wrong || 0);

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        const successRate = ((p.correct || 0) + (p.wrong || 0)) === 0 ? 0 : Math.round((p.correct / (p.correct + p.wrong)) * 100);

        // PHASE 2: Enhanced Analytics - Performance color coding
        let performanceColor = '#ef4444'; // Red (struggling)
        let performanceLabel = 'Потреба од помош';
        let performanceIcon = '⚠️';

        if (successRate >= 75) {
            performanceColor = '#10b981'; // Green (excellent)
            performanceLabel = 'Одличен';
            performanceIcon = '⭐';
        } else if (successRate >= 50) {
            performanceColor = '#fbbf24'; // Yellow (good)
            performanceLabel = 'Добар';
            performanceIcon = '👍';
        }

        // PHASE 2: Streak badge
        const streakBadge = (p.streak && p.streak >= 3) ?
            `<span style="margin-left:8px; padding:3px 8px; background:#fbbf24; color:#78350f; border-radius:12px; font-size:0.65rem; font-weight:900;">🔥 ${p.streak} ПО РЕД</span>` : '';

        tr.innerHTML = `
            <td style="padding:12px 14px;">
                <div style="font-weight:700; color:#1e293b; font-size:0.9rem;">${p.emoji || '👤'} ${escapeHtml(p.name)}${streakBadge}</div>
                <div style="font-size:0.7rem; color:#64748b;">${escapeHtml(p.odd)}</div>
            </td>
            <td style="padding:12px 14px;">
                <div style="font-weight:800; color:#2563eb; font-size:1rem;">${p.money}д</div>
                <div style="font-size:0.65rem; color:#64748b; margin-top:2px;">
                    ${p.money >= 1500 ? '💰 Богат' : p.money < 500 ? '⚠️ Криза' : '📊 Стабилен'}
                </div>
            </td>
            <td style="padding:12px 14px;">
                <div>
                    <span style="color:#10b981; font-weight:bold; font-size:1rem;">${p.correct || 0}</span> /
                    <span style="color:#ef4444; font-weight:bold; font-size:1rem;">${p.wrong || 0}</span>
                </div>
                <div style="background:#f1f5f9; height:6px; border-radius:10px; overflow:hidden; margin-top:4px;">
                    <div style="width:${successRate}%; height:100%; background:${performanceColor}; transition:width 0.3s ease;"></div>
                </div>
                <div style="font-size:0.65rem; color:#64748b; margin-top:3px;">${performanceIcon} ${successRate}%</div>
            </td>
            <td style="padding:12px 14px; font-size:0.75rem; color:#475569; max-width:160px;">
                ${p.lastActivity || '---'}
            </td>
            <td style="padding:12px 14px;">
                <span style="padding:5px 12px; border-radius:16px; font-size:0.7rem; font-weight:800; background:${p.isThinking?'#fef3c7':'#dcfce7'}; color:${p.isThinking?'#92400e':'#166534'}; display:inline-block;">
                    ${p.isThinking ? '🤔 РАЗМИСЛУВА' : '✅ ПОДГОТВЕН'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('dash-player-count').innerText = activePlayers;
    document.getElementById('dash-total-correct').innerText = totalCorrect;
    document.getElementById('dash-avg-success').innerText = totalAttempted === 0 ? '0%' : Math.round((totalCorrect / totalAttempted) * 100) + '%';

    // Update visualization panel for any room with data
    if (filteredPlayers.length > 0) {
        updateDashVisualizations(data, filteredPlayers);
    }
}

function updateDashVisualizations(data, players) {
    // 1. Live Game Status
    const gameEndTime = data.gameEndTime || 0;
    const serverTime = getServerTime();
    const remainingMs = Math.max(0, gameEndTime - serverTime);
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);
    document.getElementById('dash-viz-time-left').innerText = data.status === 'playing' ? `${remainingMin}:${remainingSec.toString().padStart(2, '0')}` : 'Чекање';

    const allPlayers = data.players || [];
    const currentPlayer = allPlayers[data.currentPlayerIndex];
    document.getElementById('dash-viz-current-player').innerText = currentPlayer ? `${currentPlayer.emoji || '👤'} ${currentPlayer.name}` : '---';

    const totalMoves = players.reduce((sum, p) => sum + (p.correct || 0) + (p.wrong || 0), 0);
    document.getElementById('dash-viz-total-moves').innerText = totalMoves;

    if (data.turnStartTime && data.status === 'playing') {
        const turnElapsed = Math.floor((serverTime - data.turnStartTime) / 1000);
        const turnRemaining = Math.max(0, 30 - turnElapsed);
        document.getElementById('dash-viz-turn-time').innerText = `${turnRemaining}s`;
    } else {
        document.getElementById('dash-viz-turn-time').innerText = '--';
    }

    // 2. Money Distribution Chart
    const validPlayers = players.filter(p => p && p.role !== 'teacher');
    const maxMoney = Math.max(...validPlayers.map(p => p.money || 0), 1);
    const moneyChart = document.getElementById('dash-viz-money-chart');
    moneyChart.innerHTML = validPlayers.map(p => {
        const percentage = ((p.money || 0) / maxMoney) * 100;
        return `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="min-width:120px; font-weight:700; font-size:0.85rem; color:#475569;">${p.emoji || '👤'} ${escapeHtml(p.name)}</div>
                <div style="flex:1; background:#f1f5f9; height:30px; border-radius:10px; overflow:hidden; position:relative;">
                    <div style="width:${percentage}%; height:100%; background:linear-gradient(90deg, #3b82f6, #8b5cf6); transition:width 0.5s ease; display:flex; align-items:center; justify-content:flex-end; padding:0 10px;">
                        <span style="color:white; font-weight:900; font-size:0.75rem;">${p.money}д</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 3. Property Ownership
    const gameBoard = data.gameBoard || [];
    const propertyCount = {};
    validPlayers.forEach(p => { propertyCount[p.id] = 0; });
    gameBoard.forEach(cell => {
        if (cell.owner !== null && propertyCount[cell.owner] !== undefined) {
            propertyCount[cell.owner]++;
        }
    });

    const propertiesDiv = document.getElementById('dash-viz-properties');
    propertiesDiv.innerHTML = validPlayers.map(p => {
        const count = propertyCount[p.id] || 0;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f8fafc; border-radius:8px;">
                <span style="font-weight:700; color:#475569;">${p.emoji || '👤'} ${escapeHtml(p.name)}</span>
                <span style="background:#3b82f6; color:white; padding:5px 12px; border-radius:12px; font-weight:900; font-size:0.85rem;">${count} 🏠</span>
            </div>
        `;
    }).join('');

    // 4. Question Difficulty Breakdown
    const diffStats = { easy: { correct: 0, wrong: 0 }, medium: { correct: 0, wrong: 0 }, hard: { correct: 0, wrong: 0 } };
    validPlayers.forEach(p => {
        if (p.difficultyStats) {
            Object.keys(p.difficultyStats).forEach(level => {
                const stats = p.difficultyStats[level];
                if (diffStats[level]) {
                    diffStats[level].correct += (stats.correct || 0);
                    diffStats[level].wrong += (stats.wrong || 0);
                }
            });
        }
    });

    const difficultyDiv = document.getElementById('dash-viz-difficulty');
    const diffLabels = { easy: 'Лесно', medium: 'Средно', hard: 'Тешко' };
    const diffColors = { easy: '#10b981', medium: '#fbbf24', hard: '#ef4444' };
    difficultyDiv.innerHTML = Object.keys(diffStats).map(level => {
        const total = diffStats[level].correct + diffStats[level].wrong;
        const successRate = total === 0 ? 0 : Math.round((diffStats[level].correct / total) * 100);
        return `
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-weight:700; color:#475569; font-size:0.85rem;">${diffLabels[level]}</span>
                    <span style="font-weight:800; color:${diffColors[level]};">${successRate}%</span>
                </div>
                <div style="background:#f1f5f9; height:10px; border-radius:10px; overflow:hidden;">
                    <div style="width:${successRate}%; height:100%; background:${diffColors[level]}; transition:width 0.3s ease;"></div>
                </div>
                <div style="font-size:0.7rem; color:#64748b; margin-top:3px;">${diffStats[level].correct} точни / ${diffStats[level].wrong} грешни</div>
            </div>
        `;
    }).join('');
}

function downloadRoomReport() {
    const data = window.lastDashData;
    if (!data || !data.players) return;
    
    const rid = activeDashRoomId || "room";
    let csv = "Ученик,Одделение,Богатство,Точни,Грешни,Успех %\n";
    
    data.players.filter(p => p && p.role !== 'teacher').forEach(p => {
        const success = ((p.correct || 0) + (p.wrong || 0)) === 0 ? 0 : Math.round((p.correct / (p.correct + p.wrong)) * 100);
        csv += `"${p.name}","${p.odd}","${p.money}д","${p.correct || 0}","${p.wrong || 0}","${success}%"\n`;
    });
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Procentopolis_Izvestaj_${rid}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function buyItem(type,cost) {
    if(myPlayerId === -1) return;
    const p=players[myPlayerId];
    if(!p) return;
    if(p.money<cost) { showError("Немаш доволно пари!"); return; }
    p.powerups[type]=true;
    updateMoneyMulti(myPlayerId, -cost);
    db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
    document.getElementById('shop-modal').style.display='none';

    // PHASE 2: Trigger shop purchase achievement
    triggerCelebration('shopPurchase');
}

function getUniqueTask(diff){
    const roomRef = db.ref(`rooms/${roomId}`);
    let finalDiff = diff || 1;

    // Shift difficulty based on room mode
    // We need to check if we have the difficultyMode globally or fetch it
    // For simplicity, we'll use a global roomDifficulty variable updated in handleRoomUpdate
    if (window.roomDifficultyMode === 'easy') {
        finalDiff = Math.max(1, finalDiff - 1);
    } else if (window.roomDifficultyMode === 'hard') {
        finalDiff = Math.min(3, finalDiff + 1);
    }

    let filtered = allTasks.filter(t => t.difficulty === finalDiff && !usedQuestionIds.includes(t.id));
    if(filtered.length === 0){ usedQuestionIds = []; filtered = allTasks.filter(t => t.difficulty === finalDiff); }
    const t = filtered[Math.floor(Math.random()*filtered.length)];
    usedQuestionIds.push(t.id);
    return t;
}

function askQuestion(cat, q, ans, opts, isAdaptive, expl, hint){
    return new Promise(resolve=>{
        // BUGFIX: Mark question as active to prevent accidental closing
        isQuestionActive = true;

        // Hide card-overlay to prevent covering the question
        document.getElementById('card-overlay').style.display = 'none';

        const m=document.getElementById('question-modal'); m.style.display='flex';
        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ isThinking: true });
        
        // Fix for whiteboard size on open
        setTimeout(resizeCanvas, 100);

        document.getElementById('modal-category').innerText=cat;
        document.getElementById('question-text').innerText=q;
        const oc=document.getElementById('options-container'); oc.innerHTML='';
        const ic=document.getElementById('input-answer-container'); ic.style.display='none';
        const fa=document.getElementById('feedback-area'); fa.innerText='';
        currentTaskData = { q, ans, expl, hint };

        // PHASE 2: Track answer time for speed achievement
        answerTimeStart = Date.now();

        const finalize = (res) => {
            const p = players[myPlayerId];
            const updates = { isThinking: false };
            if (res) {
                studentCorrect++;
                updates.correct = studentCorrect;
                p.streak = (p.streak || 0) + 1;
                updates.streak = p.streak;

                // PHASE 2: Trigger correct answer celebration
                triggerCelebration('correctAnswer');

                // PHASE 2: Check for streak achievements
                if (p.streak === 3 || p.streak === 5) {
                    triggerCelebration('streak', { count: p.streak });
                }

                // STREAK REWARD: Every 3 correct answers
                if (p.streak > 0 && p.streak % 3 === 0) {
                    const rewards = ['lawyer', 'shield', 'nitro'];
                    const chosen = rewards[Math.floor(Math.random() * rewards.length)];
                    p.powerups[chosen] = true;
                    updates.powerups = p.powerups;

                    const emojiMap = { lawyer: '⚖️ Адвокат', shield: '🛡️ Штит', nitro: '🚀 Нитро' };
                    log(`🔥 БРАВО! ${p.streak} по ред точно! Доби награда: ${emojiMap[chosen]}`);
                    showSuccess(`🔥 ${p.streak} точни по ред! Награда: ${emojiMap[chosen]}`);
                    showFloatingTextMulti(`+${emojiMap[chosen].split(' ')[0]}`, myPlayerId);
                }
            } else {
                studentWrong++;
                updates.wrong = studentWrong;
                p.streak = 0;
                updates.streak = 0;

                // PHASE 2: Trigger wrong answer (no celebration)
                triggerCelebration('wrongAnswer');
            }
            updates.lastActivity = (res ? "Точно: " : "Грешно: ") + q;

            db.ref(`rooms/${roomId}/players/${myPlayerId}`).update(updates);
            m.style.display='none';
            isQuestionActive = false; // BUGFIX: Allow closing after answer is submitted
            resolve(res);
        };

        if(opts && opts.length>0){
            opts.forEach(o=>{
                const b=document.createElement('button'); b.className='option-btn'; b.innerText=o;
                b.onclick=()=>{
                    const isCorrect = o === ans;
                    if(isCorrect){ b.classList.add('correct-answer'); AudioController.play('success'); triggerConfetti(); }
                    else { b.classList.add('wrong-answer'); AudioController.play('failure'); }
                    fa.innerText = isCorrect ? "ТОЧНО! ✅" : `ГРЕШКА! ❌ Точниот одговор е ${ans}.`;
                    fa.style.color = isCorrect ? "green" : "red";
                    sendLiveUpdate(q, o, isCorrect);
                    setTimeout(()=>{ finalize(isCorrect); }, 2000);
                };
                oc.appendChild(b);
            });
        } else {
            ic.style.display='flex';
            const manualInput = document.getElementById('manual-answer-input');
            manualInput.value='';
            manualInput.focus();
            const submitAnswer = ()=>{
                const val = manualInput.value.trim();
                const isCorrect = val === ans;
                if(isCorrect){ AudioController.play('success'); triggerConfetti(); }
                else { AudioController.play('failure'); }
                fa.innerText = isCorrect ? "ТОЧНО! ✅" : `ГРЕШКА! ❌ Точниот одговор е ${ans}.`;
                fa.style.color = isCorrect ? "green" : "red";
                sendLiveUpdate(q, val, isCorrect);
                setTimeout(()=>{ finalize(isCorrect); }, 2000);
            };
            document.getElementById('submit-answer-btn').onclick = submitAnswer;
            manualInput.onkeypress = (e) => { if (e.key === 'Enter') submitAnswer(); };
        }
    });
}

function drawVisualHint(){
    if(!currentTaskData || !currentTaskData.hint) return;
    const fa=document.getElementById('feedback-area');
    fa.innerHTML = `<div style="background:#fff3cd; padding:10px; border-radius:10px; border:1px solid #ffeeba; font-size:0.9rem; margin-bottom:10px;">${currentTaskData.hint}</div>`;
}

// BUGFIX: Prevent accidental closing of question modal during gameplay
let isQuestionActive = false;
function closeModal(){
    // Prevent closing if a question is active (would cause game to freeze)
    if (isQuestionActive) {
        showWarning('⚠️ Мораш да одговориш на прашањето! Не може да затвориш.');
        return;
    }
    document.getElementById('question-modal').style.display='none';
}
function log(msg){const l=document.getElementById('game-log'); if(!l) return; const n=document.createElement('div'); n.innerText='> '+msg; l.prepend(n);}
function updateVisualOwnership(idx,pid){const e=document.getElementById(`cell-${idx}`); if(e){e.classList.remove('owned-p0','owned-p1','owned-p2','owned-p3','owned-p4','owned-p5'); e.classList.add(`owned-p${pid}`);}}

function triggerGameOver(r){
    clearInterval(timerInterval);
    clearInterval(localTurnTicker);
    if (window.mainGameTicker) clearInterval(window.mainGameTicker);
    document.getElementById('game-over-overlay').style.display='flex'; 
    
    if (myPlayerId === -1) {
        let summary = "КРАЈНИ РЕЗУЛТАТИ:\n\n";
        players.forEach(p => {
            if(p) summary += `${p.name}: ${p.money}д\n`;
        });
        document.getElementById('report-text').innerText = summary;
        return;
    }

    const p = players[myPlayerId];
    if (!p) { document.getElementById('report-text').innerText = 'Грешка: Нема податоци за играчот.'; return; }
    let finalMoney = p.money;
    let loanNote = "";

    // Repay loan if active
    if (p.hasLoan && finalMoney > 0) {
        finalMoney -= 1500;
        loanNote = "\n(Вратен кредит: -1500д)";
    }
    
    let rep=`Играч: ${studentName}\nПричина: ${r}\nПари: ${finalMoney}д${loanNote}\nТочни: ${studentCorrect}, Грешни: ${studentWrong}`; 
    document.getElementById('report-text').innerText=rep; 
    new QRCode(document.getElementById("qrcode"),{text:rep,width:128,height:128}); 
}

function setupCanvas(){ 
    canvas=document.getElementById('whiteboard'); 
    if(!canvas) return;
    ctx=canvas.getContext('2d'); 
    
    const widthSlider = document.getElementById('pen-width');
    if(widthSlider) widthSlider.oninput = (e) => penWidth = e.target.value;

    function gp(e){
        const r = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: (clientX - r.left) * (canvas.width / r.width),
            y: (clientY - r.top) * (canvas.height / r.height)
        };
    }
    
    function st(e){
        if (e.target === canvas) e.preventDefault();
        isDrawing=true; 
        const p=gp(e); 
        lastX=p.x; lastY=p.y;
    } 
    
    function mv(e){
        if(!isDrawing) return; 
        if (e.target === canvas) e.preventDefault();
        const p=gp(e); 
        ctx.beginPath(); 
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX,lastY); 
        ctx.lineTo(p.x,p.y); 
        ctx.stroke(); 
        lastX=p.x; lastY=p.y;
    } 
    
    function en(){ isDrawing = false; }

    canvas.addEventListener('mousedown', st);
    canvas.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', en);
    
    canvas.addEventListener('touchstart', st, {passive:false});
    canvas.addEventListener('touchmove', mv, {passive:false});
    canvas.addEventListener('touchend', en);
    
    resizeCanvas();
}

function changeColor(c){ penColor = c; }
function resizeCanvas(){
    if(canvas && canvas.parentElement){
        const parent = canvas.parentElement;
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
            // Store content before resize if you want to keep it, but for a whiteboard it's usually fine to clear
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            // Reset context properties as they are lost on resize
            if(ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }
}
function clearCanvas(){if(ctx) ctx.clearRect(0,0,canvas.width,canvas.height);}
window.addEventListener('resize',()=>{resizeCanvas(); updateTokenPositionsMulti();});

function renderBoard(){
    const b=document.getElementById('board'); 
    if(!b) return;
    b.innerHTML='';
    const gp=[{r:1,c:1},{r:1,c:2},{r:1,c:3},{r:1,c:4},{r:1,c:5},{r:1,c:6},{r:2,c:6},{r:3,c:6},{r:4,c:6},{r:5,c:6},{r:6,c:6},{r:6,c:5},{r:6,c:4},{r:6,c:3},{r:6,c:2},{r:6,c:1},{r:5,c:1},{r:4,c:1},{r:3,c:1},{r:2,c:1}];
    gameBoard.forEach((c,i)=>{
        const d=document.createElement('div'); d.className=`cell type-${c.type}`; if(c.group)d.classList.add(`group-${c.group}`); d.id=`cell-${i}`;
        if(c.owner !== null && c.owner !== undefined) d.classList.add(`owned-p${c.owner}`);
        d.style.gridRow=gp[i].r; d.style.gridColumn=gp[i].c;
        d.innerHTML=`<div class="cell-name">${c.name}</div>${c.type==='property'?`<div class="cell-price">${c.price}д</div>`:''}<div class="building-container" id="bld-${i}"></div>`;
        b.appendChild(d);
    });
    updateTokenPositionsMulti();
}

function rollDiceAnimation(){
    return new Promise(r=>{
        const d=document.getElementById('dice-visual'); 
        if(!d) { r(1); return; }
        d.parentElement.classList.add('dice-shake'); AudioController.play('roll');
        setTimeout(()=>{
            d.parentElement.classList.remove('dice-shake'); const roll=Math.floor(Math.random()*6)+1;
            diceRotationCounter++; const bs=1080*diceRotationCounter; const rot=[{x:0,y:0},{x:0,y:180},{x:0,y:-90},{x:0,y:90},{x:-90,y:0},{x:90,y:0}];
            d.style.transition='transform 1.5s cubic-bezier(0.1,0.9,0.2,1)'; d.style.transform=`rotateX(${bs+rot[roll-1].x}deg) rotateY(${bs+rot[roll-1].y}deg)`;
            setTimeout(()=>{r(roll);},1600);
        },400);
    });
}

function sendLiveUpdate(question, answer, isCorrect) {
    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") return; 
    const payload = {
        player: studentName + " (" + studentOdd + ")",
        score: (players[myPlayerId] && players[myPlayerId].money) || 0,
        correct: studentCorrect,
        wrong: studentWrong,
        last_question: question,
        last_answer: answer
    };
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.log("Sync error", err));
}

// Helper function to get next room number (101, 102, 103...)
function getNextRoomNumber() {
    let counter = parseInt(localStorage.getItem('percentopolis_room_counter') || '100');
    counter++;
    localStorage.setItem('percentopolis_room_counter', counter.toString());
    return counter.toString();
}

async function createSingleRoom() {
    const diffSelect = document.getElementById('new-room-difficulty');
    const roomName = getNextRoomNumber(); // Auto-generate: 101, 102, 103...
    const difficulty = diffSelect.value;
    const teacherName = localStorage.getItem('percentopolis_teacher_name') || studentName;

    try {
        const roomRef = db.ref(`rooms/${roomName}`);
        const snapshot = await roomRef.once('value');

        if (snapshot.exists()) {
            showError('❌ Соба веќе постои. Обидете се повторно.');
            return;
        }

        await roomRef.set({
            status: 'waiting',
            players: [],
            currentPlayerIndex: 0,
            remainingTime: 40 * 60,
            gameEndTime: getServerTime() + (40 * 60 * 1000),
            turnStartTime: getServerTime(),
            difficultyMode: difficulty,
            teacherName: teacherName,
            createdAt: getServerTime(),
            gameBoard: boardConfig.map((c, i) => {
                let diff = (i < 5) ? 1 : (i < 15) ? 2 : 3;
                if (hardProperties.includes(i)) diff = 3;
                return { ...c, index: i, owner: null, buildings: 0, price: 150 + (i * 40), difficulty: diff, rentPercent: 10 * diff };
            })
        });

        // Add to teacher's rooms
        let myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
        if (!myRooms.includes(roomName)) {
            myRooms.push(roomName);
            localStorage.setItem('percentopolis_teacher_rooms', JSON.stringify(myRooms));
        }

        showSuccess(`✅ Собата ${roomName} е креирана!`);

        // Refresh dashboard
        setTimeout(() => {
            openTeacherDash();
            switchDashRoom(roomName);
        }, 1000);

    } catch (error) {
        console.error('Error creating room:', error);
        showError('❌ Грешка при креирање на соба. Обидете се повторно.');
    }
}

async function createMultipleRoomsFromDash() {
    const countInput = document.getElementById('dash-multi-room-count');
    const diffSelect = document.getElementById('new-room-difficulty');
    const count = parseInt(countInput.value) || 4;
    const difficulty = diffSelect.value;
    const teacherName = localStorage.getItem('percentopolis_teacher_name') || studentName;

    if (count < 1 || count > 10) {
        showError('❌ Број на соби мора да биде помеѓу 1 и 10');
        return;
    }

    showSuccess(`⏳ Креирам ${count} соби...`);

    let myRooms = JSON.parse(localStorage.getItem('percentopolis_teacher_rooms') || "[]");
    const createdRooms = [];

    for (let i = 0; i < count; i++) {
        const roomName = getNextRoomNumber(); // Auto-generate sequential: 101, 102, 103...

        try {
            const roomRef = db.ref(`rooms/${roomName}`);
            await roomRef.set({
                status: 'waiting',
                players: [],
                currentPlayerIndex: 0,
                remainingTime: 40 * 60,
                gameEndTime: getServerTime() + (40 * 60 * 1000),
                turnStartTime: getServerTime(),
                difficultyMode: difficulty,
                teacherName: teacherName,
                createdAt: getServerTime(),
                gameBoard: boardConfig.map((c, idx) => {
                    let diff = (idx < 5) ? 1 : (idx < 15) ? 2 : 3;
                    if (hardProperties.includes(idx)) diff = 3;
                    return { ...c, index: idx, owner: null, buildings: 0, price: 150 + (idx * 40), difficulty: diff, rentPercent: 10 * diff };
                })
            });

            myRooms.push(roomName);
            createdRooms.push(roomName);
        } catch (error) {
            console.error(`Error creating room ${roomName}:`, error);
        }
    }

    localStorage.setItem('percentopolis_teacher_rooms', JSON.stringify(myRooms));
    showSuccess(`✅ Успешно креирани ${createdRooms.length} соби!`);

    // Refresh dashboard
    setTimeout(() => {
        openTeacherDash();
        if (createdRooms.length > 0) {
            switchDashRoom(createdRooms[0]);
        }
    }, 1500);
}

function clearSave() {
    localStorage.removeItem('percentopolis_save');
    location.reload();
}

// ===== TRADE SYSTEM =====
let tradeState = {
    step: 1,
    myPropertyIndex: null,
    targetPlayerId: null,
    theirPropertyIndex: null,
    moneyAmount: 0,
    pendingOfferId: null
};

function openTradeModal() {
    if (currentRole === 'teacher') { showError("Наставникот не може да тргува."); return; }
    if (currentPlayerIndex !== myPlayerId) { showError("Може да тргуваш само кога си на потег."); return; }

    const myProps = gameBoard.filter(c => c.owner === myPlayerId && c.type === 'property');
    if (myProps.length === 0) { showError("Немаш имоти за тргување!"); return; }

    // Check if any other player owns properties
    const otherOwners = gameBoard.filter(c => c.owner !== null && c.owner !== myPlayerId && c.type === 'property');
    if (otherOwners.length === 0) { showError("Ниеден друг играч нема имот за тргување."); return; }

    tradeState = { step: 1, myPropertyIndex: null, targetPlayerId: null, theirPropertyIndex: null, moneyAmount: 0, pendingOfferId: null };
    showTradeStep(1);
    document.getElementById('trade-overlay').style.display = 'flex';
}

function closeTradeModal() {
    document.getElementById('trade-overlay').style.display = 'none';
}

function showTradeStep(step) {
    tradeState.step = step;
    document.getElementById('trade-page-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('trade-page-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('trade-page-3').style.display = step === 3 ? 'block' : 'none';

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`trade-step-${i}`);
        el.classList.remove('active', 'done');
        if (i === step) el.classList.add('active');
        else if (i < step) el.classList.add('done');
    }

    // Nav buttons
    document.getElementById('trade-back-btn').style.display = step > 1 ? 'inline-block' : 'none';
    document.getElementById('trade-next-btn').style.display = step < 3 ? 'inline-block' : 'none';
    document.getElementById('trade-send-btn').style.display = step === 3 ? 'block' : 'none';

    if (step === 1) renderMyProperties();
    if (step === 2) renderTargetPlayers();
    if (step === 3) renderTradeSummary();
}

function renderMyProperties() {
    const grid = document.getElementById('trade-my-props');
    const myProps = gameBoard.filter(c => c.owner === myPlayerId && c.type === 'property');
    grid.innerHTML = myProps.map(p => `
        <div class="trade-prop-card ${tradeState.myPropertyIndex === p.index ? 'selected' : ''}" onclick="selectMyProp(${p.index})">
            <div class="prop-color-bar" style="background:${p.color}"></div>
            <div class="prop-name">${p.name}</div>
            <div class="prop-price">${p.price}д</div>
        </div>
    `).join('');
}

function selectMyProp(idx) {
    tradeState.myPropertyIndex = idx;
    renderMyProperties();
}

function renderTargetPlayers() {
    const playersDiv = document.getElementById('trade-players-list');
    const propsDiv = document.getElementById('trade-their-props');

    // Find players who own properties (excluding me)
    const ownerIds = [...new Set(gameBoard.filter(c => c.owner !== null && c.owner !== myPlayerId && c.type === 'property').map(c => c.owner))];

    playersDiv.innerHTML = ownerIds.map(pid => {
        const p = players[pid];
        if (!p) return '';
        const pColor = getComputedStyle(document.documentElement).getPropertyValue(`--p${pid}-color`).trim();
        return `<div class="trade-player-chip ${tradeState.targetPlayerId === pid ? 'selected' : ''}"
            style="border-color: ${tradeState.targetPlayerId === pid ? pColor : '#e2e8f0'}; ${tradeState.targetPlayerId === pid ? 'background:' + pColor + '22' : ''}"
            onclick="selectTradePlayer(${pid})">${p.emoji || '👤'} ${escapeHtml(p.name)}</div>`;
    }).join('');

    // Show selected player's properties
    if (tradeState.targetPlayerId !== null) {
        const theirProps = gameBoard.filter(c => c.owner === tradeState.targetPlayerId && c.type === 'property');
        propsDiv.innerHTML = theirProps.map(p => `
            <div class="trade-prop-card ${tradeState.theirPropertyIndex === p.index ? 'selected' : ''}" onclick="selectTheirProp(${p.index})">
                <div class="prop-color-bar" style="background:${p.color}"></div>
                <div class="prop-name">${p.name}</div>
                <div class="prop-price">${p.price}д</div>
            </div>
        `).join('');
    } else {
        propsDiv.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#94a3b8; font-size:0.85rem;">Избери играч горе</p>';
    }
}

function selectTradePlayer(pid) {
    tradeState.targetPlayerId = pid;
    tradeState.theirPropertyIndex = null;
    renderTargetPlayers();
}

function selectTheirProp(idx) {
    tradeState.theirPropertyIndex = idx;
    renderTargetPlayers();
}

function renderTradeSummary() {
    const myProp = gameBoard[tradeState.myPropertyIndex];
    const theirProp = gameBoard[tradeState.theirPropertyIndex];
    const targetName = escapeHtml(players[tradeState.targetPlayerId]?.name || 'Играч');

    document.getElementById('trade-summary').innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:#94a3b8;">ТИ НУДИШ</div>
                <div style="padding:8px; background:${myProp.color}22; border-radius:8px; border:2px solid ${myProp.color}; margin-top:4px;">
                    <div style="font-weight:700; font-size:0.8rem;">${myProp.name}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${myProp.price}д</div>
                </div>
            </div>
            <div style="font-size:1.5rem;">🔄</div>
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:#94a3b8;">БАРАШ ОД ${targetName.toUpperCase()}</div>
                <div style="padding:8px; background:${theirProp.color}22; border-radius:8px; border:2px solid ${theirProp.color}; margin-top:4px;">
                    <div style="font-weight:700; font-size:0.8rem;">${theirProp.name}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${theirProp.price}д</div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('trade-money-amount').value = 0;
}

function tradeStepNext() {
    if (tradeState.step === 1) {
        if (tradeState.myPropertyIndex === null) { showError("Избери имот за понуда!"); return; }
        showTradeStep(2);
    } else if (tradeState.step === 2) {
        if (tradeState.targetPlayerId === null) { showError("Избери играч!"); return; }
        if (tradeState.theirPropertyIndex === null) { showError("Избери имот од играчот!"); return; }
        showTradeStep(3);
    }
}

function tradeStepBack() {
    if (tradeState.step > 1) showTradeStep(tradeState.step - 1);
}

async function sendTradeOffer() {
    const money = parseInt(document.getElementById('trade-money-amount').value) || 0;
    const myMoney = players[myPlayerId]?.money || 0;

    if (money > myMoney) { showError(`Немаш доволно пари! Имаш ${myMoney}д.`); return; }

    const offerId = Date.now().toString();
    const offer = {
        from: myPlayerId,
        to: tradeState.targetPlayerId,
        propertyOffered: tradeState.myPropertyIndex,
        propertyWanted: tradeState.theirPropertyIndex,
        moneyOffered: money,
        status: 'pending',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    await db.ref(`rooms/${roomId}/tradeOffers/${offerId}`).set(offer);
    closeTradeModal();
    showSuccess("📨 Понудата е испратена! Чекаме одговор...");
    log(`🔄 Испрати понуда за тргување до ${players[tradeState.targetPlayerId]?.name || 'играч'}.`);
}

// Firebase listener for incoming trade offers
function listenForTradeOffers() {
    if (!roomId || myPlayerId === null) return;

    // SECURITY: Cleanup previous listeners to prevent duplicates on reconnect
    db.ref(`rooms/${roomId}/tradeOffers`).off('child_added');
    db.ref(`rooms/${roomId}/tradeOffers`).off('child_changed');

    const connectTime = Date.now();

    db.ref(`rooms/${roomId}/tradeOffers`).on('child_added', snap => {
        const offer = snap.val();
        if (!offer || offer.status !== 'pending') return;
        if (offer.to !== myPlayerId) return;
        // SECURITY: Skip old offers (before this session started) to prevent replay
        if (offer.timestamp && offer.timestamp < connectTime - 60000) return;

        tradeState.pendingOfferId = snap.key;
        showIncomingTrade(offer);
    });

    db.ref(`rooms/${roomId}/tradeOffers`).on('child_changed', snap => {
        const offer = snap.val();
        if (!offer) return;

        // If I sent the offer and it was accepted/rejected, notify me
        if (offer.from === myPlayerId && offer.status === 'accepted') {
            showSuccess("✅ Тргувањето е прифатено!");
            log("✅ Тргувањето беше прифатено!");
        } else if (offer.from === myPlayerId && offer.status === 'rejected') {
            showError("❌ Тргувањето е одбиено.");
            log("❌ Понудата за тргување беше одбиена.");
        }
    });
}

function showIncomingTrade(offer) {
    const fromPlayer = players[offer.from];
    const offeredProp = gameBoard[offer.propertyOffered];
    const wantedProp = gameBoard[offer.propertyWanted];

    if (!fromPlayer || !offeredProp || !wantedProp) return;

    const moneyText = offer.moneyOffered > 0 ? `<div style="margin-top:8px; font-weight:700; color:#f59e0b;">+ ${offer.moneyOffered}д</div>` : '';

    document.getElementById('trade-incoming-details').innerHTML = `
        <p style="font-size:0.9rem; color:#475569; margin-bottom:14px;">
            <strong>${escapeHtml(fromPlayer.name)}</strong> сака да тргува со тебе!
        </p>
        <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:#94a3b8;">ТИ НУДИ</div>
                <div style="padding:8px; background:${offeredProp.color}22; border-radius:8px; border:2px solid ${offeredProp.color}; margin-top:4px;">
                    <div style="font-weight:700; font-size:0.8rem;">${offeredProp.name}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${offeredProp.price}д</div>
                </div>
                ${moneyText}
            </div>
            <div style="font-size:1.5rem;">🔄</div>
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:#94a3b8;">БАРА ОД ТЕБЕ</div>
                <div style="padding:8px; background:${wantedProp.color}22; border-radius:8px; border:2px solid ${wantedProp.color}; margin-top:4px;">
                    <div style="font-weight:700; font-size:0.8rem;">${wantedProp.name}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${wantedProp.price}д</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('trade-incoming-overlay').style.display = 'flex';
    AudioController.play('money');
}

async function acceptTrade() {
    const offerId = tradeState.pendingOfferId;
    if (!offerId) return;

    let snap;
    try {
        snap = await db.ref(`rooms/${roomId}/tradeOffers/${offerId}`).once('value');
    } catch(e) {
        showError('Грешка при поврзување. Обиди се повторно.');
        return;
    }
    const offer = snap.val();
    if (!offer || offer.status !== 'pending') {
        showError("Понудата повеќе не е валидна.");
        document.getElementById('trade-incoming-overlay').style.display = 'none';
        return;
    }

    // Verify ownership is still valid
    const offeredProp = gameBoard[offer.propertyOffered];
    const wantedProp = gameBoard[offer.propertyWanted];

    if (!offeredProp || offeredProp.owner !== offer.from) {
        showError("Понудувачот повеќе не го поседува тој имот.");
        await db.ref(`rooms/${roomId}/tradeOffers/${offerId}`).update({ status: 'rejected' });
        document.getElementById('trade-incoming-overlay').style.display = 'none';
        return;
    }
    if (!wantedProp || wantedProp.owner !== offer.to) {
        showError("Веќе не го поседуваш тој имот.");
        await db.ref(`rooms/${roomId}/tradeOffers/${offerId}`).update({ status: 'rejected' });
        document.getElementById('trade-incoming-overlay').style.display = 'none';
        return;
    }

    // Execute trade - swap properties
    const updates = {};
    updates[`gameBoard/${offer.propertyOffered}/owner`] = offer.to;
    updates[`gameBoard/${offer.propertyWanted}/owner`] = offer.from;

    // Money transfer
    if (offer.moneyOffered > 0) {
        const fromMoney = players[offer.from]?.money || 0;
        const toMoney = players[offer.to]?.money || 0;
        updates[`players/${offer.from}/money`] = fromMoney - offer.moneyOffered;
        updates[`players/${offer.to}/money`] = toMoney + offer.moneyOffered;
    }

    updates[`tradeOffers/${offerId}/status`] = 'accepted';

    await db.ref(`rooms/${roomId}`).update(updates);

    document.getElementById('trade-incoming-overlay').style.display = 'none';
    AudioController.play('success');
    showSuccess("✅ Тргувањето е завршено!");
    log(`🔄 Тргување: ${offeredProp.name} ↔ ${wantedProp.name}`);
}

async function rejectTrade() {
    const offerId = tradeState.pendingOfferId;
    if (!offerId) return;

    await db.ref(`rooms/${roomId}/tradeOffers/${offerId}`).update({ status: 'rejected' });
    document.getElementById('trade-incoming-overlay').style.display = 'none';
    log("❌ Ја одби понудата за тргување.");
}
