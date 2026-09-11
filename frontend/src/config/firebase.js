import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyBTfo1RILh_9BcsJxndfgrnKDOcYISoBzc",
  authDomain: "railway-tracking-aa884.firebaseapp.com",
  projectId: "railway-tracking-aa884",
  storageBucket: "railway-tracking-aa884.firebasestorage.app",
  messagingSenderId: "586688207303",
  appId: "1:586688207303:web:a31a0c82b4bb4a53b561e2"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)
const auth = getAuth(app)
export { db, auth }
