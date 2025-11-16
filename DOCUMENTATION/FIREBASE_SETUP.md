# RevMate Firebase Integration Setup Guide

## Overview
RevMate has been integrated with Firebase for backend services including authentication, database, and storage.

## Files Added

1. **firebase-config.js** - Firebase configuration and initialization
2. **firebase-auth.js** - Authentication helper functions
3. **firebase-db.js** - Firestore database helper functions
4. **firestore-rules.txt** - Firestore security rules (Security Rule 2)

## Setup Instructions

### Step 1: Install Firebase Dependencies
```bash
npm install firebase
```

### Step 2: Update HTML to Support ES Modules
The current `script.js` needs to be converted to use ES modules. Update `index.html`:

```html
<script type="module" src="script.js"></script>
```

### Step 3: Deploy Firestore Security Rules
1. Go to Firebase Console
2. Navigate to Firestore Database → Rules
3. Copy the contents of `firestore-rules.txt`
4. Paste into the rules editor
5. Click Publish

### Step 4: Initialize Firebase in script.js
Update `script.js` to use Firebase instead of localStorage:

```javascript
import { registerUser, loginUser, logoutUser, onAuthChange } from './firebase-auth.js';
import { createRide, getAllRides, joinRide, leaveRide, deleteRide } from './firebase-db.js';
```

## Security Features

### Security Rule 2: Authenticated Users Only
- ✅ Only authenticated users can access the database
- ✅ Users can only read/write their own data
- ✅ Hosts can manage their rides
- ✅ Community data is read-only to authenticated users
- ✅ Following relationships are user-specific

### Data Structure

```
users/{userId}
├── id (string)
├── name (string)
├── email (string)
├── createdAt (timestamp)
└── following (array)

rides/{rideId}
├── title (string)
├── desc (string)
├── start (string)
├── dest (string)
├── date (string)
├── host (string)
├── hostId (string)
├── joinedUsers (array)
└── createdAt (timestamp)

community/{memberId}
├── id (string)
├── name (string)
├── bike (string)
└── city (string)
```

## API Functions

### Authentication (firebase-auth.js)
- `registerUser(email, password, name)` - Create new user account
- `loginUser(email, password)` - Login user
- `logoutUser()` - Logout user
- `onAuthChange(callback)` - Listen to auth state changes
- `getCurrentUserId()` - Get current user ID

### Database (firebase-db.js)
- `createRide(rideData, hostId)` - Create a new ride
- `getAllRides()` - Get all available rides
- `getHostedRides(hostId)` - Get rides hosted by user
- `getJoinedRides(userId)` - Get rides joined by user
- `joinRide(rideId, userId)` - Join a ride
- `leaveRide(rideId, userId)` - Leave a ride
- `deleteRide(rideId)` - Delete a ride
- `getCommunityMembers()` - Get all community members
- `followMember(userId, memberId)` - Follow a member
- `unfollowMember(userId, memberId)` - Unfollow a member
- `updateUserProfile(userId, userData)` - Update user info

## Environment Variables

Create a `.env` file (optional, for sensitive data):
```
VITE_FIREBASE_API_KEY=AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis
VITE_FIREBASE_AUTH_DOMAIN=avishkar-c9826.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=avishkar-c9826
```

## Migration from localStorage to Firebase

Replace localStorage calls:
```javascript
// OLD (localStorage)
const users = getData('users');

// NEW (Firebase)
const result = await getAllRides();
if (result.success) {
    const rides = result.rides;
}
```

## Troubleshooting

### "Firebase is not defined"
- Make sure to use `type="module"` in script tag
- Import Firebase functions at top of file

### "Permission denied" errors
- Check that security rules are deployed
- Verify user is authenticated
- Ensure user ID matches the document owner

### "CORS errors"
- This is normal for development
- Configure Firebase CORS settings in Firebase Console

## Next Steps

1. Update `script.js` to use Firebase functions
2. Remove localStorage dependency
3. Test authentication flow
4. Verify security rules are working
5. Deploy to production

## Support

For Firebase documentation, visit: https://firebase.google.com/docs
