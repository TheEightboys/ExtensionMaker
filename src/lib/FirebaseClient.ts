// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiOSgKLOhCl5jga6WvUoTlhHYBJ14NNXk",
  authDomain: "extensionbrowser-7964a.firebaseapp.com",
  projectId: "extensionbrowser-7964a",
  storageBucket: "extensionbrowser-7964a.appspot.com",
  messagingSenderId: "942826462095",
  appId: "1:942826462095:web:bfe034ac4d0f2ebd1689fa",
  measurementId: "G-T21RJZS1JZ",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
