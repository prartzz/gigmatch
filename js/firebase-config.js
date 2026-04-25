// Firebase Configuration using Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, onSnapshot, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Firebase project credentials from Firebase Console
// GigMatch Project Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHC3ijBT9lw4scf5KJ3BR3gszYVndPcD8",
    authDomain: "gigmatch-20012026.firebaseapp.com",
    projectId: "gigmatch-20012026",
    storageBucket: "gigmatch-20012026.firebasestorage.app",
    messagingSenderId: "323639386049",
    appId: "1:323639386049:web:8eb5bcc9a1889595cc9940",
    measurementId: "G-9PSF9C9FPF"
};

// Initialize Firebase with error handling
let app;
let auth;
let db;

try {
    console.log('[Firebase] Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] ✓ App initialized');
} catch (error) {
    console.error('[Firebase] ✗ Failed to initialize app:', error.message);
}

try {
    console.log('[Firebase] Initializing Authentication...');
    auth = getAuth(app);
    console.log('[Firebase] ✓ Auth initialized');
} catch (error) {
    console.error('[Firebase] ✗ Failed to initialize Auth:', error.message);
}

try {
    console.log('[Firebase] Initializing Firestore...');
    db = getFirestore(app);
    console.log('[Firebase] ✓ Firestore initialized');
} catch (error) {
    console.error('[Firebase] ✗ Failed to initialize Firestore:', error.message);
}

// Set up auth state listener to restore session
let authReady = false;
onAuthStateChanged(auth, (user) => {
    authReady = true;
    console.log('[Firebase] Auth state listener fired. User:', user ? user.email : 'NONE (logged out)');
});

// Function to wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds timeout (100 * 50ms)
        
        const checkReady = () => {
            if (auth && db && authReady) {
                console.log('[Firebase] ✓ All services ready! User:', auth.currentUser ? auth.currentUser.email : 'NOT LOGGED IN');
                resolve({ auth, db, app });
            } else if (attempts > maxAttempts) {
                console.warn('[Firebase] ⚠ Timeout waiting for auth state. Proceeding anyway...');
                resolve({ auth, db, app });
            } else {
                attempts++;
                setTimeout(checkReady, 50);
            }
        };
        checkReady();
    });
}

// Export Firebase instances and functions
export { 
    auth, db, app, authReady, waitForFirebase,
    // Auth functions
    createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber,
    // Firestore functions
    collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, Timestamp, onSnapshot, arrayUnion, arrayRemove
};
