// ============================================
// RIDES MODULE - Consolidated Firestore Operations
// Real-time listeners + Join/Leave + Queries
// ============================================

import { db } from './firebase-config.js';
import { getCurrentUserId } from './firebase-auth.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// ============================================
// STATE & LISTENERS
// ============================================

let discoverUnsubscribe = null;
let hostedUnsubscribe = null;
let joinedUnsubscribe = null;

// Callbacks for rendering
let onDiscoverRidesChange = null;
let onHostedRidesChange = null;
let onJoinedRidesChange = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

/**
 * Convert Firestore timestamp to readable date
 */
function formatDateTime(firestoreTimestamp) {
  if (!firestoreTimestamp) return 'TBD';

  try {
    const date = firestoreTimestamp.toDate ? firestoreTimestamp.toDate() : new Date(firestoreTimestamp);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Transform Firestore document to ride object
 */
function transformRideDoc(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    title: data.title || 'Untitled Ride',
    description: data.description || '',
    rideDateTime: data.rideDateTime,
    formattedDateTime: formatDateTime(data.rideDateTime),
    startLocation: data.startLocation || {},
    endLocation: data.endLocation || {},
    organizerId: data.organizerId || '',
    participants: Array.isArray(data.participants) ? data.participants : [],
    participantsCount: Array.isArray(data.participants) ? data.participants.length : 0,
    isPublic: data.isPublic !== false,
    createdAt: data.createdAt,
    requests: Array.isArray(data.requests) ? data.requests : []
  };
}

/**
 * Get current user ID (with fallback to localStorage)
 */
function getCurrentUid() {
  try {
    const authUid = getCurrentUserId && typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
    if (authUid) return authUid;
  } catch (e) {
    // ignore
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem('uid');
  } catch (e) {
    return null;
  }
}

// ============================================
// DISCOVER RIDES (All Public Rides)
// ============================================

/**
 * Start real-time listener for all public rides (Discover tab)
 * Fires whenever any public ride changes
 */
export function startDiscoverListener(callback) {
  // Store callback for updates
  if (callback && typeof callback === 'function') {
    onDiscoverRidesChange = callback;
  }

  // Unsubscribe from previous listener if it exists
  if (discoverUnsubscribe) {
    discoverUnsubscribe();
  }

  try {
    const q = query(
      collection(db, 'rides'),
      where('isPublic', '==', true),
      orderBy('rideDateTime', 'asc')
    );

    discoverUnsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => transformRideDoc(doc));
      if (onDiscoverRidesChange) {
        // If a callback was provided, call it and do NOT auto-render here.
        onDiscoverRidesChange(rides);
      } else {
        // No callback supplied — render all rides into the DOM.
        renderDiscoverRides(rides);
      }
    }, (error) => {
      console.error('❌ Discover listener error:', error);
    });
  } catch (error) {
    console.error('❌ Error starting discover listener:', error);
  }
}

/**
 * Stop listening to discover rides
 */
export function stopDiscoverListener() {
  if (discoverUnsubscribe) {
    discoverUnsubscribe();
    discoverUnsubscribe = null;
  }
}

/**
 * Render discover rides to DOM
 */
