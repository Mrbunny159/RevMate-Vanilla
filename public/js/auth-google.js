// ============================================
// GOOGLE SIGN-IN MODULE (HYBRID FLOW)
// Production-Ready OAuth for All Platforms
// ============================================
// Purpose: Self-contained Google OAuth implementation
//   - Works in desktop browsers (popup flow)
//   - Works in WebView wrappers (redirect flow)
//   - Works in Median.co (redirect → external browser)
//   - Works in native Android (Custom Tabs + deep link)
//   - Automatic fallback handling
//   - Comprehensive error messages
//
// Usage in other modules:
//   import { googleLogin, setupAuthListener } from './auth-google.js';
//   googleLogin().then(result => console.log(result));
//
// ============================================

import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {
  doc,
  setDoc,
<<<<<<< HEAD
  getDoc
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
=======
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { createUniqueUsername } from './utils/username-generator.js';
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
import {
  isEmbeddedWebView,
  getWrapperType,
  canOpenExternalBrowser,
  logEnvironmentDetection,
  getEnvironmentSummary
} from './env-detect.js';

// ============================================
// ERROR CODE → USER MESSAGE MAPPING
// ============================================

const ERROR_MESSAGE_MAP = {
  'auth/popup-blocked': 
    'Popup blocked by your browser. Please allow popups and try again, or use Email/Phone Sign-In.',
  
  'auth/cancelled-popup-request':
    'You cancelled the sign-in. Please try again.',
  
  'auth/popup-closed-by-user':
    'You closed the sign-in window. Please try again.',
  
  'auth/disallowed-useragent':
    'Your browser environment doesn\'t support this sign-in method. Using fallback...',
  
  'auth/operation-not-supported-in-this-environment':
    'Sign-In is not supported in this browser. Please try Email or Phone Sign-In.',
  
  'auth/auth-domain-config-required':
    'Firebase is not properly configured for this domain. Please contact support.',
  
  'auth/invalid-api-key':
    'Firebase configuration error (invalid API key). Please contact support.',
  
  'auth/invalid-client-id':
    'Firebase configuration error (invalid client ID). Please contact support.',
  
  'auth/network-request-failed':
    'Network error. Please check your internet connection and try again.',
  
  'auth/cors-not-allowed':
    'Cross-origin request blocked. This is a browser security issue.',
  
  'auth/missing-required-parameter':
    'Firebase configuration is incomplete. Please contact support.',
  
  'auth/invalid-credentials':
    'Invalid credentials or configuration. Please try Email/Phone Sign-In or contact support.',
  
  'auth/too-many-requests':
    'Too many sign-in attempts. Please wait a moment and try again.',
  
  'auth/user-cancelled':
    'You cancelled the sign-in. Please try again.',
  
  'auth/user-disabled':
    'This account has been disabled. Please contact support.',
  
  'auth/user-not-found':
    'This account doesn\'t exist. Please create a new account or try another sign-in method.'
};

/**
 * Get user-friendly error message for error code
 * Falls back to original error message if code not in map
 * 
 * @param {string} errorCode - Firebase error code (e.g., 'auth/popup-blocked')
 * @param {string} fallbackMessage - Message to use if code not found
 * @returns {string} User-friendly message
 */
function getUserFriendlyError(errorCode, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  return ERROR_MESSAGE_MAP[errorCode] || fallbackMessage;
}

// ============================================
// MAIN GOOGLE LOGIN FUNCTION
// ============================================

/**
<<<<<<< HEAD
 * Initialize Google Sign-In with hybrid popup/redirect flow
 * 
 * Flow:
 *   1. Detect if WebView
 *   2. If WebView: use signInWithRedirect (opens external browser)
 *   3. If browser: try signInWithPopup (inline dialog)
 *   4. If popup blocked: fallback to signInWithRedirect
 *   5. On success: create/update Firestore user doc
 *   6. Return user data or error
=======
 * Initialize Google Sign-In with better error handling
 * Desktop-only, simple popup flow
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
 * 
 * @returns {Promise<{success: boolean, user?: Object, error?: string, code?: string}>}
 */
export async function googleLogin() {
  try {
<<<<<<< HEAD
=======
    console.log('🔐 Google Login initiated');
    
    const provider = new GoogleAuthProvider();
    
    // Configure provider
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      'prompt': 'select_account',  // User chooses account
      'access_type': 'offline'
    });

    console.log('📱 Attempting popup flow...');
    
    let result;
    try {
      // Try popup first (desktop browsers)
      result = await signInWithPopup(auth, provider);
      console.log('✅ Popup successful');
    } catch (popupError) {
      console.warn('⚠️ Popup failed:', popupError.code, popupError.message);
      
      // If popup blocked, try redirect
      if (popupError.code === 'auth/popup-blocked') {
        console.log('📤 Popup blocked, trying redirect flow...');
        await signInWithRedirect(auth, provider);
        return {
          success: true,
          redirecting: true,
          message: 'Redirecting to Google Sign-In...'
        };
      }
      
      throw popupError;
    }

    // Success - create user document if needed
    const user = result.user;
    console.log('✅ Auth successful:', user.email);

    // Check if user document exists in Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        console.log('📝 Creating new user document...');
        
        // Generate unique username
        const username = await createUniqueUsername(user.email, db);

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          id: user.uid,
          email: user.email,
          username: username,
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || null,
          bio: '',
          bike: '',
          city: '',
          privacySettings: {
            profilePublic: true,
            hideJoinedRides: false
          },
          stats: {
            ridesHosted: 0,
            ridesJoined: 0
          },
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          following: []
        });
        console.log('✅ User document created');
      } else {
        console.log('👤 User already exists');
        // Update last active
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp()
        });
      }
    } catch (firestoreError) {
      console.error('⚠️ Firestore error:', firestoreError);
      // Continue even if Firestore fails
    }

    return {
      success: true,
      user: {
        id: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        photoURL: user.photoURL
      }
    };

  } catch (error) {
    console.error('❌ Google login error:', error.code, error.message);
    
    // User-friendly error messages
    const errorMessage = mapFirebaseError(error.code);
    
    return {
      success: false,
      error: errorMessage,
      code: error.code
    };
  }
}

