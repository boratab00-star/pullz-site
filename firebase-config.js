import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, updateDoc, where, deleteDoc, or } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByRYQSc0IOTmqXrVRthSlyDgJJvNMQ0m4",
  authDomain: "site-3842a.firebaseapp.com",
  projectId: "site-3842a",
  storageBucket: "site-3842a.firebasestorage.app",
  messagingSenderId: "73145121932",
  appId: "1:73145121932:web:159af248f2cdd38b804fa9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, updateDoc, where, deleteDoc, or };