export function renderDiscoverRides(rides = []) {
  const container = document.getElementById('discoverRides');
  if (!container) return;

  if (!rides || rides.length === 0) {
<<<<<<< HEAD
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state-container">
          <i class="bi bi-inbox"></i>
          <p class="empty-state-text">No rides available yet. Be the first to host one!</p>
        </div>
      </div>
    `;
=======
    // Use enhanced empty state
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'col-12';
    container.appendChild(wrapper);

    import('./utils/ux-helpers.js').then(({ renderEmptyState }) => {
      renderEmptyState(wrapper, {
        icon: 'bi-geo-alt',
        title: 'No rides available',
        message: 'Be the first to host a ride and start your adventure! Create a new ride to get started.',
        actionText: 'Host a Ride',
        actionIcon: 'bi-plus-circle',
        actionCallback: () => {
          document.getElementById('nav-host').click();
        },
        variant: 'rides'
      });
    });
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
    return;
  }

  const currentUid = getCurrentUid();

  container.innerHTML = rides.map(ride => {
    const isJoined = currentUid && ride.participants.includes(currentUid);
    const isOrganizer = currentUid && ride.organizerId === currentUid;

    const buttonClass = isJoined ? 'btn-joined' : 'btn-join';
    const buttonLabel = isJoined ? '✓ Joined' : '+ Join Ride';
    const buttonIcon = isJoined ? 'bi-check-circle-fill' : 'bi-plus-circle';

<<<<<<< HEAD
=======
    // Truncate description to 150 characters
    const description = ride.description || '';
    const truncatedDesc = description.length > 150 ? description.substring(0, 150) + '...' : description;

>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
    return `
      <div class="col-md-6 col-lg-4">
        <div class="ride-card">
          <div class="ride-card-header">
            <h5 class="ride-title">${escapeHtml(ride.title)}</h5>
            <span class="badge badge-public">Public</span>
          </div>
          
<<<<<<< HEAD
=======
          ${description ? `<div class="ride-description">
            <p>${escapeHtml(truncatedDesc)}</p>
          </div>` : ''}
          
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
          <div class="ride-card-body">
            <div class="ride-info-row">
              <i class="bi bi-calendar-event ride-icon"></i>
              <div>
                <p class="ride-label">Date & Time</p>
                <p class="ride-value ride-value-accent">${ride.formattedDateTime}</p>
              </div>
            </div>
            
            <div class="ride-info-row">
              <i class="bi bi-geo-alt ride-icon"></i>
              <div>
                <p class="ride-label">Location</p>
                <p class="ride-value">
                  ${ride.startLocation.latitude?.toFixed(2) || '0.00'}°, 
                  ${ride.startLocation.longitude?.toFixed(2) || '0.00'}°
                </p>
              </div>
            </div>
            
            <div class="ride-info-row">
              <i class="bi bi-people ride-icon"></i>
              <div>
                <p class="ride-label">Participants</p>
                <p class="ride-value">${ride.participantsCount} rider${ride.participantsCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          
          <div class="ride-card-footer">
            <button class="btn ${buttonClass}" data-ride-id="${ride.id}" ${isOrganizer ? 'disabled' : ''}>
              <i class="bi ${buttonIcon} me-2"></i>${buttonLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach event listeners to buttons
  attachDiscoverButtonListeners(container);
}

// Save new ride to Firestore with the expected structure
export async function saveRide(rideData = {}) {
  try {
    if (!db) throw new Error('Firestore not initialized');

    const colRef = collection(db, 'rides');

    // rideData.rideDateTime expected to be a JS Date object per requirements
    const payload = Object.assign({}, rideData, {
      createdAt: serverTimestamp()
    });

    const res = await addDoc(colRef, payload);
    return { success: true, id: res.id };
  } catch (err) {
    console.error('saveRide error', err);
    return { success: false, error: err.message };
  }
}

/**
 * Attach click listeners to join/cancel buttons in Discover using event delegation
 */
function attachDiscoverButtonListeners(container) {
  // Remove old listener if exists to prevent duplicates
  const oldListener = container._discoverButtonListener;
  if (oldListener) {
    container.removeEventListener('click', oldListener);
  }

  // Create new delegated listener
  const newListener = async (e) => {
    const btn = e.target.closest('.btn-join, .btn-joined');
    if (!btn) return;

    e.preventDefault();

    const rideId = btn.getAttribute('data-ride-id');
    const isJoined = btn.classList.contains('btn-joined');

    if (isJoined) {
      await leaveRide(rideId, btn);
    } else {
      await joinRide(rideId, btn);
    }
  };

  // Store reference and attach
  container._discoverButtonListener = newListener;
  container.addEventListener('click', newListener);
}

// ============================================
// MY RIDES → HOSTED
// ============================================

/**
 * Start real-time listener for rides hosted by current user
 */
export function startHostedListener(callback) {
  if (callback && typeof callback === 'function') {
    onHostedRidesChange = callback;
  }

  if (hostedUnsubscribe) {
    hostedUnsubscribe();
  }

  const userId = getCurrentUid();
  if (!userId) {
    console.warn('⚠️ No user ID available for hosted rides listener');
    return;
  }

  try {
    const q = query(
      collection(db, 'rides'),
      where('organizerId', '==', userId),
      orderBy('rideDateTime', 'asc')
    );

    hostedUnsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => transformRideDoc(doc));

      if (onHostedRidesChange) {
        onHostedRidesChange(rides);
      }

      renderMyHostedRides(rides);
    }, (error) => {
      console.error('❌ Hosted listener error:', error);
    });
  } catch (error) {
    console.error('❌ Error starting hosted listener:', error);
  }
}

/**
 * Stop listening to hosted rides
 */
export function stopHostedListener() {
  if (hostedUnsubscribe) {
    hostedUnsubscribe();
    hostedUnsubscribe = null;
  }
}

/**
 * Render hosted rides to DOM
 */
