import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFunctions } from "firebase/functions"; 

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyADfXP2LnYm4fI45QJoclpUCsmLcaYqlD8",
  authDomain: "uemp-aadde.firebaseapp.com",
  databaseURL: "https://uemp-aadde-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uemp-aadde",
  storageBucket: "uemp-aadde.firebasestorage.app",
  messagingSenderId: "882454100715",
  appId: "1:882454100715:web:5dbaeddc7f7ea5ec951cae",
  measurementId: "G-TX6GBJ6G99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 
const functions = getFunctions(app); 

export { auth, provider, signInWithPopup, signOut, app, functions };
