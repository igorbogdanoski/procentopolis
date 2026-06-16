# Percentopolis - Technical Specification and Logic

**Percentopolis** is an innovative EdTech platform that combines "Monopoly" mechanics with mathematical challenges for learning percentages. The application is designed for live (multiplayer) interaction between students and teachers.

## 1. System Architecture
- **Frontend**: Pure JavaScript (ES6+), HTML5, and CSS3. Uses **Glassmorphism** design for a modern look.
- **Backend**: **Firebase Realtime Database**. Provides low-latency synchronization (under 100ms) for simultaneous player movement.
- **State Management**: The entire game state (positions, money, property ownership) is stored in the cloud, allowing the game to continue even after a page refresh (Reconnection system).

## 2. Key Features
- **Live Multiplayer**: Supports 2 to 8 players per room. Every move is visible to all in real-time.
- **Advanced Teacher Panel**: Allows monitoring of students' "Thinking" status, review of correct/wrong answers, and overall class success.
- **Multi-Room**: Teachers can create multiple rooms simultaneously (e.g., for different groups in the class) and switch between them through the lobby.
- **Adaptive Difficulty**: The game contains over **220 tasks** divided into 3 levels. The teacher can set the difficulty for the entire room (Easy, Standard, Hard).

## 3. Math Engine
- **Smart Distractors**: Instead of random numbers, the system generates incorrect answers based on the most common student mistakes:
    - **Decimal Slip**: Error in decimal place (e.g., 25 instead of 2.5).
    - **Addition Error**: Adding the percentage to the base (e.g., 100 + 20% = 120).
    - **Complementary**: Calculating the remainder (e.g., 80% instead of 20%).
    - **Half/Double**: Proportional errors.
- **Pedagogical Hints**: Visual aid does not provide the answer but guides the student through the concept (e.g., "Divide by 100 and multiply by X").

## 4. Economy and Strategy
- **Initial Capital**: Each student starts with **1000d** (configurable).
- **Bank Loan System**: If a student goes into negative balance, the bank offers a loan task. If they don't solve it, they must sell properties (Mortgage) for 50% of the value.
- **Monopoly Rule**: Building houses is allowed only if the student owns all properties of the same color.
- **Shop (Power-ups)**: Strategic elements like "Lawyer" (tax shield), "Shield" (rent shield), and "Nitro" (double movement).

## 5. Digital Whiteboard
Each task window includes an interactive drawing board with precise coordinate mapping (Responsive coordinate mapping). This allows solving tasks directly on the screen, ideal for tablets and smart boards.

## 6. Teacher's Role
The teacher is a **Spectator**. They do not participate in the turn-rotation, allowing them to focus on monitoring and helping students who need assistance. The control panel provides live insight into which student is "thinking" (isThinking state) and who is ready for the next move.
