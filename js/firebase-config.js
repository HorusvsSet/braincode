/**
 * Firebase Configuration
 * 
 * IMPORTANT: Replace these values with your own Firebase project config.
 * 
 * Steps to get these values:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Go to Project Settings > General > Your apps > Web app
 * 4. Copy the firebaseConfig object
 * 5. Enable Authentication: Authentication > Sign-in method > Email/Password + Google
 * 6. Enable Firestore: Firestore Database > Create database
 */

// ============================================================
// 🔴 REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG 🔴
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyA1xAJRHOMfmABAv8Iz6hfFQhdG553jD2w",
  authDomain: "braincode-platform.firebaseapp.com",
  projectId: "braincode-platform",
  storageBucket: "braincode-platform.firebasestorage.app",
  messagingSenderId: "817871041336",
  appId: "1:817871041336:web:f8dbd0ed81b5c3ead2c7cd"
};
// ============================================================

// Initialize Firebase
let firebaseApp;
let firebaseAuth;
let firebaseDb;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();
  console.log('Firebase initialized');
} catch (e) {
  console.warn('Firebase not configured. Auth and progress will be unavailable.', e.message);
}
