// ============================================
// AUTH HANDLER INIT
// Minimal script for auth-handler.html
// ============================================
// Purpose: Called by auth-handler.html to:
//   1. Load Firebase auth config
//   2. Call handleAuthRedirect() to complete OAuth
//   3. Redirect to app or show error
//
// This is the redirect_uri that Firebase OAuth redirects to
// ============================================

import { handleAuthRedirect } from './auth-google.js';

/**
 * Main function - runs on page load
 */
async function completeAuthRedirect() {
  console.log('🔄 Auth handler page loaded - processing redirect result...');
  
  try {
    // Call handleAuthRedirect from auth-google.js
    const result = await handleAuthRedirect();
    
    if (!result) {
      // No redirect result - this page was loaded directly (not from OAuth flow)
      console.log('ℹ️ No redirect result found - this may be a direct page load');
      // Redirect to home in 2 seconds
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 2000);
      return;
    }
    
    if (result.success) {
      // ✅ LOGIN SUCCESSFUL
      console.log('✅ OAuth redirect completed successfully');
      console.log('👤 User:', result.user.email, result.user.id);
      
      // Store user in localStorage for app access
      try {
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('authTimestamp', new Date().toISOString());
      } catch (storageError) {
        console.warn('⚠️ Could not store user in localStorage:', storageError);
      }
      
      // Redirect to app home after brief delay (let spinner spin once)
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
      
    } else {
      // ❌ LOGIN FAILED
      console.error('❌ OAuth redirect failed:', result.error, result.code);
      
      // Show error to user
      const errorContainer = document.getElementById('error-container');
      const errorMessage = document.getElementById('error-message');
      
      errorContainer.classList.add('show');
      
      // Build error message
      let fullErrorText = `${result.error || 'Unknown error'}`;
      if (result.code) {
        fullErrorText += `\n\nError Code: ${result.code}`;
      }
      if (result.originalMessage) {
        fullErrorText += `\n\nDetails: ${result.originalMessage}`;
      }
      
      errorMessage.textContent = fullErrorText;
      
      // Log for debugging
      console.log('Error details:', {
        error: result.error,
        code: result.code,
        originalMessage: result.originalMessage
      });
    }
    
  } catch (error) {
    // Unexpected error in handleAuthRedirect
    console.error('❌ Unexpected error during auth handling:', error);
    
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    errorContainer.classList.add('show');
    errorMessage.textContent = `Unexpected Error\n\n${error.message || error.toString()}`;
  }
}

// Run on page load
console.log('📄 Auth handler page started');
completeAuthRedirect();
