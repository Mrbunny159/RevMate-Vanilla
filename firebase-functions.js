// firebase-functions.js
// Wrapper for Cloud Function calls (joinRide, leaveRide)
// Requires: window.db from firebase-config.js and Firebase SDK v12.6.0+

import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js';

// Get Firebase project config from window.firebaseConfig (set in firebase-config.js)
const app = typeof window !== 'undefined' && window.firebaseConfig
  ? initializeApp(window.firebaseConfig)
  : null;

const functions = app ? getFunctions(app, 'us-central1') : null;

/**
 * Join a ride via Cloud Function
 * @param {string} rideId - Ride document ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function joinRideCloudFunction(rideId) {
  if (!functions) {
    throw new Error('Firebase Functions not initialized');
  }

  const joinRide = httpsCallable(functions, 'joinRide');
  
  try {
    const result = await joinRide({ rideId });
    return result.data;
  } catch (error) {
    console.error('joinRide Cloud Function error:', error);
    throw error;
  }
}

/**
 * Leave a ride via Cloud Function
 * @param {string} rideId - Ride document ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function leaveRideCloudFunction(rideId) {
  if (!functions) {
    throw new Error('Firebase Functions not initialized');
  }

  const leaveRide = httpsCallable(functions, 'leaveRide');
  
  try {
    const result = await leaveRide({ rideId });
    return result.data;
  } catch (error) {
    console.error('leaveRide Cloud Function error:', error);
    throw error;
  }
}
