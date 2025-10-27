import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

// Firebase設定の有効性をチェック
const isFirebaseConfigured = (): boolean => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  
  console.log('Firebase設定チェック:', {
    projectId: projectId || '未設定',
    apiKey: apiKey ? `設定済み(${apiKey.substring(0, 10)}...)` : '未設定',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_FIREBASE'))
  })
  
  const isConfigured = !!(
    projectId &&
    apiKey &&
    projectId !== "testmemo-demo" &&
    apiKey !== "demo-api-key"
  )
  
  console.log('Firebase設定状態:', isConfigured ? '有効' : '無効')
  return isConfigured
}

// Firebase configuration - 本番環境では環境変数が必須
console.log('🔍 RAW ENV VARS:', {
  PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  API_KEY: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
  AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
}
  
// 開発環境では Firestore エミュレータを使用
const isDevelopment = import.meta.env.DEV
const useEmulator = isDevelopment && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

let app: FirebaseApp | null = null
let db: Firestore | null = null

export function initializeFirebase(): { app: FirebaseApp; db: Firestore } {
  if (app && db) {
    return { app, db }
  }

  // Firebase設定の検証
  if (!isFirebaseConfigured()) {
    console.warn('Firebase設定が無効です。ローカルストレージモードで動作します。')
    throw new Error('Firebase設定が不完全です。環境変数を設定してください。')
  }

  // 空の設定値をチェック
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.warn('Firebase設定値が空です。ローカルストレージモードで動作します。')
    throw new Error('Firebase設定値が空です。')
  }

  try {
    console.log('🔥 Firebase初期化開始:', firebaseConfig)
    console.log('🔥 使用予定プロジェクトID:', firebaseConfig.projectId)
    
    // もし testmemo-demo が含まれていたら警告
    if (JSON.stringify(firebaseConfig).includes('testmemo-demo')) {
      console.error('❌ CRITICAL: testmemo-demo が検出されました!', firebaseConfig)
      alert('エラー: testmemo-demo設定が検出されました。デバッグが必要です。')
    }

    // Firebase アプリを初期化
    app = initializeApp(firebaseConfig)
    console.log('✅ Firebase App初期化完了:', app.options.projectId)
    
    // Firestore を初期化
    db = getFirestore(app)
    console.log('Firestore初期化完了')
    
    // 開発環境でエミュレータを使用する場合
    if (useEmulator) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080)
        console.log('Firestore エミュレータに接続しました')
      } catch (error) {
        console.warn('Firestore エミュレータへの接続に失敗しました:', error)
        console.warn('本番のFirestoreを使用します')
      }
    }
    
    console.log('Firebase が正常に初期化されました:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    })
    return { app, db }
  } catch (error) {
    console.error('Firebase の初期化に失敗しました:', error)
    throw new Error(`Firebase の初期化に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null
  }
  
  if (!app) {
    try {
      const { app: initializedApp } = initializeFirebase()
      return initializedApp
    } catch (error) {
      console.error('Firebase初期化エラー:', error)
      return null
    }
  }
  return app
}

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) {
    return null
  }
  
  if (!db) {
    try {
      const { db: initializedDb } = initializeFirebase()
      return initializedDb
    } catch (error) {
      console.error('Firebase初期化エラー:', error)
      return null
    }
  }
  return db
}

// Firebase設定の有効性をチェックする関数をエクスポート
export { isFirebaseConfigured }