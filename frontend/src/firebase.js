// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence,browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAL2z3ETmp_HpvBE7E5niDn-uqqy-f5s9k",
  authDomain: "workhub-a3706.firebaseapp.com",
  projectId: "workhub-a3706",
  storageBucket: "workhub-a3706.firebasestorage.app",
  messagingSenderId: "521914592880",
  appId: "1:521914592880:web:f74a5bed830308f498ceb5",
  measurementId: "G-FX9YLZECSZ"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// stay logged in across tabs/browser restarts
setPersistence(auth, browserLocalPersistence);

const googleProvider = new GoogleAuthProvider();

// helper exported functions
export {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
};

export const logout = () => signOut(auth);