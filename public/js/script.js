// ============================================
// REVMATE - JAVASCRIPT (PHASES 1-5)
// ============================================

// Import PWA install functionality
import { initInstallPrompt, triggerInstall, updateProfileInstallButton } from './pwa-install.js';

// Import hybrid Google Sign-In (popup + redirect fallback)
import { googleLogin, handleAuthRedirect } from './auth-google.js';

import {
    registerUser,
    loginUser,
    logoutUser,
    onAuthChange,
    getCurrentUserId,
    loginWithGoogle,
    loginWithApple,
    setupRecaptcha,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    processAuthRedirect
} from './firebase-auth.js';

import {
    createRide,
    getAllRides,
    getHostedRides,
    getJoinedRides,
    getCommunityMembers,
    followMember as firebaseFollowMember,
    unfollowMember,
    updateUserProfile
} from './firebase-db.js';

// NEW: Import the consolidated rides module with real-time listeners
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
    showRideNotification,
    stopAllListeners
} from './rides.js';
import { renderDiscoverRides } from './rides.js';
import { haversineDistanceKm } from './utils/distance.js';

// Host ride module (wires host button + load/refresh)
import './host-ride.js';

let isLoginMode = true;
let confirmationResult = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getData(key) {
    const data = localStorage.getItem(key);
    if (!data) return key === 'users' ? [] : null;
    return JSON.parse(data);
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function showRideAlert(message) {
    const existingAlert = document.querySelector('.ride-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'ride-alert';
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 2500);
}

// ============================================
// THEME MANAGEMENT (PHASE 5)
// ============================================

// Theme color palette system
const THEME_COLORS = {
    // Pastel Themes
    mint: {
        name: '🌿 Mint Dream',
        category: 'Pastel',
        primary: '#A8DADC',
        secondary: '#F8E8E8',
        accent: '#CDB4DB'
    },
    blush: {
        name: '🌸 Blush Rose',
        category: 'Pastel',
        primary: '#FEC8D8',
        secondary: '#E8D5E8',
        accent: '#FF6B9D'
    },
    lavender: {
        name: '💜 Lavender',
        category: 'Pastel',
        primary: '#CDB4DB',
        secondary: '#E8D5F8',
        accent: '#9B7EBD'
    },
    seafoam: {
        name: '🌊 Seafoam',
        category: 'Pastel',
        primary: '#B8E0D2',
        secondary: '#D8F0E8',
        accent: '#76C9A1'
    },
    peach: {
        name: '🍑 Peach',
        category: 'Pastel',
        primary: '#FFCDB2',
        secondary: '#FFE5D9',
        accent: '#FF9D71'
    },
    // Vibrant Themes
    ocean: {
        name: '🌀 Ocean Blue',
        category: 'Vibrant',
        primary: '#0E7C86',
        secondary: '#8DD3C7',
        accent: '#006D7D'
    },
    sunset: {
        name: '🌅 Sunset Orange',
        category: 'Vibrant',
        primary: '#FF6B35',
        secondary: '#F5B461',
        accent: '#D62828'
    },
    forest: {
        name: '🌲 Forest Green',
        category: 'Vibrant',
        primary: '#2D6A4F',
        secondary: '#52B788',
        accent: '#1B4332'
    },
    coral: {
        name: '🪸 Coral Pink',
        category: 'Vibrant',
        primary: '#FF6B6B',
        secondary: '#FFD66B',
        accent: '#FF5252'
    },
    violet: {
        name: '✨ Deep Violet',
        category: 'Vibrant',
        primary: '#8B5A8E',
        secondary: '#DDB4DB',
        accent: '#6A4C70'
    },
    // Modern Themes
    teal: {
        name: 'Teal Modern',
        category: 'Modern',
        primary: '#20B2AA',
        secondary: '#48D1CC',
        accent: '#008B8B'
    },
    rose: {
        name: 'Rose Gold',
        category: 'Modern',
        primary: '#B76E79',
        secondary: '#FDBCB4',
        accent: '#9D4E6C'
    },
    amber: {
        name: 'Amber',
        category: 'Modern',
        primary: '#FFA500',
        secondary: '#FFD700',
        accent: '#FF8C00'
    },
    cyan: {
        name: 'Cyan',
        category: 'Modern',
        primary: '#00CED1',
        secondary: '#E0FFFF',
        accent: '#00BFFF'
    }
};

function applyTheme(themeName) {
    const theme = THEME_COLORS[themeName] || THEME_COLORS.mint;

    // Apply theme class to root
    document.documentElement.classList.remove(
        ...Object.keys(THEME_COLORS).map(t => `theme-${t}`)
    );
    document.documentElement.classList.add(`theme-${themeName}`);

    // Apply CSS variables for immediate effect
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--accent', theme.accent);

    // Update preview
    updateThemePreview(theme);
}

function updateThemePreview(theme) {
    const preview = document.getElementById('themePreview');
    if (preview) {
        preview.style.setProperty('--primary', theme.primary);
        preview.style.setProperty('--accent', theme.accent);
    }
}

function applySavedTheme() {
    const themeSettings = getData('themeSettings');

    if (themeSettings && themeSettings.theme) {
        // Apply selected theme
        applyTheme(themeSettings.theme);
    } else {
        // Apply default theme
        applyTheme('mint');
    }

    // Apply dark mode
    if (themeSettings && themeSettings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function saveThemeSettings() {
    const themeName = document.getElementById('themeSelect').value;
    const darkMode = document.getElementById('darkModeToggle').checked;

    const themeSettings = {
        theme: themeName,
        darkMode: darkMode
    };

    saveData('themeSettings', themeSettings);

    // Apply immediately
    applyTheme(themeName);

    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    showRideAlert('✨ Theme saved successfully!');
}

function loadProfileData() {
    const currentUser = getData('currentUser');

    if (currentUser) {
        document.getElementById('profileName').value = currentUser.name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
    }

    // Load theme settings
    const themeSettings = getData('themeSettings');
    if (themeSettings) {
        document.getElementById('themeSelect').value = themeSettings.theme || 'mint';
        document.getElementById('darkModeToggle').checked = themeSettings.darkMode || false;
        // Update preview
        const selectedTheme = THEME_COLORS[themeSettings.theme] || THEME_COLORS.mint;
        updateThemePreview(selectedTheme);
    } else {
        // Set default preview
        updateThemePreview(THEME_COLORS.mint);
    }
}

function saveProfileData() {
    const currentUser = getData('currentUser');

    if (!currentUser) return;

    const newName = document.getElementById('profileName').value.trim();

    if (!newName) {
        showRideAlert('Please enter a valid name');
        return;
    }

    // Update current user
    currentUser.name = newName;
    saveData('currentUser', currentUser);

    // Update in users array
    const users = getData('users');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        saveData('users', users);
    }

    // Update name display in home
    const userNameHome = document.getElementById('user-name-home');
    if (userNameHome) {
        userNameHome.textContent = newName;
    }

    showRideAlert('Profile updated successfully!');
}

// ============================================
// RIDES DATA MANAGEMENT
// ============================================

const defaultRides = [
    {
        id: 1,
        title: "Sunday Coastal Cruise",
        desc: "Easy scenic ride by the sea. Perfect for beginners and experienced riders alike.",
        start: "Bandra Fort, Mumbai",
        dest: "Alibaug Beach",
        date: "2025-11-15T07:00",
        host: "Admin",
        hostId: 0,
        joinedUsers: []
    },
    {
        id: 2,
        title: "Mountain Rush",
        desc: "Twisties and tea stops through the hills. Bring your A-game!",
        start: "Pune Camp",
        dest: "Lavasa Lake City",
        date: "2025-11-17T06:30",
        host: "Admin",
        hostId: 0,
        joinedUsers: []
    },
    {
        id: 3,
        title: "Weekend Highway Blast",
        desc: "High-speed highway cruise with breakfast stop at famous dhaba.",
        start: "Vashi, Navi Mumbai",
        dest: "Lonavala",
        date: "2025-11-16T05:30",
        host: "Admin",
        hostId: 0,
        joinedUsers: []
    }
];

function getRides() {
    let rides = getData('rides');

    if (!rides || rides.length === 0) {
        rides = defaultRides;
        saveRides(rides);
    }

    return rides;
}

function saveRides(rides) {
    saveData('rides', rides);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-IN', options);
}

// ============================================
// DISCOVER RIDES (Real-time Firestore Integration)
// ============================================

async function loadDiscoverRides() {
    // Start real-time listener for public rides with radius filtering
    let userLocation = null;
    const radiusSelect = document.getElementById('radiusSelect');
    let cachedRides = [];

    const tryGetLocation = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition((pos) => {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, () => resolve(null), { maximumAge: 60000, timeout: 5000 });
    });

    userLocation = await tryGetLocation();

    function filterAndRender(rides) {
        if (!userLocation) {
            renderDiscoverRides(rides);
            return;
        }

        const radiusKm = Number(radiusSelect?.value || 25);
        const filtered = rides.filter(r => {
            const sl = r.startLocation || {};
            const lat = sl.lat ?? sl.latitude ?? null;
            const lng = sl.lng ?? sl.longitude ?? null;
            if (lat == null || lng == null) return false;
            const d = haversineDistanceKm(userLocation.lat, userLocation.lng, Number(lat), Number(lng));
            return d <= radiusKm;
        });

        renderDiscoverRides(filtered);
    }

    // Re-run filter when radius changes
    if (radiusSelect) {
        radiusSelect.addEventListener('change', () => { filterAndRender(cachedRides); });
    }

    // Start listener with callback to receive all rides and then filter
    startDiscoverListener((rides) => {
        cachedRides = rides;
        filterAndRender(rides);
    });
}

/**
 * Refresh discover rides when returning to tab
 */
async function refreshDiscoverRides() {
    // Already listening in real-time, no need to refresh
    console.log('ℹ️ Discover rides are syncing in real-time');
}

function initHostRideForm() {
    const hostForm = document.getElementById('hostRideForm');

    if (!hostForm) return;

    hostForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const currentUser = getData('currentUser');

        if (!currentUser) {
            showRideAlert('Please login to host rides');
            return;
        }

        const title = document.getElementById('rideTitle').value.trim();
        const desc = document.getElementById('rideDesc').value.trim();
        const start = document.getElementById('rideStart').value.trim();
        const dest = document.getElementById('rideDest').value.trim();
        const date = document.getElementById('rideDate').value;

        if (!title || !desc || !start || !dest || !date) {
            showRideAlert('Please fill in all fields');
            return;
        }

        const newRide = {
            id: Date.now(),
            title: title,
            desc: desc,
            start: start,
            dest: dest,
            date: date,
            host: currentUser.name,
            hostId: currentUser.id,
            joinedUsers: []
        };

        const rides = getRides();
        rides.push(newRide);
        saveRides(rides);

        hostForm.reset();
        showRideAlert('Ride created successfully!');

        setTimeout(() => {
            showSection('discover');
        }, 1000);
    });
}

