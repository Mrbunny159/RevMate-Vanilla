# Firebase Console Configuration Checklist

**Project**: RevMate (avishkar-c9826)  
**Date**: November 16, 2025  

This checklist ensures your Firebase and Google Cloud consoles are correctly configured for Google Sign-In.

---

## ✅ SECTION 1: Firebase Project Verification

### Step 1.1: Verify Project ID
- **Where**: Firebase Console → Project Settings
- **What to Check**: Project ID should be `avishkar-c9826`
- **Expected**: ✅ avishkar-c9826
- **Status**: ☐ Verified

**Action**: Go to https://console.firebase.google.com → Select avishkar-c9826 → Settings icon (⚙️) → Project Settings

---

## ✅ SECTION 2: Authentication - Authorized Domains

### Step 2.1: Add Authorized Domains

**Where**: Firebase Console → Authentication → Sign-in method → Google  
**URL**: https://console.firebase.google.com/project/avishkar-c9826/authentication/providers

**What it does**: Tells Firebase which domains are allowed to use authentication

**Domains to Add**:

| Domain | Type | Add It |
|--------|------|--------|
| `avishkar-c9826.firebaseapp.com` | Firebase Hosting (primary) | ☐ |
| `avishkar-c9826.web.app` | Firebase Hosting (alternate) | ☐ |
| `localhost` | Local development | ☐ |
| `localhost:3000` | Local development (alternative port) | ☐ |
| `localhost:5173` | Vite dev server | ☐ |
| Your custom domain | If using custom domain | ☐ |
| `mrbunny159.github.io` | If using GitHub Pages | ☐ |

**Step-by-Step**:
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Find "Google" provider
4. Click "Edit" (pencil icon)
5. Under "Web SDK configuration", copy the Web Client ID
6. Scroll down to "Authorized domains"
7. Click "Add domain"
8. Enter first domain (e.g., `avishkar-c9826.firebaseapp.com`)
9. Click "Add"
10. Repeat for other domains

**Verification**:
```
Expected to see under "Authorized domains":
✅ avishkar-c9826.firebaseapp.com
✅ avishkar-c9826.web.app
✅ localhost
✅ (any custom domains)
```

**Status**: ☐ All domains added

---

## ✅ SECTION 3: Google Cloud OAuth Configuration

### Step 3.1: Access Google Cloud Console

**Where**: https://console.cloud.google.com/  
**Project**: avishkar-c9826  

**Action**:
1. Go to https://console.cloud.google.com
2. At top left, select project dropdown
3. Find and select "avishkar-c9826"
4. Go to "APIs & Services" → "Credentials"

### Step 3.2: Verify OAuth 2.0 Client ID Exists

**What to Check**: Should have a Web type OAuth 2.0 credential

**Status**: ☐ OAuth 2.0 Client ID (Web) exists

**If it doesn't exist**, create one:
1. Click "Create Credentials" → "OAuth client ID"
2. Choose application type: "Web application"
3. Name it: "RevMate Web App"
4. Save

### Step 3.3: Add Authorized Redirect URIs

**Important**: These URIs tell Google where to redirect users after they sign in.

**Where**: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

**Click on your Web OAuth credential** and add these Redirect URIs:

| Redirect URI | Purpose | Status |
|---|---|---|
| `https://avishkar-c9826.firebaseapp.com/__/auth/handler` | Firebase main domain | ☐ |
| `https://avishkar-c9826.web.app/__/auth/handler` | Firebase alternate domain | ☐ |
| `http://localhost:3000/__/auth/handler` | Local dev (if using port 3000) | ☐ |
| `http://localhost:5173/__/auth/handler` | Vite dev server | ☐ |
| `http://localhost/__/auth/handler` | Local dev (default) | ☐ |
| `https://your-custom-domain.com/__/auth/handler` | If using custom domain | ☐ |
| `https://mrbunny159.github.io/__/auth/handler` | If using GitHub Pages | ☐ |

**CRITICAL**: The path `/__/auth/handler` is Firebase's built-in handler endpoint. DO NOT change this path.

**Step-by-Step**:
1. Open your Web OAuth 2.0 Client ID
2. Scroll to "Authorized redirect URIs"
3. Click "Add URI"
4. Paste first URI: `https://avishkar-c9826.firebaseapp.com/__/auth/handler`
5. Press Enter
6. Repeat for other URIs
7. Click "Save" at bottom

**Verification**:
```
Expected to see:
✅ https://avishkar-c9826.firebaseapp.com/__/auth/handler
✅ https://avishkar-c9826.web.app/__/auth/handler
✅ http://localhost/__/auth/handler
✅ http://localhost:5173/__/auth/handler
(and any custom domains)
```

**Status**: ☐ All redirect URIs added

### Step 3.4: Get Your Client ID

**Why**: You need this to verify in your app code

**Where**: Google Cloud Console → Credentials → OAuth 2.0 Client IDs

**Look for**: "Client ID" field (alphanumeric string)

**Example**: `123456789012-abc123def456ghi789.apps.googleusercontent.com`

**Your Client ID**: ________________

**Status**: ☐ Client ID noted

---

## ✅ SECTION 4: Enable Required APIs

### Step 4.1: Enable Google Identity Services API

**Where**: Google Cloud Console → APIs & Services → Library

**Action**:
1. Search for "Google Identity Services API"
2. Click on it
3. Click "Enable"
4. Wait for activation (usually instant)

**Status**: ☐ Google Identity Services API enabled

### Step 4.2: Enable Google+ API (for profile data)

**Where**: Google Cloud Console → APIs & Services → Library

