# Median.co Link Behavior Configuration Guide

**App**: RevMate  
**Purpose**: Configure Median.co to open OAuth links in device browser (fixes Error 403)  
**Time Required**: 5-10 minutes  

---

## ⚡ QUICK REFERENCE: Copy-Paste Rules

If you just want the rules to paste, here they are. Detailed explanation follows.

### Rule Set for Median.co Link Behavior

```
Domain/Pattern                          | Behavior         | Notes
=========================================|==================|==========================
https://accounts.google.com/*           | External Browser | OAuth endpoint
https://*.googleusercontent.com/*       | External Browser | Google user data
https://*.gstatic.com/*                 | External Browser | Google static assets
https://avishkar-c9826.firebaseapp.com/__/auth/handler | External | Firebase callback
https://avishkar-c9826.web.app/__/auth/handler | External | Firebase callback (alternate)
https://avishkar-c9826.firebaseapp.com/* | Internal WebView | Your app domain
https://avishkar-c9826.web.app/*       | Internal WebView | Your app domain (alternate)
http://localhost/*                      | Internal WebView | Local dev (if testing)
All Other Links                         | External Browser | Recommended for security
```

---

## 📋 WHY THESE RULES?

### The Problem (Error 403: disallowed_useragent)

When you click "Sign In with Google" in Median:

1. **Without proper rules**: Median tries to open `accounts.google.com` **inside the WebView**
2. **Google sees**: A WebView user-agent string (not Chrome, Safari, or standard browser)
3. **Google rejects it**: "Error 403: disallowed_useragent" - we don't accept WebView requests
4. **Result**: ❌ Auth fails, user frustrated

### The Solution

Force OAuth URLs to open in the **device browser** (Chrome/Safari) instead of the WebView:

1. User clicks "Sign In with Google"
2. Median sees `accounts.google.com` in the rule list
3. Median opens URL in **device's native browser** instead of WebView
4. Google receives request from Chrome/Safari (proper user-agent)
5. Google accepts it ✅
6. After sign-in, browser redirects back to Firebase callback
7. Firebase callback is also configured to be external, so redirect happens in browser
8. Median intercepts the redirect and **brings user back to app**
9. Auth complete ✅

---

## 🔧 STEP-BY-STEP MEDIAN.CO SETUP

### Step 1: Log In to Median Dashboard

1. Go to https://median.co/dashboard
2. Log in with your Median account
3. Find your RevMate app in the list
4. Click to open app settings

### Step 2: Navigate to Link Behavior Settings

**Path in Median Dashboard**:
```
Dashboard
  → Your App
    → Settings
      → Links
        → Link Behavior Rules
```

Or direct: Look for "Links" section in the left sidebar

### Step 3: Add Individual Rules

#### Rule 1: Google Sign-In Endpoint

- **Domain/URL Pattern**: `https://accounts.google.com/*`
- **Behavior**: External Browser
- **Explanation**: This is where users sign in. Must be in device browser.

**How to add**:
1. Click "Add Rule" or "New Rule"
2. Pattern: `https://accounts.google.com/*`
3. Behavior: External Browser
4. Click Save

#### Rule 2: Google User Data

- **Domain/URL Pattern**: `https://*.googleusercontent.com/*`
- **Behavior**: External Browser
- **Explanation**: Google's user profile data. Needed for OAuth flow.

#### Rule 3: Google Static Assets

- **Domain/URL Pattern**: `https://*.gstatic.com/*`
- **Behavior**: External Browser
- **Explanation**: Google's CDN (scripts, stylesheets, fonts). Must load in browser context.

#### Rule 4: Firebase Auth Handler (Primary Domain)

- **Domain/URL Pattern**: `https://avishkar-c9826.firebaseapp.com/__/auth/handler`
- **Behavior**: External Browser
- **Explanation**: After user signs in on Google, they're redirected here. Must be external so Median can intercept and return to app.

#### Rule 5: Firebase Auth Handler (Alternate Domain)

- **Domain/URL Pattern**: `https://avishkar-c9826.web.app/__/auth/handler`
- **Behavior**: External Browser
- **Explanation**: Same as Rule 4, but for the alternate Firebase domain.

#### Rule 6: Your App Domain (Primary)

- **Domain/URL Pattern**: `https://avishkar-c9826.firebaseapp.com/*`
- **Behavior**: Internal WebView
- **Explanation**: Regular app content stays in the WebView. Only OAuth URLs break out.

#### Rule 7: Your App Domain (Alternate)

- **Domain/URL Pattern**: `https://avishkar-c9826.web.app/*`
- **Behavior**: Internal WebView
- **Explanation**: Same as Rule 6, for alternate domain.

#### Rule 8: Local Development (Optional)

- **Domain/URL Pattern**: `http://localhost/*`
- **Behavior**: Internal WebView
- **Explanation**: If testing locally in Median, keep local URLs in WebView.

### Step 4: Set Default Behavior

In Median, there's usually a setting for "Default behavior for all other links".

**Recommended**: Set to **External Browser**

