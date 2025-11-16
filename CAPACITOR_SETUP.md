# Capacitor Configuration for Google Sign-In

This is the configuration file for Capacitor projects (Ionic, Angular, React with Capacitor).

## Installation

```bash
npm install @capacitor/browser @capacitor/core
npx cap sync
```

## capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.revmate.app',
  appName: 'RevMate',
  webDir: 'www', // or 'dist' for React/Vue/Angular build output
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'accounts.google.com',
      'accounts.googleusercontent.com',
      '*.firebaseapp.com',
      'your-domain.com' // Add your custom domain if applicable
    ]
  },
  plugins: {
    Browser: {
      windowsTarget: 'Edge'
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;
```

## Android Setup

### android/app/build.gradle

```gradle
android {
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.revmate.app"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### android/app/src/main/AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.RevMate"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:theme="@style/Theme.RevMate.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Google Sign-In Intent Filter -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="avishkar-c9826.firebaseapp.com"
                    android:pathPattern="/__/auth/handler" />
            </intent-filter>

            <!-- Custom Domain (if applicable) -->
            <!-- Uncomment and update if using custom domain
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="your-domain.com"
                    android:pathPattern="/__/auth/handler" />
            </intent-filter>
            -->
        </activity>
    </application>
</manifest>
```

## iOS Setup

### ios/App/Info.plist

Add these keys:

```xml
<key>NSBonjourServiceTypes</key>
<array>
    <string>_http._tcp</string>
</array>

<key>NSLocalNetworkUsageDescription</key>
<string>RevMate uses your local network for sign-in</string>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.revmate.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

Get your Google Client ID from:
1. Go to **Google Cloud Console**
2. **Credentials** → Your OAuth 2.0 Client ID (iOS)
3. Copy the bundle ID format (e.g., `com.googleusercontent.apps.123456789-abcdefgh.apps.googleusercontent.com`)

### ios/App/App/SceneDelegate.swift

Add this method to handle URL scheme redirects:

```swift
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else {
        return
    }
    
    // Let Firebase handle the redirect
    if Auth.auth().canHandle(url) {
        return
    }
}
```

## HTML Integration

In your `index.html`, add this script after Firebase is initialized:

```html
<!-- Capacitor JS -->
<script src="capacitor-js-stubs.js"></script>

<!-- Your app script -->
<script type="module" src="js/script.js"></script>

<script>
  // Initialize wrapper support on load
  import { initWrapperSupport } from './WEBVIEW_WRAPPER_SETUP.js';
  
  document.addEventListener('capacitorplatformready', () => {
    console.log('✅ Capacitor ready');
    initWrapperSupport();
  });
</script>
```

## Using Browser Plugin for External Links

In your JavaScript:

```javascript
import { Browser } from '@capacitor/browser';

async function openUrl(url) {
  await Browser.open({ 
    url: url,
    windowName: '_blank'
  });
}

// Or use our wrapper setup which does this automatically
import { setupExternalLinkHandler } from './WEBVIEW_WRAPPER_SETUP.js';
setupExternalLinkHandler();
```

## Building and Testing

### Build for Android

```bash
npm run build
npx cap sync
npx cap open android
```

Then in Android Studio:
1. Click **Run** → **Run 'app'**
2. Select your emulator or connected device
3. Wait for the app to build and install

### Build for iOS

```bash
npm run build
npx cap sync
npx cap open ios
```

Then in Xcode:
1. Select your target device
2. Press **Cmd + R** to run
3. Wait for the app to build and install

## Debugging

### Chrome DevTools (Android)

```bash
# Connect your Android device via USB
# Enable USB debugging on device

# Open Chrome
chrome://inspect

# Your app will appear in the list
# Click "inspect" to open DevTools
```

### Safari Web Inspector (iOS)

1. Connect your iOS device
2. Open **Safari** on your Mac
3. **Develop** → Your Device → Select app
4. Safari DevTools will open

## Troubleshooting

### "Google Sign-In not opening"
- Ensure Firebase app is deployed to `avishkar-c9826.firebaseapp.com`
- Check that `allowNavigation` includes Google domains in `capacitor.config.ts`
- Verify Android `AndroidManifest.xml` intent filter is correct

### "Blank page after sign-in"
- Check that Firebase redirect URI is correct in Google Cloud Console
- Ensure your web build is deployed before testing
- Check console logs for errors

### "Browser not opening"
- Verify Browser plugin is installed: `npm list @capacitor/browser`
- Try on a real device instead of emulator
- Check Android version (requires Android 6+)
