// ============================================
// MAPS-LEAFLET.JS
// OpenStreetMap + Leaflet integration for host ride flow
// Supports autocomplete search, map modal, marker dragging, and OSRM routing
// ============================================

let map = null;
let startMarker = null;
let endMarker = null;
let routeLine = null;
let startPlace = null;
let endPlace = null;
let mapsReady = false;
let activeMode = 'start';

let startInputEl = null;
let endInputEl = null;
let mapContainerEl = null;
let backdropEl = null;
let distanceTextEl = null;
let durationTextEl = null;
let modeStartBtn = null;
let modeEndBtn = null;
let expandBtn = null;
let closeBtn = null;
let startMapBtn = null;
let endMapBtn = null;

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

export async function initializeMaps({ startInputId = 'startLocationInput', endInputId = 'endLocationInput', mapContainerId = 'mapPreview' } = {}) {
  await ensureMapsReady();

  startInputEl = document.getElementById(startInputId);
  endInputEl = document.getElementById(endInputId);
  const mapEl = document.getElementById(mapContainerId);
  mapContainerEl = document.getElementById('mapPreviewContainer');
  backdropEl = document.getElementById('mapBackdrop');
  distanceTextEl = document.getElementById('distanceText');
  durationTextEl = document.getElementById('durationText');
  modeStartBtn = document.getElementById('mapModeStart');
  modeEndBtn = document.getElementById('mapModeEnd');
  expandBtn = document.getElementById('expandMapBtn');
  closeBtn = document.getElementById('closeMapBtn');
  startMapBtn = document.getElementById('startMapBtn');
  endMapBtn = document.getElementById('endMapBtn');

  if (!startInputEl || !endInputEl || !mapEl || !mapContainerEl) return;

  if (map) {
    attachUiControls();
    updateInputsFromPlaces(true);
    updateMapPreview();
    return;
  }

  // Fix default marker assets when using CDN
  if (L?.Icon?.Default) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }

  map = L.map(mapEl).setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  map.on('click', handleMapClick);

  setupLocationAutocomplete(startInputEl, true);
  setupLocationAutocomplete(endInputEl, false);
  attachUiControls();

  const useBtn = document.getElementById('useCurrentLocation');
  if (useBtn) {
    useBtn.addEventListener('click', handleUseCurrentLocation);
  }

  updateInputsFromPlaces(true);
  updateMapPreview();
}

function attachUiControls() {
  if (modeStartBtn) modeStartBtn.addEventListener('click', () => setActiveMode('start'));
  if (modeEndBtn) modeEndBtn.addEventListener('click', () => setActiveMode('end'));
  if (expandBtn) expandBtn.addEventListener('click', () => openMapModal(activeMode));
  if (closeBtn) closeBtn.addEventListener('click', closeMapModal);
  if (backdropEl) backdropEl.addEventListener('click', closeMapModal);
  if (startMapBtn) startMapBtn.addEventListener('click', () => openMapModal('start'));
  if (endMapBtn) endMapBtn.addEventListener('click', () => openMapModal('end'));
}

function setActiveMode(mode = 'start') {
  activeMode = mode;
  if (modeStartBtn) {
    modeStartBtn.classList.toggle('active', mode === 'start');
    modeStartBtn.classList.toggle('btn-outline-secondary', mode !== 'start');
    modeStartBtn.classList.toggle('btn-secondary', mode === 'start');
  }
  if (modeEndBtn) {
    modeEndBtn.classList.toggle('active', mode === 'end');
    modeEndBtn.classList.toggle('btn-outline-secondary', mode !== 'end');
    modeEndBtn.classList.toggle('btn-secondary', mode === 'end');
  }
}

function openMapModal(mode = 'start') {
  setActiveMode(mode);
  if (mapContainerEl) mapContainerEl.classList.add('fullscreen');
  if (backdropEl) backdropEl.classList.add('active');
  if (expandBtn) expandBtn.classList.add('d-none');
  if (closeBtn) closeBtn.classList.remove('d-none');
  if (map) {
    setTimeout(() => map.invalidateSize(), 150);
  }
}

