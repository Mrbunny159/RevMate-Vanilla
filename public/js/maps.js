// maps.js
// ES module to initialize Place Autocomplete inputs, map preview, directions, and "Use Current Location".

let map = null;
let directionsService = null;
let directionsRenderer = null;
let startMarker = null;
let endMarker = null;
let startPlace = null;
let endPlace = null;
let mapsReady = false;

// Wait for Google Maps JS API to be ready
export function ensureMapsReady(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (mapsReady && window.google && window.google.maps) return resolve();

    const start = Date.now();

    const check = () => {
      if (window.google && window.google.maps) {
        mapsReady = true;
        return resolve();
      }
      if (Date.now() - start > timeout) return reject(new Error('Google Maps API load timeout'));
      setTimeout(check, 100);
    };

    check();
  });
}

function safe(elOrId) {
  return typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
}

// Create Place Autocomplete element (new standard) or fallback to Autocomplete
function createAutocomplete(inputEl) {
  if (!inputEl) return null;

  if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
    try {
      // New Places Autocomplete Element
      const pae = new window.google.maps.places.PlaceAutocompleteElement({ input: inputEl });
      return pae;
    } catch (err) {
      console.warn('PlaceAutocompleteElement init failed, falling back to Autocomplete:', err);
    }
  }

  // Fallback: older Autocomplete
  if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
    try {
      return new window.google.maps.places.Autocomplete(inputEl);
    } catch (err) {
      console.warn('Fallback Autocomplete init failed:', err);
    }
  }

  return null;
}

// Parse a PlaceResult (robustly) into our small shape
function parsePlaceResult(place) {
  if (!place) return null;
  const ge = place.geometry || place.geometry?.location;
  const lat = ge && (typeof ge.lat === 'function' ? ge.lat() : ge.lat);
  const lng = ge && (typeof ge.lng === 'function' ? ge.lng() : ge.lng);
  return {
    name: place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : ''),
    address: place.formatted_address || place.vicinity || '',
    lat: lat,
    lng: lng
  };
}

function setStart(place) {
  startPlace = parsePlaceResult(place);
  window.__selectedStartLocation = startPlace;
  triggerLocationsChanged();
  updateMapPreview();
}

function setEnd(place) {
  endPlace = parsePlaceResult(place);
  window.__selectedEndLocation = endPlace;
  triggerLocationsChanged();
  updateMapPreview();
}

const locationChangeCallbacks = [];
export function onLocationsChanged(cb) {
  if (typeof cb === 'function') locationChangeCallbacks.push(cb);
}
function triggerLocationsChanged() {
  locationChangeCallbacks.forEach(cb => {
    try { cb({ start: startPlace, end: endPlace }); } catch (e) { console.error(e); }
  });
}

export function getStartLocation() { return startPlace; }
export function getEndLocation() { return endPlace; }

