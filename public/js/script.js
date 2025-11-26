// revmate-main.js (Refactored - Firebase-only, PWA Removed)
// Author: Refactor output
// Assumptions: firebase-auth.js, firebase-db.js, rides.js, community.js, utils available

// ------------------------------
// Imports (Firebase + app modules)
// ------------------------------
import {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  loginWithGoogle,
  loginWithApple,
  setupRecaptcha,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  handleAuthRedirect
} from './firebase-auth.js';

import {
  createRide,
  updateUserProfile,
  // other DB helpers if needed
} from './firebase-db.js';

import {
  startDiscoverListener,
  stopDiscoverListener,
  startHostedListener,
  stopHostedListener,
  startJoinedListener,
  stopJoinedListener,
  joinRide,
  leaveRide,
  deleteRide,
  stopAllListeners,
  renderDiscoverRides
} from './rides.js';

import {
  startCommunityListener,
  stopCommunityListener,
  updateFilters,
  followMember as firebaseFollowMember,
  unfollowMember as firebaseUnfollowMember,
  getUniqueCities
} from './community.js';

import {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  renderEmptyState,
  showLoadingSkeleton
} from './utils/ux-helpers.js';

import { haversineDistanceKm } from './utils/distance.js';

// ------------------------------
// Small local storage helpers
// ------------------------------
function getData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return key === 'users' ? [] : null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage getData error', e);
    return null;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage saveData error', e);
  }
}

// ------------------------------
// Alert / Toast wrapper
// ------------------------------
function showAlert(message, type = 'success') {
  // Consistently route through UX helpers
  if (!message) return;
  switch (type) {
    case 'danger':
    case 'error':
      showError(message);
      break;
    case 'warning':
      showWarning(message);
      break;
    case 'info':
      showInfo(message);
      break;
    default:
      showSuccess(message);
      break;
  }
}

// ------------------------------
// THEME MANAGEMENT (kept)
// ------------------------------
const THEME_COLORS = {
  // Pastel Themes
  mint:  { name: '🌿 Mint Dream', primary: '#A8DADC', secondary: '#F8E8E8', accent: '#CDB4DB' },
  blush: { name: '🌸 Blush Rose', primary: '#FEC8D8', secondary: '#E8D5E8', accent: '#FF6B9D' },
  lavender: { name: '💜 Lavender', primary: '#CDB4DB', secondary: '#E8D5F8', accent: '#9B7EBD' },
  seafoam: { name: '🌊 Seafoam', primary: '#B8E0D2', secondary: '#D8F0E8', accent: '#76C9A1' },
  peach: { name: '🍑 Peach', primary: '#FFCDB2', secondary: '#FFE5D9', accent: '#FF9D71' },
  // Vibrant / Modern
  ocean: { name: '🌀 Ocean Blue', primary: '#0E7C86', secondary: '#8DD3C7', accent: '#006D7D' },
  sunset: { name: '🌅 Sunset Orange', primary: '#FF6B35', secondary: '#F5B461', accent: '#D62828' },
  forest: { name: '🌲 Forest Green', primary: '#2D6A4F', secondary: '#52B788', accent: '#1B4332' },
  coral: { name: '🪸 Coral Pink', primary: '#FF6B6B', secondary: '#FFD66B', accent: '#FF5252' },
  violet: { name: '✨ Deep Violet', primary: '#8B5A8E', secondary: '#DDB4DB', accent: '#6A4C70' },
  teal: { name: 'Teal Modern', primary: '#20B2AA', secondary: '#48D1CC', accent: '#008B8B' },
  rose: { name: 'Rose Gold', primary: '#B76E79', secondary: '#FDBCB4', accent: '#9D4E6C' },
  amber: { name: 'Amber', primary: '#FFA500', secondary: '#FFD700', accent: '#FF8C00' },
  cyan: { name: 'Cyan', primary: '#00CED1', secondary: '#E0FFFF', accent: '#00BFFF' }
};

function applyTheme(themeName) {
  const theme = THEME_COLORS[themeName] || THEME_COLORS.mint;
  document.documentElement.classList.remove(...Object.keys(THEME_COLORS).map(t => `theme-${t}`));
  document.documentElement.classList.add(`theme-${themeName}`);
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  document.documentElement.style.setProperty('--accent', theme.accent);
  updateThemePreview(theme);
}

