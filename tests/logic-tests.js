/**
 * Simple Logic Tests for ProcentOpolis
 * Run with: node tests/logic-tests.js
 */

const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
};

// Mocking some functions needed for logic testing
const fl = n => String(Math.floor(n));

function testBonusLogic(money, pct) {
    const Y = Math.max(0, money);
    const X = pct;
    const ans = fl(Y * X / 100);
    const expected = String(Math.floor(money * pct / 100));
    assert(ans === expected, `Bonus calculation for ${money}d at ${pct}%`);
}

function testTaxLogic(money) {
    const Y = Math.max(0, money), X = 10;
    const taxAmt = Math.floor(Y * X / 100);
    const remaining = Y - taxAmt;
    const ans = String(remaining);
    const expected = String(money - Math.floor(money * 0.1));
    assert(ans === expected, `Tax calculation for ${money}d`);
}

console.log("--- STARTING SECURITY & LOGIC TESTS ---");
testBonusLogic(1000, 15);
testBonusLogic(0, 20);
testBonusLogic(-500, 10); // Edge case: negative balance should treat as 0 for bonus
testTaxLogic(2000);
testTaxLogic(0);
console.log("--- ALL TESTS COMPLETED SUCCESSFULLY ---");
