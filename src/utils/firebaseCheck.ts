import { isFirebaseConfigured } from '../config/firebase'

export function checkFirebaseConfig() {
  console.log('=== Firebase Configuration Check ===')
  console.log('Firebase Configured:', isFirebaseConfigured())
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
  console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
  console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '設定済み' : '未設定')
  console.log('Environment:', import.meta.env.PROD ? 'Production' : 'Development')
  console.log('====================================')
}

// ブラウザのコンソールで実行可能
(window as any).checkFirebaseConfig = checkFirebaseConfig