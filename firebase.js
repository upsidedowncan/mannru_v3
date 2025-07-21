// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9FndR3HGfFF9Q3kJM4bTqcZxTaVR8FlM",
  authDomain: "mannru3-346ad.firebaseapp.com",
  projectId: "mannru3-346ad",
  storageBucket: "mannru3-346ad.firebasestorage.app",
  messagingSenderId: "858614055963",
  appId: "1:858614055963:web:a8c2d6cdd1580f49afa4be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore }; 