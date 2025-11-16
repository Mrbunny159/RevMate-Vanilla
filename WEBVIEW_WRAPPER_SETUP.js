/**
 * WebView Wrapper Configuration & Compatibility Layer
 * Add this file to handle different website wrapper platforms
 * 
 * Supported Wrappers:
 * - Median.co
 * - Capacitor (Ionic/Angular)
 * - Cordova
 * - Flutter WebView
 * - React Native WebView
 * - Native Android/iOS WebView
 */

// ============================================
// WRAPPER DETECTION
// ============================================

export function detectWrapper() {
    const ua = navigator.userAgent;
    const isMedian = typeof window.median !== 'undefined' || /Median/.test(ua);
    const isCapacitor = typeof window.Capacitor !== 'undefined';
    const isCordova = typeof window.cordova !== 'undefined';
    const isFlutter = typeof window.flutterWebViewCallback !== 'undefined';
    const isReactNative = typeof window.ReactNativeWebView !== 'undefined';
    
    const wrapper = {
        isMedian,
        isCapacitor,
        isCordova,
        isFlutter,
        isReactNative,
        detected: isMedian || isCapacitor || isCordova || isFlutter || isReactNative
    };
    
    if (wrapper.detected) {
        console.log('📱 Website Wrapper Detected:', {
            median: isMedian,
            capacitor: isCapacitor,
            cordova: isCordova,
            flutter: isFlutter,
            reactNative: isReactNative
        });
    }
    
    return wrapper;
}

// ============================================
// EXTERNAL LINK HANDLER
// For opening OAuth flows in external browser
// ============================================

export function setupExternalLinkHandler() {
    const wrapper = detectWrapper();
    
    if (!wrapper.detected) {
        console.log('⚠️ Not running in a wrapper - external link handling skipped');
        return;
    }
    
    // OAuth domains that should open in external browser
    const externalDomains = [
        'accounts.google.com',
        'accounts.googleusercontent.com',
        'appleid.apple.com',
        'firebaseapp.com',
        'web.app',
        'github.com',
        'microsoft.com'
    ];
    
    // Capacitor: Use Browser plugin
    if (wrapper.isCapacitor && typeof window.Capacitor !== 'undefined') {
        console.log('⚙️ Capacitor: Setting up external browser handler');
        
        const { Browser } = window.Capacitor.Plugins;
        
        document.addEventListener('click', async (e) => {
            const target = e.target.closest('a');
            if (!target) return;
            
            const href = target.getAttribute('href');
            if (!href) return;
            
            // Check if this is an external OAuth domain
            const shouldOpenExternal = externalDomains.some(domain => href.includes(domain));
            
            if (shouldOpenExternal) {
                e.preventDefault();
                console.log('🌐 Opening in external browser:', href);
                await Browser.open({ url: href });
            }
        });
    }
    
    // Cordova: Use InAppBrowser or window.open with _system
    if (wrapper.isCordova && typeof window.cordova !== 'undefined') {
        console.log('⚙️ Cordova: Setting up external browser handler');
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;
            
            const href = target.getAttribute('href');
            if (!href) return;
            
            const shouldOpenExternal = externalDomains.some(domain => href.includes(domain));
            
            if (shouldOpenExternal) {
                e.preventDefault();
                console.log('🌐 Opening in external browser:', href);
                
                if (typeof window.cordova.InAppBrowser !== 'undefined') {
                    window.cordova.InAppBrowser.open(href, '_system');
                } else {
                    window.open(href, '_system');
                }
            }
        });
    }
    
    // Median.co: Links open externally by default if configured in dashboard
    if (wrapper.isMedian) {
        console.log('⚙️ Median.co: Configure external browser in dashboard → Settings → Links');
    }
    
    // Flutter WebView: Use platform channels
    if (wrapper.isFlutter && typeof window.flutterWebViewCallback !== 'undefined') {
        console.log('⚙️ Flutter: Setting up Flutter bridge for external links');
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;
            
            const href = target.getAttribute('href');
            if (!href) return;
            
            const shouldOpenExternal = externalDomains.some(domain => href.includes(domain));
            
            if (shouldOpenExternal) {
                e.preventDefault();
                console.log('🌐 Opening in external browser via Flutter:', href);
                
                // Call Flutter method
                window.flutterWebViewCallback({
                    method: 'openExternalBrowser',
                    url: href
                });
            }
        });
    }
    
    // React Native WebView
    if (wrapper.isReactNative && typeof window.ReactNativeWebView !== 'undefined') {
        console.log('⚙️ React Native: Setting up external browser handler');
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;
            
            const href = target.getAttribute('href');
            if (!href) return;
            
            const shouldOpenExternal = externalDomains.some(domain => href.includes(domain));
            
            if (shouldOpenExternal) {
                e.preventDefault();
                console.log('🌐 Opening in external browser via React Native:', href);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'openExternalBrowser',
                    url: href
                }));
            }
        });
    }
}