function updateThemePreview(theme) {
  const preview = document.getElementById('themePreview');
  if (!preview) return;
  preview.style.setProperty('--primary', theme.primary);
  preview.style.setProperty('--accent', theme.accent);
}

function applySavedTheme() {
  const themeSettings = getData('themeSettings');
  if (themeSettings?.theme) {
    applyTheme(themeSettings.theme);
  } else {
    applyTheme('mint');
  }
  if (themeSettings?.darkMode) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
}

function saveThemeSettings() {
  const themeName = document.getElementById('themeSelect')?.value || 'mint';
  const darkMode = !!document.getElementById('darkModeToggle')?.checked;
  const themeSettings = { theme: themeName, darkMode };
  saveData('themeSettings', themeSettings);
  applyTheme(themeName);
  if (darkMode) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode');
  showAlert('✨ Theme saved successfully!');
}

// ------------------------------
// AUTH & AUTH-RELATED UI
// ------------------------------
let confirmationResult = null;

function attachAuthFormListeners() {
  // Signup
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value.trim();
      if (!name || !email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
      }
      const result = await registerUser(email, password, name);
      if (result.success) {
        showAlert('Account created successfully!', 'success');
        redirectToAppAfterDelay();
      } else showAlert(result.error || 'Sign-up failed', 'danger');
    });
  }

  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value.trim();
      if (!email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
      }
      const result = await loginUser(email, password);
      if (result.success) {
        showAlert('Login successful!', 'success');
        redirectToAppAfterDelay();
      } else {
        showAlert(result.error || 'Login failed', 'danger');
      }
    });
  }

  // Social buttons (delegated)
  document.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    // Google Login / Signup (hybrid handled in firebase-auth)
    if (target.id === 'login-google' || target.id === 'signup-google') {
      e.preventDefault();
      target.disabled = true;
      const original = target.innerHTML;
      target.innerHTML = '<i class="bi bi-google"></i> Signing...';
      try {
        const res = await loginWithGoogle();
        if (res.success) {
          showAlert('Login successful!', 'success');
          redirectToAppAfterDelay();
        } else if (res.redirecting) {
          showAlert('Redirecting to sign-in...', 'info');
        } else {
          showAlert(res.error || 'Google sign-in failed', 'danger');
          target.disabled = false;
          target.innerHTML = original;
        }
      } catch (err) {
        console.error('Google login error', err);
        showAlert(err.message || 'Google login error', 'danger');
        target.disabled = false;
        target.innerHTML = original;
      }
      return;
    }

    // Apple Login
    if (target.id === 'login-apple' || target.id === 'signup-apple') {
      e.preventDefault();
      try {
        const res = await loginWithApple();
        if (res.success) {
          showAlert('Login successful!', 'success');
          redirectToAppAfterDelay();
        } else {
          showAlert(res.error || 'Apple sign-in failed', 'danger');
        }
      } catch (err) {
        console.error('Apple login error', err);
        showAlert(err.message || 'Apple login error', 'danger');
      }
      return;
    }
  });
}

