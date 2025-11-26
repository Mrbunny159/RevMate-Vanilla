// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

let toastCount = 0;
const MAX_TOASTS = 3;

/**
 * Show a toast notification
 * @param {string} message - Main message
 * @param {string} type - Type: success, error, warning, info
 * @param {string} title - Optional title
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'success', title = null, duration = 3000) {
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Limit max toasts
    const existingToasts = document.querySelectorAll('.toast');
    if (existingToasts.length >= MAX_TOASTS) {
        existingToasts[0].remove();
    }

    // Icon mapping
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    // Default titles
    const defaultTitles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <i class="bi ${icons[type]} toast-icon"></i>
    <div class="toast-content">
      ${title ? `<p class="toast-title">${escapeHtml(title)}</p>` : ''}
      <p class="toast-message">${escapeHtml(message)}</p>
    </div>
    <button class="toast-close" aria-label="Close">
      <i class="bi bi-x"></i>
    </button>
  `;

    // Add close handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    // Add to container
    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Convenience methods
export function showSuccess(message, title = 'Success') {
    showToast(message, 'success', title);
}

export function showError(message, title = 'Error') {
    showToast(message, 'error', title);
}

export function showWarning(message, title = 'Warning') {
    showToast(message, 'warning', title);
}

export function showInfo(message, title = null) {
    showToast(message, 'info', title);
}

// ============================================
// EMPTY STATE RENDERER
// ============================================

/**
 * Render an enhanced empty state
 * @param {string} container - Container ID
 * @param {object} options - Configuration
 */
export function renderEmptyState(container, options = {}) {
    const {
        icon = 'bi-inbox',
        title = 'No items found',
        message = 'There are no items to display.',
        actionText = null,
        actionIcon = null,
        actionCallback = null,
        variant = 'default'
    } = options;

    const containerEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!containerEl) return;

    const actionHtml = actionText ? `
    <button class="empty-state-action" id="emptyStateAction">
      ${actionIcon ? `<i class="bi ${actionIcon}"></i>` : ''}
      ${actionText}
    </button>
  ` : '';

    containerEl.innerHTML = `
    <div class="empty-state ${variant}">
      <div class="empty-state-icon">
        <i class="bi ${icon}"></i>
      </div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-message">${message}</p>
      ${actionHtml}
    </div>
  `;

    // Attach action callback
    if (actionCallback && actionText) {
        const actionBtn = document.getElementById('emptyStateAction');
        if (actionBtn) {
            actionBtn.addEventListener('click', actionCallback);
        }
    }
}

// ============================================
// LOADING SKELETON
// ============================================

/**
 * Show loading skeleton
 * @param {string} container - Container ID
 * @param {number} count - Number of skeleton cards
 */
export function showLoadingSkeleton(container, count = 3) {
    const containerEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!containerEl) return;

    const skeletons = Array.from({ length: count }, () => `
    <div class="col-md-6 col-lg-4">
      <div class="skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    </div>
  `).join('');

    containerEl.innerHTML = skeletons;
}

/**
 * Hide loading skeleton and show content
 * @param {string} container - Container ID
 * @param {string} content - HTML content to show
 */
export function hideLoadingSkeleton(container, content) {
    const containerEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!containerEl) return;

    containerEl.innerHTML = content;
}

// ============================================
// ERROR BOUNDARY
// ============================================

/**
 * Render an error boundary
 * @param {string} container - Container ID
 * @param {Error} error - Error object
 */
export function renderErrorBoundary(container, error) {
    const containerEl = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!containerEl) return;

    containerEl.innerHTML = `
    <div class="error-boundary">
      <div class="error-boundary-content">
        <div class="error-boundary-icon">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h2 class="error-boundary-title">Oops! Something went wrong</h2>
        <p class="error-boundary-message">
          We're sorry, but something unexpected happened. 
          ${error?.message ? `Error: ${error.message}` : ''}
        </p>
        <div class="error-boundary-actions">
          <button class="error-boundary-button primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise"></i> Reload Page
          </button>
          <button class="error-boundary-button secondary" onclick="history.back()">
            <i class="bi bi-arrow-left"></i> Go Back
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError(
        'An unexpected error occurred. Please try refreshing the page.',
        'Error'
    );
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError(
        'A network or data error occurred. Please check your connection.',
        'Error'
    );
});
