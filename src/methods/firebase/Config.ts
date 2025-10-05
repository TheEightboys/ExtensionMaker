// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCiOSgKLOhCl5jga6WvUoTlhHYBJ14NNXk",
  authDomain: "extensionbrowser-7964a.firebaseapp.com",
  projectId: "extensionbrowser-7964a",
  storageBucket: "extensionbrowser-7964a.firebasestorage.app",
  messagingSenderId: "942826462095",
  appId: "1:942826462095:web:bfe034ac4d0f2ebd1689fa",
  measurementId: "G-T21RJZS1JZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();