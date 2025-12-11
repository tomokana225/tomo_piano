import * as firebaseApp from 'firebase/app';

const initializeFirebase = async () => {
  // TypeScript might fail to find named exports in 'firebase/app' depending on the environment setup.
  // We use namespace import and explicit casting to ensure access to v9 modular functions.
  const appModule = firebaseApp as any;
  const getApps = appModule.getApps;
  const initializeApp = appModule.initializeApp;

  // getApps() を使用して、Firebaseがすでに初期化されているか確認します。
  if (getApps && getApps().length > 0) {
    // Firebaseはすでに初期化済みです。
    return;
  }
  
  try {
    const response = await fetch('/api/songs?action=getFirebaseConfig');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firebase設定の取得に失敗しました (Status: ${response.status}). ${errorText}`);
    }
    const firebaseConfig = await response.json();
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.error("Firebase設定にAPIキーがありません。Firebaseは初期化されません。");
      throw new Error("取得したFirebase設定にAPIキーが含まれていません。");
    }
    // Firebase v9+のモジュラー構文で初期化します。
    if (initializeApp) {
        initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error("Firebaseの初期化エラー:", error);
    // DOM操作を削除し、エラーをスローして呼び出し元で処理できるようにします。
    // これにより、アプリはレンダリングを停止する代わりに、フォールバック（例：モックデータモード）が可能になります。
    throw error;
  }
};

export { initializeFirebase };