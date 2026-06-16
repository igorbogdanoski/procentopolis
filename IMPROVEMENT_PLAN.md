# Percentopolis — Improvement Plan

Task pool: ~530 tasks (TYPE 1–7, difficulty 1–3)
Status before plan: commit `5dfbb7c` — all P0/P1/P2 bugs fixed.
Implemented #1–#10 (all): commit `eea2927`

---

## LEVEL 1 — High Pedagogical Impact, Low Effort

### ✅ #1 JAIL → early exit challenge
**Status:** DONE ✅
Current: skip turn, no value.
Better: "Solve task → exit immediately. Wrong → wait 1 turn."
Change: `showLandingCardMulti` — `c.type === 'jail'` block.

### ✅ #2 START BONUS — variable % [10,12,15,18,20]
**Status:** DONE ✅
Current: always 15%. Pedagogically one-dimensional.
Better: random % from the list — bonus and question are different every time.
Change: `playTurnMulti` — `passedStart` block.

### ✅ #3 Adaptive Difficulty per Student (streak-based)
**Status:** DONE ✅
3 correct in a row → `currentDifficultyLevel++` (max 3)
3 wrong in a row → `currentDifficultyLevel--` (min 1)
`getUniqueTask` and contextual questions use this level.
Important: only for CHANCE and generic questions — does not change cell-based questions.

### ✅ #4 Game PAUSE (for teacher)
**Status:** DONE ✅
New Firebase status: `status: 'paused'`
`handleRoomUpdate` → if 'paused', lock roll-btn, show overlay "⏸ Pause".
Teacher dashboard: PAUSE ↔ RESUME button.

---

## LEVEL 2 — Teacher Tools

### ✅ #5 Live Answers in Teacher Dashboard
**Status:** DONE ✅
`sendLiveUpdate` already exists — writes to Firebase.
Required: teacher panel with scroll list "Student X → question → ✅/❌".
Firebase listener on `/liveUpdates` in `openTeacherDash()`.

### ✅ #6 Export CSV after Game End
**Status:** DONE ✅
"Download CSV" button in game-over overlay (teacher only).
Columns: Student, Correct, Wrong, Success%, By question type.
Pure `Blob` + `a.download` — no backend.

---

## LEVEL 3 — Gameplay Mechanics

### ✅ #7 Bankrupt → Spectator mode (not elimination)
**Status:** DONE ✅
Bankrupt student gets `isSpectator: true`.
Continues to answer CHANCE/TAX (without monetary consequence).
Maintains engagement instead of waiting for the end.

### ✅ #8 Catch-up Mechanic
**Status:** DONE ✅
When a student's wallet is ≤ 25% of the average → receives a "Rescue Token".
Effect: one-time skip of next rent.
Checked in `endTurnMulti` after each move.

---

## LEVEL 4 — Technical Hardening

### ✅ #9 Concurrent join race condition
**Status:** DONE ✅
`myPlayerId = currentPlayers.length` without atomic protection.
Solution: Firebase `.transaction()` during join.

### ✅ #10 New D3 Questions — real life context
**Status:** DONE ✅
Current: TYPE 6 (interest) and TYPE 7 (tax) = 60 tasks for D3.
Add: shop discounts, salary calculation, VAT, bank loans.
Goal: another 60–80 D3 tasks with real context.

---

## Implementation Order

| # | Improvement | Pedagogical Value | Effort | Priority |
|---|-------------|-------------------|-------|-----------|
| 1 | JAIL with task | ⭐⭐⭐⭐⭐ | Low | 🔴 First |
| 2 | START BONUS variable | ⭐⭐⭐⭐ | Low | 🔴 First |
| 3 | Adaptive Difficulty (streak) | ⭐⭐⭐⭐⭐ | Medium | 🟠 Second |
| 4 | Game Pause | ⭐⭐⭐⭐ | Low | 🔴 First |
| 5 | Live Answers Dashboard | ⭐⭐⭐⭐⭐ | Medium | 🟠 Second |
| 6 | Export CSV | ⭐⭐⭐ | Low | 🟡 Third |
| 7 | Bankrupt → Spectator | ⭐⭐⭐⭐ | Medium | 🟠 Second |
| 8 | Catch-up Mechanic | ⭐⭐⭐ | Medium | 🟡 Third |
| 9 | Concurrent join fix | ⭐⭐ (tech) | Low | 🟡 Third |
| 10| New D3 Questions | ⭐⭐⭐⭐⭐ | High | 🟠 Second |
