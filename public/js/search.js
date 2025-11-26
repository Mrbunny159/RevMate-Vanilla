// ============================================
// SEARCH MODULE
// Search users + rides with autocomplete
// ============================================

import { db } from './firebase-config.js';
import { collection, query, where, getDocs, limit } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { navigateTo } from './router.js';

let searchTimeout = null;

/**
 * Initialize search
 */
export function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (searchTerm.length < 2) {
            hideSearchDropdown();
            return;
        }

        // Debounce 300ms
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, 300);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchDropdown();
        }
    });
}

/**
 * Perform search for users and rides
 */
async function performSearch(searchTerm) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '<div class="search-loading">Searching...</div>';
    dropdown.classList.add('active');

    try {
        const term = searchTerm.toLowerCase();

        // Search users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(query(usersRef, limit(5)));
        const users = usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(u =>
                u.username?.toLowerCase().includes(term) ||
                u.displayName?.toLowerCase().includes(term)
            )
            .slice(0, 5);

        // Search rides
        const ridesRef = collection(db, 'rides');
        const ridesSnapshot = await getDocs(query(ridesRef, limit(10)));
        const rides = ridesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(r => r.title?.toLowerCase().includes(term) && r.isPublic)
            .slice(0, 5);

        renderSearchResults(users, rides, searchTerm);
    } catch (error) {
        console.error('Search error:', error);
        dropdown.innerHTML = '<div class="search-error">Search failed</div>';
    }
}

/**
 * Render search results
 */
function renderSearchResults(users, rides, term) {
    const dropdown = document.getElementById('search-dropdown');

    if (users.length === 0 && rides.length === 0) {
        dropdown.innerHTML = `<div class="search-no-results">No results for "${term}"</div>`;
        return;
    }

    let html = '';

    if (users.length > 0) {
        html += '<div class="search-section"><h4>Users</h4>';
        users.forEach(user => {
            html += `
        <div class="search-item" data-type="user" data-username="${user.username}">
          <i class="bi bi-person"></i>
          <div>
            <div class="search-item-title">${user.displayName || 'User'}</div>
            <div class="search-item-subtitle">@${user.username}</div>
          </div>
        </div>
      `;
        });
        html += '</div>';
    }

    if (rides.length > 0) {
        html += '<div class="search-section"><h4>Rides</h4>';
        rides.forEach(ride => {
            const date = ride.rideDateTime?.toDate?.() || new Date(ride.rideDateTime);
            html += `
        <div class="search-item" data-type="ride" data-ride-id="${ride.id}">
          <i class="bi bi-bicycle"></i>
          <div>
            <div class="search-item-title">${ride.title}</div>
            <div class="search-item-subtitle">${date.toLocaleDateString()}</div>
          </div>
        </div>
      `;
        });
        html += '</div>';
    }

    dropdown.innerHTML = html;

    // Attach click handlers
    dropdown.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.getAttribute('data-type');
            if (type === 'user') {
                const username = item.getAttribute('data-username');
                navigateTo(`/profile/${username}`);
                hideSearchDropdown();
            } else if (type === 'ride') {
                const rideId = item.getAttribute('data-ride-id');
                // TODO: Navigate to ride detail
                console.log('View ride:', rideId);
                hideSearchDropdown();
            }
        });
    });
}

function hideSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}
