# Median.co Configuration for Google Sign-In

Median.co is a **no-code wrapper** that makes it easiest to convert your website to a mobile app. This guide shows how to configure Google Sign-In specifically for Median.

## Quick Start (30 seconds)

1. Go to **[Median.co Dashboard](https://median.co/dashboard)**
2. Select your app
3. Go to **Settings → Links**
4. Under **Link Behavior**, select **"Open external links in system browser"**
5. Done! 🎉 Google Sign-In should now work

---

## Detailed Setup

### Step 1: Add Your Website to Median

1. Visit **[Median.co](https://median.co)**
2. Click **"Create App"**
3. Enter your website URL:
   - `https://avishkar-c9826.web.app` (or your custom domain)
4. Choose your app name and icon
5. Click **"Create"**

### Step 2: Configure Link Behavior

1. **Go to Dashboard** → Select your app
2. **Settings** → **Links**
3. Under **"External Link Behavior"**:
   - Select: ✅ **"Open external links in device browser"**
   - This ensures OAuth flows open in the system browser (required for Google security)

### Step 3: Whitelist Google Domains

1. Still in **Settings** → **Links**
2. Find **"External Browser Whitelist"** (if available)
3. Add these domains:
   ```
   https://accounts.google.com
   https://accounts.googleusercontent.com
   https://avishkar-c9826.firebaseapp.com
   https://avishkar-c9826.web.app
   ```
   (Add your custom domain if applicable)

### Step 4: Configure Hosting

If using Firebase Hosting:

1. Go to **Firebase Console** → **Hosting**
2. Your app should be deployed to:
   - `https://avishkar-c9826.web.app` (or custom domain)
3. Ensure the HTML file includes all your scripts

### Step 5: Test in Median

1. Download the **Median for Android** or **Median for iOS** app
2. Open it and search for your app
3. Click **"Preview"** or **"Install"**
4. Wait for the app to load
5. Click **"Sign in with Google"**
6. ✅ System browser should open → Sign in → Redirect back to app

---

## How Median Handles Google Sign-In

```
┌──────────────────────┐
│  Median App (WebView)│
└──────────┬───────────┘
           │
      User clicks
      "Google Sign-In"
           │
           ↓
    ┌────────────────────┐
    │ Detects WebView    │
    │ Uses Redirect Flow │
    └─────────┬──────────┘
              │
              │ Opens external browser
              │ (Median's link behavior)
              │
              ↓
    ┌────────────────────────────────┐
    │ Android/iOS System Browser     │
    │ - Loads Google Sign-In         │
    │ - User authenticates           │
    │ - Google redirects to Firebase │
    └─────────┬──────────────────────┘
              │
              │ Redirect back to app
              │
              ↓
    ┌──────────────────────┐
    │ Median App receives  │
    │ redirect result      │
    │ ✅ User logged in!   │
    └──────────────────────┘
```

---

## Firebase Configuration (Required)

### 1. Add Authorized Domains

1. Go to **[Firebase Console](https://console.firebase.google.com)**
2. Select your project: `avishkar-c9826`
3. **Authentication** → **Settings**
4. Under **"Authorized Domains"**, add:
   ```
   avishkar-c9826.firebaseapp.com
   avishkar-c9826.web.app
   your-custom-domain.com (if applicable)
   localhost (for testing)
   ```

### 2. Add Redirect URI to Google OAuth

1. Go to **[Google Cloud Console](https://console.cloud.google.com)**
2. **Credentials** → Select your **OAuth 2.0 Client ID (Web)**
3. Under **"Authorized Redirect URIs"**, add:
   ```
   https://avishkar-c9826.firebaseapp.com/__/auth/handler
   https://avishkar-c9826.web.app/__/auth/handler
   https://your-domain.com/__/auth/handler (if custom domain)
   ```
4. **Save**

---

## Code Integration

Your code already handles this! Just ensure:

1. ✅ `firebase-auth.js` has `loginWithGoogle()` function
2. ✅ `webview-helper.js` detects WebView and uses redirect flow
3. ✅ HTML has the Google Sign-In button connected

No additional code changes needed for Median.

### Verify in Browser Console

```javascript
// Test WebView detection
import { isWebView } from './js/webview-helper.js';
console.log('Is WebView?', isWebView());

// View debug logs
import { getWebViewDebugLogs } from './js/webview-helper.js';
console.table(getWebViewDebugLogs());
```

---

## Troubleshooting

### Issue: "Sign-In button does nothing"
**Solution**:
1. Check if **Link Behavior** is set to "Open external links"
2. Verify domains are in **Authorized Domains** (Firebase Console)
3. Check browser console for errors (use Median's DevTools)

### Issue: "Page opens then closes"
**Solution**:
1. Ensure Firebase redirect domain includes Median's hosting URL
2. Check that `__/auth/handler` path is in Google Cloud credentials
3. Verify your website is deployed to Firebase Hosting

### Issue: "Error 403: disallowed_useragent"
**Solution**:
1. This means WebView tried to sign in (popup blocked)
2. Ensure **Link Behavior** is set to open external browser
3. Median dashboard may need 5-10 minutes to update after settings change
4. Try clearing app cache and reinstalling

### Issue: "Can't see debug logs"
**Solution**:
1. In Median App settings, enable **"Developer Console"** or **"Debug Mode"**
2. Use Chrome DevTools to inspect the WebView (some Median versions support this)
3. Check the browser console when previewing in dashboard

---

## Mobile Testing

### Android

1. Install **"Median"** app from Google Play Store
2. Open the app
3. Search for your Median app
4. Click **"Preview"** (no install needed)
5. Wait for your website to load
6. Click **"Sign in with Google"**
7. Observe the system browser opening
8. After sign-in, you should be redirected back

### iOS

1. Install **"Median"** app from App Store
2. Open the app
3. Search for your Median app
4. Click **"Preview"** (no install needed)
5. Wait for your website to load
6. Click **"Sign in with Google"**
7. Observe the system browser opening
8. After sign-in, you should be redirected back

---

## Advanced Configuration

### Custom Domain Setup

If you want to use `revmate.com` instead of `firebaseapp.com`:

1. **Firebase Console** → **Hosting** → **Add Custom Domain**
2. Follow domain verification steps
3. Add the domain to **Authorized Domains** in Authentication
4. Update Google Cloud OAuth with the new redirect URI:
   ```
   https://revmate.com/__/auth/handler
   ```
5. In Median dashboard, update your website URL to the custom domain

### App Icons and Styling

1. **Median Dashboard** → **Settings** → **General**
2. Upload your app icon (512x512 PNG recommended)
3. Choose accent color
4. These will appear in Median app listing and on home screen

### Push Notifications (Optional)

If you want to add push notifications:

1. **Median Dashboard** → **Settings** → **Notifications**
2. Integrate with Firebase Cloud Messaging (FCM)
3. Your website can send notifications to users

---

## Performance Tips

1. **Optimize Images**: Median apps are slower on cellular data
2. **Minimize Bundle Size**: Keep your JS/CSS optimized
3. **Use Service Workers**: Enable offline functionality
4. **Cache Data**: Use localStorage for repeat users

---

## Publishing Your Median App

### Android

1. **Median Dashboard** → **Publish** → **Android**
2. Follow instructions to publish to Google Play Store
3. Once approved, users can download your app
4. Updates happen automatically when you update your website

### iOS

1. **Median Dashboard** → **Publish** → **iOS**
2. Follow instructions to publish to App Store
3. Once approved, users can download your app
4. Updates happen automatically when you update your website

---

## Common Settings Reference

| Setting | Recommended Value | Why |
|---------|------------------|-----|
| Link Behavior | Open in device browser | Required for OAuth |
| Minimum OS | Android 8+ / iOS 12+ | For security |
| Orientation | Portrait (or both) | App preference |
| Status Bar | Light/Dark | Match your design |
| Navigation | Bottom tab bar | Standard mobile UX |

---

## Support & Help

- **Median Docs**: https://docs.median.co
- **Median Community**: https://community.median.co
- **Firebase Docs**: https://firebase.google.com/docs
- **Your Code**: Check `WEBVIEW_GOOGLE_AUTH_SETUP.md` for general guidance

---

## Example: Complete Setup Checklist

- [ ] Website deployed to Firebase Hosting
- [ ] Authorized Domains added in Firebase Console
- [ ] OAuth redirect URIs added to Google Cloud Console
- [ ] Median app created on Median.co
- [ ] Link Behavior set to "Open external links"
- [ ] Google domains in External Browser Whitelist
- [ ] Google Sign-In button added to HTML
- [ ] `firebase-auth.js` imported in script.js
- [ ] Tested in Median preview on Android
- [ ] Tested in Median preview on iOS
- [ ] ✅ Google Sign-In working!

Once all steps are complete, your RevMate app will work flawlessly on mobile with Google Sign-In! 🚀
