import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYK0C5iNQRPfNhwSOX9uLeWVmc67VghUc",
  authDomain: "doctor-green-1086d.firebaseapp.com",
  projectId: "doctor-green-1086d",
  storageBucket: "doctor-green-1086d.firebasestorage.app",
  messagingSenderId: "732383632332",
  appId: "1:732383632332:web:698090aff785270c6c1b69",
  measurementId: "G-1QYZT1M7P5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;