export function renderMyHostedRides(rides = []) {
  const container = document.getElementById('myRidesContainer');
  if (!container) return;

  if (!rides || rides.length === 0) {
    container.innerHTML = `
      <div class="empty-state-container">
        <i class="bi bi-flag"></i>
        <p class="empty-state-text">You haven't hosted any rides yet. Create one from the Host section!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = rides.map(ride => {
    return `
      <div class="my-ride-card">
        <div class="ride-type-badge hosted">
          <i class="bi bi-flag-fill"></i> Hosted
        </div>
        
        <h3 class="ride-card-title">${escapeHtml(ride.title)}</h3>
        
        <div class="ride-details">
          <div class="ride-detail-row">
            <i class="bi bi-calendar-event"></i>
            <span class="detail-value detail-accent">${ride.formattedDateTime}</span>
          </div>
          
          <div class="ride-detail-row">
            <i class="bi bi-geo-alt"></i>
            <span class="detail-value">${ride.startLocation?.latitude?.toFixed(2) || '0.00'}°, ${ride.startLocation?.longitude?.toFixed(2) || '0.00'}°</span>
          </div>
          
          <div class="ride-detail-row">
            <i class="bi bi-people"></i>
            <span class="detail-value">${ride.participantsCount} participant${ride.participantsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div class="ride-card-actions">
          <button class="btn btn-secondary btn-sm" data-ride-id="${ride.id}">
            <i class="bi bi-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach delete listeners
  const deleteButtons = container.querySelectorAll('.btn-secondary');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const rideId = btn.getAttribute('data-ride-id');
      if (confirm('Are you sure you want to delete this ride?')) {
        await deleteRide(rideId);
      }
    });
  });
}

// ============================================
// MY RIDES → JOINED
// ============================================

/**
 * Start real-time listener for rides joined by current user
 */
export function startJoinedListener(callback) {
  if (callback && typeof callback === 'function') {
    onJoinedRidesChange = callback;
  }

  if (joinedUnsubscribe) {
    joinedUnsubscribe();
  }

  const userId = getCurrentUid();
  if (!userId) {
    console.warn('⚠️ No user ID available for joined rides listener');
    return;
  }

  try {
    // Query: participants array contains current user's UID
    const q = query(
      collection(db, 'rides'),
      where('participants', 'array-contains', userId),
      orderBy('rideDateTime', 'asc')
    );

    joinedUnsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => transformRideDoc(doc));

      if (onJoinedRidesChange) {
        onJoinedRidesChange(rides);
      }

      renderMyJoinedRides(rides);
    }, (error) => {
      console.error('❌ Joined listener error:', error);
    });
  } catch (error) {
    console.error('❌ Error starting joined listener:', error);
  }
}

/**
 * Stop listening to joined rides
 */
export function stopJoinedListener() {
  if (joinedUnsubscribe) {
    joinedUnsubscribe();
    joinedUnsubscribe = null;
  }
}

/**
 * Render joined rides to DOM
 */
export function renderMyJoinedRides(rides = []) {
  const container = document.getElementById('myRidesContainer');
  if (!container) return;

  if (!rides || rides.length === 0) {
    container.innerHTML = `
      <div class="empty-state-container">
        <i class="bi bi-check-circle"></i>
        <p class="empty-state-text">You haven't joined any rides yet. Explore the Discover section!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = rides.map(ride => {
    return `
      <div class="my-ride-card">
        <div class="ride-type-badge joined">
          <i class="bi bi-check-circle-fill"></i> Joined
        </div>
        
        <h3 class="ride-card-title">${escapeHtml(ride.title)}</h3>
        
        <div class="ride-details">
          <div class="ride-detail-row">
            <i class="bi bi-calendar-event"></i>
            <span class="detail-value detail-accent">${ride.formattedDateTime}</span>
          </div>
          
          <div class="ride-detail-row">
            <i class="bi bi-geo-alt"></i>
            <span class="detail-value">${ride.startLocation?.latitude?.toFixed(2) || '0.00'}°, ${ride.startLocation?.longitude?.toFixed(2) || '0.00'}°</span>
          </div>
          
          <div class="ride-detail-row">
            <i class="bi bi-person-circle"></i>
            <span class="detail-value">Organized by ${ride.organizerId.substring(0, 12)}...</span>
          </div>
          
          <div class="ride-detail-row">
            <i class="bi bi-people"></i>
            <span class="detail-value">${ride.participantsCount} participant${ride.participantsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div class="ride-card-actions">
          <button class="btn btn-danger btn-sm" data-ride-id="${ride.id}">
            <i class="bi bi-x-circle"></i> Leave Ride
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach leave listeners
  const leaveButtons = container.querySelectorAll('.btn-danger');
  leaveButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const rideId = btn.getAttribute('data-ride-id');
      await leaveRide(rideId, btn);
    });
  });
}

