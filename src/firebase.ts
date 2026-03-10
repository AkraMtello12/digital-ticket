import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBT2FPawQcfyTMjsexjH4Y5bfoLr5zI_hk",
  authDomain: "startupsyria-tickets.firebaseapp.com",
  projectId: "startupsyria-tickets",
  storageBucket: "startupsyria-tickets.firebasestorage.app",
  messagingSenderId: "556696598375",
  appId: "1:556696598375:web:2a8faa0f135394ac86a1c2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
