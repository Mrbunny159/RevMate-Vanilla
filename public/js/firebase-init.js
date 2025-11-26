// ============================================
// FIREBASE INITIALIZATION (CENTRAL MODULE)
// ============================================
// Purpose: Single source of truth for Firebase initialization
// Ensures initializeApp runs before any service retrieval
// All other modules import from here to get initialized instances
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis",
  authDomain: "avishkar-c9826.firebaseapp.com",
  projectId: "avishkar-c9826",
  storageBucket: "avishkar-c9826.firebasestorage.app",
  messagingSenderId: "480658299095",
  appId: "1:480658299095:web:1d1cda6f2f36713738b892",
  measurementId: "G-Z565TNDFD1"
};

// ============================================
// INITIALIZE FIREBASE
// ============================================

// Step 1: Initialize app first (REQUIRED before other services)
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

// Step 2: Initialize services with the app instance
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Step 3: Configure auth persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence enabled');
  })
  .catch(err => {
    console.warn('⚠️ Auth persistence warning:', err.code, err.message);
  });

// ============================================
// EXPOSE GLOBALS (for legacy compatibility)
// ============================================

if (typeof window !== 'undefined') {
  window.db = db;
  window.auth = auth;
  window.firebaseAuth = auth;
  window.firebaseApp = app;
}

// ============================================
// EXPORTS - USE THESE INSTANCES EVERYWHERE
// ============================================

export { app, auth, db, storage, analytics };
