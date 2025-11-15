import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeFirebase } from './firebase.ts';

// Firebaseの初期化を試みますが、レンダリングをブロックしません。
// これにより、初期化に失敗した場合でも、useApiフックがAPIエラーを処理し、
// 開発用のモックデータにフォールバックできます。
initializeFirebase().catch(err => {
  console.info("Firebaseの初期化に失敗しました。アプリケーションは開発モードで続行します。", err.message);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
