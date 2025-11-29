// host-ride.js
// ES module implementing Host Ride + Discover fetch

import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  GeoPoint,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getCurrentUserId } from './firebase-auth.js';
import { getStartLocation, getEndLocation, ensureMapsReady, initializeMaps, resetMapSelections } from './maps-leaflet.js';
function formatLatLngLabel(locationObj = {}) {
  const lat = Number(locationObj.lat ?? locationObj.latitude);
  const lng = Number(locationObj.lng ?? locationObj.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  return 'Pinned Location';
}
import { saveRide } from './rides.js';
// Small HTML-escaped helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

// In-page message (no alert/prompt) — lightweight and WebView-safe
function showInlineMessage(message, { type = 'success', targetId = null, timeout = 3000 } = {}) {
  // remove existing
  const existing = document.getElementById('hostRideMessage');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'hostRideMessage';
  el.className = `host-ride-message host-ride-message-${type}`;
  el.textContent = message;
  el.style.padding = '10px 12px';
  el.style.borderRadius = '10px';
  el.style.fontSize = '0.95rem';
  el.style.maxWidth = '460px';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
  el.style.background = type === 'error' ? '#ffe6e6' : '#f0fff4';
  el.style.color = type === 'error' ? '#9b0000' : '#065f46';
  el.style.marginTop = '8px';

  if (targetId) {
    const target = document.getElementById(targetId);
    if (target && target.parentNode) {
      target.parentNode.insertBefore(el, target.nextSibling);
    } else {
      document.body.appendChild(el);
    }
  } else {
    document.body.appendChild(el);
  }

  setTimeout(() => {
    el.style.transition = 'opacity 0.25s';
    el.style.opacity = '0';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
  }, timeout);
}

// hostRide: validate form inputs, build Firestore object, save using addDoc
export async function hostRide() {
  try {
    const titleEl = document.getElementById('rideTitle');
    const descriptionEl = document.getElementById('rideDescription');
    const dateEl = document.getElementById('rideDateTime');
    const isPublicToggle = document.getElementById('isPublicToggle');
    const startInputEl = document.getElementById('startLocationInput');
    const endInputEl = document.getElementById('endLocationInput');

    if (!titleEl || !dateEl || !startInputEl || !endInputEl) {
      showInlineMessage('Host form fields are not found in the page.', { type: 'error' });
      return;
    }

    const title = titleEl.value?.trim();
    const description = descriptionEl?.value?.trim() || ''; // Optional field
    const isPublic = isPublicToggle ? isPublicToggle.checked : true; // Default to public
    const dateValue = dateEl.value; // expected format from datetime-local
    const startLocation = getStartLocation();
    const endLocation = getEndLocation();

    if (!title) { showInlineMessage('Please enter a ride title.', { type: 'error', targetId: 'rideTitle' }); return; }
    if (!dateValue) { showInlineMessage('Please select date and time.', { type: 'error', targetId: 'rideDateTime' }); return; }

    const dateObj = new Date(dateValue);
    if (!dateObj || Number.isNaN(dateObj.getTime())) {
      showInlineMessage('Invalid date/time provided.', { type: 'error', targetId: 'rideDateTime' });
      return;
    }

    // Validate that the date is in the future
    const now = new Date();
    if (dateObj <= now) {
      showInlineMessage('Please select a future date and time. Rides cannot be scheduled for the past.', { type: 'error', targetId: 'rideDateTime' });
      return;
    }

    if (!startLocation || !startLocation.lat || !startLocation.lng) {
      showInlineMessage('Please select a start location from the dropdown suggestions that appear as you type.', { type: 'error', targetId: 'startLocationInput' });
      return;
    }
    if (!startLocation.name && !startLocation.address) {
      showInlineMessage('Please pick a recognizable start location so others can follow along.', { type: 'error', targetId: 'startLocationInput' });
      return;
    }
    if (!endLocation || !endLocation.lat || !endLocation.lng) {
      showInlineMessage('Please select a destination from the dropdown suggestions that appear as you type.', { type: 'error', targetId: 'endLocationInput' });
      return;
    }
    if (!endLocation.name && !endLocation.address) {
      showInlineMessage('Please pick a recognizable destination so others know where to ride.', { type: 'error', targetId: 'endLocationInput' });
      return;
    }

    // Determine organizerId: prefer `uid`, fallback to stored `currentUser` (object with id)
    // Prefer auth-based uid when available
    let organizerId = null;
    try {
      const authUid = getCurrentUserId && typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
      if (authUid) organizerId = authUid;
    } catch (e) {
      // ignore
    }

    if (!organizerId) {
      organizerId = localStorage.getItem('uid');
    }

    if (!organizerId) {
      try {
        const cu = localStorage.getItem('currentUser');
        if (cu) {
          const parsed = JSON.parse(cu);
          if (parsed && parsed.id) organizerId = parsed.id;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    if (!organizerId) {
      showInlineMessage('Unable to identify you. Please sign in first.', { type: 'error' });
      return;
    }

    if (!window.db) {
      showInlineMessage('Firestore not initialized (window.db missing).', { type: 'error' });
      return;
    }

    // Ensure any maps data is ready (in case maps library hasn't finished loading)
    await ensureMapsReady();

    // Try to read last-calculated distance/duration from DOM (maps-leaflet.js will update these)
    const lastRoute = window.__lastRoute || null;
    const distanceKm = lastRoute?.distanceKm ?? null;
    const durationMinutes = lastRoute?.durationMinutes ?? null;

    // NEW DATA STRUCTURE with proper GeoPoint and metadata
    const normalizedStartName = startLocation.name || startLocation.address || formatLatLngLabel(startLocation);
    const normalizedStartAddress = startLocation.address || startLocation.name || formatLatLngLabel(startLocation);
    const normalizedEndName = endLocation.name || endLocation.address || formatLatLngLabel(endLocation);
    const normalizedEndAddress = endLocation.address || endLocation.name || formatLatLngLabel(endLocation);

    const rideToSave = {
      title,
      description,  // NEW: Optional description field
      rideDateTime: new Date(dateValue),
      isPublic,  // NEW: Read from toggle instead of hardcoded
      organizerId: organizerId,  // Consolidated (removed hostId)
      participants: [organizerId],
      requests: [],
      // GeoPoint for startLocation
      startLocation: new GeoPoint(Number(startLocation.lat), Number(startLocation.lng)),
      startLocationName: normalizedStartName,
      startLocationAddress: normalizedStartAddress,
      // GeoPoint for endLocation  
      endLocation: new GeoPoint(Number(endLocation.lat), Number(endLocation.lng)),
      endLocationName: normalizedEndName,
      endLocationAddress: normalizedEndAddress,
      distanceKm: distanceKm ?? null,
      durationMinutes: durationMinutes ?? null,
      createdAt: serverTimestamp()
    };

    // Save via rides module helper
    await saveRide(rideToSave);

    // Clear form
    titleEl.value = '';
    dateEl.value = '';
    document.getElementById('startLocationInput').value = '';
    document.getElementById('endLocationInput').value = '';

    // Hide map preview
    const preview = document.getElementById('mapPreviewContainer');
    if (preview) preview.classList.add('hidden');
    resetMapSelections();

    showInlineMessage('Ride hosted successfully — visible to all users in Discover.', { type: 'success', targetId: 'hostRideBtn' });

  } catch (err) {
    console.error('hostRide error:', err);
    showInlineMessage('Failed to host ride. Please try again.', { type: 'error' });
  }
}

// loadRides: fetch all rides (no filtering) and render
export async function loadRides() {
  try {
    if (!window.db) {
      console.warn('window.db not available; cannot load rides.');
      return;
    }

    const colRef = collection(window.db, 'rides');
    const snap = await getDocs(colRef);

    const rides = snap.docs.map(doc => {
      const data = doc.data() || {};
      // try to derive display-ready values
      let formatted = '';
      try {
        if (data.rideDateTime?.toDate) formatted = data.rideDateTime.toDate().toLocaleString();
        else if (data.rideDateTime && data.rideDateTime.seconds) formatted = new Date(data.rideDateTime.seconds * 1000).toLocaleString();
        else formatted = new Date().toLocaleString();
      } catch (e) {
        formatted = new Date().toLocaleString();
      }

      const startLoc = data.startLocation || {};
      const lat = (typeof startLoc.latitude === 'number') ? startLoc.latitude : (startLoc.lat ?? 0);
      const lng = (typeof startLoc.longitude === 'number') ? startLoc.longitude : (startLoc.lng ?? 0);

      return {
        id: doc.id,
        title: data.title ?? 'Untitled Ride',
        formattedDateTime: formatted,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
        organizerId: data.organizerId ?? '',
        participantsCount: Array.isArray(data.participants) ? data.participants.length : 0
      };
    });

    renderRides(rides);
  } catch (err) {
    console.error('loadRides error:', err);
    const container = document.getElementById('discoverRides') || document.getElementById('ride-list');
    if (container) {
      container.innerHTML = `<div class="col-12"><div class="placeholder-content"><p>Unable to load rides.</p></div></div>`;
    }
  }
}

// renderRides: display cards inside #discoverRides (or fallback #ride-list)
export function renderRides(rides = []) {
  const container = document.getElementById('discoverRides') || document.getElementById('ride-list');
  if (!container) return;

  if (!rides || rides.length === 0) {
    container.innerHTML = `<div class="col-12"><div class="placeholder-content"><i class="bi bi-inbox" style="font-size:2.5rem;color:var(--primary);"></i><p>No rides available yet.</p></div></div>`;
    return;
  }

  container.innerHTML = rides.map(r => {
    const t = escapeHtml(r.title);
    const d = escapeHtml(r.formattedDateTime);
    const lat = Number.isFinite(r.latitude) ? r.latitude.toFixed(6) : '0.000000';
    const lng = Number.isFinite(r.longitude) ? r.longitude.toFixed(6) : '0.000000';
    const org = escapeHtml(String(r.organizerId).substring(0, 12));
    const pcount = Number.isFinite(r.participantsCount) ? r.participantsCount : 0;

    return `
      <div class="col-12 col-md-6">
        <div class="ride-card">
          <div class="ride-card-header">
            <h5 class="ride-title">${t}</h5>
            <span class="badge badge-public">Public</span>
          </div>
          <div class="ride-card-body">
            <div class="ride-info-row">
              <i class="bi bi-calendar-event ride-icon"></i>
              <div>
                <p class="ride-label">Date & Time</p>
                <p class="ride-value">${d}</p>
              </div>
            </div>

            <div class="ride-info-row">
              <i class="bi bi-geo-alt ride-icon"></i>
              <div>
                <p class="ride-label">Lat / Lng</p>
                <p class="ride-value">${lat}, ${lng}</p>
              </div>
            </div>

            <div class="ride-info-row">
              <i class="bi bi-person ride-icon"></i>
              <div>
                <p class="ride-label">Organizer ID</p>
                <p class="ride-value">${org}...</p>
              </div>
            </div>

            <div class="ride-info-row">
              <i class="bi bi-people ride-icon"></i>
              <div>
                <p class="ride-label">Participants</p>
                <p class="ride-value">${pcount} rider${pcount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <div class="ride-card-footer">
            <button class="btn btn-join" type="button"><i class="bi bi-plus-circle me-2"></i>Join Ride</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// wire up host button and auto-load on DOM ready
function setup() {
  const hostBtn = document.getElementById('hostRideBtn');
  if (hostBtn) {
    hostBtn.addEventListener('click', (e) => { e.preventDefault(); hostRide(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { loadRides(); initializeMaps(); });
  } else {
    loadRides(); initializeMaps();
  }
}

setup();
