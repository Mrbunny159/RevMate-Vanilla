// ============================================
// FIRESTORE MIGRATION SCRIPT
// Migrates existing rides to new data structure
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, GeoPoint } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// Firebase config (replace with your config from firebase-config.js)
const firebaseConfig = {
    // YOUR FIREBASE CONFIG HERE
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Migration Script for RevMate Rides Collection
 * 
 * Changes:
 * 1. Convert startLocation/endLocation from {lat, lng, name, address} to GeoPoint
 * 2. Add separate fields: startLocationName, startLocationAddress
 * 3. Add endLocation GeoPoint if missing
 * 4. Add endLocationName, endLocationAddress
 * 5. Remove duplicate hostId field (keep organizerId)
 * 6. Add description field (empty string if missing)
 * 7. Ensure isPublic field exists (default true)
 */

async function migrateRides() {
    console.log('🔄 Starting migration...');

    try {
        const ridesCollection = collection(db, 'rides');
        const snapshot = await getDocs(ridesCollection);

        console.log(`📊 Found ${snapshot.size} rides to migrate`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const rideDoc of snapshot.docs) {
            try {
                const data = rideDoc.data();
                const rideId = rideDoc.id;

                console.log(`\n🔍 Processing ride: ${rideId} - "${data.title || 'Untitled'}"`);

                const updates = {};
                let needsUpdate = false;

                // 1. Migrate startLocation to GeoPoint
                if (data.startLocation) {
                    if (!(data.startLocation instanceof GeoPoint)) {
                        const lat = data.startLocation.lat || data.startLocation.latitude || 0;
                        const lng = data.startLocation.lng || data.startLocation.longitude || 0;

                        updates.startLocation = new GeoPoint(Number(lat), Number(lng));
                        updates.startLocationName = data.startLocation.name || data.startLocationName || '';
                        updates.startLocationAddress = data.startLocation.address || data.startLocationAddress || '';

                        console.log(`  ✅ Migrating startLocation: [${lat}, ${lng}]`);
                        needsUpdate = true;
                    } else {
                        console.log(`  ⏭️  startLocation already GeoPoint, checking metadata...`);
                        // Ensure metadata exists
                        if (!data.startLocationName) {
                            updates.startLocationName = '';
                            needsUpdate = true;
                        }
                        if (!data.startLocationAddress) {
                            updates.startLocationAddress = '';
                            needsUpdate = true;
                        }
                    }
                } else {
                    console.log(`  ⚠️  startLocation missing - adding placeholder`);
                    updates.startLocation = new GeoPoint(0, 0);
                    updates.startLocationName = 'Unknown Location';
                    updates.startLocationAddress = '';
                    needsUpdate = true;
                }

                // 2. Migrate or add endLocation
                if (data.endLocation) {
                    if (!(data.endLocation instanceof GeoPoint)) {
                        const lat = data.endLocation.lat || data.endLocation.latitude || 0;
                        const lng = data.endLocation.lng || data.endLocation.longitude || 0;

                        updates.endLocation = new GeoPoint(Number(lat), Number(lng));
                        updates.endLocationName = data.endLocation.name || data.endLocationName || '';
                        updates.endLocationAddress = data.endLocation.address || data.endLocationAddress || '';

                        console.log(`  ✅ Migrating endLocation: [${lat}, ${lng}]`);
                        needsUpdate = true;
                    } else {
                        console.log(`  ⏭️  endLocation already GeoPoint, checking metadata...`);
                        if (!data.endLocationName) {
                            updates.endLocationName = '';
                            needsUpdate = true;
                        }
                        if (!data.endLocationAddress) {
                            updates.endLocationAddress = '';
                            needsUpdate = true;
                        }
                    }
                } else {
                    console.log(`  ⚠️  endLocation missing - adding placeholder`);
                    // Use startLocation as fallback
                    const startLat = data.startLocation?.lat || data.startLocation?.latitude || 0;
                    const startLng = data.startLocation?.lng || data.startLocation?.longitude || 0;
                    updates.endLocation = new GeoPoint(Number(startLat), Number(startLng));
                    updates.endLocationName = 'Destination (TBD)';
                    updates.endLocationAddress = '';
                    needsUpdate = true;
                }

                // 3. Remove duplicate hostId (keep organizerId)
                if (data.hostId !== undefined && data.organizerId) {
                    updates.hostId = null; // Set to null to remove
                    console.log(`  🗑️  Removing duplicate hostId (keeping organizerId: ${data.organizerId})`);
                    needsUpdate = true;
                } else if (data.hostId && !data.organizerId) {
                    // If only hostId exists, rename it to organizerId
                    updates.organizerId = data.hostId;
                    updates.hostId = null;
                    console.log(`  🔄 Renaming hostId to organizerId`);
                    needsUpdate = true;
                }

                // 4. Add description if missing
                if (!data.description) {
                    updates.description = '';
                    console.log(`  📝 Adding empty description field`);
                    needsUpdate = true;
                }

                // 5. Ensure isPublic exists
                if (data.isPublic === undefined) {
                    updates.isPublic = true; // Default to public
                    console.log(`  🔓 Setting isPublic to true (default)`);
                    needsUpdate = true;
                }

                // Apply updates if needed
                if (needsUpdate && Object.keys(updates).length > 0) {
                    const rideRef = doc(db, 'rides', rideId);
                    await updateDoc(rideRef, updates);
                    console.log(`  ✅ Migration complete for ride ${rideId}`);
                    migrated++;
                } else {
                    console.log(`  ⏭️  No migration needed for ride ${rideId}`);
                    skipped++;
                }

            } catch (error) {
                console.error(`  ❌ Error migrating ride ${rideDoc.id}:`, error);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Migration Summary:');
        console.log(`  ✅ Migrated: ${migrated}`);
        console.log(`  ⏭️  Skipped: ${skipped}`);
        console.log(`  ❌ Errors: ${errors}`);
        console.log('='.repeat(50));

        if (errors === 0) {
            console.log('\n✨ Migration completed successfully!');
        } else {
            console.log('\n⚠️  Migration completed with errors. Please review.');
        }

    } catch (error) {
        console.error('❌ Fatal error during migration:', error);
    }
}

// Run migration
console.log('🚀 RevMate Firestore Migration Script');
console.log('📋 This will migrate your rides to the new data structure\n');

migrateRides();
