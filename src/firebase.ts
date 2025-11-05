import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';

let app: FirebaseApp;

const initializeFirebase = async () => {
  if (getApps().length) {
    app = getApp();
  } else {
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
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      return;
    }
  }
};

export { initializeFirebase };