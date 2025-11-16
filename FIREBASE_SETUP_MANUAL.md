# Firebase Console Setup - Manual Steps Required

**⚠️ IMPORTANT:** These steps MUST be completed in Firebase Console for Google Sign-In to work properly.

---

## What This Document Covers

After deploying the code fixes, you need to ensure your Firebase project is configured to accept OAuth redirects from your deployment domains. This document lists the required manual steps.

---

## Step 1: Add Authorized Domains

This is the MOST CRITICAL step for Google Sign-In to work.

### 1.1 Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click on your project: **avishkar-c9826**
3. In the left sidebar, click **Build** → **Authentication**
4. Click the **Settings** tab (gear icon at top)
5. Scroll down to **Authorized domains** section

### 1.2 Add Required Domains

For each domain below, click **Add domain** and enter it:

#### Local Development (REQUIRED for testing)
- [ ] `localhost` 
- [ ] `127.0.0.1`

#### Firebase Hosting (if deploying to Firebase)
- [ ] `avishkar-c9826.firebaseapp.com`
- [ ] `avishkar-c9826.web.app`

#### Netlify Hosting (if deploying to Netlify)
- [ ] `YOUR_NETLIFY_DOMAIN.netlify.app` (replace with your actual domain)
  - Example: `revmate.netlify.app`

