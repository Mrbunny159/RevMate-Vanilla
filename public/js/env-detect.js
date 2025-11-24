// ============================================
// ENVIRONMENT DETECTION MODULE
// Reliable WebView + Wrapper Detection
// ============================================
// Purpose: Detect if app is running in:
//   - Android WebView (native embedded browser)
//   - iOS WebView (UIWebView or WKWebView)
//   - Median.co wrapper
//   - WebViewGold wrapper
//   - Cordova/Capacitor
//   - Plain desktop/mobile browsers
//
// Used by: auth-google.js, auth-fallback.js, and main app
// ============================================

/**
 * Detects if the app is running inside an embedded WebView
 * Checks multiple heuristics: UA string, window properties, feature detection
 * 
 * @returns {Object} Detection result with detailed info
 *   {
 *     isWebView: boolean,
 *     type: 'android' | 'ios' | 'cordova' | 'median' | 'webviewgold' | 'plain-browser' | 'unknown',
 *     userAgent: string (truncated),
 *     details: {
 *       ua: {...detection details from UA},
 *       window: {...window properties checked},
 *       features: {...feature detection results}
 *     }
 *   }
 */
export function detectEnvironment() {
  const userAgent = navigator.userAgent || '';
  const ua = userAgent.toLowerCase();

  // Result object
  const result = {
    isWebView: false,
    type: 'plain-browser',
    userAgent: userAgent.substring(0, 200),
    details: {
      ua: {},
      window: {},
      features: {}
    }
  };

  // ==========================================
  // 1. USER-AGENT STRING CHECKS
  // ==========================================

  // Android WebView patterns
  const isAndroidWebView =
    /android/.test(ua) && (
      /wv\)/.test(ua) ||           // Chrome WebView: "Android 10; wv)"
      /webkit/.test(ua) && !/chrome\/[\d.]+/.test(ua) ||  // WebKit but not Chrome
      /version\/[\d.]+\s+webview/.test(ua) ||  // Old WebView format
      /;\s*wv\s*\)/.test(ua) ||    // Strict wv check
      /webview/.test(ua)           // Generic WebView string
    );

  result.details.ua.isAndroidWebView = isAndroidWebView;

  // iOS WebView patterns
  // Key indicators: iPhone/iPad + NOT Safari + AppleWebKit
  const isIOSWebView =
    /iphone|ipad|ipod/.test(ua) && (
      !/safari/.test(ua) || /webview/.test(ua)
    ) && (
      /applewebkit/.test(ua) ||
      /wkwebview/.test(ua) ||
      /uiwebview/.test(ua)
    );

  result.details.ua.isIOSWebView = isIOSWebView;

  // Cordova/Capacitor (hybrid app frameworks)
  const isCordova = /cordova|capacitor|phonegap/.test(ua);
  result.details.ua.isCordova = isCordova;

  // Median.co wrapper (specific UA or headers)
  const isMedian = /median/.test(ua);
  result.details.ua.isMedian = isMedian;

  // WebViewGold (no-code app wrapper)
  const isWebViewGold = /webviewgold/.test(ua);
  result.details.ua.isWebViewGold = isWebViewGold;

  // ==========================================
  // 2. WINDOW OBJECT PROPERTY CHECKS
  // ==========================================

  // Cordova global (Cordova/Capacitor framework)
  const hasCordova = typeof window.cordova !== 'undefined';
  result.details.window.hasCordova = hasCordova;

  // iOS WKWebView bridge (newer iOS WebView)
  const hasWebKitMessageHandlers =
    typeof window.webkit !== 'undefined' &&
    typeof window.webkit.messageHandlers !== 'undefined';
  result.details.window.hasWebKitMessageHandlers = hasWebKitMessageHandlers;

  // iOS older UIWebView (add safety check)
  const hasUIWebView =
    window.documentElement &&
    typeof window.documentElement._uiwebview !== 'undefined';
  result.details.window.hasUIWebView = hasUIWebView;

  // Median.co injection (wrapper may set custom global)
  const hasMedianGlobal = typeof window.median !== 'undefined' || typeof window.__MEDIAN__ !== 'undefined';
  result.details.window.hasMedianGlobal = hasMedianGlobal;

  // Check for any wrapper-specific globals
  const hasWrapperGlobals =
    typeof window._isInAppWebView !== 'undefined' ||
    typeof window.__wrapper__ !== 'undefined' ||
    typeof window.__WEBVIEW__ !== 'undefined' ||
    typeof window.external !== 'undefined' && typeof window.external.notify !== 'undefined';
  result.details.window.hasWrapperGlobals = hasWrapperGlobals;

  // ==========================================
  // 3. FEATURE DETECTION
  // ==========================================

  // iOS standalone web app mode (PWA on home screen)
  const isIOSStandalone =
    navigator.standalone === true ||
    (window.navigator.standalone !== undefined && window.navigator.standalone);
  result.details.features.isIOSStandalone = isIOSStandalone;

  // Check for DevTools (available in browser, not in WebView)
  // This is a weak signal but useful
  const hasDevTools = () => {
    try {
      // Chromium-based browsers have specific DevTools behavior
      const el = document.createElement('div');
      const originalLog = console.log;
      let hasConsole = false;
      console.log = () => { hasConsole = true; };
      console.log();
      console.log = originalLog;
      return hasConsole;
    } catch (e) {
      return true; // Default to true if we can't detect
    }
  };
  // Don't use this as primary signal; WebView can have console too

  // Check hardware concurrency (weak signal)
  const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
  result.details.features.hardwareConcurrency = hardwareConcurrency;

  // ==========================================
  // 4. COMPOSITE DETECTION & CLASSIFICATION
  // ==========================================

  if (isAndroidWebView) {
    result.isWebView = true;
    result.type = 'android';
  } else if (isIOSWebView || hasWebKitMessageHandlers || hasUIWebView) {
    result.isWebView = true;
    result.type = 'ios';
  } else if (isCordova || hasCordova) {
    result.isWebView = true;
    result.type = 'cordova';
  } else if (isMedian || hasMedianGlobal) {
    result.isWebView = true;
    result.type = 'median';
  } else if (isWebViewGold) {
    result.isWebView = true;
    result.type = 'webviewgold';
  } else if (hasWrapperGlobals) {
    result.isWebView = true;
    result.type = 'unknown';
  } else if (isIOSStandalone) {
    result.isWebView = true;
    result.type = 'ios'; // iOS standalone web app
  } else {
    result.isWebView = false;
    result.type = 'plain-browser';
  }

  return result;
}