// ------------------------------
// PHONE AUTH HANDLERS
// ------------------------------
function initPhoneLoginHandlers() {
  const phoneLoginForm = document.getElementById('phone-login-form');
  const phoneVerifyForm = document.getElementById('phone-verify-form');
  const togglePhoneLoginBtn = document.getElementById('toggle-phone-login');
  const togglePhoneBackBtn = document.getElementById('toggle-phone-back');

  if (togglePhoneLoginBtn) {
    togglePhoneLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      phoneLoginForm?.classList.remove('hidden');
      togglePhoneLoginBtn.parentElement?.classList.add('hidden');
    });
  }

  if (togglePhoneBackBtn) {
    togglePhoneBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      phoneLoginForm?.classList.add('hidden');
      togglePhoneLoginBtn.parentElement?.classList.remove('hidden');
      phoneVerifyForm?.classList.add('hidden');
    });
  }

  if (phoneLoginForm) {
    phoneLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneNumber = document.getElementById('phone-number')?.value.trim();
      if (!phoneNumber) {
        showAlert('Please enter a phone number', 'danger');
        return;
      }
      try {
        const appVerifier = setupRecaptcha && setupRecaptcha('recaptcha-container');
        if (!appVerifier) { showAlert('reCAPTCHA setup failed', 'danger'); return; }
        const result = await sendPhoneVerificationCode(phoneNumber, appVerifier);
        if (result.success) {
          confirmationResult = result.confirmationResult;
          phoneLoginForm.classList.add('hidden');
          phoneVerifyForm.classList.remove('hidden');
          showAlert('Verification code sent!', 'success');
        } else showAlert(result.error || 'Could not send verification code', 'danger');
      } catch (err) {
        console.error('Phone send error', err);
        showAlert(err.message || 'Error sending verification code', 'danger');
      }
    });
  }

  if (phoneVerifyForm) {
    phoneVerifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const verificationCode = document.getElementById('verification-code')?.value.trim();
      const phoneName = document.getElementById('phone-name')?.value.trim() || 'Phone User';
      if (!verificationCode) { showAlert('Please enter the verification code', 'danger'); return; }
      if (!confirmationResult) { showAlert('Please request a verification code first', 'danger'); return; }
      try {
        const result = await verifyPhoneCode(confirmationResult, verificationCode, phoneName);
        if (result.success) {
          showAlert('Login successful!', 'success');
          redirectToAppAfterDelay();
        } else showAlert(result.error || 'Verification failed', 'danger');
      } catch (err) {
        console.error('Phone verify error', err);
        showAlert(err.message || 'Error verifying code', 'danger');
      }
    });
  }
}

// ------------------------------
// HOST RIDE FORM (Firebase createRide)
// ------------------------------
function initHostRideForm() {
  const hostForm = document.getElementById('hostRideForm');
  if (!hostForm) return;

  hostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = getData('currentUser');
    if (!currentUser || !currentUser.id) {
      showAlert('Please login to host rides', 'warning');
      return;
    }

    const title = document.getElementById('rideTitle')?.value.trim();
    const desc  = document.getElementById('rideDesc')?.value.trim();
    const start = document.getElementById('rideStart')?.value.trim();
    const dest  = document.getElementById('rideDest')?.value.trim();
    const date  = document.getElementById('rideDate')?.value;

    if (!title || !desc || !start || !dest || !date) {
      showAlert('Please fill in all fields', 'danger');
      return;
    }

    const newRide = {
      title, desc, start, dest, date,
      host: currentUser.name || 'Host',
      hostId: currentUser.id,
      joinedUsers: []
    };

    try {
      const res = await createRide(newRide);
      if (res && res.success) {
        hostForm.reset();
        showAlert('Ride created successfully!', 'success');
        // navigate to discover
        showSection('discover');
      } else {
        showAlert(res.error || 'Failed to create ride', 'danger');
      }
    } catch (err) {
      console.error('createRide error', err);
      showAlert(err.message || 'Error creating ride', 'danger');
    }
  });
}

// ------------------------------
// MY RIDES (hosted/joined) tab control
// ------------------------------
let currentRideTab = 'hosted';

function renderMyRides(type = 'hosted') {
  currentRideTab = type;
  if (type === 'hosted') {
    stopJoinedListener();
    startHostedListener();
  } else {
    stopHostedListener();
    startJoinedListener();
  }
}

function initMyRidesTabs() {
  const hostedBtn = document.getElementById('btnHosted');
  const joinedBtn = document.getElementById('btnJoined');
  if (!hostedBtn || !joinedBtn) return;
  hostedBtn.addEventListener('click', () => {
    hostedBtn.classList.add('active');
    joinedBtn.classList.remove('active');
    renderMyRides('hosted');
  });
  joinedBtn.addEventListener('click', () => {
    joinedBtn.classList.add('active');
    hostedBtn.classList.remove('active');
    renderMyRides('joined');
  });
}

