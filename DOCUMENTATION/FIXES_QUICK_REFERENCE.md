# RevMate Fixes - Quick Reference Guide

## 1. Google Maps PlaceAutocompleteElement

### What Changed
**OLD (Deprecated):**
```javascript
const autocomplete = new google.maps.places.Autocomplete(input, {...});
```

**NEW (Current):**
```javascript
const autocompleteElement = document.createElement('gmp-place-autocomplete');
autocompleteElement.setAttribute('api-key', 'YOUR_API_KEY');
autocompleteElement.addEventListener('gmp-placeselect', async () => {
    const place = await autocompleteElement.getPlace();
    // Use place.geometry.location.lat/lng()
});
```

### HTML Required
```html
<script src="https://unpkg.com/@googlemaps/js-loader@1.16.2/dist/index.min.js"></script>
```

---

## 2. Firestore Query - Avoid Index Errors

### What Changed
**BROKEN (Requires Index):**
```javascript
query(
    collection(db, 'rides'),
    where('participants', 'array-contains', uid),
    where('organizerId', '!=', uid),           // ← Causes index error
    orderBy('organizerId'),                    // ← With this
    orderBy('rideDateTime', 'asc')
)
```

**FIXED (Simple, No Index):**
```javascript
query(
    collection(db, 'rides'),
    where('participants', 'array-contains', uid),
    orderBy('rideDateTime', 'asc')
)
// Then filter in JavaScript:
// if (ride.organizerId !== uid) { ... }
```

---

## 3. Firebase Auth - Popup + Redirect

### What Changed
**BROKEN (Popup Only):**
```javascript
const result = await signInWithPopup(auth, provider);
// ❌ Fails if popup blocked
```

**FIXED (Popup + Redirect Fallback):**
```javascript
// Try popup first
try {
    return await signInWithPopup(auth, provider);
} catch (error) {
    if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);  // Fallback
        return null;  // Page will reload
    }
    throw error;
}

// On page load, handle redirect result:
const result = await getRedirectResult(auth);
```

---

## 4. Important Imports to Keep

### maps.js
```javascript
// No Firebase imports needed - pure Google Maps
```

### firebase-auth.js
```javascript
import { signInWithRedirect, getRedirectResult } from "firebase-auth.js";
```

### rides.js
```javascript
import { getDoc, getDocs } from "firebase-firestore.js";  // ← Important!
```

### script.js
```javascript
import { handleRedirectResult } from './firebase-auth.js';
```

---

## 5. Key Functions

### Load Discover Rides
```javascript
function loadDiscoverRidesUI() {
    const unsubscribe = loadDiscoverRides((result) => {
        if (!result.success) {
            console.error(result.error);
            return;
        }
        // result.rides = array of rides
        renderRideCards(result.rides);
    });
    
    // Save unsubscribe for cleanup
    discoverRidesUnsubscribe = unsubscribe;
}
```

### Load My Rides (Joined)
```javascript
function loadMyRidesUI() {
    const unsubscribe = loadJoinedRides((result) => {
        if (!result.success) return;
        
        // Real-time update happens automatically
        // Rides where: user is in participants AND user is NOT organizer
        renderMyRides(result.rides);
    });
    
    joinedRidesUnsubscribe = unsubscribe;
}
```

### Join Ride
```javascript
async function handleJoinRide(rideId) {
    const result = await joinRide(rideId);
    if (!result.success) {
        showAlert(result.error, 'danger');
        return;
    }
    // Listener will auto-update UI
    showAlert('Joined ride!', 'success');
}
```

---

## 6. Error Handling

### Firestore Errors
```javascript
onSnapshot(q, (snapshot) => {
    // Success
}, (error) => {
    // Handle error
    if (error.code === 'failed-precondition') {
        console.log('Index being created, try again later');
    } else if (error.code === 'permission-denied') {
        console.log('User not authenticated');
    } else {
        console.log(error.message);
    }
});
```

### Auth Errors
```javascript
try {
    const result = await loginWithGoogle();
} catch (error) {
    if (error.code === 'auth/popup-blocked') {
        console.log('Popup blocked, used redirect instead');
    } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('User cancelled login');
    } else {
        console.log(error.message);
    }
}
```

---

## 7. Testing Checklist

```
LOCATION PICKER
- [ ] Type location in Host form
- [ ] Autocomplete suggestions appear
- [ ] Select location
- [ ] Coordinates captured correctly

RIDES CRUD
- [ ] Create ride (Host tab)
- [ ] Ride appears in Discover
- [ ] Join ride (Discover tab)
- [ ] Ride appears in My Rides > Joined
- [ ] See hosted rides in My Rides > Hosted
- [ ] Leave ride
- [ ] Ride disappears from Joined tab
- [ ] Cancel ride (organizer only)

REAL-TIME UPDATES
- [ ] Open Discover in 2 tabs
- [ ] Create ride in tab A
- [ ] Appears immediately in tab B
- [ ] Join in tab A
- [ ] Count updates in tab B

AUTHENTICATION
- [ ] Google login works
- [ ] Apple login works
- [ ] Email login works
- [ ] Phone login works
- [ ] Logout works
- [ ] On VS Code Live Server - uses redirect
- [ ] On mobile - works correctly
```

---

## 8. Common Issues & Fixes

### "The query requires an index"
**Cause:** Complex Firestore query with multiple where + orderBy
**Fix:** Simplify query, filter in JavaScript instead

### "auth/popup-blocked"
**Cause:** Popup blocked by browser or environment
**Fix:** Already handled - auto-fallback to redirect

### "Places.Autocomplete is not a constructor"
**Cause:** Using deprecated Autocomplete API
**Fix:** Already migrated to PlaceAutocompleteElement

### "getDoc is not a function"
**Cause:** Missing import in rides.js
**Fix:** Added to imports (already done)

### Rides not loading in real-time
**Cause:** Listener not set up, or unsubscribe called too early
**Fix:** Save unsubscribe function, call cleanup on page unload

---

## 9. Firestore Security Rules

### Recommended Rules
```firestore
match /rides/{document=**} {
  // Anyone can read public rides
  allow read: if request.auth != null && resource.data.isPublic == true;
  
  // Users can read rides they're in or created
  allow read: if request.auth != null && 
    (resource.data.organizerId == request.auth.uid ||
     request.auth.uid in resource.data.participants);
  
  // Authenticated users can create rides
  allow create: if request.auth != null;
  
  // Only organizer can update their ride
  allow update: if request.auth != null &&
    resource.data.organizerId == request.auth.uid;
  
  // Only organizer can delete their ride
  allow delete: if request.auth != null &&
    resource.data.organizerId == request.auth.uid;
}

match /users/{document=**} {
  allow read, write: if request.auth.uid == document;
}
```

---

## 10. Performance Tips

### Listener Cleanup
```javascript
// On page unload or section change
if (discoverRidesUnsubscribe) {
    discoverRidesUnsubscribe();  // Stop listening
}
```

### Batch Operations
```javascript
// For multiple updates, use batch
const batch = writeBatch(db);
batch.update(doc(db, 'rides', rideId1), {...});
batch.update(doc(db, 'rides', rideId2), {...});
await batch.commit();
```

### Pagination
```javascript
// For large result sets, use limit
const q = query(
    collection(db, 'rides'),
    where('isPublic', '==', true),
    orderBy('rideDateTime', 'desc'),
    limit(20)  // Only fetch 20 rides
);
```

---

## Version Info
- Firebase SDK: v12.6.0
- Google Maps: Latest (CDN)
- Google Maps JS Loader: v1.16.2
- Last Updated: November 15, 2025
- Status: ✅ Production Ready