#### GitHub Pages (if deploying to GitHub Pages)
- [ ] `mrbunny159.github.io` (or your username's page)

#### Custom Domains
- [ ] Add any other custom domain you own

### 1.3 Verify Each Domain

After adding each domain:
1. Firebase will show a checkmark (✓) when added successfully
2. It may take 1-2 minutes for the domain to be recognized
3. **Test:** Try Google sign-in from that domain

---

## Step 2: Verify OAuth Consent Screen

### 2.1 Navigate to OAuth Consent Screen

1. In Firebase Console, go to **Build** → **Authentication**
2. Click the **Settings** tab
3. Under "Related products", you'll see a link to **Google Cloud Console**
4. Click that link OR go to [Google Cloud Console](https://console.cloud.google.com)

### 2.2 Check Consent Screen Configuration

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Verify:
   - [ ] **User type** is set to "External" (for development) or "Internal"
   - [ ] **App name** is set to "RevMate" (or your app name)
   - [ ] **User support email** is filled in
   - [ ] **Developer contact** email is filled in
3. If missing, click **Edit** and fill in required fields

---

## Step 3: Verify OAuth 2.0 Client ID

### 3.1 Check Web Client Configuration

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Look for an entry with type **OAuth 2.0 Client** and name **Web client**
3. Click on it to view details
4. Verify:
   - [ ] **Client ID** exists (shown at top)
   - [ ] **Client Secret** exists
   - [ ] **Authorized JavaScript origins** includes your domains
   - [ ] **Authorized redirect URIs** includes Firebase auth callback

### 3.2 If Web Client Missing

If no Web client exists:

1. Click **+ Create Credentials** → **OAuth client ID**
2. Select application type: **Web application**
3. Name: "RevMate Web"
4. Add **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - `https://avishkar-c9826.firebaseapp.com`
   - `https://avishkar-c9826.web.app`
   - Your custom domain (if any)
5. Add **Authorized redirect URIs:**
   - `https://avishkar-c9826.firebaseapp.com/__/auth/handler`
   - `https://avishkar-c9826.web.app/__/auth/handler`
   - Your custom domain's auth handler URL
6. Click **Create**

---

## Step 4: Enable Required APIs

### 4.1 Enable Google Identity Services API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Identity"
3. Click **Google Identity Services API**
4. Click the **Enable** button

### 4.2 Verify Other APIs

Ensure these are enabled:
- [ ] **Google Identity Services API** (just enabled above)
- [ ] **Firebase Authentication API** (enabled by default)
- [ ] **Cloud Firestore API** (for database)
- [ ] **Google Maps JavaScript API** (for maps)

To check/enable:
1. Go to **APIs & Services** → **Library**
2. Search for each API
3. If not enabled, click **Enable**

---

## Step 5: Verify Firebase Project Credentials

### 5.1 Check Web App Registration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **Your apps** section
3. You should see a web app (marked with `<>` icon)
4. If missing, click **Add app** → **Web**
5. Note the **Firebase config** shown:
   ```javascript
   {
     "apiKey": "AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis",
     "authDomain": "avishkar-c9826.firebaseapp.com",
     "projectId": "avishkar-c9826",
     "storageBucket": "avishkar-c9826.firebasestorage.app",
     "messagingSenderId": "480658299095",
     "appId": "1:480658299095:web:1d1cda6f2f36713738b892",
     "measurementId": "G-Z565TNDFD1"
   }
   ```

### 5.2 Verify Config in Code

Check that `public/js/firebase-init.js` has the SAME credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis",
  authDomain: "avishkar-c9826.firebaseapp.com",
  projectId: "avishkar-c9826",
  storageBucket: "avishkar-c9826.firebasestorage.app",
  messagingSenderId: "480658299095",
  appId: "1:480658299095:web:1d1cda6f2f36713738b892",
  measurementId: "G-Z565TNDFD1"
};
```

⚠️ **MUST MATCH** - If different, update `firebase-init.js` with correct credentials

---

## Step 6: Configure Firestore Security Rules (Optional)

### 6.1 Review Current Rules

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Rules** tab
3. Review current rules

### 6.2 Ensure User-Created Documents Are Allowed

Make sure rules allow authenticated users to create documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow creating and reading rides
    match /rides/{rideId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == resource.data.organizerId;
      allow delete: if request.auth.uid == resource.data.organizerId;
    }
  }
}
```

---

## Step 7: Test Google Sign-In

### 7.1 Local Testing

```bash
cd "c:\Users\sufiyaan\Desktop\RevMate Vanilla"
npm start
```

1. Open `http://localhost:3000` (or file path to index.html)
2. Click "Google" sign-in button
3. Should see popup or redirect to Google
4. Select account
5. Should redirect back to app and show authenticated state

### 7.2 Hosted Testing

After deploying to Firebase or Netlify:

1. Open your deployed URL (e.g., `https://avishkar-c9826.web.app`)
2. Click "Google" sign-in button
3. Complete OAuth
4. Should be redirected back to your domain (not localhost)

---

## Troubleshooting

### Issue: "Unauthorized domain" error

**Solution:**
- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Add the domain from the error message to "Authorized domains"
- [ ] Wait 1-2 minutes for changes to propagate
- [ ] Reload the app

### Issue: "Popup blocked" but fallback doesn't work

**Solution:**
- [ ] Check that redirect URIs are configured in Google Cloud Console
- [ ] Verify Firebase config credentials match project
- [ ] Check browser console for specific error code
- [ ] Clear browser cache and try again

### Issue: "Invalid client ID" error

**Solution:**
- [ ] Verify API Key in `firebase-init.js` matches Firebase Console config
- [ ] Ensure Google Identity Services API is ENABLED
- [ ] Check that Web OAuth client exists in Google Cloud Console
- [ ] Verify Client ID matches in both places

### Issue: Service Worker blocks auth

**Solution:**
- [ ] DevTools → Application → Service Workers
- [ ] Unregister the service worker
- [ ] Reload page (will register fresh SW)
- [ ] Try sign-in again
- [ ] Check that SW properly skips `/__/auth/handler` URLs

---

## Checklist for Completion

After completing all steps above, verify:

- [ ] **Step 1:** At least `localhost` and `127.0.0.1` added to Authorized Domains
- [ ] **Step 2:** OAuth Consent Screen has app name, email fields filled
- [ ] **Step 3:** Web OAuth client exists with correct URIs
- [ ] **Step 4:** Google Identity Services API is enabled
- [ ] **Step 5:** Firebase config in code matches Console credentials
- [ ] **Step 6:** Firestore rules allow authenticated operations (if using DB)
- [ ] **Step 7:** Local Google sign-in test succeeds
- [ ] **Step 7:** Deployed Google sign-in test succeeds

---

## Important Notes

### Development vs. Production
- **Development:** Use `localhost` and `127.0.0.1` in Authorized Domains
- **Production:** Add your actual deployment domain
- **Both can coexist:** You can have both in the same Authorized Domains list

### Deployment Checklist
Before deploying to production:
1. [ ] Add production domain to Authorized Domains
2. [ ] Test sign-in on production domain
3. [ ] Verify Service Worker is active
4. [ ] Test Maps functionality
5. [ ] Check that all Firestore operations work

### What NOT to Do
❌ Do NOT change Firebase API keys in production  
❌ Do NOT commit Firebase secrets to version control  
❌ Do NOT remove localhost from authorized domains (breaks local testing)  
❌ Do NOT trust browser-level authorization (validate on backend if possible)

---

## Quick Reference Commands

### Test Google Sign-In in Browser Console

```javascript
// Check if auth is initialized
console.log('Auth initialized:', typeof auth !== 'undefined');

// Test getting current user
console.log('Current user:', auth.currentUser);

// Test environment detection
import { getEnvironmentSummary } from './js/env-detect.js';
console.log('Environment:', getEnvironmentSummary());
```

### Clear Cached Data for Fresh Test

```javascript
// Clear browser cache
// DevTools → Application → Clear Site Data (all)

// OR clear specific items
localStorage.clear();
sessionStorage.clear();

// Unregister Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Cloud Console](https://console.cloud.google.com)
- [Authorized Domain Troubleshooting](https://support.google.com/firebase/answer/7015135)

---

**Document Status:** Complete  
**Last Updated:** 2025-11-16  
**Scope:** Firebase Console manual configuration for RevMate project