/**
 * Map Firebase error codes to user-friendly messages
 */
function mapFirebaseError(code) {
  const messages = {
    'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again, or use Email Sign-In.',
    'auth/cancelled-popup-request': 'Sign-In cancelled. Please try again.',
    'auth/popup-closed-by-user': 'Sign-In window closed. Please try again.',
    'auth/operation-not-supported-in-this-environment': 'Google Sign-In not supported in this browser.',
    'auth/invalid-api-key': 'Firebase configuration error. Please contact support.',
    'auth/auth-domain-config-required': 'Firebase is not configured for this domain.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/cors-not-allowed': 'Cross-origin error. This is a browser security issue.',
    'auth/invalid-client-id': 'Firebase configuration error (invalid client ID).',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.'
  };
  
  return messages[code] || 'Sign-In failed: ' + code + '. Please try Email Sign-In instead.';
}

/**
 * OLD CODE - Initialize Google Sign-In with better error handling
 * Desktop-only, simple popup flow
 * 
 * @returns {Promise<{success: boolean, user?: Object, error?: string, code?: string}>}
 */
/* DISABLED
export async function googleLogin() {
  try {
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
    // Log environment at start
    logEnvironmentDetection('GOOGLE_LOGIN_START', {
      isWebView: isEmbeddedWebView(),
      wrapperType: getWrapperType(),
      summary: getEnvironmentSummary()
    });

    const provider = new GoogleAuthProvider();
    
    // Configure provider for max compatibility
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      'prompt': 'select_account',  // User chooses which account
      'access_type': 'offline'     // Allow refresh tokens
    });

    const isWebView = isEmbeddedWebView();
    const canOpenExternal = canOpenExternalBrowser();
    
    // Check if running in PWA standalone mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    console.log('🔐 Google Login:', {
      isWebView,
      wrapperType: getWrapperType(),
      canOpenExternal,
      isPWA
    });

    let result;

    // =====================================
    // DECISION: POPUP vs REDIRECT
    // =====================================
    
    // Use redirect for PWA standalone mode or WebView
    if (isPWA || (isWebView && canOpenExternal)) {
      // PWA or WebView detected: Use redirect flow
      if (isPWA) {
        console.log('📱 PWA standalone mode detected - using redirect flow');
      } else {
        console.log('📱 WebView detected - using redirect flow');
      }
      logEnvironmentDetection('GOOGLE_LOGIN_REDIRECT_FLOW', {
        reason: isPWA ? 'PWA standalone mode' : 'WebView detected'
      });

      try {
        await signInWithRedirect(auth, provider);
        // After redirect, getRedirectResult() is called on app load (see handleAuthRedirect)
        console.log('✅ Redirect initiated - user will be returned to app');
        return {
          success: true,
          message: 'Redirecting to Google Sign-In...',
          redirecting: true
        };
      } catch (redirectError) {
        console.error('❌ Redirect flow failed:', redirectError.code, redirectError.message);
        logEnvironmentDetection('GOOGLE_LOGIN_REDIRECT_FAILED', {
          code: redirectError.code,
          message: redirectError.message
        });
        throw redirectError;
      }

    } else {
      // Desktop/mobile browser: Use popup flow
      console.log('🖥️ Desktop browser detected - using popup flow');
      logEnvironmentDetection('GOOGLE_LOGIN_POPUP_FLOW', {
        reason: 'Browser environment'
      });

      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
        console.log('✅ Popup login successful');
        logEnvironmentDetection('GOOGLE_LOGIN_POPUP_SUCCESS', {
          uid: result.user.uid,
          email: result.user.email
        });

      } catch (popupError) {
        console.error('❌ Popup error:', popupError.code, popupError.message);
        logEnvironmentDetection('GOOGLE_LOGIN_POPUP_FAILED', {
          code: popupError.code,
          message: popupError.message
        });

        // Handle popup-blocked error with fallback
        if (popupError.code === 'auth/popup-blocked') {
          console.log('⚠️ Popup was blocked - trying redirect fallback');
          logEnvironmentDetection('GOOGLE_LOGIN_POPUP_BLOCKED_FALLBACK', {
            attemptingRedirect: true
          });

          try {
            await signInWithRedirect(auth, provider);
            console.log('✅ Redirect fallback initiated');
            return {
              success: true,
              message: 'Popup was blocked. Redirecting to sign-in...',
              redirecting: true
            };
          } catch (fallbackError) {
            console.error('❌ Redirect fallback failed:', fallbackError.code);
            logEnvironmentDetection('GOOGLE_LOGIN_FALLBACK_FAILED', {
              code: fallbackError.code
            });
            throw fallbackError;
          }
        }

        // Other popup errors - don't try fallback, just throw
        throw popupError;
      }
    }

    // =====================================
    // SUCCESS: Process user from popup result
    // =====================================
    
    const user = result.user;
    console.log('👤 User authenticated:', user.uid, user.email);

    // Create or update user document in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New user - create document
        console.log('📝 Creating Firestore document for new user');
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          authProvider: 'google',
          createdAt: new Date(),
          following: []
        });
      } else {
        // Existing user - document already exists
        console.log('👤 User document exists');
      }

      // Fetch final user data
      const finalDocSnap = await getDoc(userDocRef);
      const userData = finalDocSnap.data() || {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        following: []
      };

      logEnvironmentDetection('GOOGLE_LOGIN_SUCCESS', {
        uid: user.uid,
        email: userData.email,
        name: userData.name
      });

      return {
        success: true,
        user: {
          id: user.uid,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL,
          authProvider: 'google',
          following: userData.following || []
        }
      };

    } catch (firestoreError) {
      console.error('⚠️ Firestore error during user setup:', firestoreError.code, firestoreError.message);
      // User is still authenticated even if Firestore fails
      // Return partial success
      return {
        success: true,
        user: {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL,
          authProvider: 'google'
        },
        warning: 'User authenticated but profile setup had an issue'
      };
    }

  } catch (error) {
    console.error('❌ Google login error:', error.code, error.message, error);
    
    logEnvironmentDetection('GOOGLE_LOGIN_ERROR', {
      code: error.code,
      message: error.message,
      isWebView: isEmbeddedWebView(),
      summary: getEnvironmentSummary()
    });

    // Get user-friendly message
    const userMessage = getUserFriendlyError(error.code, error.message);

    return {
      success: false,
      error: userMessage,
      code: error.code,
      originalMessage: error.message
    };
  }
}

// ============================================
// REDIRECT RESULT HANDLER
// ============================================

/**
 * Handle OAuth redirect result
 * Call this on page load to complete redirect-based OAuth flows
 * Used by: index.html and auth-handler.html
 * 
 * Returns:
 *   - User object if redirect completed successfully
 *   - null if no redirect in progress
 *   - Error object if redirect failed
 * 
 * @returns {Promise<{success: boolean, user?: Object, error?: string} | null>}
 */
