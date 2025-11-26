// ============================================
// DISCOVER RIDES MODULE (WebView-friendly)
// ============================================

import { db } from './firebase-config.js';
import { collection, getDocs, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getCurrentUserId } from './firebase-auth.js';
import { joinRide, leaveRide } from './firebase-db.js';

/**
 * Fetch all public rides from Firestore
 * @returns {Promise<Array>} Array of ride objects
 */
async function loadRides() {
  try {
    const snapshot = await getDocs(collection(db, 'rides'));

    const rides = snapshot.docs.map(doc => {
      const data = doc.data();

      // Convert Firestore timestamp to readable date
      const rideDateTime = data.rideDateTime?.toDate ? data.rideDateTime.toDate() : new Date();

      // Extract location coordinates
      const startLocation = data.startLocation || {};
      const latitude = startLocation.latitude || 0;
      const longitude = startLocation.longitude || 0;

      return {
        id: doc.id,
        title: data.title || 'Untitled Ride',
        rideDateTime: rideDateTime,
        formattedDateTime: rideDateTime.toLocaleString(),
        startLocation: {
          latitude: latitude,
          longitude: longitude
        },
        organizerId: data.organizerId || '',
        participantsCount: (data.participants || []).length,
        isPublic: data.isPublic
      };
    });

    return rides;
  } catch (error) {
    console.error('Error loading rides:', error);
    return [];
  }
}

let _unsubscribe = null;

// Start real-time listener for rides collection. Calls renderRides on changes.
export function startDiscoverListener() {
  if (!window.db) return;
  if (_unsubscribe) return; // already listening

  const colRef = collection(db, 'rides');
  _unsubscribe = onSnapshot(colRef, (snapshot) => {
    const rides = snapshot.docs.map(doc => {
      const data = doc.data();
      const rideDateTime = data.rideDateTime?.toDate ? data.rideDateTime.toDate() : new Date();
      const startLocation = data.startLocation || {};
      const latitude = startLocation.latitude || startLocation.lat || 0;
      const longitude = startLocation.longitude || startLocation.lng || 0;
      return {
        id: doc.id,
        title: data.title || 'Untitled Ride',
        formattedDateTime: rideDateTime.toLocaleString(),
        startLocation: { latitude, longitude },
        organizerId: data.organizerId || '',
        participants: Array.isArray(data.participants) ? data.participants : [],
        participantsCount: Array.isArray(data.participants) ? data.participants.length : 0
      };
    });
    renderRides(rides);
  }, (err) => {
    console.error('Discover listener error:', err);
  });
}

export function stopDiscoverListener() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}

/**
 * Render rides as Bootstrap cards in the container
 * @param {Array} rides - Array of ride objects
 */
function renderRides(rides) {
  const container = document.getElementById('discoverRides') || document.getElementById('ride-list');
  const emptyState = document.getElementById('empty-state');

  if (!container) return;

  if (!rides || rides.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  container.innerHTML = rides.map(ride => {
    const currentUid = getCurrentUid();
    const isJoined = currentUid && Array.isArray(ride.participants) && ride.participants.includes(currentUid);
    const actionLabel = isJoined ? 'Cancel' : 'Join Ride';
    const actionType = isJoined ? 'leave' : 'join';

<<<<<<< HEAD
=======
    // Safely get location data with null checks
    const startLat = ride.startLocation?.latitude ?? 0;
    const startLng = ride.startLocation?.longitude ?? 0;
    const orgId = ride.organizerId || 'Unknown';
    const partCount = ride.participantsCount ?? 0;

>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
    return `
    <div class="col-md-6 col-lg-4">
      <div class="ride-card">
        <div class="ride-card-header">
          <h5 class="ride-title">${escapeHtml(ride.title)}</h5>
          <span class="badge badge-public">Public</span>
        </div>
        
        <div class="ride-card-body">
          <div class="ride-info-row">
            <i class="bi bi-calendar-event ride-icon"></i>
            <div>
              <p class="ride-label">Date & Time</p>
              <p class="ride-value">${ride.formattedDateTime}</p>
            </div>
          </div>
          
          <div class="ride-info-row">
            <i class="bi bi-geo-alt ride-icon"></i>
            <div>
              <p class="ride-label">Start Location</p>
<<<<<<< HEAD
              <p class="ride-value">${ride.startLocation.latitude.toFixed(2)}°, ${ride.startLocation.longitude.toFixed(2)}°</p>
=======
              <p class="ride-value">${startLat.toFixed(2)}°, ${startLng.toFixed(2)}°</p>
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
            </div>
          </div>
          
          <div class="ride-info-row">
            <i class="bi bi-person ride-icon"></i>
            <div>
              <p class="ride-label">Organizer ID</p>
<<<<<<< HEAD
              <p class="ride-value">${escapeHtml(ride.organizerId.substring(0, 8))}...</p>
=======
              <p class="ride-value">${escapeHtml(orgId.substring(0, 8))}...</p>
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
            </div>
          </div>
          
          <div class="ride-info-row">
            <i class="bi bi-people ride-icon"></i>
            <div>
              <p class="ride-label">Participants</p>
<<<<<<< HEAD
              <p class="ride-value">${ride.participantsCount} rider${ride.participantsCount !== 1 ? 's' : ''}</p>
=======
              <p class="ride-value">${partCount} rider${partCount !== 1 ? 's' : ''}</p>
>>>>>>> ce03959 (this is the most updated one 26 nov 2025)
            </div>
          </div>
        </div>
        
        <div class="ride-card-footer">
          <button class="btn btn-join" data-ride-id="${ride.id}" data-action="${actionType}">
            <i class="bi bi-plus-circle me-2"></i>${actionLabel}
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');

  // Use event delegation to prevent memory leaks
  // Remove old listener if exists
  const oldListener = container._rideButtonListener;
  if (oldListener) {
    container.removeEventListener('click', oldListener);
  }

  // Create new listener with event delegation
  const newListener = async (e) => {
    const btn = e.target.closest('.btn-join');
    if (!btn) return;

    e.preventDefault();
    const rideId = btn.getAttribute('data-ride-id');
    const action = btn.getAttribute('data-action');

    if (action === 'join') await joinRide(rideId, btn);
    else if (action === 'leave') await leaveRide(rideId, btn);
  };

  // Store reference and attach
  container._rideButtonListener = newListener;
  container.addEventListener('click', newListener);
}


// Utility to obtain current user id from localStorage
function getCurrentUid() {
  // Prefer the auth module's current user id when available
  try {
    const authUid = getCurrentUserId && typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
    if (authUid) return authUid;
  } catch (e) {
    // ignore
  }

  // Fallback to localStorage values
  try {
    let uid = localStorage.getItem('uid');
    if (uid) return uid;
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      const parsed = JSON.parse(cu);
      if (parsed && parsed.id) return parsed.id;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

// joinRide and leaveRide are provided by `firebase-db.js` to keep DB logic centralized
// imported earlier: `import { joinRide, leaveRide } from './firebase-db.js';

/**
 * Show notification using custom UI (WebView-friendly)
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showRideNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ride-notification ride-notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize the Discover Rides section
 */
export async function initializeDiscoverRides() {
  try {
    const rides = await loadRides();
    renderRides(rides);
  } catch (error) {
    console.error('Failed to initialize Discover Rides:', error);
  }
}

/**
 * Refresh rides (call this when navigating back to Discover section)
 */
export async function refreshDiscoverRides() {
  try {
    const rides = await loadRides();
    renderRides(rides);
  } catch (error) {
    console.error('Failed to refresh rides:', error);
  }
}

// Export functions for external use
export { loadRides, renderRides };
