// FIX: Changed to a namespace import to resolve Firebase module errors, as named imports were failing.
import * as firebase from 'firebase/app';

const initializeFirebase = async () => {
  // FIX: Use `firebase.getApps()` with the namespace import.
  if (firebase.getApps().length > 0) {
    // Firebase is already initialized, do nothing.
    return;
  }
  
  try {
    const response = await fetch('/api/songs?action=getFirebaseConfig');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config');
    }
    const firebaseConfig = await response.json();
    if (!firebaseConfig.apiKey) {
      console.error("Firebase config is missing API key. Firebase will not be initialized.");
      return;
    }
    // FIX: Use `firebase.initializeApp()` with the namespace import.
    firebase.initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return;
  }
};

export { initializeFirebase };