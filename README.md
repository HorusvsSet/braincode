# 🧠 BrainCode

**LeetCode-style platform for mastering Brainfuck programming.**

Solve coding challenges using one of the most mind-bending esoteric programming languages ever created. Level up your algorithmic thinking with just 8 commands.

## 🚀 Features

- 🔐 **Authentication** — Login with Google or Email/Password (Firebase Auth)
- 🧠 **Challenges** — 10 curated problems from Easy to Hard
- ✍️ **Built-in Editor** — Write, run, and submit Brainfuck code
- ✅ **Test Cases** — Instant validation against hidden test cases
- 📊 **Progress Tracking** — Save your solutions (localStorage + Firestore)
- 🎨 **Dark/Light Theme** — Toggle between themes
- 📱 **Responsive** — Works on desktop and mobile

## 📦 Setup Instructions

### 1. Clone & Deploy to GitHub Pages

```bash
# Create a new repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
# Copy all files from this braincode/ folder into the repo
git add .
git commit -m "Initial commit: BrainCode platform"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under "Source", select `main` branch and `/ (root)` folder
3. Click **Save**
4. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 3. Configure Firebase 🔴 IMPORTANT

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Create a new project** (or use existing)
3. **Add a Web App** to your project:
   - Click the `</>` web icon
   - Register your app
   - Copy the `firebaseConfig` object
4. **Enable Authentication**:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (configure OAuth consent screen)
5. **Enable Firestore**:
   - Go to **Firestore Database** → **Create database**
   - Choose **Start in production mode** or **test mode**
6. **Update config**: Open `js/firebase-config.js` and replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

### 4. Authorized Domains

In Firebase Console → **Authentication** → **Settings** → **Authorized domains**, add:
- `YOUR_USERNAME.github.io` (for GitHub Pages)

## 🏗️ Project Structure

```
braincode/
├── index.html              # Main HTML shell (SPA)
├── css/
│   └── style.css           # Full dark/light theme styles
├── js/
│   ├── firebase-config.js  # 🔴 Firebase config (REPLACE VALUES)
│   ├── auth.js             # Auth module (login/register/logout)
│   ├── brainfuck.js        # Brainfuck interpreter engine
│   ├── challenges.js       # Challenge/problem definitions
│   ├── editor.js           # Code editor & execution logic
│   └── app.js              # SPA router & main app logic
└── README.md
```

## 🧠 Brainfuck Commands

| Command | Name | Description |
|---------|------|-------------|
| `>` | Right | Move pointer right |
| `<` | Left | Move pointer left |
| `+` | Increment | Increase byte at pointer |
| `-` | Decrement | Decrease byte at pointer |
| `.` | Output | Print byte as character |
| `,` | Input | Read one byte |
| `[` | Loop Start | Jump past `]` if byte is 0 |
| `]` | Loop End | Jump back to `[` if byte is not 0 |

## 📝 Challenges Included

| # | Title | Difficulty | Category |
|---|-------|------------|----------|
| 1 | Hello, World! | Easy | Strings |
| 2 | Print the Alphabet | Easy | Loops |
| 3 | Uppercase Converter | Easy | Strings |
| 4 | Add Two Numbers | Medium | Math |
| 5 | Multiply Two Numbers | Medium | Math |
| 6 | Reverse a String | Hard | Strings |
| 7 | Fibonacci Sequence | Hard | Math |
| 8 | Character Counter | Medium | Strings |
| 9 | Which is Greater? | Medium | Math |
| 10 | Brainfuck Quine | Hard | Advanced |

## 🔧 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no build tools required)
- **Auth**: Firebase Authentication (Google + Email/Password)
- **Database**: Firebase Firestore (user progress)
- **Hosting**: GitHub Pages (free static hosting)
- **Brainfuck Engine**: Custom interpreter with memory safety & timeout protection

## 📄 License

MIT — feel free to use and modify!