**Action**:
1. Search for "Google+ API"
2. Click on it
3. Click "Enable"

**Status**: ☐ Google+ API enabled

---

## ✅ SECTION 5: Firebase Configuration Code

### Step 5.1: Verify Firebase Config in Code

**File**: `public/js/firebase-config.js`

**Check these values match Firebase Console**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEDcuCkGe7N6H6A8kX4BljtMdjR9IoXis",
  authDomain: "avishkar-c9826.firebaseapp.com",  // ← Should be this
  projectId: "avishkar-c9826",                      // ← Should be this
  storageBucket: "avishkar-c9826.firebasestorage.app",
  messagingSenderId: "480658299095",
  appId: "1:480658299095:web:1d1cda6f2f36713738b892",
  measurementId: "G-Z565TNDFD1"
};
```

**Verification**:
- ☐ apiKey is present and non-empty
- ☐ authDomain = avishkar-c9826.firebaseapp.com
- ☐ projectId = avishkar-c9826
- ☐ appId is present

**Status**: ☐ Firebase config verified

---

## ✅ SECTION 6: Auth Handler Setup

### Step 6.1: Verify auth-handler.html Exists

**File**: `public/auth-handler.html`

**Check**:
- ☐ File exists
- ☐ Contains `<script type="module" src="js/auth-handler-init.js"></script>`

**Test**: 
- Open https://avishkar-c9826.firebaseapp.com/auth-handler.html
- Should see "Completing Sign-In..." page
- Should not see errors in console

**Status**: ☐ auth-handler.html accessible

### Step 6.2: Verify auth-handler-init.js Exists

**File**: `public/js/auth-handler-init.js`

**Check**:
- ☐ File exists
- ☐ Imports from `./auth-google.js`
- ☐ Calls `handleAuthRedirect()`

**Status**: ☐ auth-handler-init.js present

---

## ✅ SECTION 7: Firestore Security Rules

### Step 7.1: Verify User Document Permissions

**File**: `firestore.rules`

**Should allow authenticated users to create/read their own documents**:

```
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId;
  allow delete: if request.auth.uid == userId;
}
```

**Status**: ☐ Firestore rules allow user document creation

**Troubleshooting**: If auth succeeds but Firestore write fails:
- Check that user doc creation is allowed
- Check console for "Permission denied" errors
- Verify auth context is available

---

## ✅ SECTION 8: Testing Checklist

### Step 8.1: Test Production Domain

**Domain**: https://avishkar-c9826.firebaseapp.com  

**Test Steps**:
1. Open domain in desktop Chrome
2. Click "Google" sign-in button
3. Expect: Popup opens with Google Sign-In
4. Sign in with test account
5. Expect: Redirected to app, user logged in

**Expected Result**: ✅ Sign-in works  
**Status**: ☐ Production domain tested

### Step 8.2: Test Local Development

**Domain**: http://localhost:5173 (Vite) or http://localhost:3000 (alternative)

**Prerequisites**:
- `localhost` added to Firebase Authorized Domains
- `http://localhost/__/auth/handler` added to Google redirect URIs

**Test Steps**:
1. Run `npm run dev` (or your dev server)
2. Open in local Chrome
3. Click "Google" sign-in button
4. Sign in
5. Expect: Callback returns to app

**Expected Result**: ✅ Local dev works  
**Status**: ☐ Local development tested

### Step 8.3: Test WebView (Median.co)

**Prerequisites**: Median.co link behavior rules configured (see median-link-rules.md)

**Test Steps**:
1. Open Median app on device
2. Click "Google" sign-in
3. Expect: External browser opens
4. Sign in
5. Expect: Redirected back to Median app

**Expected Result**: ✅ WebView redirect works  
**Status**: ☐ Median.co tested (if applicable)

---

## ✅ SECTION 9: Error Resolution

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **403: disallowed_useragent** | OAuth from WebView | ✓ Use signInWithRedirect (done in code) |
| **auth/invalid-credentials** | Wrong client ID or domain not authorized | ✓ Check Google Cloud credentials ✓ Check Firebase Authorized Domains |
| **auth/auth-domain-config-required** | Domain not in authorized list | ✓ Add domain to Firebase Console → Authentication |
| **Invalid redirect_uri** | Redirect URI not in Google console | ✓ Add `https://domain/__/auth/handler` to Google Cloud Console |
| **auth/popup-blocked** | Browser blocked popup | ✓ Code automatically tries redirect fallback |

---

## ✅ FINAL VERIFICATION SUMMARY

| Check | Status |
|-------|--------|
| Firebase Project ID = avishkar-c9826 | ☐ |
| Authorized Domains added | ☐ |
| Google OAuth Redirect URIs added | ☐ |
| Google Identity Services API enabled | ☐ |
| firebase-config.js values verified | ☐ |
| auth-handler.html accessible | ☐ |
| Firestore rules allow user docs | ☐ |
| Production domain tested | ☐ |
| Local dev tested | ☐ |
| WebView (if applicable) tested | ☐ |

---

## ❓ NEED HELP?

If you encounter issues:

1. **Check Browser Console** (F12 → Console tab)
2. **Look for error code** (auth/... codes are informative)
3. **Check this checklist** (most issues = configuration missing)
4. **Read TEST_PLAN.md** (for detailed testing procedures)
5. **Check PRODUCTION_READY_GOOGLE_AUTH_REPAIR.md** (complete technical reference)

---

**Estimated Time to Complete**: 15-20 minutes  
**Difficulty**: Easy (mostly copy-paste URLs)

Once all items are checked, your Google Sign-In should work seamlessly across all platforms!

