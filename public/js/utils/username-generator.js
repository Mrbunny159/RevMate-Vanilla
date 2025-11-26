// ============================================
// USERNAME GENERATOR UTILITY
// Auto-generate unique usernames from email
// ============================================

/**
 * Generate a base username from email
 * @param {string} email - User's email address
 * @returns {string} - Base username (lowercase, no special chars)
 * 
 * Examples:
 *   john.doe@gmail.com → johndoe
 *   sarah_smith123@yahoo.com → sarahsmith123
 *   rider+test@example.com → rider
 */
export function generateUsernameFromEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new Error('Valid email required');
    }

    // Extract part before @
    const localPart = email.split('@')[0];

    // Remove special characters, keep only alphanumeric
    const cleaned = localPart
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    // Ensure minimum length of 3
    if (cleaned.length < 3) {
        return cleaned + 'user';
    }

    // Maximum length of 20
    return cleaned.substring(0, 20);
}

/**
 * Check if username already exists in Firestore
 * @param {string} username - Username to check
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<boolean>} - True if exists, false if available
 */
export async function checkUsernameExists(username, db) {
    try {
        const { collection, query, where, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js'
        );

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const snapshot = await getDocs(q);

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking username:', error);
        throw error;
    }
}

/**
 * Ensure username is unique by adding numbers if needed
 * @param {string} baseUsername - Base username from email
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<string>} - Unique username
 * 
 * Examples:
 *   johndoe → johndoe (if available)
 *   johndoe → johndoe1 (if johndoe taken)
 *   johndoe → johndoe2 (if johndoe and johndoe1 taken)
 */
export async function ensureUniqueUsername(baseUsername, db) {
    let username = baseUsername;
    let counter = 1;
    let maxAttempts = 100;

    // Check if base username is available
    while (await checkUsernameExists(username, db)) {
        username = baseUsername + counter;
        counter++;

        if (counter > maxAttempts) {
            // Fallback to random number
            username = baseUsername + Math.floor(Math.random() * 10000);
            break;
        }
    }

    return username;
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid
 */
export function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // Must be 3-20 characters
    if (username.length < 3 || username.length > 20) {
        return false;
    }

    // Must be alphanumeric only (lowercase)
    const validFormat = /^[a-z0-9]+$/;
    return validFormat.test(username);
}

/**
 * Complete workflow: Generate and ensure unique username
 * @param {string} email - User's email
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<string>} - Final unique username
 */
export async function createUniqueUsername(email, db) {
    const baseUsername = generateUsernameFromEmail(email);

    if (!isValidUsername(baseUsername)) {
        throw new Error('Generated username is invalid');
    }

    const uniqueUsername = await ensureUniqueUsername(baseUsername, db);

    console.log(`✅ Generated username: ${uniqueUsername} from ${email}`);

    return uniqueUsername;
}