// ------------------------------
// COMMUNITY (Firebase real-time)
// ------------------------------
function initCommunity() {
  // Start real-time community listener
  startCommunityListener();

  // Filters
  const filterCity = document.getElementById('filterCity');
  const filterBike = document.getElementById('filterBike');
  const filterActivity = document.getElementById('filterActivity');
  const resetBtn = document.getElementById('resetFilters');

  filterCity?.addEventListener('change', () => updateFilters({ city: filterCity.value }));
  filterBike?.addEventListener('change', () => updateFilters({ bike: filterBike.value }));
  filterActivity?.addEventListener('change', () => updateFilters({ activity: filterActivity.value }));

  resetBtn?.addEventListener('click', () => {
    if (filterCity) filterCity.value = 'all';
    if (filterBike) filterBike.value = 'all';
    if (filterActivity) filterActivity.value = 'all';
    updateFilters({ city: 'all', bike: 'all', activity: 'all' });
  });

  // Delegate follow/unfollow from community list container
  document.getElementById('communityList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-follow');
    if (!btn) return;
    const memberId = btn.getAttribute('data-member-id');
    if (!memberId) return;
    const currentUser = getData('currentUser');
    if (!currentUser) { showAlert('Please login to follow riders', 'warning'); return; }

    // Determine action: if button says Following -> unfollow
    const isFollowing = btn.classList.contains('following');
    try {
      if (isFollowing) {
        const res = await firebaseUnfollowMember(currentUser.id, memberId);
        if (res.success) {
          btn.classList.remove('following');
          btn.innerHTML = '<i class="bi bi-plus-circle"></i> Follow';
          showAlert('Unfollowed', 'info');
        } else showAlert(res.error || 'Could not unfollow', 'danger');
      } else {
        const res = await firebaseFollowMember(currentUser.id, memberId);
        if (res.success) {
          btn.classList.add('following');
          btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Following';
          showAlert('Now following!', 'success');
        } else showAlert(res.error || 'Could not follow', 'danger');
      }
    } catch (err) {
      console.error('follow/unfollow error', err);
      showAlert(err.message || 'Follow action failed', 'danger');
    }
  });
}

// ------------------------------
// NAVIGATION & SECTIONS
// ------------------------------
function showSection(sectionId) {
  const allSections = document.querySelectorAll('.app-section');
  allSections.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });

  saveData('lastSection', sectionId);

  // Section-specific init
  if (sectionId === 'discover') {
    startDiscoverListener(); // will call renderDiscoverRides via rides.js
  } else if (sectionId === 'myrides') {
    if (currentRideTab === 'hosted') startHostedListener();
    else startJoinedListener();
  } else if (sectionId === 'community') {
    initCommunity();
  } else if (sectionId === 'profile') {
    loadProfileData();
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.getAttribute('data-section');
      showSection(section);
    });
  });

  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const section = card.getAttribute('data-section');
      showSection(section);
    });
  });

  initHostRideForm();
  initMyRidesTabs();

  const last = getData('lastSection') || 'discover';
  showSection(last);
}

// ------------------------------
// PROFILE - load & save (persist to Firestore per choice C)
// ------------------------------
function loadProfileData() {
  const currentUser = getData('currentUser');
  if (!currentUser) return;
  document.getElementById('profileName')?.value = currentUser.name || '';
  document.getElementById('profileEmail')?.value = currentUser.email || '';
  const themeSettings = getData('themeSettings');
  if (themeSettings) {
    document.getElementById('themeSelect') && (document.getElementById('themeSelect').value = themeSettings.theme || 'mint');
    document.getElementById('darkModeToggle') && (document.getElementById('darkModeToggle').checked = themeSettings.darkMode || false);
    updateThemePreview(THEME_COLORS[themeSettings.theme] || THEME_COLORS.mint);
  } else updateThemePreview(THEME_COLORS.mint);
}

async function saveProfileData() {
  const currentUser = getData('currentUser');
  if (!currentUser) { showAlert('No current user', 'danger'); return; }
  const newName = document.getElementById('profileName')?.value.trim();
  if (!newName) { showAlert('Please enter a valid name', 'danger'); return; }

  try {
    const res = await updateUserProfile(currentUser.id, { name: newName });
    if (res && res.success) {
      // Update local copy for immediate UI responsiveness
      currentUser.name = newName;
      saveData('currentUser', currentUser);
      document.getElementById('user-name-home') && (document.getElementById('user-name-home').textContent = newName);
      showAlert('Profile updated successfully!', 'success');
    } else {
      showAlert(res.error || 'Failed to update profile', 'danger');
    }
  } catch (err) {
    console.error('updateUserProfile error', err);
    showAlert(err.message || 'Error updating profile', 'danger');
  }
}

