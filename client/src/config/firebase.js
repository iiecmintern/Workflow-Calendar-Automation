import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBTB1bwsJjjeDFPRbSOtiOP4bM6woNVoGU",
  authDomain: "calender-automation-d6216.firebaseapp.com",
  projectId: "calender-automation-d6216",
  storageBucket: "calender-automation-d6216.firebasestorage.app",
  messagingSenderId: "194650932782",
  appId: "1:194650932782:web:b8cbd5bcd7258b416481bf",
  measurementId: "G-5JYJGZ8GRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;