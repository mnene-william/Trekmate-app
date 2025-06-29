// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOcQfJQPqOAllSGYS1UKG2-OgqW17cC1Q",
  authDomain: "trekmate-127e9.firebaseapp.com",
  projectId: "trekmate-127e9",
  storageBucket: "trekmate-127e9.firebasestorage.app",
  messagingSenderId: "754337651808",
  appId: "1:754337651808:web:57de5bb020f71a9b65f705",
  measurementId: "G-QE0WMV3FC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);