This ensures:
- Unexpected links open safely outside the app
- Better security (malicious links can't hijack app context)
- Consistent with modern app best practices

### Step 5: Save Configuration

1. Click "Save All Rules" or equivalent
2. Median should confirm: "Rules saved successfully"
3. Wait 1-2 minutes for changes to propagate

### Step 6: Test Configuration

**On your Median app**:

1. Open the app on your test device
2. Navigate to Sign-In screen
3. Click "Sign In with Google"
4. Expected behavior:
   - Device's native browser opens (you see full Chrome/Safari UI)
   - Google Sign-In page appears
   - You sign in normally
   - You're redirected back
   - Median re-opens, and you're logged in to RevMate
5. **No error message** ✅

---

## 🖼️ VISUAL GUIDE (Text Description)

### Before Configuration (❌ Broken)

```
User App (WebView)
  ↓ Click "Sign In with Google"
  → Median tries to load accounts.google.com in WebView
  → WebView user-agent sent to Google
  → Google says: "Error 403: disallowed_useragent - go away"
  ❌ Auth fails
```

### After Configuration (✅ Working)

```
User App (WebView)
  ↓ Click "Sign In with Google"
  → Median sees accounts.google.com in rules
  → Median opens accounts.google.com in Device Browser
  → Device Browser sends Chrome/Safari user-agent
  → Google says: "OK, valid browser" ✅
  → User signs in in Device Browser
  → Google redirects to avishkar-c9826.firebaseapp.com/__/auth/handler
  → Median intercepts redirect, sees it in rules
  → Median brings user back to app (still in Device Browser first, then back to app)
  → Auth complete ✅
  → User is logged in to RevMate
```

---

## ⚠️ IMPORTANT NOTES

### 1. The `/__/auth/handler` Path

**DO NOT CHANGE THIS PATH**. It's Firebase's built-in handler.

```
✅ Correct: https://avishkar-c9826.firebaseapp.com/__/auth/handler
❌ Wrong:  https://avishkar-c9826.firebaseapp.com/auth-handler
❌ Wrong:  https://avishkar-c9826.firebaseapp.com/custom-auth-path
```

### 2. Wildcard Patterns

The `*` at the end matches any sub-path or query parameter.

```
https://accounts.google.com/*
  Matches: https://accounts.google.com/signin
  Matches: https://accounts.google.com/oauth/authorize?...
  Matches: https://accounts.google.com/anything/else
```

### 3. Testing Locally

If testing in Median on your local machine:
- Add `http://localhost/*` rule
- Set to Internal WebView
- App will work as expected

### 4. Propagation Time

After saving rules:
- Some changes apply immediately
- Some may take 1-5 minutes
- If tests fail immediately after saving, wait a minute and retry

---

## 🔍 TROUBLESHOOTING

### Problem: "Error 403: disallowed_useragent" Still Appears

**Check**:
1. ☐ Did you add `https://accounts.google.com/*` rule?
2. ☐ Is it set to "External Browser"?
3. ☐ Did you click Save?
4. ☐ Did you wait 1-2 minutes for propagation?
5. ☐ Are you testing on the actual Median app (not preview)?

**Solution**: Go back and double-check each rule. Typos are easy to miss.

### Problem: Sign-In Works, But User Isn't Logged In to App

**Check**:
1. ☐ Does your app code call `handleAuthRedirect()` on page load?
2. ☐ Is this code in `index.html` or `script.js`?

**Solution**: Make sure your app explicitly calls the auth handler when page loads.

### Problem: Redirect Happens, But App Goes to Blank Page

**Check**:
1. ☐ Are you running the app through Firebase Hosting (not local)?
2. ☐ Does `/__/auth/handler` rule exist and is External?
3. ☐ Does Firebase have `https://avishkar-c9826.firebaseapp.com/__/auth/handler` in authorized redirects?

**Solution**: Check both Median rules AND Firebase Console - both must be configured.

### Problem: Everything Works, But on Every Page Load It Logs Out

**Check**:
1. ☐ Is localStorage being used to store auth state?
2. ☐ Is `onAuthStateChanged` listener set up?

**Solution**: Ensure your app has proper session persistence configured.

---

## 📱 EXPECTED USER EXPERIENCE

After configuration:

1. **User launches app** → RevMate opens in Median WebView ✅
2. **User sees login screen** → Can see all options (Email, Google, Apple, Phone) ✅
3. **User clicks "Sign In with Google"** → Device's native browser opens ✅
4. **User signs in** → Google account screen, 2FA if enabled ✅
5. **After sign-in** → Browser redirects to Firebase handler ✅
6. **User returned to app** → Back in Median WebView, logged in ✅
7. **No error messages** → Smooth experience ✅

---

## 🔗 RELATED CONFIGURATION

This guide covers **Link Behavior Rules** only.

For complete setup, also ensure:

✅ **Firebase Console**:
- Authorized Domains: `avishkar-c9826.firebaseapp.com`, `avishkar-c9826.web.app`
- See: `FIREBASE_CONSOLE_CHECKLIST.md`

✅ **Google Cloud Console**:
- Redirect URIs: `https://avishkar-c9826.firebaseapp.com/__/auth/handler` (and others)
- See: `FIREBASE_CONSOLE_CHECKLIST.md`

✅ **Your App Code**:
- Should use `signInWithRedirect` in WebView (automatically handled by `auth-google.js`)
- Should call `handleAuthRedirect()` on page load
- See: `auth-google.js` and `auth-handler-init.js`

---

## ✅ VERIFICATION CHECKLIST

After completing setup:

- ☐ All 8 rules added to Median.co
- ☐ Rules saved successfully
- ☐ 1-2 minutes waited for propagation
- ☐ Tested on device: Click Google button
- ☐ Device browser opened (not WebView)
- ☐ Signed in successfully
- ☐ Redirected back to app
- ☐ No error messages
- ☐ User is logged in to RevMate

---

## 📞 SUPPORT

If you encounter issues:

1. Check browser console (Device Browser's DevTools while signing in)
2. Look for specific error codes
3. Cross-reference with `FIREBASE_CONSOLE_CHECKLIST.md`
4. Review `PRODUCTION_READY_GOOGLE_AUTH_REPAIR.md` (complete technical reference)

---

**Configuration Complete! ✅**

Your RevMate app is now ready for Google Sign-In in Median.co wrapper.