function closeMapModal() {
  if (mapContainerEl) mapContainerEl.classList.remove('fullscreen');
  if (backdropEl) backdropEl.classList.remove('active');
  if (expandBtn) expandBtn.classList.remove('d-none');
  if (closeBtn) closeBtn.classList.add('d-none');
  if (map) {
    setTimeout(() => map.invalidateSize(), 150);
  }
}

async function handleUseCurrentLocation(event) {
  event.preventDefault();
  if (!navigator.geolocation) {
    showMapMessage('Geolocation not supported in this browser', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const locationData = await reverseGeocode(lat, lng);
    const place = buildPlaceFromGeocode(locationData, lat, lng, 'My Location');
    selectPlace(place, true);
  }, (err) => {
    console.error('Geolocation error', err);
    showMapMessage('Unable to get your location', 'error');
  });
}

function handleMapClick(event) {
  const { lat, lng } = event.latlng;
  capturePlaceFromCoords(lat, lng, activeMode === 'start');
}

async function capturePlaceFromCoords(lat, lng, isStart) {
  const locationData = await reverseGeocode(lat, lng);
  const place = buildPlaceFromGeocode(locationData, lat, lng);
  selectPlace(place, isStart);
}

function selectPlace(place, isStart) {
  if (!place) return;
  if (isStart) {
    startPlace = place;
  } else {
    endPlace = place;
  }
  updateInputsFromPlaces();
  updateMapPreview();
}

