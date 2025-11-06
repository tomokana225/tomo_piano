// FIX: The original named import `import { initializeApp, getApps } from 'firebase/app';` was causing errors.
// Switched to a namespace import which is more robust against module resolution issues in some build environments.
import * as app from 'firebase/app';

const initializeFirebase = async () => {
  // Check if Firebase has already been initialized to avoid re-initialization errors.
  // This uses the v9+ modular syntax which is compatible with Firebase v10+.
  if (app.getApps().length > 0) {
    return;
  }
  
  try {
    // Fetch the Firebase configuration from our secure serverless function.
    // This is a good practice to avoid exposing config in client-side source code.
    const response = await fetch('/api/songs?action=getFirebaseConfig');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config from server. Status: ${response.status}`);
    }
    const firebaseConfig = await response.json();

    // A crucial check to ensure we have a valid configuration before proceeding.
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase config is invalid or missing an API key. Firebase will not be initialized.");
      return; // Stop initialization if config is bad.
    }

    // Initialize Firebase with the fetched configuration.
    app.initializeApp(firebaseConfig);

  } catch (error) {
    // Catch any errors during the fetch or initialization process and log them.
    // This prevents the entire app from crashing if Firebase can't be reached.
    console.error("Firebase initialization process failed:", error);
  }
};

export { initializeFirebase };