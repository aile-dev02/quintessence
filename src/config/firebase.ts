import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "testmemo-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "testmemo-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "testmemo-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

// デモ用の設定（実際のFirebaseプロジェクトを作成する場合は上記の値を置き換えてください）
// 開発環境では Firestore エミュレータを使用
const isDevelopment = import.meta.env.DEV
const useEmulator = isDevelopment && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false'

let app: FirebaseApp | null = null
let db: Firestore | null = null

export function initializeFirebase(): { app: FirebaseApp; db: Firestore } {
  if (app && db) {
    return { app, db }
  }

  try {
    // Firebase設定を検証
    if (!firebaseConfig.projectId || firebaseConfig.projectId === "testmemo-demo") {
      throw new Error('有効なFirebaseプロジェクトIDが設定されていません')
    }

    // Firebase アプリを初期化
    app = initializeApp(firebaseConfig)
    
    // Firestore を初期化
    db = getFirestore(app)
    
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

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const { app: initializedApp } = initializeFirebase()
    return initializedApp
  }
  return app
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const { db: initializedDb } = initializeFirebase()
    return initializedDb
  }
  return db
}