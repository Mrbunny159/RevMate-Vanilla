// ============================================
// WEBVIEW DETECTION & REDIRECT HANDLER
// Safe Google Auth for Android/iOS WebViews
// ============================================

import { auth, db } from './firebase-config.js';
import { getRedirectResult } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

/**
 * Detects if the app is running in a WebView (Android/iOS)
 * Checks for common WebView user-agent patterns
 * @returns {boolean} True if WebView detected
 */
export function isWebView() {
  const userAgent = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(userAgent) && /Version\/[\d.]+\s+Chrome/.test(userAgent) === false && /[wW]eb[vV]iew/.test(userAgent);
  const isIOSWebView = /iPhone|iPad|iPod/.test(userAgent) && !/Safari/.test(userAgent) && /AppleWebKit/.test(userAgent);
  const isMedian = /Median/.test(userAgent) || window.location.hostname.includes('median') || typeof window.median !== 'undefined';
  
  const detected = isAndroidWebView || isIOSWebView || isMedian;
  
  if (detected) {
    console.log('🔍 WebView detected:', {
      userAgent: userAgent.substring(0, 100),
      isAndroidWebView,
      isIOSWebView,
      isMedian
    });
  }
  
  return detected;
}

/**
 * Handles redirect result after Google Sign-In redirect
 * This is called on app load to complete the login flow
 * @param {Object} auth - Firebase auth instance
 * @returns {Promise<Object>} User result or null if no redirect
 */
export async function handleAuthRedirect(auth) {
  try {
    console.log('🔄 Checking for redirect result...');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('✅ Redirect result found - login successful');
      const user = result.user;
      
      // Create/update user document in Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log('📝 Creating new user document for', user.email);
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL || null,
            authProvider: 'google',
            createdAt: new Date(),
            following: []
          });
        } else {
          console.log('👤 User document already exists');
        }
      } catch (firestoreError) {
        console.error('⚠️ Firestore error during redirect handling:', firestoreError);
        // Continue even if Firestore fails; user is already authenticated
      }
      
      return {
        success: true,
        user: {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL,
          authProvider: 'google'
        }
      };
    } else {
      console.log('ℹ️ No redirect result - fresh session or popup login');
      return null;
    }
  } catch (error) {
    console.error('❌ Redirect result error:', error.code, error.message);
    return null;
  }
}

/**
 * Log detailed information for debugging WebView issues
 * @param {string} stage - Current stage (e.g., 'LOGIN_STARTED', 'POPUP_BLOCKED')
 * @param {Object} details - Additional debug info
 */
export function logWebViewDebug(stage, details = {}) {
  const timestamp = new Date().toISOString();
  const debugInfo = {
    timestamp,
    stage,
    userAgent: navigator.userAgent.substring(0, 150),
    isWebView: isWebView(),
    ...details
  };
  
  console.log(`🐛 [${stage}]`, debugInfo);
  
  // Store in sessionStorage for later inspection
  try {
    const logs = JSON.parse(sessionStorage.getItem('webview_debug_logs') || '[]');
    logs.push(debugInfo);
    // Keep last 20 logs
    if (logs.length > 20) logs.shift();
    sessionStorage.setItem('webview_debug_logs', JSON.stringify(logs));
  } catch (e) {
    // Silently fail if storage unavailable
  }
}

/**
 * Get stored debug logs (for inspection in console)
 * @returns {Array} Array of debug log objects
 */
export function getWebViewDebugLogs() {
  try {
    return JSON.parse(sessionStorage.getItem('webview_debug_logs') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clear debug logs
 */
export function clearWebViewDebugLogs() {
  try {
    sessionStorage.removeItem('webview_debug_logs');
    console.log('✅ Debug logs cleared');
  } catch (e) {
    // Silently fail
  }
}

// ============================================
// MEDIAN.CO CONFIGURATION GUIDE
// ============================================
/*
To enable Google Sign-In in Median.co WebView:

1. REDIRECT DOMAINS (Median → Rules → External Browsers):
   ✅ https://accounts.google.com/*
   ✅ https://*.googleusercontent.com/*
   ✅ https://*.firebaseapp.com/*
   ✅ https://your-custom-domain.com/* (if applicable)
   ✅ All other HTTPS links → External

2. FIREBASE CONFIGURATION:
   - Go to Firebase Console → Authentication → Settings
   - Add your app domain to "Authorized domains"
   - Ensure your Google OAuth credential includes:
     * Web (for popup login on desktop)
     * Android or iOS (for WebView on mobile)

3. GOOGLE CLOUD CONSOLE:
   - Create OAuth 2.0 credentials (Web type)
   - Add authorized redirect URIs:
     * https://your-firebaseapp.firebaseapp.com/__/auth/handler
     * https://your-custom-domain.com/__/auth/handler (if custom domain)

4. MEDIAN LINK BEHAVIOR:
   In your Median.co dashboard:
   - Settings → Links → "Open external links in device browser"
   - This ensures OAuth flows open in the system browser, not the WebView
   - Median will handle the redirect back to the app

5. TESTING:
   - Open the app in Median on Android/iOS
   - Click "Google Sign-In" button
   - Browser should open → redirect to Google → redirect back to app
   - In console: run getWebViewDebugLogs() to inspect login flow

If "Error 403: disallowed_useragent" appears:
   → Check that links are configured to open in External Browser
   → Ensure authorized domains are added in Firebase Console

If "Error (auth/popup-blocked)" appears:
   → WebView was detected; redirect flow should be used instead
   → Check console for "WebView detected" log

If "Error (auth/invalid-credentials)" appears:
   → Firestore user doc creation may have failed
   → Check Firestore rules allow write to /users/{uid}
   → Check browser console for Firestore error details
*/
