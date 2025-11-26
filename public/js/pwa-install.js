// ============================================
// PWA INSTALL PROMPT HANDLER
// Handles "Add to Home Screen" for Android, Desktop, and iOS
// ============================================

let deferredPrompt = null;

// ============================================
// DETECT PWA MODE
// ============================================

/**
 * Check if app is running in standalone PWA mode
 * @returns {boolean}
 */
export function isPWAStandalone() {
  // Check for standalone mode on various platforms
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  
  return isStandalone;
}

/**
 * Check if app is installable
 * @returns {boolean}
 */
export function isInstallable() {
  // Already installed if in standalone mode
  if (isPWAStandalone()) {
    return false;
  }
  
  // Check if beforeinstallprompt is supported
  return 'onbeforeinstallprompt' in window;
}

/**
 * Check if running on iOS
 * @returns {boolean}
 */
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// ============================================
// INSTALL PROMPT HANDLER
// ============================================

/**
 * Initialize install prompt functionality
 */
export function initInstallPrompt() {
  console.log('[PWA] Initializing install prompt handler');
  console.log('[PWA] Standalone mode:', isPWAStandalone());
  console.log('[PWA] iOS detected:', isIOS());
  console.log('[PWA] Installable:', isInstallable());
  
  // Show button immediately (will be updated when prompt is available)
  updateProfileInstallButton();
  
  // Listen for beforeinstallprompt event (Android/Desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] ✅ beforeinstallprompt event fired');
    
    // Prevent the default mini-infobar from appearing
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Update profile install button visibility
    updateProfileInstallButton();
  });
  
  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    
    // Hide profile install card
    updateProfileInstallButton();
    
    // Clear the deferred prompt
    deferredPrompt = null;
    
    // Show success message
    showInstallSuccess();
  });
  
  // Initial check for installability
  updateProfileInstallButton();
  
  // Check if already installed on load
  if (isPWAStandalone()) {
    console.log('[PWA] App is already installed');
    updateProfileInstallButton();
  }
}

/**
 * Update install button visibility in profile section
 */
export function updateProfileInstallButton() {
  const installContainer = document.getElementById('installContainer');
  const installBtn = document.getElementById('installAppBtn');
  const iosHint = document.getElementById('ios-install-hint');
  const statusDiv = document.getElementById('install-status');
  
  if (!installContainer || !installBtn) {
    console.warn('[PWA] Install container or button not found');
    return;
  }
  
  // Always show the container (button will be visible)
  installContainer.style.display = 'block';
  
  // Hide if already installed
  if (isPWAStandalone()) {
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.className = 'install-status installed';
      statusDiv.innerHTML = '<small>✅ RevMate is already installed on your device!</small>';
    }
    installBtn.style.display = 'none';
    if (iosHint) iosHint.style.display = 'none';
    return;
  }
  
  // Show button
  installBtn.style.display = 'flex';
  
  // Show iOS hint if on iOS and no deferred prompt
  if (isIOS() && !deferredPrompt) {
    if (iosHint) {
      iosHint.style.display = 'block';
    }
    installBtn.disabled = false;
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.className = 'install-status ios-info';
      statusDiv.innerHTML = '<small>💡 Tap the button above for iOS installation instructions</small>';
    }
    console.log('[PWA] iOS detected - showing manual install option');
    return;
  }
  
  // Show if installable (has deferred prompt)
  if (deferredPrompt !== null) {
    if (iosHint) {
      iosHint.style.display = 'none';
    }
    installBtn.disabled = false;
    if (statusDiv) {
      statusDiv.style.display = 'none';
    }
    console.log('[PWA] Install prompt available - button ready');
  } else {
    // Show button anyway (for testing/development)
    installBtn.disabled = false;
    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.className = 'install-status waiting';
      statusDiv.innerHTML = '<small>⏳ Waiting for install prompt... (Try refreshing the page)</small>';
    }
    if (iosHint) {
      iosHint.style.display = 'none';
    }
    console.log('[PWA] No install prompt yet - button visible for testing');
  }
}

/**
 * Manually trigger install prompt (can be called from UI)
 * @returns {Promise<boolean>}
 */
