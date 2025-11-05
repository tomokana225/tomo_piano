import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp;
let storage: FirebaseStorage;

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
  
  try {
      storage = getStorage(app);
  } catch (e) {
      console.error("Failed to initialize Firebase Storage. Image uploads will not work.", e);
  }
};

export { initializeFirebase, storage };
