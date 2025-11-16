# Complete Testing Plan for Google Sign-In

**Project**: RevMate (avishkar-c9826)  
**Time Required**: 45-60 minutes  
**Objective**: Verify Google Sign-In works in all deployment contexts  

---

## 🎯 TEST OVERVIEW

This plan tests 5 scenarios covering all deployment contexts:

1. ✅ Desktop Chrome (Popup Flow)
2. ✅ Mobile Chrome (Popup/Redirect Flow)
3. ✅ Median.co Wrapper (Redirect → External Browser)
4. ✅ Android Studio WebView (Chrome Custom Tabs)
5. ✅ Error Scenarios & Fallbacks

---

## 📋 PREPARATION

Before testing:

- [ ] Deploy to Firebase Hosting: `firebase deploy`
- [ ] Note your hosting URL: `https://avishkar-c9826.firebaseapp.com`
- [ ] Create test Google account (if not already)
- [ ] Have test devices/browsers ready
- [ ] Open browser DevTools (F12) on test machines
- [ ] Prepare console logs capture method (screenshots or text copy)

**Test Devices/Browsers Needed**:
- Desktop Chrome (Windows/Mac)
- Mobile Chrome (iOS/Android)
- Median.co app (iOS/Android, if testing wrapper)
- Android Studio device/emulator (if testing native)

---

## TEST 1: DESKTOP CHROME (POPUP FLOW)

### Objective
Verify popup-based Google Sign-In works on desktop browsers.

### Prerequisites
- ☐ Desktop with Chrome installed
- ☐ Firebase Hosting domain accessible
- ☐ `localhost` in Firebase Authorized Domains (for local testing)
- ☐ Local dev server running (optional): `npm run dev`

### Test Steps

#### 1.1: Test on Production Domain

**URL**: https://avishkar-c9826.firebaseapp.com

1. Open URL in Chrome
2. Navigate to login page (if not default)
3. **Screenshot**: Capture login screen
4. Click "Google Sign-In" button
5. **EXPECTED**: Popup window opens with Google Sign-In form
6. Sign in with test account
7. **EXPECTED**: Popup closes, redirected to app dashboard
8. **EXPECTED**: User name displayed in header/profile
9. Open browser DevTools (F12) → Console tab
10. **EXPECTED**: No errors, see messages like:
    ```
    🖥️ [GOOGLE_LOGIN_START] Environment: plain-browser
    ✅ Popup login successful
    👤 User authenticated: [uid]
    ```
11. **Screenshot**: Capture console with success logs

#### 1.2: Test Local Development (Optional)

**URL**: http://localhost:5173 (or your Vite port)

**Prerequisites**:
- `http://localhost/*` added to Firebase Authorized Domains
- `http://localhost/__/auth/handler` in Google Cloud redirect URIs

1. Run `npm run dev`
2. Open http://localhost:5173
3. Repeat steps 1-11 above
4. **EXPECTED**: Same success as production

#### 1.3: Test Popup Blocker Fallback

**Objective**: Verify that if popup is blocked, fallback to redirect works.

1. In Chrome, block popups: Settings → Privacy → Site settings → Pop-ups → Block
2. Open app on Firebase Hosting
3. Click "Google Sign-In"
4. **EXPECTED**: No popup appears
5. **EXPECTED**: Redirect to Google Sign-In page instead
6. Sign in
7. **EXPECTED**: Redirected back to app
8. **EXPECTED**: User logged in successfully
9. **Console**: Should see logs like:
    ```
    ⚠️ Popup was blocked - trying redirect fallback
    ✅ Redirect fallback initiated
    ```
10. **Screenshot**: Capture console logs

**Reset**: Re-enable popups in Chrome settings for next tests

#### 1.4: Test Error Handling

**Objective**: Verify error messages are user-friendly.

1. Intentionally cause an error by:
   - Cancel the Google Sign-In popup
   - OR close popup without signing in
2. **EXPECTED**: Error message appears
3. **EXPECTED**: Message is helpful (not cryptic error code)
4. **EXPECTED**: Option to retry
5. **Screenshot**: Capture error message

#### 1.5: Console Log Capture

**Action**: Copy all console logs

