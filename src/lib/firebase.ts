import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAq5RwfKdw9USo4DVvpghmM_Vh_qwm0szc",
  authDomain: "saltify-game.firebaseapp.com",
  projectId: "saltify-game",
  storageBucket: "saltify-game.firebasestorage.app",
  messagingSenderId: "586425648216",
  appId: "1:586425648216:web:24ff720492615ed90af62d",
  measurementId: "G-NM6V696P1L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
