// ============================================
// SIMPLE SPA ROUTER
// Handles /profile/{username} navigation
// ============================================

import { loadProfile } from './profile.js';

/**
 * Initialize router and listen to URL changes
 */
export function initRouter() {
    // Listen to popstate (back/forward buttons)
    window.addEventListener('popstate', handleRoute);

    // Listen to link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-route]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        }
    });

    // Handle initial route
    handleRoute();
}

/**
 * Navigate to a route
 * @param {string} path - Route path
 */
export function navigateTo(path) {
    window.history.pushState({}, '', path);
    handleRoute();
}

/**
 * Handle current route
 */
function handleRoute() {
    const path = window.location.pathname;

    // Check for /profile/{username}
    if (path.startsWith('/profile/')) {
        const username = path.split('/profile/')[1];
        if (username) {
            showProfile(username);
            return;
        }
    }

    // Default: show home/discover
    showHome();
}

/**
 * Show profile page
 * @param {string} username - Username to display
 */
function showProfile(username) {
    // Hide all app sections
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));

    // Show profile section
    const profileSection = document.getElementById('user-profile');
    if (profileSection) {
        profileSection.classList.add('active');
        loadProfile(username);
    }
}

/**
 * Show home page
 */
function showHome() {
    // Click discover nav
    const discoverNav = document.querySelector('[data-section="discover"]');
    if (discoverNav) {
        discoverNav.click();
    }
}
