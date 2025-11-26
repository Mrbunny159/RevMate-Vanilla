// ============================================
// FOLLOW SYSTEM MODULE
// Mutual follow with accept/reject
// ============================================

import { db } from './firebase-config.js';
import { getCurrentUserId } from './firebase-auth.js';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    serverTimestamp,
    getDoc
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

import { showSuccess, showError, showInfo } from './utils/ux-helpers.js';

// ============================================
// SEND FOLLOW REQUEST
// ============================================

/**
 * Send a follow request to another user
 * @param {string} targetUserId - User to follow
 * @returns {Promise<object>} - Result object
 */
export async function sendFollowRequest(targetUserId) {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            showError('Please log in to follow users');
            return { success: false, error: 'Not authenticated' };
        }

        if (currentUserId === targetUserId) {
            showError('You cannot follow yourself');
            return { success: false, error: 'Cannot follow self' };
        }

        // Check if request already exists
        const existingRequest = await getFollowStatus(targetUserId);

        if (existingRequest.status === 'pending') {
            showInfo('Follow request already sent');
            return { success: false, error: 'Request already exists' };
        }

        if (existingRequest.status === 'accepted') {
            showInfo('You are already following this user');
            return { success: false, error: 'Already following' };
        }

        // Create follow request
        const followsRef = collection(db, 'follows');
        const docRef = await addDoc(followsRef, {
            followerId: currentUserId,
            followedId: targetUserId,
            status: 'pending',
            createdAt: serverTimestamp(),
            respondedAt: null
        });

        console.log('✅ Follow request sent:', docRef.id);
        showSuccess('Follow request sent!');

        return { success: true, requestId: docRef.id };
    } catch (error) {
        console.error('❌ Error sending follow request:', error);
        showError('Failed to send follow request');
        return { success: false, error: error.message };
    }
}

// ============================================
// ACCEPT FOLLOW REQUEST
// ============================================

/**
 * Accept a follow request
 * @param {string} requestId - Follow request document ID
 * @returns {Promise<object>} - Result object
 */
export async function acceptFollowRequest(requestId) {
    try {
        const requestRef = doc(db, 'follows', requestId);

        await updateDoc(requestRef, {
            status: 'accepted',
            respondedAt: serverTimestamp()
        });

        console.log('✅ Follow request accepted:', requestId);
        showSuccess('Follow request accepted!');

        return { success: true };
    } catch (error) {
        console.error('❌ Error accepting follow request:', error);
        showError('Failed to accept request');
        return { success: false, error: error.message };
    }
}

// ============================================
// REJECT FOLLOW REQUEST
// ============================================

/**
 * Reject a follow request
 * @param {string} requestId - Follow request document ID
 * @returns {Promise<object>} - Result object
 */
export async function rejectFollowRequest(requestId) {
    try {
        const requestRef = doc(db, 'follows', requestId);

        await updateDoc(requestRef, {
            status: 'rejected',
            respondedAt: serverTimestamp()
        });

        console.log('✅ Follow request rejected:', requestId);
        showInfo('Follow request rejected');

        return { success: true };
    } catch (error) {
        console.error('❌ Error rejecting follow request:', error);
        showError('Failed to reject request');
        return { success: false, error: error.message };
    }
}

// ============================================
// CANCEL FOLLOW REQUEST (UNDO SENT REQUEST)
// ============================================

/**
 * Cancel a pending follow request that you sent
 * @param {string} targetUserId - User you sent request to
 * @returns {Promise<object>} - Result object
 */
export async function cancelFollowRequest(targetUserId) {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            return { success: false, error: 'Not authenticated' };
        }

        // Find the pending request
        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followerId', '==', currentUserId),
            where('followedId', '==', targetUserId),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'No pending request found' };
        }

        // Delete the request
        const requestDoc = snapshot.docs[0];
        await deleteDoc(doc(db, 'follows', requestDoc.id));

        console.log('✅ Follow request cancelled');
        showInfo('Follow request cancelled');

        return { success: true };
    } catch (error) {
        console.error('❌ Error cancelling follow request:', error);
        showError('Failed to cancel request');
        return { success: false, error: error.message };
    }
}

// ============================================
// UNFOLLOW USER
// ============================================