// ============================================
// MY RIDES - Real-Time Sync (Hosted & Joined)
// ============================================

let currentRideTab = 'hosted';

function renderMyRides(type = 'hosted') {
    /**
     * Real-time listeners in rides.js will automatically handle rendering
     * This function is now just to switch between tabs
     */
    currentRideTab = type;

    // Stop old listener
    if (type === 'hosted') {
        stopJoinedListener();
        // Start hosted listener (will auto-render)
        startHostedListener();
    } else {
        stopHostedListener();
        // Start joined listener (will auto-render)
        startJoinedListener();
    }
}

/**
 * Delete ride (handled by rides.js module)
 */
async function deleteRideHandler(rideId) {
    const confirmed = confirm('Are you sure you want to delete this ride?');
    if (confirmed) {
        await deleteRide(rideId);
    }
}

/**
 * Leave ride (handled by rides.js module)
 */
async function leaveRideHandler(rideId) {
    const confirmed = confirm('Are you sure you want to leave this ride?');
    if (confirmed) {
        await leaveRide(rideId);
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

// ============================================
// COMMUNITY
// ============================================

const defaultCommunity = [
    { id: 1001, name: "Aarav Sharma", bike: "Royal Enfield Classic 350", city: "Pune, Maharashtra" },
    { id: 1002, name: "Karan Mehta", bike: "KTM Duke 200", city: "Mumbai, Maharashtra" },
    { id: 1003, name: "Priya Singh", bike: "Yamaha MT-15", city: "Delhi" },
    { id: 1004, name: "Simran Kaur", bike: "BMW G310R", city: "Bangalore, Karnataka" },
    { id: 1005, name: "Rohan Desai", bike: "Bajaj Dominar 400", city: "Ahmedabad, Gujarat" },
    { id: 1006, name: "Ananya Iyer", bike: "Honda CB350", city: "Chennai, Tamil Nadu" },
    { id: 1007, name: "Vikram Reddy", bike: "Triumph Street Triple", city: "Hyderabad, Telangana" },
    { id: 1008, name: "Neha Patel", bike: "Kawasaki Ninja 300", city: "Surat, Gujarat" }
];

function getCommunity() {
    let community = getData('community');

    if (!community || community.length === 0) {
        community = defaultCommunity;
        saveCommunity(community);
    }

    return community;
}

function saveCommunity(community) {
    saveData('community', community);
}

function getAvatarColor(name) {
    const colors = [
        'linear-gradient(135deg, #A8DADC, #89C5C8)',
        'linear-gradient(135deg, #FEC8D8, #FDB0C5)',
        'linear-gradient(135deg, #CDB4DB, #B89DC9)',
        'linear-gradient(135deg, #B8E0D2, #9DD4C3)',
        'linear-gradient(135deg, #FFD6A5, #FFC785)',
        'linear-gradient(135deg, #CAFFBF, #B3F0A8)'
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

function renderCommunity() {
    const container = document.getElementById('communityList');
    const emptyState = document.getElementById('community-empty-state');

    if (!container) return;

    const community = getCommunity();
    const currentUser = getData('currentUser');

    if (!currentUser) {
        container.innerHTML = '<div class="empty-rides"><p>Please login to view community</p></div>';
        return;
    }

    if (!currentUser.following) {
        currentUser.following = [];
        saveData('currentUser', currentUser);
    }

    if (community.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = community.map(member => {
        const isFollowing = currentUser.following.includes(member.id);
        const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2);

        return `
            <div class="community-card">
                <div class="community-avatar" style="background: ${getAvatarColor(member.name)}">
                    ${initials}
                </div>
                
                <div class="community-info">
                    <h3 class="community-name">${member.name}</h3>
                    <p class="community-bike">
                        <i class="bi bi-bicycle"></i>
                        ${member.bike}
                    </p>
                    <p class="community-city">
                        <i class="bi bi-geo-alt"></i>
                        ${member.city}
                    </p>
                </div>
                
                <button class="btn-follow" data-member-id="${member.id}" ${isFollowing ? 'disabled' : ''}>
                    ${isFollowing ? '<i class="bi bi-check-circle-fill"></i> Following' : '<i class="bi bi-plus-circle"></i> Follow'}
                </button>
            </div>
        `;
    }).join('');

    const followButtons = container.querySelectorAll('.btn-follow:not([disabled])');
    followButtons.forEach(button => {
        button.addEventListener('click', () => {
            const memberId = parseInt(button.getAttribute('data-member-id'));
            followMember(memberId);
        });
    });
}

function followMember(memberId) {
    const currentUser = getData('currentUser');

    if (!currentUser) {
        showRideAlert('Please login to follow riders');
        return;
    }

    const community = getCommunity();
    const member = community.find(m => m.id === memberId);

    if (!member) {
        showRideAlert('Member not found');
        return;
    }

    if (!currentUser.following) {
        currentUser.following = [];
    }

    if (currentUser.following.includes(memberId)) {
        showRideAlert('Already following this rider');
        return;
    }

    currentUser.following.push(memberId);
    saveData('currentUser', currentUser);
    renderCommunity();
    showRideAlert(`Now following ${member.name}!`);
}

// ============================================
// AUTH MODE SWITCHING
// ============================================

function toggleAuthMode() {
    isLoginMode = !isLoginMode;

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const switchText = document.getElementById('switch-text');
    const loginSocialDiv = document.querySelector('.social-divider');
    const loginSocialButtons = document.querySelector('.social-login-buttons');
    const signupSocialDiv = document.getElementById('signup-social-divider');
    const signupSocialButtons = document.getElementById('signup-social-buttons');

    if (isLoginMode) {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        switchText.innerHTML = 'Don\'t have an account? <a id="switch-link">Sign Up</a>';

        // Show login social options
        loginSocialDiv.classList.remove('hidden');
        loginSocialButtons.classList.remove('hidden');

        // Hide signup social options
        signupSocialDiv.classList.add('hidden');
        signupSocialButtons.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        switchText.innerHTML = 'Already have an account? <a id="switch-link">Login</a>';

        // Hide login social options
        loginSocialDiv.classList.add('hidden');
        loginSocialButtons.classList.add('hidden');

        // Show signup social options
        signupSocialDiv.classList.remove('hidden');
        signupSocialButtons.classList.remove('hidden');
    }

    document.getElementById('switch-link').addEventListener('click', toggleAuthMode);
    document.getElementById('alert-container').innerHTML = '';
}

// ============================================
// SIGNUP LOGIC
// ============================================

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!name || !email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }

    const result = await registerUser(email, password, name);

    if (result.success) {
        showAlert('Account created successfully!', 'success');

        setTimeout(() => {
            redirectToApp();
        }, 1000);
    } else {
        showAlert(result.error, 'danger');
    }
});

// ============================================
// LOGIN LOGIC
// ============================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }

    const result = await loginUser(email, password);

    if (result.success) {
        showAlert('Login successful!', 'success');

        setTimeout(() => {
            redirectToApp();
        }, 800);
    } else {
        showAlert(result.error, 'danger');
    }
});