// Initialize map preview, autocompletes and listeners
export async function initializeMaps({ startInputId = 'startLocationInput', endInputId = 'endLocationInput', mapContainerId = 'mapPreview' } = {}) {
  await ensureMapsReady();

  const startEl = document.getElementById(startInputId);
  const endEl = document.getElementById(endInputId);
  const mapEl = document.getElementById(mapContainerId);

  if (!startEl || !endEl || !mapEl) return;

  // Create map
  try {
    map = new window.google.maps.Map(mapEl, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      disableDefaultUI: true,
      gestureHandling: 'greedy'
    });

    directionsService = new window.google.maps.DirectionsService();
    directionsRenderer = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: true });
  } catch (err) {
    console.error('Error initializing map:', err);
  }

  // Create autocompletes
  const startAuto = createAutocomplete(startEl);
  const endAuto = createAutocomplete(endEl);

  // Handle selection events: try both new and fallback event names
  if (startAuto) {
    if (startAuto.addListener) {
      // fallback Autocomplete
      startAuto.addListener('place_changed', () => {
        const place = startAuto.getPlace ? startAuto.getPlace() : null;
        setStart(place);
      });
    } else if (startAuto.input) {
      // PlaceAutocompleteElement may not have addListener; listen on input blur and try reverse geocode
      startEl.addEventListener('change', async () => {
        // try to fetch details using PlacesService
        const placesService = new window.google.maps.places.PlacesService(map);
        const val = startEl.value;
        if (!val) return;
        try {
          const r = await findPlaceByText(val);
          setStart(r?.candidates?.[0] || null);
        } catch (e) { console.warn(e); }
      });
    }
  }

  if (endAuto) {
    if (endAuto.addListener) {
      endAuto.addListener('place_changed', () => {
        const place = endAuto.getPlace ? endAuto.getPlace() : null;
        setEnd(place);
      });
    } else if (endAuto.input) {
      endEl.addEventListener('change', async () => {
        const val = endEl.value;
        if (!val) return;
        try {
          const r = await findPlaceByText(val);
          setEnd(r?.candidates?.[0] || null);
        } catch (e) { console.warn(e); }
      });
    }
  }

  // If user types and presses Enter, try to find place by text
  async function findPlaceByText(text) {
    if (!window.google || !window.google.maps || !window.google.maps.places) return null;
    const service = new window.google.maps.places.PlacesService(map);

    return new Promise((resolve, reject) => {
      service.findPlaceFromQuery({ query: text, fields: ['name', 'formatted_address', 'geometry'] }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length) {
          resolve({ candidates: results });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Expose a method to use current position and reverse geocode
  const useBtn = document.getElementById('useCurrentLocation');
  if (useBtn) {
    useBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!navigator.geolocation) {
        alert('Geolocation not supported in this browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const geocoder = new window.google.maps.Geocoder();
        const resp = await geocodeLatLng(geocoder, { lat, lng });
        const placeLike = {
          name: resp?.name || 'My Location',
          formatted_address: resp?.address || '',
          geometry: { location: { lat: () => lat, lng: () => lng } }
        };
        // Fill input and set start
        startEl.value = placeLike.formatted_address || placeLike.name || '';
        setStart(placeLike);
      }, (err) => {
        console.error('Geolocation error', err);
        alert('Unable to get your location');
      });
    });
  }

  // Map helpers
  async function geocodeLatLng(geocoder, latlng) {
    return new Promise((resolve) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve({ name: results[0].address_components?.[0]?.long_name || '', address: results[0].formatted_address });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Draw route when both places exist
  async function updateMapPreview() {
    const previewContainer = document.getElementById('mapPreviewContainer');
    const distanceTextEl = document.getElementById('distanceText');
    const durationTextEl = document.getElementById('durationText');

    if (!startPlace || !endPlace) {
      // clear map markers and renderer
      if (directionsRenderer) directionsRenderer.set('directions', null);
      if (startMarker) { startMarker.setMap(null); startMarker = null; }
      if (endMarker) { endMarker.setMap(null); endMarker = null; }
      if (previewContainer) previewContainer.classList.add('hidden');
      window.__lastRoute = null;
      return;
    }

    if (previewContainer) previewContainer.classList.remove('hidden');

    const request = {
      origin: { lat: startPlace.lat, lng: startPlace.lng },
      destination: { lat: endPlace.lat, lng: endPlace.lng },
      travelMode: window.google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);

        // Place markers (green start / red end)
        if (startMarker) startMarker.setMap(null);
        if (endMarker) endMarker.setMap(null);

        startMarker = new window.google.maps.Marker({
          position: { lat: startPlace.lat, lng: startPlace.lng },
          map,
          title: startPlace.name || 'Start',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2ECC71',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        endMarker = new window.google.maps.Marker({
          position: { lat: endPlace.lat, lng: endPlace.lng },
          map,
          title: endPlace.name || 'End',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#E74C3C',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Fit bounds
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new window.google.maps.LatLng(startPlace.lat, startPlace.lng));
        bounds.extend(new window.google.maps.LatLng(endPlace.lat, endPlace.lng));
        map.fitBounds(bounds);

        // Compute distance & duration from result (sum legs)
        try {
          const legs = result.routes[0].legs || [];
          let distanceMeters = 0;
          let durationSeconds = 0;
          legs.forEach(l => {
            distanceMeters += l.distance?.value || 0;
            durationSeconds += l.duration?.value || 0;
          });

          const distanceKm = distanceMeters / 1000;
          const durationMinutes = Math.round(durationSeconds / 60);

          window.__lastRoute = { distanceKm: Number(distanceKm.toFixed(1)), durationMinutes };

          if (distanceTextEl) distanceTextEl.textContent = `Distance: ${distanceKm.toFixed(1)} km`;
          if (durationTextEl) durationTextEl.textContent = `Estimated Duration: ${durationMinutes} minutes`;
        } catch (e) {
          console.warn('Failed to parse directions legs', e);
        }
      } else {
        console.warn('Directions request failed:', status, result);
      }
    });
  }

  // Also update preview when input values change manually
  startEl.addEventListener('blur', async () => {
    if (!startEl.value) return;
    if (!startPlace || startPlace.address !== startEl.value) {
      const r = await findPlaceByText(startEl.value);
      if (r && r.candidates && r.candidates[0]) setStart(r.candidates[0]);
    }
  });

  endEl.addEventListener('blur', async () => {
    if (!endEl.value) return;
    if (!endPlace || endPlace.address !== endEl.value) {
      const r = await findPlaceByText(endEl.value);
      if (r && r.candidates && r.candidates[0]) setEnd(r.candidates[0]);
    }
  });

  // Expose initial state if inputs already filled
  if (startEl.value) startEl.dispatchEvent(new Event('blur'));
  if (endEl.value) endEl.dispatchEvent(new Event('blur'));
}

// Utility for other modules
export function getLastRoute() { return window.__lastRoute || null; }

export default {
  initializeMaps,
  ensureMapsReady,
  getStartLocation,
  getEndLocation,
  onLocationsChanged,
  getLastRoute
};
