// ============================================
// AUTH FALLBACK UI & STRATEGY
// Email/Phone Fallback for WebView Limitations
// ============================================
// Purpose: Manages UI visibility based on environment
//   - If WebView cannot open external browser:
//     * Hide Google button
//     * Show message
//     * Highlight Email/Phone options
//   - If WebView can open external browser:
//     * Show all options normally
//   - Show "Open in Device Browser" option if needed
//
// Usage:
//   import { setupAuthFallbackUI } from './auth-fallback.js';
//   setupAuthFallbackUI();
//
// ============================================

import {
  isEmbeddedWebView,
  getWrapperType,
  canOpenExternalBrowser,
  getEnvironmentSummary
} from './env-detect.js';

/**
 * Setup auth fallback UI based on environment
 * Call this on page load, before user interacts with auth buttons
 * 
 * Logic:
 *   - If WebView + can open external: Show all options (Google + Email + Phone)
 *   - If WebView + cannot open external: Hide Google, show Email + Phone + message
 *   - If plain browser: Show all options normally
 */
export function setupAuthFallbackUI() {
  console.log('🎨 Setting up auth fallback UI...');
  
  const isWebView = isEmbeddedWebView();
  const canOpenExt = canOpenExternalBrowser();
  const wrapperType = getWrapperType();
  
  console.log('📊 Auth UI Config:', {
    isWebView,
    wrapperType,
    canOpenExternalBrowser: canOpenExt,
    summary: getEnvironmentSummary()
  });
  
  // ================================
  // GET DOM ELEMENTS
  // ================================
  
  const googleButton = document.getElementById('login-google');
  const signupGoogleButton = document.getElementById('signup-google');
  const emailLoginForm = document.getElementById('login-form');
  const phoneLoginBtn = document.getElementById('toggle-phone-login');
  const alertContainer = document.getElementById('alert-container');
  
  // ================================
  // CASE 1: Plain Browser
  // ================================
  
  if (!isWebView) {
    console.log('✅ Plain browser detected - showing all options');
    // Show everything normally
    enableButtons(googleButton, signupGoogleButton);
    return;
  }
  
  // ================================
  // CASE 2: WebView with External Browser Support
  // ================================
  
  if (isWebView && canOpenExt) {
    console.log('✅ WebView detected but external browser available - showing all options');
    // Google OAuth will work via redirect → external browser → redirect back
    enableButtons(googleButton, signupGoogleButton);
    
    // Show helpful message
    if (alertContainer) {
      showAlert(
        alertContainer,
        `ℹ️ You're using ${getEnvironmentSummary()}. Clicking "Google" will open your device browser for secure sign-in.`,
        'info'
      );
    }
    return;
  }
  
  // ================================
  // CASE 3: WebView without External Browser Support
  // (This is rare but possible in some wrapped environments)
  // ================================
  
  if (isWebView && !canOpenExt) {
    console.log('⚠️ WebView detected - external browser NOT available - hiding Google option');
    
    // Hide Google button
    disableButtons(googleButton, signupGoogleButton);
    
    // Show prominent message
    if (alertContainer) {
      showAlert(
        alertContainer,
        `⚠️ Google Sign-In is not available in ${getEnvironmentSummary()}. Please use Email or Phone Sign-In below.`,
        'warning'
      );
    }
    
    // Make Email/Phone more prominent
    highlightFallback();
    
    // Offer to open in device browser (if possible)
    offerDeviceBrowserOption();
    
    return;
  }
}

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Enable (show and enable) buttons
 */
function enableButtons(...buttons) {
  buttons.forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  });
}

/**
 * Disable (hide or disable) buttons
 */
function disableButtons(...buttons) {
  buttons.forEach(btn => {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  });
}

/**
 * Show alert message
 */
function showAlert(container, message, type = 'info') {
  if (!container) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.style.cssText = `
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
    font-size: 0.95rem;
    line-height: 1.5;
  `;
  
  if (type === 'warning') {
    alert.style.backgroundColor = '#fff3cd';
    alert.style.borderLeft = '4px solid #ffc107';
    alert.style.color = '#856404';
  } else if (type === 'info') {
    alert.style.backgroundColor = '#cfe2ff';
    alert.style.borderLeft = '4px solid #0d6efd';
    alert.style.color = '#084298';
  }
  
  alert.textContent = message;
  container.appendChild(alert);
}

/**
 * Make Email/Phone options more visually prominent
 */
