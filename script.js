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

// --- VARIABLES ---
let studentName = "", studentOdd = "", studentCorrect = 0, studentWrong = 0;
let usedQuestionIds = [], remainingTime = 40 * 60, players = [], currentPlayerIndex = 0, gameBoard = [], isRolling = false;
let myPlayerId = null;
let roomId = null;
let isCreator = false;
let timerInterval, turnTimerInterval;
let canvas, ctx, isDrawing = false, lastX = 0, lastY = 0;
let penColor = '#000000';
let penWidth = 3;
let diceRotationCounter = 0;
let currentDifficultyLevel = 1; 
let correctStreak = 0;
let currentTaskData = null;
let turnRemainingTime = 30;

// --- DATA ---
function shuffleArray(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const allTasks=[];
for(let i=0;i<220;i++){
    let diff=(i%3)+1; let rate=5+(i%15)*5; let base=50+(i*10);
    if(diff===1){rate=[10,20,25,50][i%4]; base=[100,200,50,80,120,400][i%6];}
    let cv=(base*rate)/100; let cs=cv%1===0?cv.toString():cv.toFixed(1);
    let expl=`💡 Постапка: ${rate}% од ${base} се пресметува како (${rate} ÷ 100) × ${base} = ${cs}.`;
    let opts=[...new Set([((base*rate)/10).toFixed(1), (base+rate).toString(), rate.toString(), ((base*(100-rate))/100).toFixed(1)])];
    while(opts.length<4){opts.push((parseFloat(cs)+Math.floor(Math.random()*10)+1).toString());}
    if(!opts.includes(cs))opts[0]=cs; let fo=shuffleArray(opts).slice(0,4); if(!fo.includes(cs))fo[0]=cs;
    allTasks.push({id:100+i, difficulty:diff, question:`Пресметај ${rate}% од ${base}.`, correct_answer:cs, options:shuffleArray(fo), raw:{rate,base}, explanation:expl});
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
    document.getElementById('start-game-btn-multi').onclick = requestStartGame;
    setupCanvas();

    // Check for existing session
    const saved = localStorage.getItem('percentopolis_session');
    if (saved) {
        const session = JSON.parse(saved);
        document.getElementById('player-name-input').value = session.name;
        document.getElementById('room-id-input').value = session.roomId;
    }
};

function checkLoginValid() {
    const nameVal = document.getElementById('player-name-input').value.trim();
    const roomVal = document.getElementById('room-id-input').value.trim();
    const btn = document.getElementById('login-btn');
    
    if (currentRole === 'teacher') {
        btn.disabled = nameVal.length < 3;
    } else {
        btn.disabled = nameVal.length < 3 || roomVal.length < 3;
    }
}

function setRole(role) {
    currentRole = role;
    const sBtn = document.getElementById('role-student');
    const tBtn = document.getElementById('role-teacher');
    const studentFields = document.getElementById('student-only-fields');
    const roomBox = document.querySelector('.room-box');
    const roomLabel = document.getElementById('room-label');
    const roomHint = document.getElementById('room-hint');
    const roomInput = document.getElementById('room-id-input');

    if (role === 'teacher') {
        sBtn.classList.remove('active');
        tBtn.classList.add('active');
        studentFields.style.display = 'none';
        roomBox.classList.add('teacher-mode');
        roomLabel.innerText = "🏠 КРЕИРАЈ НОВА СОБА:";
        roomInput.placeholder = "Име на соба (пр. МАТЕМАТИКА8)";
        roomHint.innerText = "Остави празно за автоматски генериран код.";
    } else {
        tBtn.classList.remove('active');
        sBtn.classList.add('active');
        studentFields.style.display = 'block';
        roomBox.classList.remove('teacher-mode');
        roomLabel.innerText = "🏠 ПРИКЛУЧИ СЕ ВО СОБА:";
        roomInput.placeholder = "Код на соба (пр. ROOM123)";
        roomHint.innerText = "Внеси го кодот што го доби од наставникот.";
    }
    checkLoginValid();
}

async function joinRoom() {
    studentName = document.getElementById('player-name-input').value.trim();
    studentOdd = (currentRole === 'teacher') ? "Наставник" : document.getElementById('player-odd-input').value;
    
    let rawRoom = document.getElementById('room-id-input').value.trim().toUpperCase();
    if (currentRole === 'teacher' && !rawRoom) {
        roomId = "ROOM" + Math.floor(1000 + Math.random() * 9000);
    } else {
        roomId = rawRoom || "ROOM" + Math.floor(1000 + Math.random() * 9000);
    }
    
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('lobby-section').style.display = 'block';
    document.getElementById('current-room-display').innerText = `Соба: ${roomId}`;
    
    const roomRef = db.ref('rooms/' + roomId);
    
    roomRef.once('value', snapshot => {
        if (!snapshot.exists()) {
            isCreator = true;
            roomRef.set({
                status: 'waiting',
                players: [],
                currentPlayerIndex: 0,
                remainingTime: 40 * 60,
                turnStartTime: Date.now(),
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
            
            // Check if player is already in the list (reconnection)
            let existingPid = -1;
            currentPlayers.forEach((p, idx) => {
                if (p && p.name === studentName) existingPid = idx;
            });

            if (existingPid !== -1) {
                myPlayerId = existingPid;
            } else {
                if (currentPlayers.length >= 6) {
                    alert("Собата е полна!");
                    location.reload();
                    return;
                }
                myPlayerId = currentPlayers.length;
                const newPlayer = {
                    id: myPlayerId,
                    name: studentName,
                    odd: studentOdd,
                    money: 1000,
                    pos: 0,
                    color: `var(--p${myPlayerId}-color)`,
                    powerups: { lawyer: false, shield: false, nitro: false, bribe: false }
                };
                playersRef.child(myPlayerId).set(newPlayer);
            }

            // Save session
            localStorage.setItem('percentopolis_session', JSON.stringify({
                name: studentName,
                roomId: roomId,
                playerId: myPlayerId
            }));

            roomRef.on('value', handleRoomUpdate);
        });
    });
}

function handleRoomUpdate(snapshot) {
    const data = snapshot.val();
    if (!data) return;
    
    players = data.players || [];
    gameBoard = data.gameBoard || [];
    const prevTurnIndex = currentPlayerIndex;
    currentPlayerIndex = data.currentPlayerIndex || 0;
    remainingTime = data.remainingTime;
    
    // Turn Timer Logic
    if (data.turnStartTime) {
        const elapsed = Math.floor((Date.now() - data.turnStartTime) / 1000);
        turnRemainingTime = Math.max(0, 30 - elapsed);
        document.getElementById('turn-timer').innerText = `Потег: ${turnRemainingTime}s`;
        
        // Auto-skip if time is up and I'm the current player
        if (turnRemainingTime === 0 && currentPlayerIndex === myPlayerId && !isRolling) {
            log("Времето истече! Потегот се префрла.");
            endTurnMulti();
        }
    }

    updateLobbyUI();
    
    if (data.status === 'playing' && document.getElementById('login-overlay').style.display !== 'none') {
        initMultiplayerGame();
    }
    
    if (data.status === 'playing') {
        syncGameState();
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
    ul.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `👤 ${p.name} (${p.odd})`;
        if (p.id === 0) li.innerText += " (Креатор)";
        ul.appendChild(li);
    });
    
    document.getElementById('start-game-btn-multi').style.display = isCreator ? 'block' : 'none';
}

function requestStartGame() {
    if (!isCreator) return;
    db.ref('rooms/' + roomId).update({ 
        status: 'playing',
        turnStartTime: firebase.database.ServerValue.TIMESTAMP 
    });
}

function initMultiplayerGame() {
    AudioController.init();
    document.getElementById('player-display-name').innerText = (currentRole === 'teacher' ? 'Наставник: ' : 'Играч: ') + studentName;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('game-wrapper').classList.remove('blur-filter');
    
    if (isCreator) {
        document.getElementById('teacher-dash-btn').style.display = 'block';
    }

    const statsPanel = document.getElementById('stats-panel-multi');
    statsPanel.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.id = `stat-${p.id}`;
        div.className = 'player-stat';
        div.innerHTML = `<span>${p.name}</span><span id="score-${p.id}">${p.money}д</span><div id="powerups-${p.id}" class="active-powerups"></div>`;
        statsPanel.appendChild(div);
        
        const t = document.getElementById(`token-${p.id}`);
        if (t) t.style.display = 'flex';
    });
    
    renderBoard();
    updateUI();
    if (isCreator) startTimerMulti();
    
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
    players.forEach(p => {
        const c = document.getElementById(`cell-${p.pos}`);
        const t = document.getElementById(`token-${p.id}`);
        if (!c || !t) return;
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

function startTimerMulti() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (remainingTime > 0) {
            remainingTime--;
            db.ref('rooms/' + roomId).update({ remainingTime: remainingTime });
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
}

async function playTurnMulti(){
    if(isRolling || currentPlayerIndex !== myPlayerId) return;
    isRolling = true;
    document.getElementById('roll-btn').disabled = true;
    
    const p = players[myPlayerId];
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
    await showLandingCardMulti(p, c);
    
    endTurnMulti();
}

function updateMoneyMulti(pid, amt){
    if(amt === 0) return;
    const p = players[pid];
    const newMoney = p.money + amt;
    db.ref(`rooms/${roomId}/players/${pid}`).update({ money: newMoney });
    AudioController.play('money');
    showFloatingTextMulti(amt, pid);
}

function showFloatingTextMulti(amount, pid) {
    if(amount===0)return; const pt=document.getElementById(`token-${pid}`); if(!pt)return;
    const r=pt.getBoundingClientRect(); const t=document.createElement('div'); t.className='floating-text';
    t.innerText=(amount>0?'+':'')+amount+'д'; t.style.color=amount>0?'#27ae60':'#e74c3c'; t.style.left=r.left+'px'; t.style.top=r.top+'px';
    document.body.appendChild(t); setTimeout(()=>{document.body.removeChild(t);},1500);
}

async function showLandingCardMulti(p, c){
    return new Promise(resolve => {
        const o = document.getElementById('card-overlay');
        o.style.display = 'flex';
        o.innerHTML = '';
        const rc = (res) => { o.style.display = 'none'; resolve(res); };
        
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
                        const ok = await askQuestion("ШАНСА", t.question, t.correct_answer, t.options, true, t.explanation);
                        if(ok) updateMoneyMulti(myPlayerId, isPos ? amt : 0);
                        else if(!isPos) updateMoneyMulti(myPlayerId, amt);
                        rc();
                    };
                }, 800);
            };
        } else if(c.type === 'tax'){
            const tax = Math.floor(p.money * 0.1);
            o.innerHTML = `<div class="card-view"><div class="card-header" style="background:#34495e">ДАНOК</div><div class="card-body"><p>10% данок.</p><h2>${tax}д</h2></div><div class="card-actions"><button class="action-btn btn-rent" id="pay-tax">ПЛАТИ</button>${p.powerups.lawyer?'<button class="action-btn btn-buy" id="use-lawyer">АДВОКАТ (⚖️)</button>':''}</div></div>`;
            document.getElementById('pay-tax').onclick = () => { updateMoneyMulti(myPlayerId, -tax); rc(); };
            if(p.powerups.lawyer) document.getElementById('use-lawyer').onclick = () => {
                p.powerups.lawyer = false;
                db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                rc();
            };
        } else if(c.type === 'property'){
            const rent = Math.floor(c.price * (c.rentPercent / 100));
            if(c.owner == null){ // Matches null and undefined
                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><div class="card-row"><span>Цена:</span><span>${c.price}д</span></div><div class="card-row"><span>Кирија:</span><span>${rent}д</span></div></div><div class="card-actions"><button class="action-btn btn-buy" id="buy-prop">КУПИ (РEШИ ЗАДАЧА)</button><button class="action-btn btn-pass" id="pass-prop">ПОМИНУВАЈ</button></div></div>`;
                document.getElementById('buy-prop').onclick = async () => {
                    const isHard = c.difficulty === 3;
                    const t = getUniqueTask(c.difficulty);
                    const ok = await askQuestion("КУПУВАЊЕ", t.question, t.correct_answer, isHard ? [] : t.options, true, t.explanation);
                    if(ok){
                        let finalPrice = c.price;
                        if(p.powerups.bribe){ finalPrice = 1; p.powerups.bribe = false; }
                        db.ref(`rooms/${roomId}/gameBoard/${c.index}`).update({ owner: myPlayerId });
                        updateMoneyMulti(myPlayerId, -finalPrice);
                        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                    }
                    rc();
                };
                document.getElementById('pass-prop').onclick = () => rc();
            } else if(c.owner !== myPlayerId){
                const ownerName = (players[c.owner] && players[c.owner].name) ? players[c.owner].name : "Противник";
                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><p>Сопственик: ${ownerName}</p><h2>Кирија: ${rent}д</h2></div><div class="card-actions"><button class="action-btn btn-rent" id="pay-rent">ПЛАТИ</button>${p.powerups.shield?'<button class="action-btn btn-buy" id="use-shield">ШТИТ (🛡️)</button>':''}</div></div>`;
                document.getElementById('pay-rent').onclick = async () => {
                    const t = getUniqueTask(c.difficulty);
                    const ok = await askQuestion("КИРИЈА", `Точен одговор за ${rent}д, инаку ${rent*2}д!\n\n${t.question}`, t.correct_answer, t.options, true, t.explanation);
                    const finalRent = ok ? rent : rent * 2;
                    updateMoneyMulti(myPlayerId, -finalRent);
                    updateMoneyMulti(c.owner, finalRent);
                    rc();
                };
                if(p.powerups.shield) document.getElementById('use-shield').onclick = () => {
                    p.powerups.shield = false;
                    db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
                    rc();
                };
            } else {
                o.innerHTML = `<div class="card-view"><div class="card-header" style="background:${c.color}">${c.name}</div><div class="card-body"><p>Твој имот</p></div><div class="card-actions">${c.buildings<3?`<button class="action-btn btn-build" id="build-btn">ГРАДИ (${Math.floor(c.price*0.4)}д)</button>`:''} <button class="action-btn btn-pass" id="pass-prop">ЗАТВОРИ</button></div></div>`;
                const bldBtn = document.getElementById('build-btn');
                if(bldBtn) bldBtn.onclick = async () => {
                    const t = getUniqueTask(3);
                    const ok = await askQuestion("ГРАДЕЊЕ", t.question, t.correct_answer, [], true, t.explanation);
                    if(ok){
                        const cost = Math.floor(c.price * 0.4);
                        db.ref(`rooms/${roomId}/gameBoard/${c.index}`).update({ buildings: c.buildings + 1, rentPercent: c.rentPercent + 15 });
                        updateMoneyMulti(myPlayerId, -cost);
                    }
                    rc();
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
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    db.ref(`rooms/${roomId}`).update({ 
        currentPlayerIndex: nextPlayerIndex,
        turnStartTime: firebase.database.ServerValue.TIMESTAMP 
    });
}

function updateUI(){
    players.forEach(p => {
        const scoreEl = document.getElementById(`score-${p.id}`);
        if(scoreEl) scoreEl.innerText = `${p.money}д`;
        
        const statEl = document.getElementById(`stat-${p.id}`);
        if(statEl){
            if(currentPlayerIndex === p.id) statEl.classList.add('active-turn');
            else statEl.classList.remove('active-turn');
            
            // Thinking indicator
            if(p.isThinking) statEl.style.borderRight = "4px solid #f1c40f";
            else statEl.style.borderRight = "none";
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

function openTeacherDash() {
    const tbody = document.getElementById('teacher-stats-tbody');
    tbody.innerHTML = '';
    players.forEach(p => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';
        tr.innerHTML = `
            <td style="padding:10px;">${p.name} (${p.odd})</td>
            <td style="padding:10px;">${p.money}д</td>
            <td style="padding:10px; color:green;">${p.correct || 0}</td>
            <td style="padding:10px; color:red;">${p.wrong || 0}</td>
            <td style="padding:10px; font-size:0.8rem;">${p.lastActivity || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('teacher-modal').style.display = 'flex';
}

function buyItem(type,cost) {
    const p=players[myPlayerId];
    if(p.money<cost) { alert("Немаш доволно пари!"); return; }
    p.powerups[type]=true;
    updateMoneyMulti(myPlayerId, -cost);
    db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ powerups: p.powerups });
    document.getElementById('shop-modal').style.display='none';
}

function getUniqueTask(diff){
    let filtered = allTasks.filter(t => t.difficulty === (diff||1) && !usedQuestionIds.includes(t.id));
    if(filtered.length === 0){ usedQuestionIds = []; filtered = allTasks.filter(t => t.difficulty === (diff||1)); }
    const t = filtered[Math.floor(Math.random()*filtered.length)];
    usedQuestionIds.push(t.id);
    return t;
}

function askQuestion(cat, q, ans, opts, isAdaptive, expl){
    return new Promise(resolve=>{
        const m=document.getElementById('question-modal'); m.style.display='flex';
        db.ref(`rooms/${roomId}/players/${myPlayerId}`).update({ isThinking: true });
        
        document.getElementById('modal-category').innerText=cat;
        document.getElementById('question-text').innerText=q;
        const oc=document.getElementById('options-container'); oc.innerHTML='';
        const ic=document.getElementById('input-answer-container'); ic.style.display='none';
        const fa=document.getElementById('feedback-area'); fa.innerText='';
        currentTaskData = { q, ans, expl };

        const finalize = (res) => {
            const updates = { isThinking: false };
            if (res) {
                studentCorrect++;
                updates.correct = studentCorrect;
            } else {
                studentWrong++;
                updates.wrong = studentWrong;
            }
            updates.lastActivity = (res ? "Точно: " : "Грешно: ") + q;
            
            db.ref(`rooms/${roomId}/players/${myPlayerId}`).update(updates);
            m.style.display='none';
            resolve(res);
        };

        if(opts && opts.length>0){
            opts.forEach(o=>{
                const b=document.createElement('button'); b.className='option-btn'; b.innerText=o;
                b.onclick=()=>{
                    const isCorrect = o === ans;
                    if(isCorrect){ b.classList.add('correct-answer'); AudioController.play('success'); triggerConfetti(); correctStreak++; }
                    else { b.classList.add('wrong-answer'); AudioController.play('failure'); correctStreak=0; }
                    fa.innerText = isCorrect ? "ТОЧНО! ✅" : `ГРЕШКА! ❌ Точниот одговор е ${ans}.`;
                    fa.style.color = isCorrect ? "green" : "red";
                    sendLiveUpdate(q, o, isCorrect);
                    setTimeout(()=>{ finalize(isCorrect); }, 2000);
                };
                oc.appendChild(b);
            });
        } else {
            ic.style.display='flex';
            document.getElementById('manual-answer-input').value='';
            document.getElementById('submit-answer-btn').onclick=()=>{
                const val = document.getElementById('manual-answer-input').value.trim();
                const isCorrect = val === ans;
                if(isCorrect){ AudioController.play('success'); triggerConfetti(); correctStreak++; }
                else { AudioController.play('failure'); correctStreak=0; }
                fa.innerText = isCorrect ? "ТОЧНО! ✅" : `ГРЕШКА! ❌ Точниот одговор е ${ans}.`;
                fa.style.color = isCorrect ? "green" : "red";
                sendLiveUpdate(q, val, isCorrect);
                setTimeout(()=>{ finalize(isCorrect); }, 2000);
            };
        }
    });
}

function drawVisualHint(){
    if(!currentTaskData || !currentTaskData.expl) return;
    const fa=document.getElementById('feedback-area');
    fa.innerHTML = `<div style="background:#fff3cd; padding:10px; border-radius:10px; border:1px solid #ffeeba; font-size:0.9rem; margin-bottom:10px;">${currentTaskData.expl}</div>`;
}

function closeModal(){document.getElementById('question-modal').style.display='none';}
function log(msg){const l=document.getElementById('game-log'); if(!l) return; const n=document.createElement('div'); n.innerText='> '+msg; l.prepend(n);}
function updateVisualOwnership(idx,pid){const e=document.getElementById(`cell-${idx}`); if(e){e.classList.remove('owned-p0','owned-p1','owned-p2','owned-p3','owned-p4','owned-p5'); e.classList.add(`owned-p${pid}`);}}

function triggerGameOver(r){ 
    clearInterval(timerInterval); 
    document.getElementById('game-over-overlay').style.display='flex'; 
    let rep=`Играч: ${studentName}\nПричина: ${r}\nПари: ${players[myPlayerId].money}д\nТочни: ${studentCorrect}, Грешни: ${studentWrong}`; 
    document.getElementById('report-text').innerText=rep; 
    new QRCode(document.getElementById("qrcode"),{text:rep,width:128,height:128}); 
}

function setupCanvas(){ 
    canvas=document.getElementById('whiteboard'); 
    if(!canvas) return;
    ctx=canvas.getContext('2d'); 
    
    const widthSlider = document.getElementById('pen-width');
    if(widthSlider) widthSlider.oninput = (e) => penWidth = e.target.value;

    function gp(e){const r=canvas.getBoundingClientRect(); return e.touches?{x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top}:{x:e.clientX-r.left,y:e.clientY-r.top};} 
    function st(e){e.preventDefault(); isDrawing=true; const p=gp(e); lastX=p.x; lastY=p.y;} 
    function mv(e){
        if(!isDrawing)return; 
        e.preventDefault(); 
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
    canvas.addEventListener('mousedown',st); canvas.addEventListener('mousemove',mv); canvas.addEventListener('mouseup',()=>isDrawing=false); 
    canvas.addEventListener('touchstart',st,{passive:false}); canvas.addEventListener('touchmove',mv,{passive:false}); 
    resizeCanvas();
}

function changeColor(c){ penColor = c; }
function resizeCanvas(){if(canvas){canvas.width=canvas.parentElement.clientWidth; canvas.height=canvas.parentElement.clientHeight;}}
function clearCanvas(){if(ctx) ctx.clearRect(0,0,canvas.width,canvas.height);}
window.addEventListener('resize',()=>{resizeCanvas(); updateTokenPositionsMulti();});

function renderBoard(){
    const b=document.getElementById('board'); 
    if(!b) return;
    b.innerHTML='';
    const gp=[{r:1,c:1},{r:1,c:2},{r:1,c:3},{r:1,c:4},{r:1,c:5},{r:1,c:6},{r:2,c:6},{r:3,c:6},{r:4,c:6},{r:5,c:6},{r:6,c:6},{r:6,c:5},{r:6,c:4},{r:6,c:3},{r:6,c:2},{r:6,c:1},{r:5,c:1},{r:4,c:1},{r:3,c:1},{r:2,c:1}];
    gameBoard.forEach((c,i)=>{
        const d=document.createElement('div'); d.className=`cell type-${c.type}`; if(c.group)d.classList.add(`group-${c.group}`); d.id=`cell-${i}`;
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
        score: players[myPlayerId].money,
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

function clearSave() {
    localStorage.removeItem('percentopolis_save');
    location.reload();
}
