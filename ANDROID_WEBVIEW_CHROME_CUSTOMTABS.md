# Native Android WebView + Chrome Custom Tabs Implementation

**Use This If**: You want to build a native Android app (not using Median wrapper)  
**Time Required**: 30-60 minutes  
**Difficulty**: Intermediate (requires Android Studio and Java/Kotlin knowledge)  

---

## 📚 TABLE OF CONTENTS

1. WebView Configuration (Java/Kotlin)
2. Chrome Custom Tabs Setup
3. Deep Link Configuration (AndroidManifest.xml)
4. Firebase Redirect Handler
5. Complete Code Example
6. Testing Procedure

---

## 1️⃣ WebView Configuration (Java/Kotlin)

### Why This Matters

By default, Android WebView:
- Blocks pop-ups
- Blocks opening new windows
- Has restrictive user-agent string

For OAuth to work, we need to:
- Allow JavaScript
- Allow pop-up window creation
- Configure WebChromeClient to handle window requests

### Code: MainActivity.java

```java
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.view.Window;
import android.widget.FrameLayout;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private FrameLayout customViewContainer;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        customViewContainer = findViewById(R.id.custom_view_container);
        
        // CRITICAL: Configure WebView for OAuth
        configureWebView();
        
        // Setup Custom Tab handling for OAuth URLs
        setupChromeCustomTabs();
        
        // Load your app
        webView.loadUrl("https://avishkar-c9826.firebaseapp.com");
    }
    
    /**
     * Configure WebView for maximum compatibility
     */
    private void configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        
        // Get WebView settings
        WebSettings settings = webView.getSettings();
        
        // === CRITICAL SETTINGS ===
        
        // Allow JavaScript (required for Firebase SDK)
        settings.setJavaScriptEnabled(true);
        
        // Allow DOM storage (for session persistence)
        settings.setDomStorageEnabled(true);
        
        // Allow pop-ups and new windows (needed for OAuth callbacks)
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // Allow local storage
        settings.setAppCacheEnabled(true);
        settings.setDatabaseEnabled(true);
        
        // Mixed content (if loading HTTP content - not recommended for prod)
        if (BuildConfig.DEBUG) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        } else {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        
        // User agent (helpful for detecting app context in JS)
        settings.setUserAgentString(
            settings.getUserAgentString() + " RevMateAndroidApp/1.0"
        );
        
        // === WEB CLIENTS ===
        
        // WebViewClient: Handle page navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                
                // Always allow your own domain
                if (url.contains("avishkar-c9826.firebaseapp.com") ||
                    url.contains("avishkar-c9826.web.app") ||
                    url.contains("localhost")) {
                    return false; // Let WebView handle it
                }
                
                // For other links, decide: open in WebView or Chrome Custom Tab
                // For OAuth: let WebChromeClient handle it via onCreateWindow
                return false;
            }
        });
        
        // WebChromeClient: Handle pop-ups, permissions, console messages
        webView.setWebChromeClient(new WebChromeClient() {
            
            /**
             * Called when JavaScript tries to open a new window (window.open())
             * OAuth URLs are typically opened this way
             */
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog,
                    boolean isUserGesture, Message resultMsg) {
                
                String url = getRequestedUrl(view);
                
                Log.d("OAuth", "onCreateWindow: " + url);
                
                // Check if this is an OAuth URL (Google, Apple, etc.)
                if (isOAuthUrl(url)) {
                    // Open in Chrome Custom Tab instead of WebView
                    openInChromeCustomTab(url);
                    
                    // Return false to prevent WebView from handling it
                    return false;
                }
                
                // For non-OAuth links, create a new WebView (if desired)
                WebView newWebView = new WebView(MainActivity.this);
                newWebView.setWebViewClient(webView.getWebViewClient());
                newWebView.setWebChromeClient(this);
                
                WebViewTransport transport = (WebViewTransport) resultMsg.obj;
                transport.setWebView(newWebView);
                resultMsg.sendToTarget();
                
                return true;
            }
            
            @Override
            public void onCloseWindow(WebView window) {
                Log.d("OAuth", "onCloseWindow");
                // Handle window close if needed
            }
            
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                // Update progress bar if you have one
                if (newProgress == 100) {
                    Log.d("WebView", "Page load complete");
                }
            }
        });
    }
    
    /**
     * Setup Chrome Custom Tabs for OAuth
     * Provides a better UX than opening in device browser
     */
    private void setupChromeCustomTabs() {
        // PreWarm connection to Chrome (optional, improves performance)
        try {
            String packageName = CustomTabsClient.getPackageName(MainActivity.this);
            if (packageName != null) {
                CustomTabsClient.bindCustomTabsService(
                    MainActivity.this,
                    packageName,
                    new CustomTabsServiceConnection() {
                        @Override
                        public void onCustomTabsServiceConnected(ComponentName componentName,
                                CustomTabsClient client) {
                            // Pre-warm connection (improves load speed)
                            client.warmupConnection(0);
                        }
                        
                        @Override
                        public void onServiceDisconnected(ComponentName componentName) {}
                    }
                );
            }
        } catch (Exception e) {
            Log.w("CustomTabs", "Could not pre-warm Custom Tabs", e);
        }
    }
    
    /**
     * Open URL in Chrome Custom Tab (better than full browser window)
     */
    private void openInChromeCustomTab(String url) {
        try {
            CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
            
            // Customize appearance
            builder.setToolbarColor(Color.parseColor("#667EEA")); // RevMate color
            builder.setSecondaryToolbarColor(Color.parseColor("#764BA2"));
            
            // Add close button
            builder.setCloseButtonIcon(
                BitmapFactory.decodeResource(getResources(), R.drawable.ic_close)
            );
            
            // Optional: Add action button
            builder.addDefaultShareMenuItem();
            
            CustomTabsIntent customTabsIntent = builder.build();
            
            // Important: Specify callback URL for deep links
            // This tells Android to route redirect back to app
            // See DeepLinkActivity below
            
            customTabsIntent.launchUrl(MainActivity.this, Uri.parse(url));
            
            Log.d("CustomTabs", "Opened in Custom Tab: " + url);
            
        } catch (Exception e) {
            Log.e("CustomTabs", "Error opening Custom Tab", e);
            // Fallback to default browser
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        }
    }
    
    /**
     * Check if URL is an OAuth endpoint
     */
    private boolean isOAuthUrl(String url) {
        if (url == null) return false;
        return url.contains("accounts.google.com") ||
               url.contains("appleid.apple.com") ||
               url.contains("github.com/login") ||
               url.contains("firebaseapp.com/__/auth/handler") ||
               url.contains("avishkar-c9826.web.app/__/auth/handler");
    }
    
    /**
     * Extract URL from WebView (helper)
     */
    private String getRequestedUrl(WebView view) {
        // Try to get URL from view
        try {
            return view.getUrl();
        } catch (Exception e) {
            return "unknown";
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### Code: MainActivity.kt (Kotlin Alternative)

If you prefer Kotlin:

```kotlin
import android.app.Activity
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.*
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsServiceConnection
import android.content.ComponentName
import androidx.appcompat.app.AppCompatActivity
import android.widget.FrameLayout

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webview)
        
        configureWebView()
        setupChromeCustomTabs()
        
        webView.loadUrl("https://avishkar-c9826.firebaseapp.com")
    }
    
    private fun configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            supportMultipleWindows = true
            javaScriptCanOpenWindowsAutomatically = true
            databaseEnabled = true
            
            if (BuildConfig.DEBUG) {
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                return false
            }
        }
        
        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message
            ): Boolean {
                val url = view.url
                
                if (url != null && isOAuthUrl(url)) {
                    openInChromeCustomTab(url)
                    return false
                }
                
                return true
            }
        }
    }
    
    private fun setupChromeCustomTabs() {
        try {
            val packageName = CustomTabsClient.getPackageName(this)
            packageName?.let {
                CustomTabsClient.bindCustomTabsService(
                    this, it,
                    object : CustomTabsServiceConnection() {
                        override fun onCustomTabsServiceConnected(
                            componentName: ComponentName,
                            client: CustomTabsClient
                        ) {
                            client.warmupConnection(0)
                        }
                        
                        override fun onServiceDisconnected(componentName: ComponentName) {}
                    }
                )
            }
        } catch (e: Exception) {
            Log.w("CustomTabs", "Could not setup Custom Tabs", e)
        }
    }
    
    private fun openInChromeCustomTab(url: String) {
        try {
            CustomTabsIntent.Builder().apply {
                setToolbarColor(Color.parseColor("#667EEA"))
                setSecondaryToolbarColor(Color.parseColor("#764BA2"))
                addDefaultShareMenuItem()
            }.build().launchUrl(this, Uri.parse(url))
        } catch (e: Exception) {
            Log.e("CustomTabs", "Error", e)
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }
    }
    
    private fun isOAuthUrl(url: String?): Boolean {
        return url?.let {
            it.contains("accounts.google.com") ||
            it.contains("appleid.apple.com") ||
            it.contains("firebaseapp.com/__/auth/handler") ||
            it.contains("avishkar-c9826.web.app/__/auth/handler")
        } ?: false
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}
```

---

## 2️⃣ Chrome Custom Tabs Setup

Chrome Custom Tabs provide:
- Better UX than full browser window
- Faster loading (connection pre-warming)
- App branding (custom colors, buttons)
- Seamless return to app

**Gradle Dependency**:

Add to `build.gradle`:

```gradle
dependencies {
    implementation 'androidx.browser:browser:1.6.0'  // Latest Custom Tabs library
}
```

---

## 3️⃣ Deep Link Configuration (AndroidManifest.xml)

After user signs in via Custom Tab, Firebase redirects to your deep link. This tells Android to route back to your app.

### AndroidManifest.xml Configuration

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.revmate.app">
    
    <!-- Internet permission (required for WebView and Firebase) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.RevMate">
        
        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <!-- Deep Link Handler Activity for OAuth -->
        <!-- This receives the redirect from Firebase after sign-in -->
        <activity
            android:name=".DeepLinkActivity"
            android:exported="true"
            android:launchMode="singleTask">
            
            <!-- Deep link: revmate://auth -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="revmate" android:host="auth" />
            </intent-filter>
            
            <!-- App Link: https://avishkar-c9826.firebaseapp.com/__/auth/handler -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="avishkar-c9826.firebaseapp.com"
                    android:pathPrefix="/__/auth/handler" />
            </intent-filter>
            
            <!-- App Link: https://avishkar-c9826.web.app/__/auth/handler -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="avishkar-c9826.web.app"
                    android:pathPrefix="/__/auth/handler" />
            </intent-filter>
            
        </activity>
        
    </application>
    
</manifest>
```

