// ============================================
// FIREBASE CONFIGURATION (BACKWARD COMPATIBILITY)
// ============================================
// NOTE: For new modules, import from firebase-init.js instead
// This file now re-exports from the centralized firebase-init.js
// to ensure all modules use the same Firebase app instance

import { app, auth, db, storage, analytics } from './firebase-init.js';

export { app, analytics, auth, db, storage };

