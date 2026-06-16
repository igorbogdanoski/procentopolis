# Percentopolis (Multiplayer)

A mathematical game about percentages, now live with 4-8 players!

## 🚀 How to start

### 1. Firebase Setup (Required)
For the game to work live, you must create your own Firebase database:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., "Percentopolis").
3. Add a **Web App** to the project.
4. Copy the `firebaseConfig` object.
5. Open the `script.js` file and replace the placeholder with your data:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       ...
   };
   ```
6. In the Firebase Console, go to **Realtime Database** and activate it.
7. Set the database **Rules** to `true` for testing (or appropriate authentication):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

### 2. Vercel Hosting
1. Create a new repository on GitHub.
2. Push this code there.
3. Connect the repository with [Vercel](https://vercel.com/).
4. Enjoy the game live!

## 🛠️ Technologies
- **Frontend:** HTML5, CSS3, JavaScript
- **Backend/Database:** Firebase Realtime Database
- **Hosting:** Vercel
- **QR Codes:** qrcode.js

## 👤 Author
The original version of Percentopolis has been refactored for multiplayer support.
