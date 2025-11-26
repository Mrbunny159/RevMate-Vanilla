// ============================================
// MAPS-LEAFLET.JS - OpenStreetMap Integration
// Replaces Google Maps with Leaflet + OSM
// ============================================

let map = null;
let startMarker = null;
let endMarker = null;
let routeLine = null;
let startPlace = null;
let endPlace = null;
let mapsReady = false;

// Wait for Leaflet to be ready
export function ensureMapsReady(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (mapsReady && window.L) return resolve();

    const start = Date.now();
    const check = () => {
      if (window.L) {
        mapsReady = true;
        return resolve();
      }
      if (Date.now() - start > timeout) return reject(new Error('Leaflet library load timeout'));
      setTimeout(check, 100);
    };
    check();
  });
}

// Initialize map
export async function initializeMaps({ startInputId = 'startLocationInput', endInputId = 'endLocationInput', mapContainerId = 'mapPreview' } = {}) {
  await ensureMapsReady();

  const startEl = document.getElementById(startInputId);
  const endEl = document.getElementById(endInputId);
  const mapEl = document.getElementById(mapContainerId);

  if (!startEl || !endEl || !mapEl) return;

  // Create Leaflet map centered on India
  map = L.map(mapEl).setView([20.5937, 78.9629], 5);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Setup autocomplete for both inputs
  setupLocationAutocomplete(startEl, true);
  setupLocationAutocomplete(endEl, false);

  // Setup "Use Current Location" button
  const useBtn = document.getElementById('useCurrentLocation');
  if (useBtn) {
    useBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!navigator.geolocation) {
        showMapMessage('Geolocation not supported in this browser', 'error');
        return;
      }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Reverse geocode using Nominatim
        const locationData = await reverseGeocode(lat, lng);
        if (locationData) {
          startEl.value = locationData.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          startPlace = {
            name: locationData.name || 'My Location',
            address: locationData.display_name || '',
            lat: lat,
            lng: lng
          };
          updateMapPreview();
        }
      }, (err) => {
        console.error('Geolocation error', err);
        showMapMessage('Unable to get your location', 'error');
      });
    });
  }
}

