/**
 * Logic Tests for ProcentOpolis
 * Run with: node tests/logic-tests.js
 */

let passed = 0, failed = 0;
const assert = (condition, message) => {
    if (!condition) { console.error(`❌ FAILED: ${message}`); failed++; }
    else { console.log(`✅ PASSED: ${message}`); passed++; }
};

const fl = n => String(Math.floor(n));

// ── BONUS CALCULATION ──────────────────────────────────────
function bonusCalc(money, pct) {
    const Y = Math.max(0, money);
    return Math.floor(Y * pct / 100);
}

assert(bonusCalc(1000, 15) === 150, 'Bonus: 15% of 1000 = 150');
assert(bonusCalc(0, 20) === 0,      'Bonus: 0d gives 0');
assert(bonusCalc(-500, 10) === 0,   'Bonus: negative balance clamps to 0 (never negative bonus)');
assert(bonusCalc(333, 15) === 49,   'Bonus: 15% of 333 = 49 (floor)');

// ── TAX CALCULATION ────────────────────────────────────────
function taxCalc(money) {
    const Y = Math.max(0, money);
    return Math.floor(Y * 10 / 100);
}

assert(taxCalc(2000) === 200, 'Tax: 10% of 2000 = 200');
assert(taxCalc(0) === 0,      'Tax: 0d gives 0 tax');
assert(taxCalc(150) === 15,   'Tax: 10% of 150 = 15');
assert(taxCalc(333) === 33,   'Tax: floor(33.3) = 33');

// ── RENT CALCULATION ───────────────────────────────────────
function rentCalc(price, rentPct) {
    return Math.floor(price * rentPct / 100);
}

assert(rentCalc(150, 10) === 15,  'Rent D1: 10% of 150 = 15');
assert(rentCalc(200, 20) === 40,  'Rent D2: 20% of 200 = 40');
assert(rentCalc(350, 30) === 105, 'Rent D3: 30% of 350 = 105');
// Wrong answer doubles rent
assert(rentCalc(150, 10) * 2 === 30, 'Wrong rent doubles: 15 * 2 = 30');

// ── BUILD COST CALCULATION ─────────────────────────────────
function buildCost(price, pct) {
    return Math.floor(price * pct / 100);
}

assert(buildCost(200, 30) === 60,  'Build: 30% of 200 = 60');
assert(buildCost(200, 50) === 100, 'Build: 50% of 200 = 100');
assert(buildCost(350, 40) === 140, 'Build: 40% of 350 = 140');

// ── SELL PROPERTY (FORCED SALE AT 50%) ────────────────────
function sellValue(price) {
    return Math.floor(price * 0.5);
}

assert(sellValue(150) === 75,  'Sell: 50% of 150 = 75');
assert(sellValue(200) === 100, 'Sell: 50% of 200 = 100');
assert(sellValue(301) === 150, 'Sell: floor(50% of 301) = 150');

// ── MONEY TRANSACTION (NULL GUARD) ────────────────────────
// Simulates the Firebase transaction fallback logic
function transactionUpdate(currentMoney, localMoney, amt) {
    return (currentMoney !== null ? currentMoney : localMoney) + amt;
}

assert(transactionUpdate(500, 500, -100) === 400,  'Transaction: 500 - 100 = 400');
assert(transactionUpdate(0,   500, 100) === 100,   'Transaction: server=0, apply +100 (not stale local!)');
assert(transactionUpdate(null, 500, 200) === 700,  'Transaction: null → fallback to local 500 + 200');
assert(transactionUpdate(200, 100, -50) === 150,   'Transaction: server diverged from local, use server');

// ── XP CALCULATION ────────────────────────────────────────
function xpCalc(correct, successRate) {
    return 20 + (correct * 10) + (successRate >= 70 ? 30 : successRate >= 40 ? 15 : 0);
}

assert(xpCalc(5, 80) === 100,  'XP: 5 correct, 80% rate = 20+50+30 = 100');
assert(xpCalc(0, 0)  === 20,   'XP: participation only = 20');
assert(xpCalc(3, 50) === 65,   'XP: 3 correct, 50% rate = 20+30+15 = 65');
assert(xpCalc(2, 30) === 40,   'XP: 2 correct, 30% rate = 20+20+0 = 40');

// ── TURN SKIP AFTER JAIL ───────────────────────────────────
function jailTurnsAfterVisit(current) { return Math.max(0, current - 1); }
assert(jailTurnsAfterVisit(1) === 0, 'Jail: 1 turn served, now free');
assert(jailTurnsAfterVisit(0) === 0, 'Jail: 0 remaining stays at 0');

// ── LEVEL CALCULATION ─────────────────────────────────────
const XP_PER_LEVEL = 100;
function getLevel(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpIntoLevel(xp) { return xp % XP_PER_LEVEL; }

assert(getLevel(0)   === 1, 'Level: 0 XP = Level 1');
assert(getLevel(99)  === 1, 'Level: 99 XP = Level 1');
assert(getLevel(100) === 2, 'Level: 100 XP = Level 2');
assert(getLevel(250) === 3, 'Level: 250 XP = Level 3');
assert(xpIntoLevel(150) === 50, 'XP into level: 150 XP = 50 into Level 2');

// ── ADAPTIVE DIFFICULTY THRESHOLDS ────────────────────────
function shouldBumpUp(correctStreak, typeAccuracy) {
    const masteredType = typeAccuracy === null || typeAccuracy >= 0.6;
    return (correctStreak >= 3 && masteredType) || correctStreak >= 5;
}
function shouldDropDown(wrongStreak, typeAccuracy) {
    const weakType = typeAccuracy !== null && typeAccuracy <= 0.34;
    return wrongStreak >= 3 || (wrongStreak >= 2 && weakType);
}

assert(shouldBumpUp(3, null) === true,  'Adaptive: 3 correct, no data → bump up');
assert(shouldBumpUp(3, 0.4) === false,  'Adaptive: 3 correct but type accuracy 40% → no bump');
assert(shouldBumpUp(3, 0.7) === true,   'Adaptive: 3 correct, type accuracy 70% → bump up');
assert(shouldBumpUp(5, 0.4) === true,   'Adaptive: 5 correct always bumps');
assert(shouldDropDown(3, null) === true, 'Adaptive: 3 wrong → drop');
assert(shouldDropDown(2, 0.3) === true,  'Adaptive: 2 wrong + weak type → drop early');
assert(shouldDropDown(2, 0.5) === false, 'Adaptive: 2 wrong + ok type → no drop yet');
assert(shouldDropDown(1, 0.1) === false, 'Adaptive: 1 wrong never drops regardless of type');

// ── SUMMARY ───────────────────────────────────────────────
console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
else console.log('--- ALL TESTS PASSED ✅ ---');
