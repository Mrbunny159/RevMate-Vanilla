# Google Sign-In for Website Wrappers (WebView) - Complete Setup Guide

## Problem
When converting your website to a website wrapper (Android/iOS WebView), Google Sign-In fails with errors like:
- `Error 403: disallowed_useragent`
- `auth/popup-blocked`
- `Authentication failed`

This happens because Google's security policies require **secure browser interactions** that bypass the WebView's default behavior.

---

## Solution: Redirect Flow + External Browser

Your code uses a **hybrid approach**:
- **Desktop browsers**: Popup flow (in-app modal)
- **WebView**: Redirect flow (opens external system browser)

The key is **configuring your website wrapper to allow external browser redirection**.

---

## Setup Instructions

### Step 1: Firebase Console Configuration

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select your project (`avishkar-c9826`)
3. Go to **Authentication → Settings**
4. Under **Authorized Domains**, add:
   - `localhost` (for testing)
   - Your custom domain (if any)
   - `*.firebaseapp.com`

✅ Example:
```
- avishkar-c9826.firebaseapp.com
- avishkar-c9826.web.app
- yourdomain.com (if applicable)
```

---

### Step 2: Google Cloud Console OAuth Configuration

1. Go to **[Google Cloud Console](https://console.cloud.google.com)**
2. Navigate to **Credentials**
3. Select your **OAuth 2.0 Client ID (Web)**
4. Add these **Authorized Redirect URIs**:

```
https://avishkar-c9826.firebaseapp.com/__/auth/handler
https://your-domain.com/__/auth/handler
```

✅ The `__/auth/handler` is Firebase's built-in redirect handler - **don't change this**.

---

### Step 3: Configure Your Website Wrapper

#### **For Android (Capacitor/Cordova/Ionic)**

In your `android/app/src/main/AndroidManifest.xml`:

```xml
<activity android:name="MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="your-domain.com"/>
    </intent-filter>
</activity>
```

#### **For Median.co (Easiest for Beginners)**

1. Go to **[Median.co Dashboard](https://median.co)**
2. Navigate to your app → **Settings → Links**
3. Set **External Link Behavior**:
   - ✅ `Open in device browser` (for Google Auth domains)
4. Add these domains to the **External Browser Whitelist**:
   ```
   https://accounts.google.com
   https://accounts.googleusercontent.com
   https://avishkar-c9826.firebaseapp.com
   ```

#### **For Capacitor**

In your `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.revmate.app',
  appName: 'RevMate',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Browser: {
      windowsTarget: 'Edge'
    }
  }
};
```

In your HTML, enable external link opening:
```html
<script>
  // Listen for external link clicks
  document.addEventListener('click', (e) => {
    if (e.target.href && e.target.href.includes('accounts.google.com')) {
      e.preventDefault();
      window.open(e.target.href, '_system'); // Opens in system browser
    }
  }, true);
</script>
```

#### **For Cordova**

In your `config.xml`:

```xml
<plugin name="cordova-plugin-inappbrowser" spec="~6.0.0" />

<allow-intent href="https://accounts.google.com/*" />
<allow-intent href="https://accounts.googleusercontent.com/*" />
<allow-intent href="https://*.firebaseapp.com/*" />
```

---

### Step 4: Update Your Custom Domain (Optional)

If you're using a custom domain (not firebaseapp.com):

1. Go to **Firebase → Hosting**
2. Add your domain and follow the verification steps
3. Deploy your site to Firebase Hosting
4. Update the redirect URIs in Google Cloud Console (Step 2)

---

## How It Works

```
┌─────────────────────┐
│   Your WebView App  │
│   (Mobile/Desktop)  │
└──────────┬──────────┘
           │
           │ User clicks "Sign in with Google"
           │
           ↓
┌─────────────────────┐
│ loginWithGoogle()   │ (firebase-auth.js)
│ Detects WebView     │
└──────────┬──────────┘
           │
           │ isWebView() = true
           │ Uses signInWithRedirect()
           │
           ↓
┌─────────────────────────────────────────┐
│ System Browser Opens (External)         │
│ - Google Accounts page loads            │
│ - User enters credentials               │
│ - Google redirects to your Firebase app │
└──────────┬────────────────────────────┘
           │
           │ Browser passes control back to app
           │
           ↓
┌─────────────────────────────────────────┐
│ Your App Receives Redirect Result       │
│ processAuthRedirect() catches this      │
│ User is logged in! ✅                   │
└─────────────────────────────────────────┘
```

---

## Testing

### Test in Your WebView Wrapper

1. **Build your wrapper app**
   ```bash
   # For Capacitor
   npm run build
   npx cap sync
   npx cap open android
   ```

2. **Open your app on Android/iOS**

3. **Click "Sign in with Google"** button

4. **Expected behavior**:
   - ✅ System browser opens
   - ✅ Google login page appears
   - ✅ After login, you're redirected back to your app
   - ✅ You're logged in!

### Check Debug Logs

In your browser console, run:
```javascript
// Import from your module
import { getWebViewDebugLogs } from './js/webview-helper.js';

// View logs
console.table(getWebViewDebugLogs());
```

This shows all authentication steps and helps diagnose issues.

---

## Troubleshooting

### Error: "403 - disallowed_useragent"
**Cause**: Google blocked the WebView user agent  
**Solution**: Ensure external browser is configured to handle Google domains

### Error: "auth/popup-blocked"
**Cause**: WebView's popup blocker prevented popup  
**Solution**: WebView was correctly detected, but redirect flow didn't trigger. Check if `isWebView()` returns `true`

### Error: "Invalid redirect_uri"
**Cause**: Redirect URI not in OAuth configuration  
**Solution**: Add `https://avishkar-c9826.firebaseapp.com/__/auth/handler` to Google Cloud Console credentials

### User stays on Google login after redirect
**Cause**: Your domain isn't recognized as authorized  
**Solution**: Add it to Firebase Console > Authentication > Authorized Domains

### "window.median is undefined" (Median.co only)
**Cause**: Median bridge not loaded  
**Solution**: Ensure you're testing in Median environment, not regular browser

---

## Code Reference

### WebView Detection
```javascript
// This detects if running in Android/iOS WebView
isWebView() // Returns true in WebView, false in browser
```

### Manual Testing for Popup-Blocking
```javascript
// If you suspect popup issues, test manually:
const result = await signInWithPopup(auth, provider);
// This should fail in WebView with auth/popup-blocked error
```

---

## Security Notes

✅ **What Your Code Does Right**:
- Uses system browser for OAuth (more secure)
- Detects WebView environment automatically
- Stores auth tokens securely
- Validates user data with Firestore rules

⚠️ **Best Practices**:
1. Always use HTTPS (not HTTP)
2. Never hardcode OAuth secrets in frontend code (✅ You don't)
3. Use Firestore rules to validate user data (recommended)
4. Keep sensitive operations server-side

---

## Firebase Rules (Security)

Update your `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only write their own documents
    match /users/{userId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }
    
    // Public rides (read-only)
    match /rides/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null;
    }
  }
}
```

---

## Common Website Wrappers

| Wrapper | Type | External Browser Config |
|---------|------|-------------------------|
| **Median.co** | No-code | Dashboard → Settings → Links |
| **Capacitor** | Framework | `capacitor.config.ts` |
| **Cordova** | Framework | `config.xml` |
| **Flutter** | Framework | `android/build.gradle` |
| **React Native** | Framework | `android` folder config |
| **Ionic** | Framework | Combined with Capacitor |
| **Android Studio** | Native | `AndroidManifest.xml` |
| **Xcode** | Native | `Info.plist` |

---

## Minimal Working Example

```javascript
// In your script.js
const googleLoginBtn = document.getElementById('login-google');

googleLoginBtn.addEventListener('click', async () => {
    const result = await loginWithGoogle();
    
    if (result.success) {
        // Desktop or WebView redirect successful
        alert('Welcome, ' + result.user.name);
        location.reload(); // For WebView to process redirect
    } else {
        // Show error
        alert('Login failed: ' + result.error);
    }
});
```

---

## Still Having Issues?

1. **Check WebView Detection**:
   ```javascript
   console.log('Is WebView?', isWebView());
   ```

2. **View Debug Logs**:
   ```javascript
   console.table(getWebViewDebugLogs());
   ```

3. **Verify Authorized Domains**:
   - Firebase Console → Authentication → Settings
   - Your domain must be there

4. **Check OAuth Configuration**:
   - Google Cloud Console → Credentials
   - Verify redirect URIs match Firebase's `__/auth/handler`

5. **Enable Console Logging**:
   - Check browser/WebView console for exact error messages
   - Error codes will help identify the issue

---

## Next Steps

1. ✅ Configure your website wrapper (Median, Capacitor, etc.)
2. ✅ Update Firebase authorized domains
3. ✅ Update Google Cloud OAuth credentials
4. ✅ Build and test your app
5. ✅ Monitor debug logs during login
6. 🎉 Your Google Sign-In should now work!

For questions, check your console logs or contact your website wrapper support.