// Setup location autocomplete using Nominatim API
function setupLocationAutocomplete(inputEl, isStart) {
  let debounceTimeout = null;
  let suggestionsDiv = null;

  inputEl.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    const query = e.target.value.trim();

    if (query.length < 3) {
      if (suggestionsDiv) suggestionsDiv.remove();
      return;
    }

    debounceTimeout = setTimeout(async () => {
      const results = await searchLocation(query);
      showSuggestions(results, inputEl, isStart);
    }, 500); // Debounce 500ms
  });

  function showSuggestions(results, inputEl, isStart) {
    // Remove existing suggestions
    if (suggestionsDiv) suggestionsDiv.remove();

    if (!results || results.length === 0) return;

    // Create suggestions dropdown
    suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'location-suggestions';
    suggestionsDiv.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      width: ${inputEl.offsetWidth}px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    results.forEach(result => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
      `;
      div.textContent = result.display_name;
      
      div.addEventListener('mouseenter', () => {
        div.style.background = '#f5f5f5';
      });
      div.addEventListener('mouseleave', () => {
        div.style.background = 'white';
      });
      div.addEventListener('click', () => {
        inputEl.value = result.display_name;
        
        const place = {
          name: result.name || result.display_name.split(',')[0],
          address: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };

        if (isStart) {
          startPlace = place;
        } else {
          endPlace = place;
        }

        updateMapPreview();
        suggestionsDiv.remove();
      });

      suggestionsDiv.appendChild(div);
    });

    // Position suggestions below input
    inputEl.parentElement.style.position = 'relative';
    inputEl.parentElement.appendChild(suggestionsDiv);
  }

  // Close suggestions on click outside
  document.addEventListener('click', (e) => {
    if (suggestionsDiv && !inputEl.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.remove();
    }
  });
}

// Search location using Nominatim API
async function searchLocation(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
    );
    return await response.json();
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}

// Reverse geocode coordinates
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    return await response.json();
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Update map preview with route
async function updateMapPreview() {
  const previewContainer = document.getElementById('mapPreviewContainer');
  const distanceTextEl = document.getElementById('distanceText');
  const durationTextEl = document.getElementById('durationText');

  if (!startPlace || !endPlace) {
    // Clear markers and route
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routeLine) map.removeLayer(routeLine);
    if (previewContainer) previewContainer.classList.add('hidden');
    window.__lastRoute = null;
    return;
  }

  if (previewContainer) previewContainer.classList.remove('hidden');

  // Clear existing markers and route
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  if (routeLine) map.removeLayer(routeLine);

  // Add start marker (green)
  startMarker = L.circleMarker([startPlace.lat, startPlace.lng], {
    radius: 8,
    fillColor: '#2ECC71',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1
  }).addTo(map).bindPopup(startPlace.name || 'Start');

  // Add end marker (red)
  endMarker = L.circleMarker([endPlace.lat, endPlace.lng], {
    radius: 8,
    fillColor: '#E74C3C',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1
  }).addTo(map).bindPopup(endPlace.name || 'End');

  // Fit map to show both markers
  const bounds = L.latLngBounds(
    [startPlace.lat, startPlace.lng],
    [endPlace.lat, endPlace.lng]
  );
  map.fitBounds(bounds, { padding: [50, 50] });

  // Get route from OSRM (Open Source Routing Machine)
  try {
    const route = await getRoute(startPlace.lat, startPlace.lng, endPlace.lat, endPlace.lng);
    if (route) {
      // Draw route line
      routeLine = L.polyline(route.coordinates, {
        color: '#3498db',
        weight: 4,
        opacity: 0.7
      }).addTo(map);

      // Update distance and duration
      const distanceKm = route.distance / 1000;
      const durationMinutes = Math.round(route.duration / 60);

      window.__lastRoute = { distanceKm: Number(distanceKm.toFixed(1)), durationMinutes };

      if (distanceTextEl) distanceTextEl.textContent = `Distance: ${distanceKm.toFixed(1)} km`;
      if (durationTextEl) durationTextEl.textContent = `Estimated Duration: ${durationMinutes} minutes`;
    }
  } catch (error) {
    console.warn('Route calculation failed:', error);
    // Draw straight line if routing fails
    routeLine = L.polyline([
      [startPlace.lat, startPlace.lng],
      [endPlace.lat, endPlace.lng]
    ], {
      color: '#95a5a6',
      weight: 2,
      opacity: 0.5,
      dashArray: '5, 10'
    }).addTo(map);

    // Calculate straight-line distance
    const distance = calculateDistance(startPlace.lat, startPlace.lng, endPlace.lat, endPlace.lng);
    if (distanceTextEl) distanceTextEl.textContent = `Distance: ~${distance.toFixed(1)} km (straight line)`;
    if (durationTextEl) durationTextEl.textContent = `Estimated Duration: —`;
  }
}

// Get route from OSRM
async function getRoute(startLat, startLng, endLat, endLng) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Swap lon/lat to lat/lon
        distance: route.distance,
        duration: route.duration
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

// Calculate straight-line distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Show inline message
function showMapMessage(message, type = 'info') {
  const existing = document.getElementById('mapMessage');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'mapMessage';
  el.style.cssText = `
    padding: 10px;
    border-radius: 8px;
    margin: 10px 0;
    background: ${type === 'error' ? '#ffe6e6' : '#e3f2fd'};
    color: ${type === 'error' ? '#c00' : '#1976d2'};
    font-size: 0.9rem;
  `;
  el.textContent = message;

  const mapContainer = document.getElementById('mapPreviewContainer');
  if (mapContainer) {
    mapContainer.insertBefore(el, mapContainer.firstChild);
    setTimeout(() => el.remove(), 5000);
  }
}

// Export getters
export function getStartLocation() { return startPlace; }
export function getEndLocation() { return endPlace; }
export function getLastRoute() { return window.__lastRoute || null; }

export default {
  initializeMaps,
  ensureMapsReady,
  getStartLocation,
  getEndLocation,
  getLastRoute
};
