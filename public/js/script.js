// ============================================
// REVMATE - JAVASCRIPT (PHASES 1-5)
// ============================================

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
    joinRide as firebaseJoinRide,
    leaveRide,
    deleteRide as firebaseDeleteRide,
    getCommunityMembers,
    followMember as firebaseFollowMember,
    unfollowMember,
    updateUserProfile
} from './firebase-db.js';

import {
    initializeDiscoverRides,
    refreshDiscoverRides
} from './discover-rides.js';

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

function applySavedTheme() {
    const themeSettings = getData('themeSettings');
    
    if (themeSettings) {
        // Apply accent color
        if (themeSettings.accent) {
            document.documentElement.style.setProperty('--accent', themeSettings.accent);
        }
        
        // Apply dark mode
        if (themeSettings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
}

function saveThemeSettings() {
    const accent = document.getElementById('themeSelect').value;
    const darkMode = document.getElementById('darkModeToggle').checked;
    
    const themeSettings = {
        accent: accent,
        darkMode: darkMode
    };
    
    saveData('themeSettings', themeSettings);
    
    // Apply immediately
    document.documentElement.style.setProperty('--accent', accent);
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    showRideAlert('Theme saved successfully!');
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
        document.getElementById('themeSelect').value = themeSettings.accent || '#A8DADC';
        document.getElementById('darkModeToggle').checked = themeSettings.darkMode || false;
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
// DISCOVER RIDES (Firestore Integration)
// ============================================

async function loadDiscoverRides() {
    await initializeDiscoverRides();
}

// ============================================
// HOST RIDE
// ============================================

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
// MY RIDES
// ============================================

let currentRideTab = 'hosted';

function renderMyRides(type = 'hosted') {
    const container = document.getElementById('myRidesContainer');
    if (!container) return;
    
    currentRideTab = type;
    const rides = getRides();
    const currentUser = getData('currentUser');
    
    if (!currentUser) {
        container.innerHTML = '<div class="empty-rides"><p>Please login to view your rides</p></div>';
        return;
    }
    
    let filteredRides = [];
    
    if (type === 'hosted') {
        filteredRides = rides.filter(r => r.hostId === currentUser.id);
    } else {
        filteredRides = rides.filter(r => r.joinedUsers.includes(currentUser.id));
    }
    
    if (filteredRides.length === 0) {
        const emptyMessage = type === 'hosted' 
            ? 'You\'haven\'t hosted any rides yet. Create one from the Host section!'
            : 'You\'haven\'t joined any rides yet. Explore the Discover section!';
        
        container.innerHTML = `
            <div class="empty-rides">
                <i class="bi bi-${type === 'hosted' ? 'flag' : 'calendar-x'}"></i>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    filteredRides.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = filteredRides.map(ride => {
        const badge = type === 'hosted' 
            ? '<span class="ride-type-badge"><i class="bi bi-flag-fill"></i> Hosted</span>'
            : '<span class="ride-type-badge" style="background: linear-gradient(135deg, var(--success), var(--primary));"><i class="bi bi-check-circle-fill"></i> Joined</span>';
        
        const deleteBtn = type === 'hosted'
            ? `<button class="btn-delete" data-ride-id="${ride.id}">
                <i class="bi bi-trash"></i> Delete
               </button>`
            : '';
        
        return `
            <div class="my-ride-card">
                ${badge}
                <h3 class="my-ride-card-title">${ride.title}</h3>
                
                <div class="my-ride-card-details">
                    <div class="my-ride-detail">
                        <i class="bi bi-geo-alt-fill"></i>
                        <span>${ride.start} → ${ride.dest}</span>
                    </div>
                    <div class="my-ride-detail">
                        <i class="bi bi-calendar-event"></i>
                        <span>${formatDate(ride.date)}</span>
                    </div>
                    ${type === 'joined' ? `
                        <div class="my-ride-detail">
                            <i class="bi bi-person-circle"></i>
                            <span>Host: ${ride.host}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="my-ride-card-footer">
                    <div class="ride-status">
                        <i class="bi bi-people-fill"></i>
                        ${ride.joinedUsers.length} rider${ride.joinedUsers.length !== 1 ? 's' : ''} joined
                    </div>
                    ${deleteBtn}
                </div>
            </div>
        `;
    }).join('');
    
    if (type === 'hosted') {
        const deleteButtons = container.querySelectorAll('.btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const rideId = parseInt(button.getAttribute('data-ride-id'));
                deleteRide(rideId);
            });
        });
    }
}

function deleteRide(rideId) {
    const currentUser = getData('currentUser');
    if (!currentUser) return;
    
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId && r.hostId === currentUser.id);
    
    if (rideIndex === -1) {
        showRideAlert('Cannot delete this ride');
        return;
    }
    
    const deletedRide = rides.splice(rideIndex, 1)[0];
    saveRides(rides);
    renderMyRides('hosted');
    showRideAlert(`"${deletedRide.title}" deleted successfully`);
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
// GOOGLE LOGIN
// ============================================

const googleLoginBtn = document.getElementById('login-google');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await loginWithGoogle();
        
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
// APPLE LOGIN
// ============================================

const appleLoginBtn = document.getElementById('login-apple');
if (appleLoginBtn) {
    appleLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await loginWithApple();
        
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
// GOOGLE SIGNUP
// ============================================

const googleSignupBtn = document.getElementById('signup-google');
if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await loginWithGoogle();
        
        if (result.success) {
            showAlert('Account created successfully!', 'success');
            setTimeout(() => {
                redirectToApp();
            }, 800);
        } else {
            showAlert(result.error, 'danger');
        }
    });
}

// ============================================
// APPLE SIGNUP
// ============================================

const appleSignupBtn = document.getElementById('signup-apple');
if (appleSignupBtn) {
    appleSignupBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await loginWithApple();
        
        if (result.success) {
            showAlert('Account created successfully!', 'success');
            setTimeout(() => {
                redirectToApp();
            }, 800);
        } else {
            showAlert(result.error, 'danger');
        }
    });
}

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
    
    if (sectionId === 'discover') {
        refreshDiscoverRides();
    } else if (sectionId === 'myrides') {
        renderMyRides(currentRideTab);
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
    processAuthRedirect().catch(err => {
        console.error('Error processing auth redirect:', err);
    });
    
    // Initialize Profile section event listeners
    const saveProfileBtn = document.getElementById('saveProfile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileData);
    }
    
    const saveThemeBtn = document.getElementById('saveTheme');
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', saveThemeSettings);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
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
            try { localStorage.setItem('uid', userId); } catch (e) {}
            
            // Show app and hide auth
            const userNameHome = document.getElementById('user-name-home');
            if (userNameHome) {
                userNameHome.textContent = userName;
            }
            
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            initNavigation();
            
            // Initialize Discover Rides from Firestore (real-time)
            try {
                // start real-time updates
                const dr = await import('./discover-rides.js');
                if (dr && typeof dr.startDiscoverListener === 'function') {
                    dr.startDiscoverListener();
                } else if (dr && typeof dr.initializeDiscoverRides === 'function') {
                    await dr.initializeDiscoverRides();
                }
            } catch (e) {
                console.error('Failed to initialize Discover rides listener:', e);
            }
        } else {
            // User is logged out
            localStorage.removeItem('currentUser');
            localStorage.removeItem('lastSection');
            try { localStorage.removeItem('uid'); } catch (e) {}
            
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
window.addEventListener('load', applySavedTheme);

// Run initialization
initApp();

// ============================================
// END OF SCRIPT
// ============================================
