// ============================================
// FIREBASE FIRESTORE DATABASE HELPER (ESM, CDN v12.6.0)
// ============================================

import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// Create a new ride
export async function createRide(rideData, hostId) {
  try {
    const docRef = await addDoc(collection(db, 'rides'), {
      title: rideData.title,
      desc: rideData.desc,
      start: rideData.start,
      dest: rideData.dest,
      date: rideData.date,
      host: rideData.host,
      hostId: hostId,
      joinedUsers: [],
      createdAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all rides
export async function getAllRides() {
  try {
    const q = query(collection(db, 'rides'), orderBy('date'));
    const snap = await getDocs(q);
    const rides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, rides };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get rides hosted by a user
export async function getHostedRides(hostId) {
  try {
    const q = query(collection(db, 'rides'), where('hostId', '==', hostId));
    const snap = await getDocs(q);
    return { success: true, rides: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get rides joined by a user
export async function getJoinedRides(userId) {
  try {
    const q = query(collection(db, 'rides'), where('joinedUsers', 'array-contains', userId));
    const snap = await getDocs(q);
    return { success: true, rides: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Join a ride
export async function joinRide(rideId, userId) {
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, { joinedUsers: arrayUnion(userId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Leave a ride
export async function leaveRide(rideId, userId) {
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, { joinedUsers: arrayRemove(userId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete a ride
export async function deleteRide(rideId) {
  try {
    await deleteDoc(doc(db, 'rides', rideId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Community members
export async function getCommunityMembers() {
  try {
    const snap = await getDocs(collection(db, 'community'));
    return { success: true, members: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Follow / unfollow
export async function followMember(userId, memberId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { following: arrayUnion(memberId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function unfollowMember(userId, memberId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { following: arrayRemove(memberId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(userId, userData) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