function updateInputsFromPlaces(clearIfMissing = false) {
  if (startInputEl) {
    startInputEl.value = clearIfMissing && !startPlace
      ? ''
      : (startPlace?.address || startPlace?.name || startInputEl.value);
  }

  if (endInputEl) {
    endInputEl.value = clearIfMissing && !endPlace
      ? ''
      : (endPlace?.address || endPlace?.name || endInputEl.value);
  }
}

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
    }, 400);
  });

  function showSuggestions(results, input, isStartField) {
    if (suggestionsDiv) suggestionsDiv.remove();
    if (!results || results.length === 0) return;

    suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'location-suggestions';
    suggestionsDiv.style.cssText = `
      position: absolute;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 10px;
      max-height: 220px;
      overflow-y: auto;
      width: ${input.offsetWidth}px;
      z-index: 1200;
      box-shadow: 0 10px 25px rgba(0,0,0,0.12);
    `;

    results.forEach(result => {
      const option = document.createElement('div');
      option.className = 'suggestion-item';
      option.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.9rem;
      `;
      option.textContent = result.display_name;
      option.addEventListener('mouseenter', () => { option.style.background = '#f5f5f5'; });
      option.addEventListener('mouseleave', () => { option.style.background = '#fff'; });
      option.addEventListener('click', () => {
        const place = {
          name: result.name || result.display_name.split(',')[0],
          address: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        selectPlace(place, isStartField);
        input.value = place.address;
        suggestionsDiv.remove();
      });
      suggestionsDiv.appendChild(option);
    });

    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(suggestionsDiv);
  }

  document.addEventListener('click', (event) => {
    if (suggestionsDiv && !inputEl.contains(event.target) && !suggestionsDiv.contains(event.target)) {
      suggestionsDiv.remove();
    }
  });
}

async function searchLocation(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`
    );
    return await response.json();
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    return await response.json();
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

function buildPlaceFromGeocode(data, lat, lng, fallbackName = 'Pinned Location') {
  if (!data) {
    return {
      name: fallbackName,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng
    };
  }
  return {
    name: data.name || data.address?.road || fallbackName,
    address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    lat,
    lng
  };
}

async function updateMapPreview() {
  if (!map || !mapContainerEl) return;

  const hasStart = Boolean(startPlace?.lat && startPlace?.lng);
  const hasEnd = Boolean(endPlace?.lat && endPlace?.lng);

  if (!hasStart && !hasEnd) {
    hideMapArtifacts();
    return;
  }

  mapContainerEl.classList.remove('hidden');

  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  if (routeLine) map.removeLayer(routeLine);

  if (hasStart) startMarker = createMarker(startPlace, true);
  if (hasEnd) endMarker = createMarker(endPlace, false);

  if (hasStart && hasEnd) {
    const bounds = L.latLngBounds(
      [startPlace.lat, startPlace.lng],
      [endPlace.lat, endPlace.lng]
    );
    map.fitBounds(bounds, { padding: [50, 50] });
    await drawRoute();
  } else if (hasStart) {
    map.setView([startPlace.lat, startPlace.lng], 13);
    resetRouteStats();
  } else if (hasEnd) {
    map.setView([endPlace.lat, endPlace.lng], 13);
    resetRouteStats();
  }

  setTimeout(() => map.invalidateSize(), 100);
}

function createMarker(place, isStart) {
  const marker = L.marker([place.lat, place.lng], {
    draggable: true,
    title: isStart ? 'Start' : 'Destination'
  }).addTo(map).bindPopup(place.name || (isStart ? 'Start' : 'Destination'));

  marker.on('dragend', async (event) => {
    const { lat, lng } = event.target.getLatLng();
    await capturePlaceFromCoords(lat, lng, isStart);
  });

  return marker;
}

async function drawRoute() {
  try {
    const route = await getRoute(startPlace.lat, startPlace.lng, endPlace.lat, endPlace.lng);
    if (route) {
      routeLine = L.polyline(route.coordinates, {
        color: '#2f80ed',
        weight: 4,
        opacity: 0.8
      }).addTo(map);

      const distanceKm = route.distance / 1000;
      const durationMinutes = Math.round(route.duration / 60);
      window.__lastRoute = { distanceKm: Number(distanceKm.toFixed(1)), durationMinutes };

      if (distanceTextEl) distanceTextEl.textContent = `Distance: ${distanceKm.toFixed(1)} km`;
      if (durationTextEl) durationTextEl.textContent = `Estimated Duration: ${durationMinutes} minutes`;
      return;
    }
  } catch (error) {
    console.warn('Route calculation failed:', error);
  }

  // Fallback straight line
  routeLine = L.polyline([
    [startPlace.lat, startPlace.lng],
    [endPlace.lat, endPlace.lng]
  ], {
    color: '#95a5a6',
    weight: 2,
    opacity: 0.6,
    dashArray: '5, 8'
  }).addTo(map);

  const distance = calculateDistance(startPlace.lat, startPlace.lng, endPlace.lat, endPlace.lng);
  window.__lastRoute = null;
  if (distanceTextEl) distanceTextEl.textContent = `Distance: ~${distance.toFixed(1)} km (straight line)`;
  if (durationTextEl) durationTextEl.textContent = `Estimated Duration: —`;
}

async function getRoute(startLat, startLng, endLat, endLng) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.code === 'Ok' && data.routes?.length) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
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

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function hideMapArtifacts() {
  if (mapContainerEl) mapContainerEl.classList.add('hidden');
  if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
  if (endMarker) { map.removeLayer(endMarker); endMarker = null; }
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  resetRouteStats();
  window.__lastRoute = null;
}

function resetRouteStats() {
  if (distanceTextEl) distanceTextEl.textContent = 'Distance: —';
  if (durationTextEl) durationTextEl.textContent = 'Estimated Duration: —';
  window.__lastRoute = null;
}

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

  if (mapContainerEl) {
    mapContainerEl.insertBefore(el, mapContainerEl.firstChild);
    setTimeout(() => el.remove(), 4500);
  }
}

export function getStartLocation() { return startPlace; }
export function getEndLocation() { return endPlace; }
export function getLastRoute() { return window.__lastRoute || null; }

export function resetMapSelections() {
  startPlace = null;
  endPlace = null;
  window.__lastRoute = null;
  updateInputsFromPlaces(true);
  hideMapArtifacts();
}

export default {
  initializeMaps,
  ensureMapsReady,
  getStartLocation,
  getEndLocation,
  getLastRoute,
  resetMapSelections
};