export async function triggerInstall() {
  console.log('[PWA] triggerInstall() called');
  console.log('[PWA] deferredPrompt:', deferredPrompt ? 'available' : 'not available');
  console.log('[PWA] isIOS:', isIOS());
  console.log('[PWA] isPWAStandalone:', isPWAStandalone());
  
  // Handle iOS (no beforeinstallprompt support)
  if (isIOS()) {
    console.log('[PWA] iOS detected - showing manual install instructions');
    showIOSInstallInstructions();
    showUserMessage('iOS Installation', 'Please follow the instructions shown on screen to install RevMate.', 'info');
    return false;
  }
  
  // Check if already installed
  if (isPWAStandalone()) {
    console.log('[PWA] Already installed');
    showUserMessage('Already Installed', 'RevMate is already installed on your device!', 'success');
    return false;
  }
  
  // Check if deferred prompt is available
  if (!deferredPrompt) {
    console.warn('[PWA] No install prompt available yet');
    showUserMessage(
      'Install Prompt Not Ready', 
      'The install prompt is not available yet. Please try:\n1. Refreshing the page\n2. Waiting a few seconds\n3. Using Chrome browser on Android/Desktop',
      'warning'
    );
    return false;
  }
  
  try {
    console.log('[PWA] Showing install prompt...');
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      console.log('[PWA] ✅ User accepted install prompt');
      showUserMessage('Installation Started', 'RevMate is being installed...', 'success');
      // The 'appinstalled' event will fire and handle cleanup
    } else {
      console.log('[PWA] ❌ User dismissed install prompt');
      showUserMessage('Installation Cancelled', 'You can install RevMate anytime from the browser menu.', 'info');
    }
    
    // Clear the deferred prompt (can only be used once)
    deferredPrompt = null;
    
    // Update button visibility
    updateProfileInstallButton();
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] ❌ Install error:', error);
    showUserMessage('Installation Error', `An error occurred: ${error.message}. Please try again or use the browser menu to install.`, 'error');
    return false;
  }
}

/**
 * Show user-friendly message
 */
function showUserMessage(title, message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `install-user-message install-user-message-${type}`;
  messageDiv.innerHTML = `
    <div class="install-message-content">
      <strong>${title}</strong>
      <p>${message}</p>
      <button onclick="this.closest('.install-user-message').remove()" class="install-message-close">Got it</button>
    </div>
  `;
  
  document.body.appendChild(messageDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentElement) {
      messageDiv.remove();
    }
  }, 5000);
}

/**
 * Get the deferred prompt (for checking if installable)
 * @returns {object|null}
 */
export function getDeferredPrompt() {
  return deferredPrompt;
}

/**
 * Show iOS install instructions
 */
function showIOSInstallInstructions() {
  const instructions = `
    <div class="pwa-ios-instructions">
      <h3>Install RevMate</h3>
      <ol>
        <li>Tap the <strong>Share</strong> button <span style="font-size: 1.2em;">📤</span> at the bottom of your screen</li>
        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>"Add"</strong> in the top right to confirm</li>
      </ol>
      <button onclick="this.closest('.pwa-ios-instructions').parentElement.remove()">Got it!</button>
    </div>
  `;
  
  // Create and show instructions modal
  const modal = document.createElement('div');
  modal.className = 'pwa-instructions-modal';
  modal.innerHTML = instructions;
  document.body.appendChild(modal);
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 15000);
}

/**
 * Show install success message
 */
function showInstallSuccess() {
  const message = document.createElement('div');
  message.className = 'pwa-install-success';
  message.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    <span>RevMate installed successfully!</span>
  `;
  
  document.body.appendChild(message);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (message.parentElement) {
      message.remove();
    }
  }, 3000);
}

// ============================================
// AUTO-INITIALIZE
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInstallPrompt);
} else {
  initInstallPrompt();
}

// Export for use in other modules
export default {
  initInstallPrompt,
  triggerInstall,
  isPWAStandalone,
  isInstallable,
  getDeferredPrompt,
  updateProfileInstallButton
};
