// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection,
  addDoc, getDocs, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, 'users', result.user.uid), {
      displayName,
      email,
      createdAt: serverTimestamp(),
    });
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: result.user.displayName,
        email: result.user.email,
        createdAt: serverTimestamp(),
      });
    }
    return result;
  }

  function logout() {
    return signOut(auth);
  }

  async function saveScanToFirestore(scanData) {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'scans'), {
        top_prediction: scanData.top_prediction || '',
        confidence: scanData.confidence || 0,
        status: scanData.status || 'unknown',
        description: scanData.description || '',
        supplement: scanData.supplement || '',
        buy_link: scanData.buy_link || '',
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving scan:', err);
    }
  }

  async function getUserScans() {
    if (!currentUser) return [];
    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'scans'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error getting scans:', err);
      return [];
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    saveScanToFirestore,
    getUserScans,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
