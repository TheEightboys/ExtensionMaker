// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCiOSgKLOhCl5jga6WvUoTlhHYBJ14NNXk",
  authDomain: "extensionbrowser-7964a.firebaseapp.com",
  projectId: "extensionbrowser-7964a",
  storageBucket: "extensionbrowser-7964a.appspot.com",
  messagingSenderId: "942826462095",
  appId: "1:942826462095:web:bfe034ac4d0f2ebd1689fa",
  measurementId: "G-T21RJZS1JZ",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
