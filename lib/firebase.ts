import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, getAuth } from "firebase"; // Try top-level import for getFirestore and getAuth
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // If you plan to use Authentication
// import { getStorage } from "firebase/storage"; // If you plan to use Storage
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDn2hgT-cYoGUQpFdI-sXsb4I2dDSJq-FY",
  authDomain: "muuappberlin.firebaseapp.com",
  projectId: "muuappberlin",
  storageBucket: "muuappberlin.appspot.com",
  messagingSenderId: "820793338754",
  appId: "1:820793338754:web:a9552c7b99df3203107d9b",
  measurementId: "G-LHJTKXWG1W"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const db = getFirestore(app);
const auth = getAuth(app); // If using Auth
// const storage = getStorage(app); // If using Storage

// Initialize Analytics and get a reference to the service
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, auth /*, storage, analytics */ }; 