### DeepLinkActivity.java

This activity receives the OAuth callback:

```java
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import androidx.appcompat.app.AppCompatActivity;

public class DeepLinkActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get the deep link intent
        Intent intent = getIntent();
        Uri deepLink = intent.getData();
        
        if (deepLink != null) {
            Log.d("DeepLink", "Received: " + deepLink.toString());
            
            // Extract auth parameters if present
            String code = deepLink.getQueryParameter("code");
            String state = deepLink.getQueryParameter("state");
            
            Log.d("DeepLink", "Code: " + code + ", State: " + state);
        }
        
        // Redirect back to MainActivity
        Intent mainIntent = new Intent(this, MainActivity.class);
        
        // Pass the deep link URI to MainActivity if needed
        if (deepLink != null) {
            mainIntent.setData(deepLink);
        }
        
        startActivity(mainIntent);
        
        // Close this activity
        finish();
    }
}
```

---

## 4️⃣ Firebase OAuth Client Configuration

In Google Cloud Console, you may need to add Android App Link or Custom URI Scheme:

**Where**: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

**For Web App Redirect URIs** (already configured):
```
https://avishkar-c9826.firebaseapp.com/__/auth/handler
https://avishkar-c9826.web.app/__/auth/handler
```

**For Native App** (if creating separate Android client):
```
Android App with package name: com.revmate.app
Signed certificate SHA-1: [your app signing cert SHA-1]
```