1. Open DevTools → Console
2. Select all text (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into TEST_RESULTS.md under "Desktop Chrome Logs"
5. **Expected format**:
    ```
    🖥️ [GOOGLE_LOGIN_START] Environment: plain-browser
    📊 Auth UI Config: {...}
    ✅ Plain browser detected - showing all options
    🔐 Google Login: {isWebView: false, ...}
    🖥️ Desktop browser detected - using popup flow
    ✅ Popup login successful
    👤 User authenticated: abc123xyz
    ✅ Redirect result found - completing login
    ```

### Expected Results

| Check | Status |
|-------|--------|
| Popup opens on click | ✅ |
| Google Sign-In form displays | ✅ |
| Popup closes after sign-in | ✅ |
| User logged in to app | ✅ |
| User name visible in UI | ✅ |
| No console errors | ✅ |
| Fallback to redirect if blocked | ✅ |
| Error messages friendly | ✅ |

### Evidence Required

- [ ] Screenshot of login screen
- [ ] Screenshot of popup with Google Sign-In
- [ ] Screenshot of logged-in dashboard
- [ ] Console logs (full output)
- [ ] Screenshot of fallback success (popup blocked scenario)
- [ ] Screenshot of error message (cancel scenario)

---

## TEST 2: MOBILE CHROME (POPUP/REDIRECT FLOW)

### Objective
Verify Google Sign-In works on mobile browsers.

### Prerequisites
- ☐ Mobile device (iOS or Android) with Chrome
- ☐ Network access to Firebase Hosting
- ☐ Test account ready

### Test Steps

#### 2.1: Test on iOS Chrome

**Device**: iPhone/iPad with Chrome installed

1. Open Chrome
2. Go to https://avishkar-c9826.firebaseapp.com
3. Navigate to login page
4. **Screenshot**: Capture login screen on mobile
5. Tap "Google Sign-In" button
6. **EXPECTED**: Google Sign-In sheet appears (modal popup behavior)
7. Tap Google account to use
8. **EXPECTED**: Signed in or 2FA required
9. Complete sign-in
10. **EXPECTED**: Sheet closes, redirected to app
11. **EXPECTED**: User logged in, name visible
12. **Screenshot**: Capture logged-in state

#### 2.2: Test on Android Chrome

**Device**: Android phone/tablet with Chrome

1. Open Chrome
2. Go to https://avishkar-c9826.firebaseapp.com
3. Repeat steps 3-12 from iOS test above
4. **EXPECTED**: Identical behavior to iOS

#### 2.3: Inspect Mobile Console

**On Android** (via Chrome DevTools):
1. On desktop, open chrome://inspect
2. Connect Android device via USB
3. In Chrome on Android, navigate to app
4. In desktop Chrome Inspect tab, find your device and click Inspect
5. Open Console tab
6. Click Google Sign-In button on device
7. Observe console logs in real-time
8. **EXPECTED**: See logs like:
    ```
    📱 [GOOGLE_LOGIN_START] isWebView: false
    🖥️ Desktop browser detected - using popup flow
    ✅ Popup login successful
    ```
9. **Screenshot**: Capture inspector console

#### 2.4: Test Slow Network Behavior

**Objective**: Verify app doesn't hang or show confusing messages on slow connections.

1. In DevTools (F12) → Network tab
2. Set throttling: "Slow 3G"
3. Click Google Sign-In
4. **EXPECTED**: Loading indicator (spinner or message)
5. **EXPECTED**: Auth completes within 30 seconds
6. **EXPECTED**: No timeout errors
7. **Screenshot**: Capture with network throttling

### Expected Results

| Check | Status |
|-------|--------|
| Login page loads on mobile | ✅ |
| Google button visible and clickable | ✅ |
| Sign-In modal/popup appears | ✅ |
| Signing in successful | ✅ |
| Returns to app after sign-in | ✅ |
| User name visible | ✅ |
| No console errors | ✅ |
| Works on slow network | ✅ |

### Evidence Required

- [ ] Screenshots of login on iOS Chrome
- [ ] Screenshots of login on Android Chrome
- [ ] Screenshots of logged-in state
- [ ] Desktop Inspector console logs
- [ ] Screenshot with network throttling

---

## TEST 3: MEDIAN.CO WRAPPER (REDIRECT → EXTERNAL BROWSER)

### Objective
Verify Google Sign-In works in Median.co wrapped app (most complex scenario).

### Prerequisites
- ☐ Median.co app with RevMate configured
- ☐ iOS or Android device
- ☐ WiFi/mobile network connection
- ☐ Median link behavior rules configured (see MEDIAN_LINK_RULES.md)
- ☐ Test account ready

### Test Steps

#### 3.1: Launch Median App

1. On iOS/Android device, open Median app with RevMate
2. **EXPECTED**: App loads in WebView (full-screen, no browser chrome)
3. **EXPECTED**: See login screen
4. **Screenshot**: Capture app login page in Median

#### 3.2: Tap Google Sign-In

1. Tap "Sign In with Google" button
2. **EXPECTED**: Device browser (Chrome/Safari) opens automatically
3. **EXPECTED**: URL bar visible (you're in device browser, not WebView)
4. **EXPECTED**: Google Sign-In page loads
5. **Screenshot**: Capture device browser with Google Sign-In

#### 3.3: Complete Sign-In in Browser

1. Select Google account (or sign in manually)
2. Complete any 2FA if required
3. **EXPECTED**: Redirected to Firebase callback page
4. **URL Bar**: Should show `https://avishkar-c9826.firebaseapp.com/__/auth/handler` briefly
5. **EXPECTED**: Device browser automatically closes (handled by Median)
6. **EXPECTED**: Returned to Median app
7. **EXPECTED**: Logged in to RevMate (see dashboard, user name)
8. **Screenshot**: Capture logged-in state in Median

#### 3.4: Verify No Error 403

**Critical Check**: You should NOT see "Error 403: disallowed_useragent"

- ☐ No 403 error at any point
- ☐ OAuth completed successfully
- ☐ User logged in

#### 3.5: Test Log Capture

1. In Median app, open browser DevTools (if available):
   - iOS: Connect to Safari on Mac
   - Android: chrome://inspect
2. Open Console tab
3. Refresh or sign out and sign in again
4. Capture logs:
   ```
   📱 [GOOGLE_LOGIN_START] isWebView: true
   📊 Auth UI Config: {...}
   📱 WebView detected - using redirect flow
   ✅ Redirect initiated - user will be returned to app
   ```
5. **Screenshot**: Capture console logs

#### 3.6: Test Logout & Re-Login

1. Find logout button in app (usually in Profile section)
2. Tap "Logout" or "Sign Out"
3. **EXPECTED**: Returned to login screen
4. Repeat steps 3.2-3.4
5. **EXPECTED**: Same success as first login

### Expected Results

| Check | Status |
|-------|--------|
| Median app loads | ✅ |
| Login screen visible | ✅ |
| Google button visible | ✅ |
| Clicking Google opens device browser | ✅ |
| Google Sign-In page loads in browser | ✅ |
| Signing in successful | ✅ |
| Browser closes after sign-in | ✅ |
| Returned to Median app | ✅ |
| User logged in (see name/dashboard) | ✅ |
| NO Error 403 | ✅ |
| Logout & re-login works | ✅ |

### Evidence Required

- [ ] Screenshot of Median app login
- [ ] Screenshot of device browser with Google Sign-In
- [ ] Screenshot of Firebase callback page (brief)
- [ ] Screenshot of logged-in state in Median
- [ ] Console logs showing redirect flow
- [ ] Verification that no 403 error occurred

---

## TEST 4: NATIVE ANDROID WEBVIEW + CHROME CUSTOM TABS

### Objective
Verify Google Sign-In works in native Android app with Chrome Custom Tabs.

### Prerequisites
- ☐ Android Studio with RevMate project
- ☐ Physical device or emulator
- ☐ Chrome installed on device
- ☐ Code from ANDROID_WEBVIEW_CHROME_CUSTOMTABS.md implemented

### Test Steps

#### 4.1: Build and Install App

```bash
./gradlew installDebug
```

1. Connect Android device or start emulator
2. Run above command
3. **EXPECTED**: App installs successfully
4. App automatically launches
5. **Screenshot**: Capture app launch

#### 4.2: Tap Google Sign-In

1. On login screen, tap "Sign In with Google"
2. **EXPECTED**: Chrome Custom Tab opens
3. **Visual Cues**: 
   - Toolbar color matches app (RevMate purple)
   - Back button visible
   - URL bar visible
4. **EXPECTED**: Google Sign-In page loads in Custom Tab
5. **Screenshot**: Capture Custom Tab with Google Sign-In

#### 4.3: Sign In

1. Select Google account
2. Complete sign-in
3. **EXPECTED**: Custom Tab closes automatically
4. **EXPECTED**: Returned to app
5. **EXPECTED**: User logged in (see dashboard)
6. **Screenshot**: Capture logged-in state

#### 4.4: Verify Deep Link Reception

**Objective**: Confirm deep link was processed correctly.

1. In Android Studio, open Logcat
2. Filter for: `revmate` or `DeepLink`
3. Sign out and try Google Sign-In again
4. **EXPECTED**: See logs:
    ```
    D/DeepLink: Received: https://avishkar-c9826.firebaseapp.com/__/auth/handler?...
    D/DeepLink: Code: ..., State: ...
    ```
5. **Screenshot**: Capture Logcat output

#### 4.5: Test Back Button in Custom Tab

**Objective**: Verify user can go back in OAuth flow.

1. Sign out
2. Tap Google Sign-In (opens Custom Tab)
3. Wait for Google page to load
4. Tap back button in Custom Tab toolbar
5. **EXPECTED**: Closes Custom Tab
6. **EXPECTED**: Returns to app
7. **EXPECTED**: Still on login screen (not signed in)
8. **No crash**: App should handle back button gracefully

#### 4.6: Test Network Interruption

**Objective**: Verify auth handles network issues gracefully.

1. In device Settings, disable WiFi
2. Tap Google Sign-In
3. **EXPECTED**: Custom Tab opens but cannot load Google
4. **EXPECTED**: Error message appears (from Google)
5. Re-enable WiFi
6. Refresh (pull-down or F5)
7. **EXPECTED**: Page loads and auth completes
8. **No hang**: App should respond normally

### Expected Results

| Check | Status |
|-------|--------|
| App installs without errors | ✅ |
| App launches successfully | ✅ |
| Google button visible | ✅ |
| Chrome Custom Tab opens on click | ✅ |
| Custom Tab has app branding (color) | ✅ |
| Google Sign-In page loads | ✅ |
| Signing in successful | ✅ |
| Custom Tab closes after sign-in | ✅ |
| User logged in to app | ✅ |
| Deep link received correctly | ✅ |
| Back button works without crash | ✅ |
| Handles network interruption | ✅ |

### Evidence Required

- [ ] Screenshot of app launch
- [ ] Screenshot of Chrome Custom Tab with Google page
- [ ] Screenshot of logged-in dashboard
- [ ] Logcat output showing deep link received
- [ ] Screenshot of Custom Tab with app colors

---

## TEST 5: ERROR SCENARIOS & FALLBACKS

### Objective
Verify app handles errors gracefully and provides fallbacks.

### Scenario 5.1: Network Offline

1. Disable internet on device/browser
2. Click Google Sign-In
3. **EXPECTED**: Error message appears within 10 seconds
4. **Expected Message**: "Network error. Check your connection..."
5. **EXPECTED**: Friendly message, not cryptic code
6. Re-enable internet
7. Retry sign-in
8. **EXPECTED**: Works normally

### Scenario 5.2: Invalid Firebase Config

**Setup**: Temporarily break Firebase config (for testing only)

1. Edit `firebase-config.js`
2. Change `projectId` to fake value: `"fake-project"`
3. Refresh app
4. Click Google Sign-In
5. **EXPECTED**: Error appears
6. **Expected Message**: "Firebase not properly configured..."
7. Fix config back to `"avishkar-c9826"`
8. Refresh and retry
9. **EXPECTED**: Works normally

### Scenario 5.3: Google Credentials Missing/Wrong

**Setup**: Verify Google Cloud credentials

1. Check Google Cloud Console: Is OAuth client ID correct?
2. If not, add new OAuth credential
3. Test sign-in
4. **EXPECTED**: Should work after credentials fixed

### Scenario 5.4: 2FA/Multi-Account Selection

**Objective**: Verify complex Google flows work.

1. Use Google account with 2FA enabled
2. Click Google Sign-In
3. **EXPECTED**: 2FA prompt appears
4. Complete 2FA
5. **EXPECTED**: App receives user
6. Logout and retry with different account
7. **EXPECTED**: Account selection screen appears
8. Select correct account
9. **EXPECTED**: App receives selected user

### Scenario 5.5: Session Persistence

**Objective**: Verify session persists across page reloads.

1. Sign in successfully
2. Refresh page (F5)
3. **EXPECTED**: Still logged in (no redirect to login)
4. Close browser tab completely
5. Reopen app
6. **EXPECTED**: Still logged in (session in localStorage)
7. Clear localStorage and refresh
8. **EXPECTED**: Logged out (as expected after clear)

### Scenario 5.6: Fallback Auth Methods

**Objective**: Verify Email/Phone fallback when Google not available.

1. In a WebView-only environment (if you can simulate):
   - If WebView configured to NOT open external browser
2. **EXPECTED**: Google button hidden or disabled
3. **EXPECTED**: Message shown: "Google not supported..."
4. **EXPECTED**: Email/Phone options highlighted
5. Click Email Sign-In
6. **EXPECTED**: Email form visible and working
7. Test Phone Sign-In
8. **EXPECTED**: Phone form visible and working

### Expected Results

| Scenario | Status |
|----------|--------|
| Network offline → friendly error | ✅ |
| Invalid Firebase config → clear message | ✅ |
| Wrong Google credentials → clear message | ✅ |
| 2FA works | ✅ |
| Account selection works | ✅ |
| Session persists on refresh | ✅ |
| Session persists after close/reopen | ✅ |
| Email fallback works | ✅ |
| Phone fallback works | ✅ |

---

## 📝 TEST RESULTS TEMPLATE

Copy this template and fill in results:

```markdown
# TEST RESULTS - Google Sign-In

**Date**: [Date]
**Tester**: [Your Name]
**Firebase Project**: avishkar-c9826

## TEST 1: Desktop Chrome
- [ ] Popup opens and closes correctly
- [ ] User logged in after sign-in
- [ ] Console shows success logs
- [ ] Popup-blocked fallback works
- [ ] Error handling friendly

**Desktop Chrome Status**: PASS / FAIL / PARTIAL

**Issues Found**:
- [List any issues]

**Console Logs**:
```
[Paste full console output]
```

## TEST 2: Mobile Chrome
- [ ] Works on iOS
- [ ] Works on Android
- [ ] No console errors
- [ ] Handles slow network

**Mobile Chrome Status**: PASS / FAIL / PARTIAL

## TEST 3: Median.co Wrapper
- [ ] Device browser opens on Google click
- [ ] No Error 403
- [ ] Redirects back to app
- [ ] User logged in
- [ ] Works on iOS and Android

**Median.co Status**: PASS / FAIL / PARTIAL

## TEST 4: Android WebView + Custom Tabs
- [ ] App installs and launches
- [ ] Custom Tab opens
- [ ] Sign-in completes
- [ ] Deep link received
- [ ] User logged in

**Android WebView Status**: PASS / FAIL / PARTIAL

## TEST 5: Error Scenarios
- [ ] Network offline handled
- [ ] Invalid config shows helpful message
- [ ] Session persistence works
- [ ] Fallback methods work

**Error Scenarios Status**: PASS / FAIL / PARTIAL

## OVERALL RESULT: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**Summary**: [Brief description of results and any issues found]
```

---

## ✅ SIGN-OFF

When ALL tests pass:

- [ ] All 5 test scenarios completed
- [ ] No critical errors found
- [ ] Error messages are user-friendly
- [ ] Session persistence works
- [ ] Fallbacks work
- [ ] Results documented in TEST_RESULTS.md

**Status**: ✅ Ready for Production

---

## 🐛 TROUBLESHOOTING

See PRODUCTION_READY_GOOGLE_AUTH_REPAIR.md for detailed troubleshooting.

**Quick Reference**:
- Error 403 → Check Median rules and Firebase authorized domains
- auth/popup-blocked → Should fallback automatically
- auth/invalid-credentials → Check Google Cloud OAuth credentials
- Session not persisting → Check localStorage and onAuthStateChanged listener

---

**Total Estimated Testing Time**: 60-90 minutes  
**Difficulty**: Medium (mostly clicking and observing)

This comprehensive test plan ensures Google Sign-In works reliably across all deployment contexts!