// ------------------------------
// LOGOUT
// ------------------------------
async function handleLogout() {
  // Stop real-time listeners before logout
  stopAllListeners();
  stopDiscoverListener();
  stopHostedListener();
  stopJoinedListener();
  stopCommunityListener();

  const res = await logoutUser();
  if (res.success) {
    document.getElementById('login-form')?.reset();
    document.getElementById('signup-form')?.reset();
    document.getElementById('app-container')?.classList.add('hidden');
    document.getElementById('auth-section')?.classList.remove('hidden');
    showAlert('Logged out successfully', 'success');
  } else {
    showAlert(res.error || 'Logout failed', 'danger');
  }
}

// ------------------------------
// INITIALIZATION
// ------------------------------
function redirectToAppAfterDelay() {
  setTimeout(() => {
    redirectToApp();
  }, 700);
}

function redirectToApp() {
  const currentUser = getData('currentUser');
  if (!currentUser) return;
  document.getElementById('user-name-home') && (document.getElementById('user-name-home').textContent = currentUser.name || 'User');
  document.getElementById('auth-section')?.classList.add('hidden');
  document.getElementById('app-container')?.classList.remove('hidden');
  initNavigation();
}

function initDescriptionCounter() {
  const descriptionEl = document.getElementById('rideDescription');
  const counterEl = document.getElementById('descriptionCounter');
  if (!descriptionEl || !counterEl) return;
  descriptionEl.addEventListener('input', () => {
    const length = descriptionEl.value.length;
    const maxLength = descriptionEl.maxLength || 500;
    counterEl.textContent = `${length}/${maxLength}`;
    if (length > maxLength * 0.9) counterEl.style.color = '#dc3545';
    else if (length > maxLength * 0.7) counterEl.style.color = '#ffc107';
    else counterEl.style.color = '#6c757d';
  });
}

// Main app init (binds listeners, sets up auth watcher)
function initApp() {
  applySavedTheme();

  // Handle OAuth redirect (if applicable)
  handleAuthRedirect().catch(err => console.error('Auth redirect error', err));

  // Attach UI listeners
  attachAuthFormListeners();
  initPhoneLoginHandlers();
  initHostRideForm();
  initMyRidesTabs();
  initDescriptionCounter();

  // Profile and theme buttons
  document.getElementById('saveProfile')?.addEventListener('click', saveProfileData);
  document.getElementById('saveTheme')?.addEventListener('click', saveThemeSettings);
  document.getElementById('themeSelect')?.addEventListener('change', (e) => {
    const sel = e.target.value;
    updateThemePreview(THEME_COLORS[sel] || THEME_COLORS.mint);
  });

  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Monitor Firebase auth state
  onAuthChange(async (user) => {
    if (user) {
      const uid = user.uid;
      const userName = user.displayName || user.email || 'User';
      // Persist minimal local copy for quick UI updates
      const currentUser = { id: uid, name: userName, email: user.email || '' };
      saveData('currentUser', currentUser);
      try { localStorage.setItem('uid', uid); } catch (e) { /* ignore */ }

      document.getElementById('user-name-home') && (document.getElementById('user-name-home').textContent = userName);
      document.getElementById('auth-section')?.classList.add('hidden');
      document.getElementById('app-container')?.classList.remove('hidden');

      initNavigation();

      // Start real-time discover listener
      startDiscoverListener();
    } else {
      // Signed out: stop listeners, clear local user
      stopAllListeners();
      stopDiscoverListener();
      stopHostedListener();
      stopJoinedListener();
      stopCommunityListener();

      localStorage.removeItem('currentUser');
      localStorage.removeItem('lastSection');
      try { localStorage.removeItem('uid'); } catch (e) { /* ignore */ }

      document.getElementById('app-container')?.classList.add('hidden');
      document.getElementById('auth-section')?.classList.remove('hidden');
    }
  });
}

// DOM ready bootstrap
function initializeApp() {
  initApp();
  // Restore lastSection or default navigation
  initNavigation();
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