export async function handleAuthRedirect() {
  try {
    logEnvironmentDetection('HANDLE_AUTH_REDIRECT_START');

    const result = await getRedirectResult(auth);

    if (!result) {
      // No redirect result - this is a fresh page load
      logEnvironmentDetection('HANDLE_AUTH_REDIRECT_NO_RESULT');
      return null;
    }

    // =====================================
    // REDIRECT COMPLETED - PROCESS USER
    // =====================================
    
    console.log('✅ Redirect result found - completing login');
    const user = result.user;

    // Create or update user in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.log('📝 Creating Firestore document for redirected user');
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          authProvider: 'google',
          createdAt: new Date(),
          following: []
        });
      }

      const finalDocSnap = await getDoc(userDocRef);
      const userData = finalDocSnap.data() || {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        following: []
      };

      logEnvironmentDetection('HANDLE_AUTH_REDIRECT_SUCCESS', {
        uid: user.uid,
        email: userData.email
      });

      return {
        success: true,
        user: {
          id: user.uid,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL || null,
          authProvider: 'google',
          following: userData.following || []
        }
      };

    } catch (firestoreError) {
      console.error('⚠️ Firestore error during redirect handling:', firestoreError.code);
      // User is authenticated even if Firestore fails
      return {
        success: true,
        user: {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          photoURL: user.photoURL || null,
          authProvider: 'google'
        },
        warning: 'Authenticated but profile setup had an issue'
      };
    }

  } catch (error) {
    console.error('❌ Redirect result error:', error.code, error.message);
    logEnvironmentDetection('HANDLE_AUTH_REDIRECT_ERROR', {
      code: error.code,
      message: error.message
    });

    return {
      success: false,
      error: getUserFriendlyError(error.code, error.message),
      code: error.code
    };
  }
}