// ============================================
// SOCIAL LOGIN & SIGNUP BUTTONS (Event Delegation)
// ============================================

document.addEventListener('click', async (e) => {
    // Google login button - use hybrid popup/redirect flow
    if (e.target.closest('#login-google') || e.target.id === 'login-google' || e.target.closest('button[id="login-google"]')) {
        console.log('🔐 Google Login clicked');
        e.preventDefault();
        e.stopPropagation();

        const btn = e.target.closest('button[id="login-google"]') || document.getElementById('login-google');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-google"></i> Signing in...';
        }

        try {
            const result = await googleLogin();
            console.log('Google login result:', result);

            if (result.success) {
                showAlert('Login successful!', 'success');
                setTimeout(() => {
                    redirectToApp();
                }, 800);
            } else if (result.redirecting) {
                // Redirect flow initiated - will return to app
                showAlert('Redirecting to sign-in...', 'info');
            } else {
                showAlert(result.error || 'Sign-in failed', 'danger');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-google"></i> Google';
                }
            }
        } catch (err) {
            console.error('Google login error:', err);
            showAlert('Error: ' + err.message, 'danger');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-google"></i> Google';
            }
        }
        return;
    }

    // Google signup button - use hybrid popup/redirect flow
    if (e.target.closest('#signup-google') || e.target.id === 'signup-google' || e.target.closest('button[id="signup-google"]')) {
        console.log('🔐 Google Signup clicked');
        e.preventDefault();
        e.stopPropagation();

        const btn = e.target.closest('button[id="signup-google"]') || document.getElementById('signup-google');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-google"></i> Signing up...';
        }

        try {
            const result = await googleLogin();
            console.log('Google signup result:', result);

            if (result.success) {
                showAlert('Account created successfully!', 'success');
                setTimeout(() => {
                    redirectToApp();
                }, 800);
            } else if (result.redirecting) {
                // Redirect flow initiated - will return to app
                showAlert('Redirecting to sign-up...', 'info');
            } else {
                showAlert(result.error || 'Sign-up failed', 'danger');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-google"></i> Google';
                }
            }
        } catch (err) {
            console.error('Google signup error:', err);
            showAlert('Error: ' + err.message, 'danger');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-google"></i> Google';
            }
        }
        return;
    }

    // Apple login button
    if (e.target.closest('#login-apple') || e.target.id === 'login-apple' || e.target.closest('button[id="login-apple"]')) {
        console.log('🔐 Apple Login clicked');
        e.preventDefault();
        e.stopPropagation();

        try {
            const result = await loginWithApple();
            console.log('Apple login result:', result);

            if (result.success) {
                showAlert('Login successful!', 'success');
                setTimeout(() => {
                    redirectToApp();
                }, 800);
            } else {
                showAlert(result.error, 'danger');
            }
        } catch (err) {
            console.error('Apple login error:', err);
            showAlert('Error: ' + err.message, 'danger');
        }
        return;
    }

    // Apple signup button
    if (e.target.closest('#signup-apple') || e.target.id === 'signup-apple' || e.target.closest('button[id="signup-apple"]')) {
        console.log('🔐 Apple Signup clicked');
        e.preventDefault();
        e.stopPropagation();

        try {
            const result = await loginWithApple();
            console.log('Apple signup result:', result);

            if (result.success) {
                showAlert('Account created successfully!', 'success');
                setTimeout(() => {
                    redirectToApp();
                }, 800);
            } else {
                showAlert(result.error, 'danger');
            }
        } catch (err) {
            console.error('Apple signup error:', err);
            showAlert('Error: ' + err.message, 'danger');
        }
        return;
    }
});