/**
 * Unfollow a user (remove accepted follow)
 * @param {string} targetUserId - User to unfollow
 * @returns {Promise<object>} - Result object
 */
export async function unfollowUser(targetUserId) {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            return { success: false, error: 'Not authenticated' };
        }

        // Find the accepted follow
        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followerId', '==', currentUserId),
            where('followedId', '==', targetUserId),
            where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'Not following this user' };
        }

        // Delete the follow
        const followDoc = snapshot.docs[0];
        await deleteDoc(doc(db, 'follows', followDoc.id));

        console.log('✅ Unfollowed user');
        showInfo('Unfollowed successfully');

        return { success: true };
    } catch (error) {
        console.error('❌ Error unfollowing user:', error);
        showError('Failed to unfollow');
        return { success: false, error: error.message };
    }
}

// ============================================
// GET FOLLOW STATUS
// ============================================

/**
 * Get the follow status between current user and target user
 * @param {string} targetUserId - User to check
 * @returns {Promise<object>} - Status object
 */
export async function getFollowStatus(targetUserId) {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            return { status: 'none' };
        }

        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followerId', '==', currentUserId),
            where('followedId', '==', targetUserId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { status: 'none' };
        }

        const followDoc = snapshot.docs[0];
        const data = followDoc.data();

        return {
            status: data.status,
            requestId: followDoc.id,
            createdAt: data.createdAt
        };
    } catch (error) {
        console.error('❌ Error getting follow status:', error);
        return { status: 'none' };
    }
}

// ============================================
// GET FOLLOWERS/FOLLOWING COUNTS
// ============================================

/**
 * Get follower count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Follower count
 */
export async function getFollowerCount(userId) {
    try {
        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followedId', '==', userId),
            where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('❌ Error getting follower count:', error);
        return 0;
    }
}

/**
 * Get following count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Following count
 */
export async function getFollowingCount(userId) {
    try {
        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followerId', '==', userId),
            where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('❌ Error getting following count:', error);
        return 0;
    }
}

// ============================================
// GET PENDING FOLLOW REQUESTS
// ============================================

/**
 * Get all pending follow requests received by current user
 * @returns {Promise<array>} - Array of pending requests
 */
export async function getPendingFollowRequests() {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            return [];
        }

        const followsRef = collection(db, 'follows');
        const q = query(
            followsRef,
            where('followedId', '==', currentUserId),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);

        const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // Fetch follower user data
            const userDoc = await getDoc(doc(db, 'users', data.followerId));
            const userData = userDoc.data() || {};

            return {
                requestId: docSnap.id,
                followerId: data.followerId,
                followerName: userData.displayName || userData.name || 'Unknown',
                followerUsername: userData.username || 'unknown',
                followerPhoto: userData.photoURL || null,
                createdAt: data.createdAt
            };
        }));

        return requests;
    } catch (error) {
        console.error('❌ Error getting pending requests:', error);
        return [];
    }
}

// ============================================
// LISTEN TO FOLLOW REQUESTS
// ============================================

let followRequestsUnsubscribe = null;

/**
 * Listen to pending follow requests in real-time
 * @param {function} callback - Called with array of requests
 */
export function listenToFollowRequests(callback) {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
        return;
    }

    // Stop existing listener
    if (followRequestsUnsubscribe) {
        followRequestsUnsubscribe();
    }

    const followsRef = collection(db, 'follows');
    const q = query(
        followsRef,
        where('followedId', '==', currentUserId),
        where('status', '==', 'pending')
    );

    followRequestsUnsubscribe = onSnapshot(q, async (snapshot) => {
        const requests = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            const userDoc = await getDoc(doc(db, 'users', data.followerId));
            const userData = userDoc.data() || {};

            return {
                requestId: docSnap.id,
                followerId: data.followerId,
                followerName: userData.displayName || userData.name || 'Unknown',
                followerUsername: userData.username || 'unknown',
                followerPhoto: userData.photoURL || null,
                createdAt: data.createdAt
            };
        }));

        callback(requests);
    });
}

/**
 * Stop listening to follow requests
 */
export function stopListeningToFollowRequests() {
    if (followRequestsUnsubscribe) {
        followRequestsUnsubscribe();
        followRequestsUnsubscribe = null;
    }
}