// ============================================
// JOIN RIDE
// ============================================

/**
 * Join a ride (add user UID to participants array)
 * Prevents duplicates and provides optimistic UI update with rate limiting
 */
export async function joinRide(rideId, buttonElement = null) {
  const userId = getCurrentUid();

  if (!userId) {
    console.error('❌ Cannot join ride: user not logged in');
    showRideNotification('Please log in to join a ride', 'error');
    return;
  }

  // Rate limiting - prevent multiple clicks
  if (buttonElement && buttonElement.disabled) {
    return; // Already processing
  }

  try {
    // Disable button immediately to prevent spam
    if (buttonElement) {
      buttonElement.disabled = true;
    }

    // Get ride document to check if already joined
    const rideRef = doc(db, 'rides', rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      console.error('❌ Ride not found');
      showRideNotification('Ride not found', 'error');
      if (buttonElement) buttonElement.disabled = false;
      return;
    }

    const rideData = rideDoc.data();
    const participants = rideData.participants || [];

    // Check for duplicates
    if (participants.includes(userId)) {
      showRideNotification('You already joined this ride', 'info');
      if (buttonElement) buttonElement.disabled = false;
      return;
    }

    // Optimistic UI update
    if (buttonElement) {
      buttonElement.classList.remove('btn-join');
      buttonElement.classList.add('btn-joined');
      buttonElement.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>✓ Joined';
    }

    // Add user to participants array
    await updateDoc(rideRef, {
      participants: arrayUnion(userId)
    });

    showRideNotification('Joined ride successfully!', 'success');
    console.log('✅ Joined ride:', rideId);

    // Keep button disabled (joined state)
  } catch (error) {
    console.error('❌ Error joining ride:', error);
    showRideNotification('Failed to join ride. Please try again.', 'error');

    // Revert optimistic UI on error
    if (buttonElement) {
      buttonElement.classList.remove('btn-joined');
      buttonElement.classList.add('btn-join');
      buttonElement.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Join Ride';
      buttonElement.disabled = false;
    }
  }
}

// ============================================
// LEAVE RIDE
// ============================================

/**
 * Leave a ride (remove user UID from participants array)
 */
export async function leaveRide(rideId, buttonElement = null) {
  const userId = getCurrentUid();

  if (!userId) {
    console.error('❌ Cannot leave ride: user not logged in');
    showRideNotification('Please log in', 'error');
    return;
  }

  try {
    const rideRef = doc(db, 'rides', rideId);

    // Optimistic UI update
    if (buttonElement) {
      buttonElement.disabled = true;
    }

    // Remove user from participants array
    await updateDoc(rideRef, {
      participants: arrayRemove(userId)
    });

    showRideNotification('Left ride successfully!', 'success');
    console.log('✅ Left ride:', rideId);
  } catch (error) {
    console.error('❌ Error leaving ride:', error);
    showRideNotification('Failed to leave ride. Please try again.', 'error');

    // Revert optimistic UI on error
    if (buttonElement) {
      buttonElement.disabled = false;
    }
  }
}

// ============================================
// DELETE RIDE
// ============================================

/**
 * Delete a ride (organizer only)
 */
export async function deleteRide(rideId) {
  const userId = getCurrentUid();

  if (!userId) {
    showRideNotification('Please log in', 'error');
    return;
  }

  try {
    const rideRef = doc(db, 'rides', rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      showRideNotification('Ride not found', 'error');
      return;
    }

    // Verify user is organizer
    const rideData = rideDoc.data();
    if (rideData.organizerId !== userId) {
      showRideNotification('You can only delete your own rides', 'error');
      return;
    }

    // Delete the ride
    await deleteDoc(rideRef);
    showRideNotification('Ride deleted successfully!', 'success');
    console.log('✅ Deleted ride:', rideId);
  } catch (error) {
    console.error('❌ Error deleting ride:', error);
    showRideNotification('Failed to delete ride', 'error');
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Show toast notification
 */
export function showRideNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ride-notification ride-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ============================================
// EXPORT CLEANUP FUNCTIONS
// ============================================

/**
 * Stop all listeners (useful when logging out)
 */
export function stopAllListeners() {
  stopDiscoverListener();
  stopHostedListener();
  stopJoinedListener();
}