To get your certificate SHA-1:
```bash
./gradlew signingReport
```

Then copy the SHA-1 from debug or release key.

---

## 5️⃣ Layout File (activity_main.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">
    
    <!-- WebView fills entire screen -->
    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
    
    <!-- Optional: Container for full-screen custom views (e.g., video) -->
    <FrameLayout
        android:id="@+id/custom_view_container"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:visibility="gone" />
        
</LinearLayout>
```

---

## ✅ TESTING PROCEDURE

### 1. Install the App

```bash
./gradlew installDebug
```

### 2. On Device

1. Open the RevMate app
2. Navigate to login screen
3. Tap "Sign In with Google"
4. **Expected**: Chrome Custom Tab opens with Google Sign-In
5. Sign in with test account
6. **Expected**: Custom Tab closes, app returns, user is logged in

### 3. Verify Auth State

In Chrome DevTools (chrome://inspect):
```javascript
// In browser console
getAuth().currentUser
// Should show signed-in user
```

### 4. Log Inspection

```
D/OAuth: onCreateWindow: https://accounts.google.com/...
D/CustomTabs: Opened in Custom Tab: https://accounts.google.com/...
D/DeepLink: Received: https://avishkar-c9826.firebaseapp.com/__/auth/handler?...
```

---

## 🔗 RELATED CONFIGURATION

- **Firebase Console**: FIREBASE_CONSOLE_CHECKLIST.md
- **Google Cloud OAuth**: FIREBASE_CONSOLE_CHECKLIST.md
- **Web App Setup**: PRODUCTION_READY_GOOGLE_AUTH_REPAIR.md

---

## 🐛 TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank page in WebView | Settings not configured | Check `configureWebView()` settings |
| Custom Tab doesn't open | Package name not found | Install Chrome on device |
| Redirect doesn't return to app | Deep link not configured | Check AndroidManifest.xml intent-filters |
| Auth appears to work, but user still logged out | Session not persisting | Check Firebase persistence in JS |
| "Unknown scheme revmate" error | Deep link not recognized | Ensure `android:scheme="revmate"` in manifest |

---

**Estimated Time**: 45 minutes  
**Difficulty**: Intermediate

This setup provides a production-ready native Android app with seamless OAuth via Chrome Custom Tabs!

