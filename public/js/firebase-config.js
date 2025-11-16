// ============================================
// FIREBASE CONFIGURATION (ES Module, CDN v12.6.0)
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis",
  authDomain: "avishkar-c9826.firebaseapp.com",
  projectId: "avishkar-c9826",
  storageBucket: "avishkar-c9826.firebasestorage.app",
  messagingSenderId: "480658299095",
  appId: "1:480658299095:web:1d1cda6f2f36713738b892",
  measurementId: "G-Z565TNDFD1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Auth for WebView compatibility
// This ensures session persistence works correctly in WebView environments
auth.setPersistence = undefined; // Reset to default (LOCAL persistence)
if (typeof auth.settings !== 'undefined') {
  auth.settings.appVerificationDisabledForTesting = false;
}

// Export Firebase services for use in other modules
// expose db on window for modules that expect window.db
if (typeof window !== 'undefined') window.db = db;

export { app, analytics, auth, db, storage };
