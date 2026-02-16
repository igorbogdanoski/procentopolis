# 🔥 Firebase Setup Guide for Percentopolis

## 📋 Prerequisites
- Firebase Project created at https://console.firebase.google.com/
- Firebase Realtime Database enabled
- Firebase config copied to `script.js`

---

## 🔐 Step 1: Configure Security Rules

### Current Status: ⚠️ **OPEN ACCESS** (Not Secure!)

Your current Firebase rules allow **anyone** to read and write data. This is a **CRITICAL SECURITY RISK**.

### How to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **percentopolis**
3. Navigate to: **Realtime Database → Rules**
4. Replace existing rules with the content from `firebase-rules.json`
5. Click **Publish**

### What the rules do:

```json
✅ Rooms are readable by everyone (needed for students to join)
✅ Only allow valid room creation
✅ Player data is validated (name length, money limits, position bounds)
✅ Game board cells have owner/building constraints
✅ Turn rotation is validated
✅ Prevent negative money exploits (limit: -5000 to 1,000,000)
```

---

## 🔒 Step 2: Enable Authentication (Recommended)

Currently, the app works **without authentication**. This is OK for a classroom setting, but for production you should add:

### Option A: Anonymous Authentication (Easiest)
```javascript
// In Firebase Console → Authentication → Sign-in method
// Enable: Anonymous

// In script.js (add before db initialization):
firebase.auth().signInAnonymously()
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch((error) => {
    console.error('Auth error:', error);
  });
```

### Option B: Google Sign-In (For Teachers)
```javascript
// Enable Google Sign-in in Firebase Console
// Teachers sign in with school Google account
// Students use anonymous auth

const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider);
```

---

## 📊 Step 3: Configure Realtime Database

### Index Configuration
For better query performance, add these indexes:

```json
{
  "rules": {
    "rooms": {
      ".indexOn": ["status", "teacherName", "createdAt"]
    }
  }
}
```

### Backup Configuration
1. Go to **Realtime Database → Backups**
2. Enable **Daily Automatic Backups**
3. Retention: **30 days**

---

## 🔍 Step 4: Monitor Usage

### Set up Budget Alerts:
1. Go to **Project Settings → Usage and Billing**
2. Set alert at: **50%, 75%, 90%** of quota
3. Monitor:
   - Database reads/writes
   - Bandwidth
   - Storage

### Typical Usage (per game session):
- **Players:** 4-6 students
- **Duration:** 40 minutes
- **Reads:** ~2,000-3,000
- **Writes:** ~500-800
- **Bandwidth:** ~10-20 MB

**Free Tier Limits:**
- Reads: 100K/day ✅ (Enough for ~30 game sessions)
- Writes: 20K/day ✅ (Enough for ~25 game sessions)
- Bandwidth: 10 GB/month ✅

---

## 🚨 Security Checklist

Before going to production, verify:

- [ ] Firebase Security Rules are configured (not default open)
- [ ] API keys are **NOT** committed to public repos (use environment variables)
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Input validation on both client AND server side
- [ ] Rate limiting configured (to prevent spam/abuse)
- [ ] Backup strategy in place

---

## 🔧 Testing Security Rules

Use Firebase Emulator to test rules locally:

```bash
npm install -g firebase-tools
firebase login
firebase init emulators
firebase emulators:start
```

Then update `script.js`:
```javascript
if (location.hostname === "localhost") {
  db.useEmulator("localhost", 9000);
}
```

---

## 📚 Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Realtime Database Best Practices](https://firebase.google.com/docs/database/usage/best-practices)
- [Security Checklist](https://firebase.google.com/support/guides/security-checklist)

---

## ⚠️ ВАЖНО!

**НЕ ГО ОБЈАВУВАЈТЕ на GitHub како public repo ако содржи Firebase config!**

Either:
1. Make repo **private**
2. OR move Firebase config to `.env` file (excluded from git)

```javascript
// .env (не commitувај ова!)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=percentopolis.firebaseapp.com
...

// script.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  ...
};
```

---

Last updated: February 16, 2026
