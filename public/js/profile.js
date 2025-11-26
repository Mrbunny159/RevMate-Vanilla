// ============================================
// USER PROFILE MODULE
// Display public user profiles
// ============================================

import { db } from './firebase-config.js';
import { getCurrentUserId } from './firebase-auth.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getFollowerCount, getFollowingCount, getFollowStatus, sendFollowRequest, unfollowUser } from './follow-system.js';
import { showSuccess, showError } from './utils/ux-helpers.js';

/**
 * Load and display user profile
 * @param {string} username - Username to load
 */
export async function loadProfile(username) {
    const container = document.getElementById('profile-content');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading profile...</div>';

    try {
        // Find user by username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `
        <div class="profile-not-found">
          <i class="bi bi-person-x" style="font-size: 4rem;"></i>
          <h3>User not found</h3>
          <p>@${username} doesn't exist</p>
        </div>
      `;
            return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;
        const currentUserId = getCurrentUserId();
        const isOwnProfile = userId === currentUserId;

        // Check privacy
        if (!isOwnProfile && !userData.privacySettings?.profilePublic) {
            container.innerHTML = `
        <div class="profile-private">
          <i class="bi bi-lock" style="font-size: 4rem;"></i>
          <h3>This profile is private</h3>
        </div>
      `;
            return;
        }

        // Get counts
        const followerCount = await getFollowerCount(userId);
        const followingCount = await getFollowingCount(userId);

        // Render profile
        renderProfile(userData, userId, isOwnProfile, followerCount, followingCount);

    } catch (error) {
        console.error('Error loading profile:', error);
        container.innerHTML = '<div class="profile-error">Failed to load profile</div>';
    }
}

/**
 * Render profile content
 */
function renderProfile(user, userId, isOwn, followers, following) {
    const container = document.getElementById('profile-content');

    const avatar = user.photoURL
        ? `<img src="${user.photoURL}" alt="${user.displayName}" class="profile-avatar">`
        : `<div class="profile-avatar-placeholder">${getInitials(user.displayName)}</div>`;

    const memberSince = user.createdAt?.toDate?.() || new Date(user.createdAt);
    const memberSinceText = memberSince.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    container.innerHTML = `
    <div class="profile-header">
      ${avatar}
      <div class="profile-header-info">
        <h2 class="profile-name">${user.displayName || 'User'}</h2>
        <p class="profile-username">@${user.username}</p>
        <div class="profile-stats">
          <span><strong>${user.stats?.ridesHosted || 0}</strong> Hosted</span>
          <span><strong>${user.stats?.ridesJoined || 0}</strong> Joined</span>
          <span><strong>${followers}</strong> Followers</span>
          <span><strong>${following}</strong> Following</span>
        </div>
      </div>
      <div class="profile-actions">
        ${isOwn ? `
          <button class="btn-edit-profile" onclick="alert('Edit profile - TODO')">
            <i class="bi bi-pencil"></i> Edit Profile
          </button>
        ` : `
          <button class="btn-follow-profile" data-user-id="${userId}">
            <i class="bi bi-person-plus"></i> Follow
          </button>
          <button class="btn-report" data-user-id="${userId}">
            <i class="bi bi-flag"></i> Report
          </button>
        `}
      </div>
    </div>
    
    <div class="profile-body">
      ${user.bio ? `
        <div class="profile-section">
          <h4>Bio</h4>
          <p>${user.bio}</p>
        </div>
      ` : ''}
      
      ${user.bike ? `
        <div class="profile-section">
          <h4><i class="bi bi-bicycle"></i> Bike</h4>
          <p>${user.bike}</p>
        </div>
      ` : ''}
      
      ${user.city ? `
        <div class="profile-section">
          <h4><i class="bi bi-geo-alt"></i> Location</h4>
          <p>${user.city}</p>
        </div>
      ` : ''}
      
      <div class="profile-section">
        <h4><i class="bi bi-calendar"></i> Member Since</h4>
        <p>${memberSinceText}</p>
      </div>
    </div>
  `;

    // Attach event listeners
    if (!isOwn) {
        attachProfileListeners(userId);
    }
}

/**
 * Attach event listeners to profile buttons
 */
function attachProfileListeners(userId) {
    // Follow button
    const followBtn = document.querySelector('.btn-follow-profile');
    if (followBtn) {
        // Update button based on follow status
        getFollowStatus(userId).then(status => {
            if (status.status === 'accepted') {
                followBtn.innerHTML = '<i class="bi bi-check-circle"></i> Following';
                followBtn.classList.add('following');
            }
        });

        followBtn.addEventListener('click', async () => {
            const status = await getFollowStatus(userId);
            if (status.status === 'accepted') {
                await unfollowUser(userId);
                followBtn.innerHTML = '<i class="bi bi-person-plus"></i> Follow';
                followBtn.classList.remove('following');
            } else {
                await sendFollowRequest(userId);
                followBtn.innerHTML = '<i class="bi bi-clock"></i> Requested';
            }
        });
    }

    // Report button
    const reportBtn = document.querySelector('.btn-report');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => showReportModal(userId));
    }
}

/**
 * Show report abuse modal
 */
function showReportModal(userId) {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = `
    <div class="report-modal-content">
      <h3>Report Abuse</h3>
      <select id="reportReason">
        <option value="">Select reason...</option>
        <option value="spam">Spam</option>
        <option value="harassment">Harassment</option>
        <option value="inappropriate">Inappropriate content</option>
        <option value="fake">Fake profile</option>
        <option value="other">Other</option>
      </select>
      <textarea id="reportDescription" placeholder="Additional details..." rows="4"></textarea>
      <div class="report-modal-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-submit-report" data-user-id="${userId}">Submit Report</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-submit-report').addEventListener('click', async () => {
        const reason = document.getElementById('reportReason').value;
        const description = document.getElementById('reportDescription').value;

        if (!reason) {
            showError('Please select a reason');
            return;
        }

        await submitReport(userId, reason, description);
        modal.remove();
    });
}

/**
 * Submit abuse report
 */
async function submitReport(reportedUserId, reason, description) {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            showError('Please log in to report');
            return;
        }

        const reportsRef = collection(db, 'reports');
        await addDoc(reportsRef, {
            reporterId: currentUserId,
            reportedUserId: reportedUserId,
            reason: reason,
            description: description,
            createdAt: serverTimestamp(),
            status: 'pending'
        });

        showSuccess('Report submitted. Thank you!');
    } catch (error) {
        console.error('Error submitting report:', error);
        showError('Failed to submit report');
    }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}
