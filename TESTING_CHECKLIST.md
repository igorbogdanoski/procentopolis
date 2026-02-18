# 🧪 Manual Testing Checklist - Percentopolis

## Pre-Testing Setup

- [ ] Firebase Rules applied from `firebase-rules.json`
- [ ] Clear browser cache & localStorage
- [ ] Test on Chrome, Firefox, and Safari
- [ ] Test on mobile device (Android/iOS)
- [ ] Have 2-3 test accounts ready (different names)

---

## 1. Teacher Flow Testing

### 1.1 Login & Dashboard Access
- [ ] Open https://procentopolis.vercel.app/
- [ ] Select "НАСТАВНИК" role
- [ ] Try empty name → Should show error nema poraka gre[ka ne se vleguva]
- [ ] Try name with <2 chars → Should show error
- [ ] Enter valid name (e.g., "Марија")
- [ ] Click "📊 ОТВОРИ КОНТРОЛЕН ПАНЕЛ"
- [ ] Should see empty state dashboard with create interface

### 1.2 Single Room Creation
- [ ] Enter custom room name (e.g., "МАТЕМАТИКА8А")
- [ ] Select difficulty (СТАНДАРДНО)
- [ ] Click "🚀 КРЕИРАЈ СОБА"
- [ ] Loading spinner should appear
- [ ] Success toast should show: "✅ Собата МАТЕМАТИКА8А е креирана!"
- [ ] Dashboard refreshes automatically
- [ ] New room appears in sidebar
- [ ] Room status shows "🟡 ЧЕКАЊЕ"

### 1.3 Multi-Room Creation
- [ ] Enter number of rooms (e.g., 4)
- [ ] Click "⚡ КРЕИРАЈ ПОВЕЌЕ"
- [ ] Loading overlay with "🚀 Креирам 4 соби..."
- [ ] Success toast shows number created
- [ ] All rooms appear in sidebar
- [ ] Can switch between rooms

### 1.4 Room Management
- [ ] Click different rooms in sidebar
- [ ] Each room loads its own data
- [ ] "СТАРТУВАЈ СОБА" button visible
- [ ] "📱 ПРЕГЛЕД НА СИТЕ" shows grid view
- [ ] Grid view shows all rooms with metrics
- [ ] Can return to single room view