// ============================================
// PHONE LOGIN - TOGGLE FORMS
// ============================================

const togglePhoneLoginBtn = document.getElementById('toggle-phone-login');
const togglePhoneBackBtn = document.getElementById('toggle-phone-back');
const phoneLoginForm = document.getElementById('phone-login-form');
const phoneVerifyForm = document.getElementById('phone-verify-form');

if (togglePhoneLoginBtn) {
    togglePhoneLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (phoneLoginForm) {
            phoneLoginForm.classList.remove('hidden');
            togglePhoneLoginBtn.parentElement.classList.add('hidden');
        }
    });
}

if (togglePhoneBackBtn) {
    togglePhoneBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (phoneLoginForm) {
            phoneLoginForm.classList.add('hidden');
            togglePhoneLoginBtn.parentElement.classList.remove('hidden');
            phoneVerifyForm.classList.add('hidden');
        }
    });
}

// ============================================
// PHONE LOGIN - SEND CODE
// ============================================

if (phoneLoginForm) {
    phoneLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const phoneNumber = document.getElementById('phone-number').value.trim();

        if (!phoneNumber) {
            showAlert('Please enter a phone number', 'danger');
            return;
        }

        try {
            // Setup reCAPTCHA
            const appVerifier = setupRecaptcha('recaptcha-container');

            if (!appVerifier) {
                showAlert('reCAPTCHA setup failed', 'danger');
                return;
            }

            // Send verification code
            const result = await sendPhoneVerificationCode(phoneNumber, appVerifier);

            if (result.success) {
                confirmationResult = result.confirmationResult;
                phoneLoginForm.classList.add('hidden');
                phoneVerifyForm.classList.remove('hidden');
                showAlert('Verification code sent!', 'success');
            } else {
                showAlert(result.error, 'danger');
            }
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

// ============================================
// PHONE LOGIN - VERIFY CODE
// ============================================

if (phoneVerifyForm) {
    phoneVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const verificationCode = document.getElementById('verification-code').value.trim();
        const phoneName = document.getElementById('phone-name').value.trim() || 'Phone User';

        if (!verificationCode) {
            showAlert('Please enter the verification code', 'danger');
            return;
        }

        if (!confirmationResult) {
            showAlert('Please request a verification code first', 'danger');
            return;
        }

        const result = await verifyPhoneCode(confirmationResult, verificationCode, phoneName);

        if (result.success) {
            showAlert('Login successful!', 'success');

            setTimeout(() => {
                redirectToApp();
            }, 800);
        } else {
            showAlert(result.error, 'danger');
        }
    });
}