// ============================================
// REDIRECT HANDLING
// Capture redirect results from OAuth flows
// ============================================

export function setupRedirectHandler(onRedirectCallback) {
    const wrapper = detectWrapper();
    
    // For Capacitor & Cordova, intercept URL changes
    if (wrapper.isCapacitor || wrapper.isCordova) {
        console.log('📍 Setting up redirect handler for OAuth redirect');
        
        // Firebase handles this automatically with getRedirectResult()
        // But you can add additional tracking here
        if (onRedirectCallback && typeof onRedirectCallback === 'function') {
            setTimeout(() => {
                onRedirectCallback({
                    wrapper: wrapper.isCapacitor ? 'capacitor' : 'cordova',
                    timestamp: new Date().toISOString()
                });
            }, 100);
        }
    }
}

// ============================================
// NAVIGATION HANDLING
// Some wrappers require special navigation handling
// ============================================

export function navigateTo(url) {
    const wrapper = detectWrapper();
    
    // Standard navigation (works in most wrappers)
    window.location.href = url;
}

export function openUrl(url) {
    const wrapper = detectWrapper();
    
    if (wrapper.isCapacitor) {
        const { Browser } = window.Capacitor.Plugins;
        Browser.open({ url });
    } else if (wrapper.isCordova) {
        window.open(url, '_system');
    } else {
        window.open(url, '_blank');
    }
}

// ============================================
// INITIALIZATION
// Call this on app load
// ============================================

export function initWrapperSupport() {
    console.log('🔧 Initializing website wrapper support...');
    
    const wrapper = detectWrapper();
    
    if (!wrapper.detected) {
        console.log('ℹ️ Not running in a wrapper (regular web browser)');
        return;
    }
    
    // Setup external link handling for OAuth
    setupExternalLinkHandler();
    
    // Setup redirect handler
    setupRedirectHandler((info) => {
        console.log('📍 OAuth redirect detected:', info);
    });
    
    console.log('✅ Wrapper support initialized');
    
    // Log wrapper info for debugging
    console.log('🔍 Wrapper Details:', {
        median: wrapper.isMedian,
        capacitor: wrapper.isCapacitor,
        cordova: wrapper.isCordova,
        flutter: wrapper.isFlutter,
        reactNative: wrapper.isReactNative,
        userAgent: navigator.userAgent.substring(0, 150)
    });
}

// ============================================
// STORAGE ADAPTER
// Some wrappers have different storage requirements
// ============================================

export function getStorageAdapter() {
    const wrapper = detectWrapper();
    
    // Default to localStorage
    let storage = localStorage;
    
    // React Native may require AsyncStorage
    if (wrapper.isReactNative) {
        console.warn('⚠️ React Native: Consider using AsyncStorage instead of localStorage');
        // You may need to bridge AsyncStorage here
    }
    
    return storage;
}

// ============================================
// DEVICE INFO
// Get device information for debugging
// ============================================

export function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        isOnline: navigator.onLine,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        wrapper: detectWrapper(),
        timestamp: new Date().toISOString()
    };
}

// ============================================
// ERROR HANDLING
// Graceful error handling for wrapper-specific issues
// ============================================

export function handleWrapperError(error, context = {}) {
    const wrapper = detectWrapper();
    const deviceInfo = getDeviceInfo();
    
    const errorReport = {
        error: {
            message: error.message,
            code: error.code,
            stack: error.stack
        },
        context,
        deviceInfo,
        timestamp: new Date().toISOString()
    };
    
    console.error('❌ Wrapper Error:', errorReport);
    
    // Store error in sessionStorage for debugging
    try {
        const errors = JSON.parse(sessionStorage.getItem('wrapper_errors') || '[]');
        errors.push(errorReport);
        if (errors.length > 10) errors.shift(); // Keep last 10 errors
        sessionStorage.setItem('wrapper_errors', JSON.stringify(errors));
    } catch (e) {
        // Silently fail
    }
    
    return errorReport;
}

// ============================================
// EXPORT ALL
// ============================================

export default {
    detectWrapper,
    setupExternalLinkHandler,
    setupRedirectHandler,
    navigateTo,
    openUrl,
    initWrapperSupport,
    getStorageAdapter,
    getDeviceInfo,
    handleWrapperError
};