/**
 * Convenience function: Simple boolean check if WebView is detected
 * Use detectEnvironment() if you need detailed info
 * 
 * @returns {boolean} True if running in any WebView
 */
export function isEmbeddedWebView() {
  return detectEnvironment().isWebView;
}

/**
 * Get the detected wrapper type
 * Useful for logging or conditional behavior
 * 
 * @returns {string} One of: 'android', 'ios', 'cordova', 'median', 'webviewgold', 'plain-browser', 'unknown'
 */
export function getWrapperType() {
  return detectEnvironment().type;
}

/**
 * Check if this is a specific type of WebView
 * 
 * @param {string} type - Type to check: 'android', 'ios', 'cordova', 'median', 'webviewgold'
 * @returns {boolean}
 */
export function isWrapperType(type) {
  const detected = detectEnvironment();
  return detected.isWebView && detected.type === type;
}

/**
 * Check if OAuth can be opened in external browser
 * Returns false if WebView has no way to break out to device browser
 * 
 * Used by: auth-google.js to decide popup vs redirect flow
 * Used by: auth-fallback.js to show/hide Google button
 * 
 * @returns {boolean} True if external browser OAuth is possible
 */
export function canOpenExternalBrowser() {
  const env = detectEnvironment();

  // These types CAN open external browser via redirect
  const supportRedirect = ['android', 'ios', 'cordova', 'median', 'webviewgold'];

  if (!env.isWebView) {
    // Plain browser can always open (popup or external)
    return true;
  }

  if (supportRedirect.includes(env.type)) {
    // These wrappers support signInWithRedirect (opens external browser)
    return true;
  }

  // For unknown wrappers, assume they might support redirect
  // (worst case: OAuth fails and fallback to email is shown)
  return true;
}

/**
 * Log detection results to console and sessionStorage for debugging
 * Called by: auth-google.js and other modules during auth flow
 * 
 * @param {string} stage - Label for this log point (e.g., 'AUTH_START', 'POPUP_FAILED')
 * @param {Object} additionalData - Extra data to log
 */
export function logEnvironmentDetection(stage = '', additionalData = {}) {
  const env = detectEnvironment();
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    stage: stage || 'UNKNOWN',
    environment: env,
    ...additionalData
  };

  // Log to console
  const prefix = env.isWebView ? '📱' : '🖥️';
  const typeStr = env.isWebView ? `${env.type}` : 'browser';
  console.log(
    `${prefix} [${stage}] Environment: ${typeStr}`,
    logEntry
  );

  // Store in sessionStorage for inspection
  try {
    const logs = JSON.parse(sessionStorage.getItem('env_detection_logs') || '[]');
    logs.push(logEntry);
    // Keep last 30 logs
    if (logs.length > 30) logs.shift();
    sessionStorage.setItem('env_detection_logs', JSON.stringify(logs));
  } catch (e) {
    // Silently fail if storage not available
  }
}

/**
 * Get all environment detection logs from this session
 * Useful for debugging: call in console and inspect
 * 
 * @returns {Array} Array of log entries
 */
export function getEnvironmentDetectionLogs() {
  try {
    return JSON.parse(sessionStorage.getItem('env_detection_logs') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clear all environment detection logs
 */
export function clearEnvironmentDetectionLogs() {
  try {
    sessionStorage.removeItem('env_detection_logs');
    console.log('✅ Environment detection logs cleared');
  } catch (e) {
    // Silently fail
  }
}

/**
 * Get a human-readable summary of the environment
 * Useful for error messages, debugging, telemetry
 * 
 * @returns {string} Summary string
 */
export function getEnvironmentSummary() {
  const env = detectEnvironment();

  if (env.type === 'plain-browser') {
    return 'Desktop/Mobile Browser';
  } else if (env.type === 'android') {
    return 'Android WebView';
  } else if (env.type === 'ios') {
    return 'iOS WebView';
  } else if (env.type === 'cordova') {
    return 'Cordova/Capacitor App';
  } else if (env.type === 'median') {
    return 'Median.co Wrapper';
  } else if (env.type === 'webviewgold') {
    return 'WebViewGold Wrapper';
  } else {
    return 'Unknown Wrapper';
  }
}

// ============================================
// EXPORT SUMMARY
// ============================================
// Main exports:
//   - detectEnvironment() → full object with details
//   - isEmbeddedWebView() → boolean (most common use)
//   - getWrapperType() → string type
//   - isWrapperType(type) → boolean check for specific type
//   - canOpenExternalBrowser() → boolean (for OAuth strategy)
//   - logEnvironmentDetection(stage, data) → debug logging
//   - getEnvironmentSummary() → human-readable string
// ============================================
