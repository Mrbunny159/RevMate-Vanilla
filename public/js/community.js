// ============================================
// COMMUNITY DISCOVERY MODULE
// Real-time user fetching from Firestore
// ============================================

import { db } from './firebase-config.js';
import { getCurrentUserId } from './firebase-auth.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// ============================================
// STATE
// ============================================

let communityUnsubscribe = null;
let allUsers = [];
let filteredUsers = [];

// Current filters
let currentFilters = {
    city: 'all',
    bike: 'all',
    activity: 'all'
};

// ============================================
// REAL-TIME LISTENER
// ============================================

/**
 * Start real-time listener for all users
 * @param {function} callback - Called when users update
 */
export function startCommunityListener(callback) {
    if (communityUnsubscribe) {
        console.log('Community listener already active');
        return;
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));

        communityUnsubscribe = onSnapshot(q, (snapshot) => {
            allUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    id: doc.id,
                    username: data.username || 'unknown',
                    displayName: data.displayName || data.name || 'User',
                    email: data.email || '',
                    photoURL: data.photoURL || null,
                    bio: data.bio || '',
                    bike: data.bike || '',
                    city: data.city || '',
                    stats: data.stats || { ridesHosted: 0, ridesJoined: 0 },
                    createdAt: data.createdAt,
                    lastActive: data.lastActive || data.createdAt,
                    privacySettings: data.privacySettings || { profilePublic: true }
                };
            });

            console.log(`👥 Loaded ${allUsers.length} users from Firestore`);

            // Apply filters
            applyFilters();

            if (callback) {
                callback(filteredUsers);
            } else {
                renderCommunity(filteredUsers);
            }
        }, (error) => {
            console.error('❌ Community listener error:', error);
        });

        console.log('✅ Community listener started');
    } catch (error) {
        console.error('❌ Error starting community listener:', error);
    }
}

/**
 * Stop community listener
 */
export function stopCommunityListener() {
    if (communityUnsubscribe) {
        communityUnsubscribe();
        communityUnsubscribe = null;
        console.log('👥 Community listener stopped');
    }
}

// ============================================
// FILTERING
// ============================================

/**
 * Apply current filters to users
 */
function applyFilters() {
    filteredUsers = allUsers.filter(user => {
        if (currentFilters.city !== 'all' && user.city !== currentFilters.city) {
            return false;
        }
        if (currentFilters.bike !== 'all') {
            const bikeSearch = currentFilters.bike.toLowerCase();
            const userBike = user.bike.toLowerCase();
            if (!userBike.includes(bikeSearch)) {
                return false;
            }
        }
        if (currentFilters.activity !== 'all') {
            const now = new Date();
            const lastActive = user.lastActive?.toDate?.() || new Date(user.lastActive);
            const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
            switch (currentFilters.activity) {
                case 'week':
                    if (daysSinceActive > 7) return false;
                    break;
                case 'month':
                    if (daysSinceActive > 30) return false;
                    break;
            }
        }
        return true;
    });
    console.log(`🔍 Filtered: ${filteredUsers.length} / ${allUsers.length} users`);
}

/**
 * Update filters and re-render
 * @param {object} filters - New filter values
 */
export function updateFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    applyFilters();
    renderCommunity(filteredUsers);
}

/**
 * Get unique cities from all users
 * @returns {string[]} - Array of unique cities
 */
export function getUniqueCities() {
    const cities = allUsers
        .map(u => u.city)
        .filter(c => c && c.trim() !== '');
    return [...new Set(cities)].sort();
}

/**
 * Get unique bike brands/models
 * @returns {string[]} - Array of unique bikes
 */
export function getUniqueBikes() {
    const bikes = allUsers
        .map(u => u.bike)
        .filter(b => b && b.trim() !== '');
    return [...new Set(bikes)].sort();
}

// ============================================
// RENDERING
// ============================================

/**
 * Render community users
 * @param {array} users - Array of user objects
 */
export function renderCommunity(users = []) {
    const container = document.getElementById('community-list');
    if (!container) return;

    const currentUserId = getCurrentUserId();

    if (!users || users.length === 0) {
        // Empty state
        import('./utils/ux-helpers.js').then(({ renderEmptyState }) => {
            container.innerHTML = '';
            renderEmptyState(container, {
                icon: 'bi-people',
                title: 'No community members found',
                message: 'Adjust your filters or be the first to join!',
                variant: 'community'
            });
        });
        return;
    }

    container.innerHTML = users.map(user => {
        // Skip current user
        if (user.uid === currentUserId) {
            return '';
        }

        // Generate avatar
        const avatar = user.photoURL
            ? `<img src="${escapeHtml(user.photoURL)}" alt="${escapeHtml(user.displayName)}" class="community-avatar">`
            : `<div class="community-avatar-placeholder">${getInitials(user.displayName)}</div>`;

        // Truncate bio
        const bioText = user.bio ? truncate(user.bio, 100) : 'No bio yet';

        // Total rides
        const totalRides = (user.stats?.ridesHosted || 0) + (user.stats?.ridesJoined || 0);

        // Last active
        const lastActiveText = getLastActiveText(user.lastActive);

        return `
      <div class="community-card" data-user-id="${user.uid}">
        <div class="community-card-header">
          ${avatar}
          <div class="community-card-info">
            <h4 class="community-name">${escapeHtml(user.displayName)}</h4>
            <p class="community-username">@${escapeHtml(user.username)}</p>
          </div>
        </div>

        <div class="community-card-body">
          ${user.bio ? `<p class="community-bio">${escapeHtml(bioText)}</p>` : ''}
          
          <div class="community-details">
            ${user.bike ? `
              <div class="community-detail">
                <i class="bi bi-bicycle"></i>
                <span>${escapeHtml(user.bike)}</span>
              </div>
            ` : ''}
            
            ${user.city ? `
              <div class="community-detail">
                <i class="bi bi-geo-alt"></i>
                <span>${escapeHtml(user.city)}</span>
              </div>
            ` : ''}
            
            <div class="community-detail">
              <i class="bi bi-flag"></i>
              <span>${totalRides} ride${totalRides !== 1 ? 's' : ''}</span>
            </div>
            
            <div class="community-detail">
              <i class="bi bi-clock"></i>
              <span>${lastActiveText}</span>
            </div>
          </div>
        </div>

        <div class="community-card-footer">
          <button class="btn-follow" data-user-id="${user.uid}">
            <i class="bi bi-person-plus"></i> Follow
          </button>
          <button class="btn-view-profile" data-username="${escapeHtml(user.username)}">
            <i class="bi bi-eye"></i> View Profile
          </button>
        </div>
      </div>
    `;
    }).join('');

    // Attach event listeners
    attachCommunityListeners(container);
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getLastActiveText(lastActive) {
    if (!lastActive) return 'Unknown';

    const date = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
