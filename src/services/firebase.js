// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC8wmHDtX9AHFKhd9IHLmYqi87myF5o7lo",
  authDomain: "async-music.vercel.app",
  projectId: "async-music",
  storageBucket: "async-music.appspot.com",
  messagingSenderId: "425046929612",
  appId: "1:425046929612:web:1cd532c172a70de5db5269",
  measurementId: "G-WJQ8E0BM0C",
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to local emulators when running on localhost to avoid CORS and real network calls during development.
// Temporarily disabled storage emulator to use real Firebase Storage for uploaded songs
// if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
//   try {
//     // Storage emulator default port 9199
//     connectStorageEmulator(storage, 'localhost', 9199);
//     // If you also run Firestore emulator, you could connect it here as well.
//     // Example: import { connectFirestoreEmulator } from 'firebase/firestore'; connectFirestoreEmulator(db, 'localhost', 8080);
//     // This keeps local dev isolated and avoids CORS issues from the real bucket.
//     // Note: Start emulator with `firebase emulators:start --only storage`.
//     // See README or comments in code for more info.
//     // eslint-disable-next-line no-console
//     console.log('Connected Firebase Storage emulator at localhost:9199');
//   } catch (e) {
//     // eslint-disable-next-line no-console
//     console.warn('Could not connect to Storage emulator:', e.message || e);
//   }
// }
export { app };
