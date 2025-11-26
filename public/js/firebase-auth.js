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

// Safe import with fallbacks to prevent module breakage
let isWebView, handleAuthRedirect, logWebViewDebug;
try {
    const webviewModule = await import('./webview-helper.js');
    isWebView = webviewModule.isWebView;
    handleAuthRedirect = webviewModule.handleAuthRedirect;
    logWebViewDebug = webviewModule.logWebViewDebug;
    console.log('✅ WebView helper loaded successfully');
} catch (error) {
    console.warn('⚠️ WebView helper unavailable, using desktop-only mode:', error.message);
    isWebView = () => false;
    handleAuthRedirect = async () => null;
    logWebViewDebug = () => { };
}

<<<<<<< HEAD
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
=======
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { createUniqueUsername } from './utils/username-generator.js';
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)

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

<<<<<<< HEAD
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            name: name,
            email: email,
            createdAt: new Date(),
=======
        // Generate unique username from email
        const username = await createUniqueUsername(email, db);
        console.log(`✅ Generated username: ${username} for ${email}`);

        // Create expanded user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            id: user.uid, // Legacy compatibility
            email: email,
            username: username,  // NEW: Permanent unique username
            displayName: name,
            photoURL: null,
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
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
            following: []
        });

        return {
            success: true,
            user: {
                id: user.uid,
<<<<<<< HEAD
=======
                username: username,
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
                name: name,
                email: email
            }
        };
    } catch (error) {
<<<<<<< HEAD
=======
        console.error('Registration error:', error);
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
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
 * Includes fallback for popup-blocked errors
 * @returns {Promise} User data or error
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const webview = isWebView();

        // Check if running in PWA standalone mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');

        // Configure provider for maximum compatibility
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            'prompt': 'select_account', // Let user choose account
            'access_type': 'offline'
        });

        logWebViewDebug('GOOGLE_LOGIN_START', { isWebView: webview, isPWA });

        let result;

        // Use redirect for PWA standalone mode or WebView
        if (isPWA || webview) {
            // PWA or WebView: Use redirect flow
            if (isPWA) {
                console.log('📱 PWA standalone mode detected - using redirect flow');
            } else {
                console.log('📱 WebView detected - using redirect flow');
            }
            logWebViewDebug('REDIRECT_FLOW_INITIATED', {
                method: 'signInWithRedirect',
                scopes: ['email', 'profile']
            });

            try {
                await signInWithRedirect(auth, provider);
                // After redirect back, handleAuthRedirect() is called on app load
                return {
                    success: true,
                    message: 'Redirecting to Google Sign-In...'
                };
            } catch (redirectError) {
                console.error('❌ Redirect flow error:', redirectError.code, redirectError.message);
                logWebViewDebug('REDIRECT_FLOW_ERROR', {
                    code: redirectError.code,
                    message: redirectError.message
                });

                // If redirect fails, throw to show user error
                throw redirectError;
            }
        } else {
            // Desktop: Use popup flow (inline auth dialog)
            console.log('🖥️ Desktop browser detected - using popup flow');
            logWebViewDebug('POPUP_FLOW_INITIATED', { method: 'signInWithPopup' });

            try {
                result = await signInWithPopup(auth, provider);
            } catch (popupError) {
                console.error('❌ Popup error:', popupError.code, popupError.message);
                logWebViewDebug('POPUP_ERROR', {
                    code: popupError.code,
                    message: popupError.message
                });

                // If popup blocked, try redirect as fallback
                if (popupError.code === 'auth/popup-blocked') {
                    console.log('⚠️ Popup blocked - trying redirect as fallback');
                    logWebViewDebug('POPUP_BLOCKED_FALLBACK', {
                        method: 'signInWithRedirect'
                    });

                    await signInWithRedirect(auth, provider);
                    return {
                        success: true,
                        message: 'Redirecting to Google Sign-In...'
                    };
                }

                // Other popup errors
                throw popupError;
            }
        }

        const user = result.user;
        logWebViewDebug('AUTH_SUCCESS', { uid: user.uid, email: user.email });

        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create user document if it's a new user
            logWebViewDebug('CREATE_FIRESTORE_DOC', { uid: user.uid });
<<<<<<< HEAD
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email,
                photoURL: user.photoURL || null,
                authProvider: 'google',
                createdAt: new Date(),
=======

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
                authProvider: 'google',
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
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

        // User-friendly error messages
        let userMessage = error.message;

        switch (error.code) {
            case 'auth/popup-blocked':
                userMessage = 'Popup was blocked. Your browser blocked the sign-in window. Please allow popups and try again, or check your popup blocker settings.';
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
        }

        return {
            success: false,
            error: userMessage,
            code: error.code
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

        // Check if running in PWA standalone mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');
        const webview = isWebView();

        logWebViewDebug('APPLE_LOGIN_START', { isPWA, isWebView: webview });

        let result;

        // Use redirect for PWA standalone mode or WebView
        if (isPWA || webview) {
            if (isPWA) {
                console.log('📱 PWA standalone mode detected - using redirect flow for Apple');
            } else {
                console.log('📱 WebView detected - using redirect flow for Apple');
            }
            await signInWithRedirect(auth, provider);
            return {
                success: true,
                message: 'Redirecting to Apple Sign-In...'
            };
        }

        try {
            result = await signInWithPopup(auth, provider);
        } catch (popupError) {
            if (popupError.code === 'auth/popup-blocked') {
                console.log('⚠️ Apple popup blocked - trying redirect fallback');
                logWebViewDebug('APPLE_POPUP_BLOCKED_FALLBACK', {});
                await signInWithRedirect(auth, provider);
                return {
                    success: true,
                    message: 'Redirecting to Apple Sign-In...'
                };
            }
            throw popupError;
        }

        const user = result.user;

        // Check if user document exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // Create user document if it's a new user
<<<<<<< HEAD
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: user.displayName || 'Apple User',
                email: user.email,
                photoURL: user.photoURL || null,
                authProvider: 'apple',
                createdAt: new Date(),
=======

            // Generate unique username
            const username = await createUniqueUsername(user.email, db);

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                id: user.uid,
                email: user.email,
                username: username,
                displayName: user.displayName || 'Apple User',
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
                authProvider: 'apple',
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
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
<<<<<<< HEAD
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: name,
                email: user.email || '',
                phoneNumber: user.phoneNumber,
                photoURL: user.photoURL || null,
                authProvider: 'phone',
                createdAt: new Date(),
=======

            // Generate username from phone or use fallback
            const emailForUsername = user.email || `user${user.phoneNumber.replace(/[^0-9]/g, '')}@phone.local`;
            const username = await createUniqueUsername(emailForUsername, db);

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                id: user.uid,
                email: user.email || '',
                username: username,
                displayName: name,
                phoneNumber: user.phoneNumber,
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
                authProvider: 'phone',
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
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
