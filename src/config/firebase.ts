import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'

// Firebase configuration
// 本番環境では環境変数から取得することを推奨します
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "testmemo-demo.firebaseapp.com",  
  projectId: "testmemo-demo",
  storageBucket: "testmemo-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
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
    
    console.log('Firebase が正常に初期化されました')
    return { app, db }
  } catch (error) {
    console.error('Firebase の初期化に失敗しました:', error)
    throw new Error('Firebase の初期化に失敗しました')
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