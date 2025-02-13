// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Your Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyBkcpnBe24_482SrXweu4BGfx8ohuqAIis",
  authDomain: "uemp-b8f1e.firebaseapp.com",
  projectId: "uemp-b8f1e",
  storageBucket: "uemp-b8f1e.firebasestorage.app",
  messagingSenderId: "1025161639985",
  appId: "1:1025161639985:web:1db09501c94588d2943d10",
  measurementId: "G-WFSGQ514G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 
export { auth, provider, signInWithPopup, signOut };
