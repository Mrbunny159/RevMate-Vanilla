// ============================================
// FIREBASE AUTHENTICATION HELPER (ESM, CDN v12.6.0)
// ============================================

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { isWebView, handleAuthRedirect, logWebViewDebug } from './webview-helper.js';

import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @returns {Promise} User data or error
 */
export async function registerUser(email, password, name) {
    try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            name: name,
            email: email,
            createdAt: new Date(),
            following: []
        });
        
        return {
            success: true,
            user: {
                id: user.uid,
                name: name,
                email: email
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} User data or error
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        return {
            success: true,
            user: {
                id: user.uid,
                name: userData.name,
                email: userData.email,
                following: userData.following || []
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Logout the current user
 * @returns {Promise} Success or error
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Monitor auth state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get current user ID
 * @returns {string} Current user ID or null
 */
export function getCurrentUserId() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Process OAuth redirect result (called on app load)
 * Handles the redirect back from Google Sign-In in WebView
 * @returns {Promise} User data if redirected back, null if fresh session
 */
export async function processAuthRedirect() {
    if (isWebView()) {
        logWebViewDebug('PROCESS_REDIRECT_INIT', {});
        const redirectResult = await handleAuthRedirect(auth);
        
        if (redirectResult && redirectResult.success) {
            logWebViewDebug('REDIRECT_SUCCESS', { uid: redirectResult.user.id });
            return redirectResult.user;
        }
    }
    return null;
}

/**
 * Login with Google - Hybrid flow for WebView & Desktop
 * Uses signInWithPopup on desktop, signInWithRedirect in WebView
 * @returns {Promise} User data or error
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const webview = isWebView();
        
        // Configure provider scopes for better compatibility
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            'prompt': 'consent'
        });
        
        logWebViewDebug('GOOGLE_LOGIN_START', { isWebView: webview });
        
        let result;
        
        if (webview) {
            // WebView: Use redirect flow (opens external browser)
            console.log('📱 WebView detected - using redirect flow');
            console.log('ℹ️ Make sure your website wrapper is configured to open Google auth in external browser');
            logWebViewDebug('REDIRECT_FLOW_INITIATED', { 
                method: 'signInWithRedirect',
                scopes: ['email', 'profile']
            });
            await signInWithRedirect(auth, provider);
            // After redirect back, handleAuthRedirect() is called on app load
            return {
                success: true,
                message: 'Redirecting to Google Sign-In...'
            };
        } else {
            // Desktop: Use popup flow (inline auth dialog)
            console.log('🖥️ Desktop browser detected - using popup flow');
            logWebViewDebug('POPUP_FLOW_INITIATED', { method: 'signInWithPopup' });
            result = await signInWithPopup(auth, provider);
        }
        
        const user = result.user;
        logWebViewDebug('AUTH_SUCCESS', { uid: user.uid, email: user.email });
        
        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create user document if it's a new user
            logWebViewDebug('CREATE_FIRESTORE_DOC', { uid: user.uid });
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email,
                photoURL: user.photoURL || null,
                authProvider: 'google',
                createdAt: new Date(),
                following: []
            });
        }
        
        const userData = (await getDoc(doc(db, 'users', user.uid))).data() || {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            following: []
        };
        
        logWebViewDebug('LOGIN_COMPLETE', { success: true });
        
        return {
            success: true,
            user: {
                id: user.uid,
                name: userData.name,
                email: userData.email,
                photoURL: userData.photoURL,
                following: userData.following || []
            }
        };
    } catch (error) {
        logWebViewDebug('LOGIN_ERROR', {
            code: error.code,
            message: error.message
        });
        
        console.error('❌ Google login error:', error.code, error.message);
        
        // Provide helpful error message for WebView popup-blocked errors
        if (error.code === 'auth/popup-blocked') {
            console.error('⚠️ Popup was blocked. In WebView wrappers, ensure Google authentication domains are whitelisted to open in external browser.');
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Login with Apple
 * @returns {Promise} User data or error
 */
export async function loginWithApple() {
    try {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create user document if it's a new user
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: user.displayName || 'Apple User',
                email: user.email,
                photoURL: user.photoURL || null,
                authProvider: 'apple',
                createdAt: new Date(),
                following: []
            });
        }
        
        const userData = (await getDoc(doc(db, 'users', user.uid))).data() || {
            id: user.uid,
            name: user.displayName || 'Apple User',
            email: user.email,
            following: []
        };
        
        return {
            success: true,
            user: {
                id: user.uid,
                name: userData.name,
                email: userData.email,
                photoURL: userData.photoURL,
                following: userData.following || []
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Setup reCAPTCHA verifier for phone authentication
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @returns {RecaptchaVerifier} The verifier instance
 */
export function setupRecaptcha(containerId) {
    try {
        return new RecaptchaVerifier(containerId, {
            'size': 'normal',
            'callback': (response) => {
                console.log('reCAPTCHA verified');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
            }
        }, auth);
    } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
        return null;
    }
}

/**
 * Send verification code to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +1234567890)
 * @param {RecaptchaVerifier} appVerifier - The reCAPTCHA verifier
 * @returns {Promise} Confirmation result or error
 */
export async function sendPhoneVerificationCode(phoneNumber, appVerifier) {
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return {
            success: true,
            confirmationResult: confirmationResult
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify phone number with code and login/register
 * @param {object} confirmationResult - Confirmation result from sendPhoneVerificationCode
 * @param {string} code - Verification code entered by user
 * @param {string} name - User name (for new accounts)
 * @returns {Promise} User data or error
 */
export async function verifyPhoneCode(confirmationResult, code, name = 'Phone User') {
    try {
        const result = await confirmationResult.confirm(code);
        const user = result.user;
        
        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create user document if it's a new user
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: name,
                email: user.email || '',
                phoneNumber: user.phoneNumber,
                photoURL: user.photoURL || null,
                authProvider: 'phone',
                createdAt: new Date(),
                following: []
            });
        }
        
        const userData = (await getDoc(doc(db, 'users', user.uid))).data() || {
            id: user.uid,
            name: name,
            email: user.email || '',
            phoneNumber: user.phoneNumber,
            following: []
        };
        
        return {
            success: true,
            user: {
                id: user.uid,
                name: userData.name,
                email: userData.email,
                phoneNumber: user.phoneNumber,
                following: userData.following || []
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
