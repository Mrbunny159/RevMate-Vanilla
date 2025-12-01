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
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';

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
 * No longer needed since we use popup flow only, but kept for compatibility
 * @returns {Promise} Always returns null since redirect flow is not used
 */
export async function processAuthRedirect() {
    // Popup flow only - no redirect processing needed
    return null;
}

/**
 * Login with Google - Popup flow only
 * Uses signInWithPopup for all environments
 * @returns {Promise} User data or error
 */
export async function loginWithGoogle() {
    try {
        console.log('🔐 Starting Google login with popup flow');
        
        const provider = new GoogleAuthProvider();
        
        // Configure provider
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            'prompt': 'select_account', // Let user choose account
            'access_type': 'offline'
        });
        
        // Use popup flow only
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('✅ Google popup login successful:', user.uid, user.email);
        
        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create user document if it's a new user
            console.log('📝 Creating Firestore document for new user');
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
        
        // Get user data from Firestore
        const userData = (await getDoc(doc(db, 'users', user.uid))).data() || {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            following: []
        };
        
        console.log('✅ Google login complete');
        
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
        console.error('❌ Google login error:', error.code, error.message);
        
        // User-friendly error messages
        let userMessage = error.message;
        
        switch(error.code) {
            case 'auth/popup-blocked':
                userMessage = 'Popup was blocked. Your browser blocked the sign-in window. Please allow popups for this site and try again.';
                break;
            case 'auth/popup-closed-by-user':
                userMessage = 'Sign-in popup was closed. Please try again.';
                break;
            case 'auth/cancelled-popup-request':
                userMessage = 'Sign-in was cancelled. Please try again.';
                break;
            case 'auth/operation-not-supported-in-this-environment':
                userMessage = 'Sign-in is not supported in this environment. Please try a different browser.';
                break;
            case 'auth/auth-domain-config-required':
                userMessage = 'Firebase is not properly configured for this domain. Contact support.';
                break;
            case 'auth/invalid-api-key':
                userMessage = 'Firebase configuration error. Contact support.';
                break;
            case 'auth/network-request-failed':
                userMessage = 'Network error. Please check your internet connection.';
                break;
            default:
                userMessage = error.message || 'An error occurred during sign-in. Please try again.';
        }
        
        return {
            success: false,
            error: userMessage,
            code: error.code
        };
    }
}

/**
 * Login with Apple - Popup flow only
 * Uses signInWithPopup for all environments
 * @returns {Promise} User data or error
 */
export async function loginWithApple() {
    try {
        console.log('🔐 Starting Apple login with popup flow');
        
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        // Use popup flow only
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