// ============================================
// REDIRECT TO APP
// ============================================

function redirectToApp() {
    const currentUser = getData('currentUser');

    if (currentUser && currentUser.name) {
        const userNameHome = document.getElementById('user-name-home');
        if (userNameHome) {
            userNameHome.textContent = currentUser.name;
        }

        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        initNavigation();
    }
}

// ============================================
// NAVIGATION SYSTEM
// ============================================

function showSection(sectionId) {
    // Update install button visibility when profile section is shown
    if (sectionId === 'profile') {
        console.log('[PWA] Profile section opened - updating install button');
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            updateProfileInstallButton();
        }, 100);
    }
    const allSections = document.querySelectorAll('.app-section');
    allSections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    saveData('lastSection', sectionId);

    // Handle section-specific initialization
    if (sectionId === 'discover') {
        console.log('📍 Loading Discover Rides...');
        loadDiscoverRides();
    } else if (sectionId === 'myrides') {
        console.log('📍 Loading My Rides...');
        // Start listeners for my rides tabs
        if (currentRideTab === 'hosted') {
            startHostedListener();
        } else {
            startJoinedListener();
        }
    } else if (sectionId === 'community') {
        renderCommunity();
    } else if (sectionId === 'profile') {
        loadProfileData();
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', () => {
            const sectionId = card.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    initHostRideForm();
    initMyRidesTabs();

    const lastSection = getData('lastSection');
    if (lastSection) {
        showSection(lastSection);
    } else {
        showSection('home');
    }
}

