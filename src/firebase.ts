import { initializeApp, getApps } from 'firebase/app';

const initializeFirebase = async () => {
  // Firebase is already initialized, do nothing.
  if (getApps().length > 0) {
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
    initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return;
  }
};

export { initializeFirebase };