// ============================================
// AUTH STATE MANAGEMENT
// ============================================

/**
 * Setup listener for auth state changes
 * Fires callback whenever user logs in/out
 * 
 * @param {function} callback - Called with (user) where user = Firebase user or null
 * @returns {function} Unsubscribe function (call to stop listening)
 */
export function setupAuthListener(callback) {
  console.log('👁️ Setting up auth state listener');
  
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('✅ User signed in:', user.uid);
      
      // Fetch Firestore document for this user
      try {
        const userDocSnap = await getDoc(doc(db, 'users', user.uid));
        const userData = userDocSnap.data() || {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          following: []
        };
        
        callback({
          id: user.uid,
          ...userData
        });
      } catch (error) {
        // If Firestore fails, pass Firebase user data
        console.warn('⚠️ Firestore fetch failed:', error);
        callback({
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email
        });
      }
    } else {
      console.log('❌ User signed out');
      callback(null);
    }
  });
}

/**
 * Get currently authenticated user
 * Returns null if no user logged in
 * 
 * @returns {Object | null}
 */
export function getCurrentUser() {
  return auth.currentUser ? {
    id: auth.currentUser.uid,
    email: auth.currentUser.email,
    displayName: auth.currentUser.displayName,
    photoURL: auth.currentUser.photoURL
  } : null;
}

/**
 * Get current user ID
 * @returns {string | null}
 */
export function getCurrentUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Sign out current user
 * @returns {Promise<{success: boolean}>}
 */
export async function logout() {
  try {
    const { signOut } = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js');
    await signOut(auth);
    console.log('✅ User signed out');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTS SUMMARY
// ============================================
// Exported functions:
//   - googleLogin() → Start Google OAuth
//   - handleAuthRedirect() → Complete redirect flow (call on page load)
//   - setupAuthListener(callback) → Listen for auth changes
//   - getCurrentUser() → Get current user object
//   - getCurrentUserId() → Get current user ID
//   - logout() → Sign out user
//
// Error handling: All functions return {success, user/error, code}
// Logging: Uses env-detect.js logEnvironmentDetection()
// ============================================