// ============================================
// LOGOUT LOGIC (PHASE 5)
// ============================================

async function handleLogout() {
    // Stop all real-time listeners before logging out
    stopAllListeners();

    const result = await logoutUser();

    if (result.success) {
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();

        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');

        if (!isLoginMode) {
            toggleAuthMode();
        }

        showAlert('Logged out successfully', 'success');
    } else {
        showAlert(result.error, 'danger');
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    // Apply saved theme on load
    applySavedTheme();

    // Process OAuth redirect result (WebView Google Sign-In)
    handleAuthRedirect().then(result => {
        if (result && result.success && result.user) {
            console.log('✅ Redirect auth completed:', result.user.email);
            showAlert('Welcome back!', 'success');
            setTimeout(() => {
                redirectToApp();
            }, 800);
        }
    }).catch(err => {
        console.error('Error processing auth redirect:', err);
    });

    // Initialize Profile section event listeners
    const saveProfileBtn = document.getElementById('saveProfile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileData);
    }

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        // Show preview when theme is selected
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = THEME_COLORS[e.target.value] || THEME_COLORS.mint;
            updateThemePreview(selectedTheme);
        });
    }

    const saveThemeBtn = document.getElementById('saveTheme');
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', saveThemeSettings);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Initialize Install App button in profile section
    const installAppBtn = document.getElementById('installAppBtn');
    if (installAppBtn) {
        console.log('[PWA] Install button found, attaching click handler');

        installAppBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('[PWA] ✅ Install button clicked!');

            // Add visual feedback
            installAppBtn.disabled = true;
            installAppBtn.style.opacity = '0.7';
            const originalText = installAppBtn.innerHTML;
            installAppBtn.innerHTML = '<span>Processing...</span>';

            try {
                const success = await triggerInstall();

                if (success) {
                    console.log('[PWA] ✅ Install successful');
                } else {
                    console.log('[PWA] ⚠️ Install cancelled or not available');
                }
            } catch (error) {
                console.error('[PWA] ❌ Error in install handler:', error);
                alert('Error: ' + error.message);
            } finally {
                // Restore button state
                installAppBtn.disabled = false;
                installAppBtn.style.opacity = '1';
                installAppBtn.innerHTML = originalText;

                // Update button visibility
                updateProfileInstallButton();
            }
        });

        // Also try attaching via onclick as backup
        installAppBtn.onclick = async function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[PWA] Install button clicked (onclick handler)');
            await triggerInstall();
        };

        console.log('[PWA] Install button handlers attached');

        // Update install button visibility initially
        updateProfileInstallButton();
    } else {
        console.error('[PWA] ❌ Install button not found!');
    }

    // Monitor Firebase authentication state
    onAuthChange(async (user) => {
        if (user) {
            // User is logged in
            const userId = user.uid;
            const userName = user.displayName || user.email || 'User';

            // Store current user in localStorage for quick access
            const currentUser = {
                id: userId,
                name: userName,
                email: user.email,
                following: []
            };
            saveData('currentUser', currentUser);
            // Also keep a convenient uid key used by host/join fallbacks
            try { localStorage.setItem('uid', userId); } catch (e) { }

            // Show app and hide auth
            const userNameHome = document.getElementById('user-name-home');
            if (userNameHome) {
                userNameHome.textContent = userName;
            }

            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');

            initNavigation();

            // Initialize real-time listeners for Discover Rides
            console.log('🔔 Starting real-time Discover Rides listener...');
            startDiscoverListener();
        } else {
            // User is logged out
            console.log('🔔 Stopping all real-time listeners...');
            stopAllListeners();

            localStorage.removeItem('currentUser');
            localStorage.removeItem('lastSection');
            try { localStorage.removeItem('uid'); } catch (e) { }

            document.getElementById('app-container').classList.add('hidden');
            document.getElementById('auth-section').classList.remove('hidden');
        }
    });
}

// Initialize switch link
const switchLink = document.getElementById('switch-link');
if (switchLink) {
    switchLink.addEventListener('click', toggleAuthMode);
}

// Apply theme on load
window.addEventListener('load', () => {
    applySavedTheme();
    // Initialize PWA install prompt
    initInstallPrompt();
});

// Run initialization
initApp();

// ============================================
// END OF SCRIPT
// ============================================