function highlightFallback() {
  const emailSection = document.getElementById('login-form');
  const phoneSection = document.getElementById('toggle-phone-login');
  
  if (emailSection) {
    // Add subtle highlight
    emailSection.style.borderRadius = '4px';
    emailSection.style.padding = '0.5rem';
    emailSection.style.backgroundColor = '#f9f9f9';
  }
  
  if (phoneSection) {
    phoneSection.style.fontWeight = 'bold';
    phoneSection.style.color = '#667eea';
  }
}

/**
 * Add option to open in device browser
 * This is a workaround if external browser access is needed
 */
function offerDeviceBrowserOption() {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;
  
  // Create a button to open app in device browser
  const suggestion = document.createElement('div');
  suggestion.style.cssText = `
    margin-top: 1rem;
    padding: 1rem;
    background: #f0f4ff;
    border-radius: 4px;
    text-align: center;
    border-left: 4px solid #667eea;
  `;
  
  suggestion.innerHTML = `
    <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: #666;">
      💡 <strong>Tip:</strong> If you need to use Google Sign-In, try opening this app directly in your device browser.
    </p>
    <button onclick="window.open(window.location.href, '_system')" style="
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    ">
      Open in Device Browser
    </button>
  `;
  
  alertContainer.appendChild(suggestion);
}

// ================================
// GOOGLE BUTTON CLICK HANDLER
// ================================

/**
 * Setup handler for Google button with environment awareness
 * Shows warning or message based on context
 */
export function setupGoogleButtonHandler(callback) {
  const googleButton = document.getElementById('login-google');
  if (!googleButton) return;
  
  const isWebView = isEmbeddedWebView();
  const canOpenExt = canOpenExternalBrowser();
  
  googleButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (isWebView && !canOpenExt) {
      // This shouldn't happen if setupAuthFallbackUI worked correctly
      // But add safeguard
      alert('⚠️ Google Sign-In is not supported in this environment. Please use Email or Phone Sign-In.');
      return;
    }
    
    if (isWebView && canOpenExt) {
      // Show interim message
      const btn = e.target.closest('button');
      const originalText = btn.textContent;
      btn.textContent = '⏳ Opening in device browser...';
      btn.disabled = true;
      
      // Restore after delay (in case of error)
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    }
    
    // Call the actual login function
    if (callback) {
      try {
        await callback();
      } catch (error) {
        console.error('Google login error:', error);
      }
    }
  });
}

/**
 * Setup handler for Apple button with similar logic
 */
export function setupAppleButtonHandler(callback) {
  const appleButton = document.getElementById('login-apple');
  if (!appleButton) return;
  
  const isWebView = isEmbeddedWebView();
  
  appleButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (isWebView) {
      const btn = e.target.closest('button');
      const originalText = btn.textContent;
      btn.textContent = '⏳ Opening in device browser...';
      btn.disabled = true;
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    }
    
    if (callback) {
      try {
        await callback();
      } catch (error) {
        console.error('Apple login error:', error);
      }
    }
  });
}

/**
 * Show error message related to auth in WebView
 * Helpful for users trying Google but hitting issues
 */
export function showWebViewAuthError(errorCode, errorMessage) {
  console.error('📱 WebView Auth Error:', errorCode, errorMessage);
  
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;
  
  // Clear previous alerts
  alertContainer.innerHTML = '';
  
  const errorElement = document.createElement('div');
  errorElement.style.cssText = `
    padding: 1rem;
    background: #fee;
    border-left: 4px solid #dc3545;
    border-radius: 4px;
    color: #721c24;
    margin-bottom: 1rem;
  `;
  
  let errorText = errorMessage;
  
  // Provide helpful suggestions for common errors
  if (errorCode === 'auth/disallowed-useragent') {
    errorText += '\n\n💡 Try: Open this app in your device browser instead of the in-app browser.';
  } else if (errorCode === 'auth/popup-blocked') {
    errorText += '\n\n💡 Try: Allow popups in your browser settings, or use Email/Phone Sign-In below.';
  } else if (errorCode === 'auth/auth-domain-config-required') {
    errorText += '\n\n💡 This is a server configuration issue. Please contact support.';
  }
  
  errorElement.innerHTML = `
    <strong>⚠️ Sign-In Error</strong>
    <p style="margin-top: 0.5rem; white-space: pre-wrap;">${errorText}</p>
  `;
  
  alertContainer.appendChild(errorElement);
}

// ================================
// EXPORTS
// ================================
// Main exports:
//   - setupAuthFallbackUI() → Call on page load
//   - setupGoogleButtonHandler(callback) → Setup Google button click
//   - setupAppleButtonHandler(callback) → Setup Apple button click
//   - showWebViewAuthError(code, message) → Show error to user
// ================================
