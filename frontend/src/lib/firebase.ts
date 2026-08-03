import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBVYtshULPrYSqdJ2ZmPMq8yyKR_EKfg-0",
  authDomain: "medicalassistant-ccecf.firebaseapp.com",
  projectId: "medicalassistant-ccecf",
  storageBucket: "medicalassistant-ccecf.firebasestorage.app",
  messagingSenderId: "974308232037",
  appId: "1:974308232037:web:7dd3a1ec2cb7a6479caf8c",
  measurementId: "G-EBQRS35WX0"
};

// Initialize Firebase for SSR compatibility
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
