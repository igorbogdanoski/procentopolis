# ProcentOpolis — BDE Package
### Digital Educational Game for Percentages | Professional Evaluation Package

---

## 1. Covering E-mail

**To:** Mathematics Consultants — Bureau for Development of Education (BDE)
**From:** [Teacher's Name / Author]
**Subject:** Request for Evaluation and Recommendation — Digital Educational Game "ProcentOpolis"
**Date:** [Date]

---

Dear Sir/Madam,

I am addressing you with a request for the evaluation of an educational digital game titled **"ProcentOpolis"**, intended for mathematics instruction in primary education — specifically the topic of **Percentages (6th–7th Grade)**.

The game is a multiplayer, browser-based application (no installation required), available for free at:
**https://procentopolis.vercel.app**

The application was developed to allow students to practice percentage calculations in a real-world, competitive, and collaborative context — through a simulation of an economic board game for multiple players (up to 8 students), in real-time under teacher guidance.

I am attaching a pedagogical and technical summary of the application and ask for your professional assessment and eventual recommendation for use in teaching practice.

Sincerely,
[Signature, Institution, Contact]

---

## 2. Executive Summary

| Field | Details |
|------|--------|
| **Application Name** | ProcentOpolis |
| **URL** | https://procentopolis.vercel.app |
| **Type** | Multiplayer educational game, browser-based |
| **Platform** | Web (Chrome, Firefox, Edge, Safari) — no installation |
| **Intended Age Range** | 6th–7th Grade (11–13 years) |
| **Curricular Topic** | Percentages — calculation, application, financial literacy |
| **Number of Players** | 2–8 students + 1 teacher (room leader) |
| **Language** | English (formerly Macedonian) |
| **Price** | Free, no registration |
| **Data Storage** | No personal data — anonymous authentication via Firebase |
| **Status** | Functional prototype — tested in teaching environments |

### Key Pedagogical Values

- **Authentic Context**: Students buy properties, pay rent, taxes, and commissions — math is embedded in the situation, not isolated.
- **Progressive Difficulty**: Three levels of questions (D1 / D2 / D3) — from basic calculation to inverse application.
- **Formative Feedback**: After each game — a personalized summary by question type.
- **Teacher Control**: The teacher creates a room, sees all players in real-time, and can manually end the game.
- **Zero Risk**: Anonymous sessions, no registration, no commercial interest.

---

## 3. Pedagogical Summary

### 3.1 Game Description

ProcentOpolis is a digital board game inspired by the classic "Monopoly" format but completely redesigned for educational purposes. All game mechanics are directly linked to the mathematical learning of percentages.

**Gameplay Flow:**
1. The teacher creates a room with a unique code and shares it with the students.
2. Students join via their browser — no registration, just a nickname.
3. The teacher starts the game; players roll the dice in sequence.
4. Upon landing on a cell (property, tax, chance, bonus) — the player receives a mathematical question.
5. Correct answer → successful transaction; Incorrect → loss of money / missed purchase.
6. Upon completion (40 minutes or turn limit) — results and reflections are displayed.

**Special Mechanics:**
- **Knowledge Auction (Market)**: When a player answers incorrectly, the question goes to auction — all players can bid and earn points.
- **Loan**: A player with a low balance can take a loan — by calculating interest.
- **Construction**: Advanced players can build on a property — by calculating increased rent.

### 3.2 Mathematical Content and Curriculum Alignment

The game covers the following outcomes provided by the mathematics curriculum for 6th and 7th Grade:

| Question Type | Mathematical Content | Level |
|----------------|----------------------|------|
| **BUY – D1** | Calculate X% of a given price | Basic (D1) |
| **BUY – D2** | Calculate total price with commission (price + X%) | Medium (D2) |
| **BUY – D3** | New rent after an increase of R% | Advanced (D3) |
| **RENT – D1** | X% of property value | Basic (D1) |
| **RENT – D2** | Rent after construction (increased by 20%) | Medium (D2) |
| **RENT – D3** | New rent after a hidden increase | Advanced (D3) |
| **TAX** | Remainder after deducting 10% tax | Medium (D2) |
| **BONUS** | 15% of current capital | Basic (D1) |
| **LOAN** | Interest (X% of 1500) | Advanced (D3) |
| **BUILD** | Rent increase by a random % | Advanced (D3) |
| **CHANCE** | Question based on number of turns (D1→D2→D3) | Adaptive |

Questions are **contextually generated** — the values in the question reflect the actual property and price in the game (not random abstract numbers), achieving **functional knowledge transfer**.

### 3.3 Pedagogical Approach and Theoretical Framework

**Game-Based Learning (GBL)**
The game applies GBL principles: students are motivated through rewards, competition, and cooperation; mathematical thinking is embedded in game decisions — not isolated practice.

**Zone of Proximal Development (Vygotsky)**
The adaptive difficulty system (D1 → D2 → D3) ensures gradual progression — each player starts with easier questions and advances to more complex ones based on the number of turns.

**Formative Assessment and Metacognition**
After each game, every student receives a personalized summary:
- How many questions by type (purchase, rent, tax...) they received/missed.
- Which types are weaker for them (for self-reflection).
- The teacher receives an aggregated report by student and by question type.

**Collaborative Learning**
The auction mechanic (Knowledge Market) encourages students to pay attention to other players' questions as well — not just their own — creating collective engagement.

### 3.4 Alignment with Ministry of Education Documents

| Document | Relation to the Game |
|-------------|-----------------|
| Mathematics Curriculum — 6th Grade | Topic "Percentages": calculation, practical application |
| Mathematics Curriculum — 7th Grade | Expanded application: permille, financial literacy |
| Conception for Primary Education (2018) | Active learning, digital competence, critical thinking |
| Digitalization Strategy for Education 2020–2025 | Use of ICT in the teaching process |
| Key Competencies Framework | Mathematical competence + digital competence |

### 3.5 Security and Privacy

- **No Registration**: Students do not enter e-mail, passwords, or any personal data.
- **Anonymous Authentication**: Firebase generates a temporary anonymous ID; after closing the browser, the session ceases to exist.
- **No Third Parties**: No ads, no tracking, no commercial model.
- **No History Storage**: After the game ends, the corresponding Firebase records are archived/deleted.
- **GDPR Compatibility**: No processing of personal data in the sense of GDPR / Law on Personal Data Protection.
- **Open Source**: Available for inspection on GitHub (github.com/igorbogdanoski/procentopolis)

### 3.6 Technical Conditions for Use

| Requirement | Details |
|-------|--------|
| **Device** | Computer, tablet, or smartphone |
| **Browser** | Chrome, Firefox, Edge, Safari (current versions) |
| **Internet** | Required (the game is real-time) |
| **Installation** | Not required |
| **Account** | Not required |
| **Projector/Screen** | Recommended for the teacher — monitoring the status of all players |

---

## 4. Accessing the Application

### Direct Use (No Installation)

The application is immediately available via browser:

**https://procentopolis.vercel.app**

### Teacher's Manual (Quick Start)

1. Open the page in the browser.
2. Click **"Teacher"**.
3. Enter a suitable room code (or generate one automatically).
4. Share the code with the students.
5. Wait for students to join (monitor them in real-time).
6. Click **"Start Game"**.
7. Upon completion — review the report per student.

### Student's Instructions

1. Open the page in the browser.
2. Click **"Student"**.
3. Enter the room code (received from the teacher).
4. Enter a nickname.
5. Wait for the teacher to start the game.

### Source Code and Documentation

- **GitHub Repository**: https://github.com/igorbogdanoski/procentopolis
- **Hosting**: Vercel (free tier, no SLA — intended for educational use)
- **Contact**: [Author's e-mail]

---

## 5. Request for Evaluation

Dear Consultants,

I ask for your professional evaluation of the "ProcentOpolis" application in the following aspects:

1. **Curriculum Alignment** — is the mathematical content accurate and appropriate for the target age range.
2. **Pedagogical Value** — does the game contribute to achieving teaching goals.
3. **Practical Applicability** — is it realistically feasible in standard teaching conditions.
4. **Recommendation** — can the application be recommended to mathematics teachers.

The game is available for immediate use. If you would like a practical demonstration or additional materials, I am at your disposal.

Thank you in advance for your time and professional assessment.

Sincerely,
[Signature]

---

*This document was prepared for the BDE — Bureau for Development of Education, Republic of North Macedonia.*
*Version: 1.0 | March 2026*
