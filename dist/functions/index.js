// functions/index.js
// Firebase Cloud Functions for RevMate
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Callable function: join a ride
// Called by client with { rideId }
// Adds caller's uid to participants array (atomic, idempotent)
exports.joinRide = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to join a ride'
    );
  }

  const uid = context.auth.uid;
  const { rideId } = data;

  if (!rideId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'rideId is required'
    );
  }

  try {
    const rideRef = db.collection('rides').doc(rideId);
    
    // Atomically add user to participants array (idempotent)
    await rideRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(uid)
    });

    return { success: true, message: `User ${uid} joined ride ${rideId}` };
  } catch (error) {
    console.error('joinRide function error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Unable to join ride: ${error.message}`
    );
  }
});

// Callable function: leave a ride
// Called by client with { rideId }
// Removes caller's uid from participants array (atomic, idempotent)
exports.leaveRide = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to leave a ride'
    );
  }

  const uid = context.auth.uid;
  const { rideId } = data;

  if (!rideId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'rideId is required'
    );
  }

  try {
    const rideRef = db.collection('rides').doc(rideId);
    
    // Atomically remove user from participants array (idempotent)
    await rideRef.update({
      participants: admin.firestore.FieldValue.arrayRemove(uid)
    });

    return { success: true, message: `User ${uid} left ride ${rideId}` };
  } catch (error) {
    console.error('leaveRide function error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Unable to leave ride: ${error.message}`
    );
  }
});