### 1.5 Input Validation
- [ ] Try room name with special chars (@#$%) → Should be stripped
- [ ] Try room name >20 chars → Should show error
- [ ] Try creating duplicate room name → Should show error
- [ ] Try creating 11 rooms → Should show error (max 10)

---

## 2. Student Flow Testing

### 2.1 Login
- [ ] Select "УЧЕНИК" role
- [ ] Enter name (e.g., "Петар")
- [ ] Select одделение (8-1)
- [ ] Choose token (🚀)
- [ ] Enter valid room code from teacher
- [ ] Click "🚀 ВЛЕЗИ ВО ИГРА"
- [ ] Should see lobby with room code displayed
- [ ] Student name appears in player list

### 2.2 Multiple Students Join
- [ ] Open 2-3 browser tabs (incognito)
- [ ] Each student joins same room
- [ ] All students visible in lobby
- [ ] Teacher dashboard updates in real-time
- [ ] Player count increases

### 2.3 Game Start
- [ ] Teacher clicks "СТАРТУВАЈ СОБА"
- [ ] Game board appears for all students
- [ ] First student can roll dice
- [ ] Turn timer starts (45 seconds)
- [ ] Other students see "Чека потег..."

---

## 3. Gameplay Testing

### 3.1 Movement & Questions
- [ ] Roll dice → piece moves correctly
- [ ] Land on property → card appears
- [ ] Math question displays
- [ ] Whiteboard is functional (can draw)
- [ ] Enter correct answer → success feedback
- [ ] Enter wrong answer → error feedback
- [ ] Money updates correctly

### 3.2 Property Purchase
- [ ] Answer question correctly
- [ ] Buy property → money deducted
- [ ] Property shows player color/ownership
- [ ] Property appears in player stats

### 3.3 Rent Payment
- [ ] Land on opponent's property
- [ ] Rent question appears
- [ ] Answer correctly → pay correct rent
- [ ] Answer incorrectly → pay double rent
- [ ] Money transfers between players

### 3.4 Turn Timer
- [ ] Turn timer counts down from 45s
- [ ] At 0s, turn auto-ends
- [ ] Next player's turn starts
- [ ] Teacher is skipped in rotation

### 3.5 Powerups (Shop)
- [ ] Click "🛒 ПРОДАВНИЦА"
- [ ] Shop modal appears with items
- [ ] Buy "⚖️ Адвокат" (300д)
- [ ] Money deducted
- [ ] Powerup shows in player stats
- [ ] Test each powerup functionality

---

## 4. Teacher Dashboard Testing

### 4.1 Live Monitoring
- [ ] Open dashboard while game is active
- [ ] See real-time player stats
- [ ] "🤔 РАЗМИСЛУВА" status when student thinking
- [ ] "✅ ПОДГОТВЕН" status when idle
- [ ] Correct/wrong count updates instantly

### 4.2 Analytics
- [ ] Player money displayed correctly
- [ ] Success percentage calculated
- [ ] Total correct answers sum
- [ ] Average success rate accurate

### 4.3 CSV Export
- [ ] Click "📥 ИЗВЕШТАЈ"
- [ ] CSV file downloads
- [ ] Open in Excel/Sheets
- [ ] Contains: Name, Одделение, Money, Correct, Wrong, Success%
- [ ] Macedonian characters display correctly (UTF-8 BOM)

### 4.4 Grid View
- [ ] Click "📱 ПРЕГЛЕД НА СИТЕ"
- [ ] All rooms displayed in grid
- [ ] Each shows: Status, Player count, Success rate
- [ ] Live updates work
- [ ] Can click card to go to room details

---

## 5. Error Handling Testing

### 5.1 Network Issues
- [ ] Disable internet mid-game
- [ ] Warning toast: "⚠️ Нема интернет конекција"
- [ ] Re-enable internet
- [ ] Success toast: "✅ Конекцијата е вратена!"
- [ ] Game state resumes correctly

### 5.2 Firebase Connection
- [ ] Close Firebase in Console (if testing)
- [ ] Errors handled gracefully
- [ ] User sees error message
- [ ] No crashes or white screens

### 5.3 Invalid Input
- [ ] Try SQL injection in name: `'; DROP TABLE--`
- [ ] Should be sanitized
- [ ] Try XSS: `<script>alert('xss')</script>`
- [ ] Should be stripped

---

## 6. Mobile/Tablet Testing

### 6.1 Portrait Mode (Phone)
- [ ] Login screen fits properly
- [ ] Game board visible (55vh)
- [ ] Controls accessible (45vh)
- [ ] Player stats wrap correctly
- [ ] No horizontal scroll
- [ ] Touch controls work

### 6.2 Landscape Mode (Tablet)
- [ ] Board on left (70%)
- [ ] Controls on right (30%)
- [ ] All elements visible
- [ ] No overlap

### 6.3 Teacher Dashboard on Tablet
- [ ] Sidebar converts to horizontal scroll
- [ ] Room cards fit properly
- [ ] Grid view works
- [ ] All buttons accessible

---

## 7. Security Testing

### 7.1 Firebase Rules
- [ ] Try reading data without authentication
- [ ] Try writing invalid money value (> 1,000,000)
- [ ] Try setting position > 19
- [ ] Try creating player with invalid role
- [ ] All should be blocked by Firebase Rules

### 7.2 Input Validation
- [ ] Try name with 100+ characters
- [ ] Try room code with spaces/special chars
- [ ] Try negative money via browser console
- [ ] All should be validated/sanitized

---

## 8. Performance Testing

### 8.1 Load Testing
- [ ] 6 students in one game (maximum)
- [ ] Game runs smoothly
- [ ] No lag on dice roll
- [ ] Questions load instantly
- [ ] Turn rotation works

### 8.2 Multiple Rooms
- [ ] Teacher has 10 rooms created
- [ ] Dashboard loads quickly
- [ ] Grid view performs well
- [ ] Switching between rooms is fast

---

## 9. Edge Cases

### 9.1 Page Refresh
- [ ] Refresh page mid-game
- [ ] Reconnection should work
- [ ] Player rejoins automatically
- [ ] Game state restored

### 9.2 Multiple Tabs
- [ ] Open game in 2 tabs (same player)
- [ ] Both tabs sync correctly
- [ ] Actions in one tab reflect in other

### 9.3 Teacher Leaves
- [ ] Teacher closes browser
- [ ] Students can continue playing
- [ ] Game doesn't crash

### 9.4 All Students Leave
- [ ] All students disconnect
- [ ] Room status remains
- [ ] Teacher can see final stats

---

## 10. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Edge (latest)

---

## Bug Reporting Template

When you find a bug, document it like this:

```
**Bug:** [Short description]
**Steps to Reproduce:**
1.
2.
3.

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Browser:** Chrome 120
**Device:** Desktop / Mobile
**Screenshot:** [If applicable]
```

---

## Test Results Summary

Date: _______________
Tester: _______________

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Teacher Flow | ☐ | ☐ | |
| Student Flow | ☐ | ☐ | |
| Gameplay | ☐ | ☐ | |
| Dashboard | ☐ | ☐ | |
| Error Handling | ☐ | ☐ | |
| Mobile | ☐ | ☐ | |
| Security | ☐ | ☐ | |
| Performance | ☐ | ☐ | |

**Overall Status:** ☐ Ready for Production | ☐ Needs Fixes

**Critical Issues Found:**
-
-

**Recommendations:**
-
-

---

Last Updated: February 16, 2026
