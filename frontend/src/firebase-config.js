import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Auth import kiya
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCLupWMkkk667fHIZqayvSbYdW_GdTtuX8",
  authDomain: "splitrail-50863.firebaseapp.com",
  projectId: "splitrail-50863",
  storageBucket: "splitrail-50863.firebasestorage.app",
  messagingSenderId: "302383687849",
  appId: "1:302383687849:web:03b0132340bcc12be621b8",
  measurementId: "G-4T7D84Q8L8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Authentication export karein
export const auth = getAuth(app);