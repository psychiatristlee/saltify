import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAq5RwfKdw9USo4DVvpghmM_Vh_qwm0szc",
  authDomain: "saltify-game.firebaseapp.com",
  projectId: "saltify-game",
  storageBucket: "saltify-game.firebasestorage.app",
  messagingSenderId: "586425648216",
  appId: "1:586425648216:web:24ff720492615ed90af62d",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
