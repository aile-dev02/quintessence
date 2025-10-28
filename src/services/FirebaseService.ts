import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore'
import { getFirebaseDb } from '../config/firebase'
import type { Memo as MemoInterface } from '../types'
import { Memo } from '../models/Memo'
import { StorageError } from '../utils/errors'

export interface SyncStatus {
  isOnline: boolean
  lastSyncTime: Date | null
  pendingUploads: number
  error: string | null
}

export interface FirebaseServiceEvents {
  statusChange: (status: SyncStatus) => void
  memosUpdated: (memos: Memo[]) => void
  error: (error: Error) => void
}

export class FirebaseService {
  private static instance: FirebaseService
  private db: any = null
  private readonly COLLECTION_NAME = 'memos'
  private unsubscribeCallbacks: Unsubscribe[] = []
  private eventListeners: Partial<FirebaseServiceEvents> = {}
  private currentStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSyncTime: null, 
    pendingUploads: 0,
    error: null
  }

  private constructor() {
    this.db = getFirebaseDb()
    if (!this.db) {
      throw new Error('Firebase設定が無効です。環境変数を確認してください。')
    }
    this.initializeNetworkListeners()
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService()
    }
    return FirebaseService.instance
  }

  /**
   * イベントリスナーを設定
   */
  on<K extends keyof FirebaseServiceEvents>(event: K, listener: FirebaseServiceEvents[K]): void {
    this.eventListeners[event] = listener
  }

  /**
   * イベントリスナーを削除
   */
  off<K extends keyof FirebaseServiceEvents>(event: K): void {
    delete this.eventListeners[event]
  }

  /**
   * 現在の同期ステータスを取得
   */
  getStatus(): SyncStatus {
    return { ...this.currentStatus }
  }

  /**
   * オンライン状態を確認
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline
  }

  /**
   * メモを作成（Firestoreに保存）
   */
  async createMemo(memo: MemoInterface): Promise<string> {
    try {
      if (!this.isOnline()) {
        throw new StorageError('オフライン中は新規作成できません', 'OFFLINE', { memo })
      }

      this.updateStatus({ pendingUploads: this.currentStatus.pendingUploads + 1 })

      const docRef = await addDoc(collection(this.db, this.COLLECTION_NAME), {
        ...memo,
        createdAt: memo.createdAt.toISOString(),
        updatedAt: memo.updatedAt.toISOString(),
        syncedAt: new Date().toISOString()
      })

      this.updateStatus({ 
        pendingUploads: this.currentStatus.pendingUploads - 1,
        lastSyncTime: new Date(),
        error: null
      })

      return docRef.id
    } catch (error) {
      this.updateStatus({ 
        pendingUploads: Math.max(0, this.currentStatus.pendingUploads - 1),
        error: error instanceof Error ? error.message : '作成に失敗しました'
      })
      throw new StorageError('メモの作成に失敗しました', 'CREATE_FAILED', { error })
    }
  }

  /**
   * メモを更新（Firestoreで更新）
   */
  async updateMemo(id: string, memo: MemoInterface): Promise<void> {
    try {
      if (!this.isOnline()) {
        throw new StorageError('オフライン中は更新できません', 'OFFLINE', { id, memo })
      }

      this.updateStatus({ pendingUploads: this.currentStatus.pendingUploads + 1 })

      const docRef = doc(this.db, this.COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...memo,
        createdAt: memo.createdAt.toISOString(),
        updatedAt: memo.updatedAt.toISOString(),
        syncedAt: new Date().toISOString()
      })

      this.updateStatus({ 
        pendingUploads: this.currentStatus.pendingUploads - 1,
        lastSyncTime: new Date(),
        error: null
      })
    } catch (error) {
      this.updateStatus({ 
        pendingUploads: Math.max(0, this.currentStatus.pendingUploads - 1),
        error: error instanceof Error ? error.message : '更新に失敗しました'
      })
      throw new StorageError('メモの更新に失敗しました', 'UPDATE_FAILED', { id, error })
    }
  }

  /**
   * メモを削除（Firestoreから削除）
   */
  async deleteMemo(id: string): Promise<void> {
    try {
      if (!this.isOnline()) {
        throw new StorageError('オフライン中は削除できません', 'OFFLINE', { id })
      }

      this.updateStatus({ pendingUploads: this.currentStatus.pendingUploads + 1 })

      const docRef = doc(this.db, this.COLLECTION_NAME, id)
      await deleteDoc(docRef)

      this.updateStatus({ 
        pendingUploads: this.currentStatus.pendingUploads - 1,
        lastSyncTime: new Date(),
        error: null
      })
    } catch (error) {
      this.updateStatus({ 
        pendingUploads: Math.max(0, this.currentStatus.pendingUploads - 1),
        error: error instanceof Error ? error.message : '削除に失敗しました'
      })
      throw new StorageError('メモの削除に失敗しました', 'DELETE_FAILED', { id, error })
    }
  }

  /**
   * メモを取得（Firestoreから）
   */
  async getMemo(id: string): Promise<Memo | null> {
    try {
      const docRef = doc(this.db, this.COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return this.convertFirestoreDataToMemo(docSnap.id, data)
      }
      
      return null
    } catch (error) {
      throw new StorageError('メモの取得に失敗しました', 'GET_FAILED', { id, error })
    }
  }

  /**
   * 全てのメモを取得（Firestoreから）
   */
  async getAllMemos(): Promise<Memo[]> {
    try {
      const q = query(
        collection(this.db, this.COLLECTION_NAME),
        orderBy('updatedAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const memos: Memo[] = []
      querySnapshot.forEach((doc) => {
        const memo = this.convertFirestoreDataToMemo(doc.id, doc.data())
        if (memo) {
          memos.push(memo)
        }
      })

      this.updateStatus({ 
        lastSyncTime: new Date(),
        error: null
      })

      return memos
    } catch (error) {
      this.updateStatus({ 
        error: error instanceof Error ? error.message : '取得に失敗しました'
      })
      throw new StorageError('メモ一覧の取得に失敗しました', 'GET_ALL_FAILED', { error })
    }
  }

  /**
   * リアルタイム同期を開始
   */
  startRealtimeSync(): void {
    try {
      const q = query(
        collection(this.db, this.COLLECTION_NAME),
        orderBy('updatedAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const memos: Memo[] = []
          querySnapshot.forEach((doc) => {
            const memo = this.convertFirestoreDataToMemo(doc.id, doc.data())
            if (memo) {
              memos.push(memo)
            }
          })

          // イベントを通知
          if (this.eventListeners.memosUpdated) {
            this.eventListeners.memosUpdated(memos)
          }

          this.updateStatus({ 
            lastSyncTime: new Date(),
            error: null
          })
        },
        (error) => {
          console.error('リアルタイム同期エラー:', error)
          this.updateStatus({ 
            error: error.message || 'リアルタイム同期に失敗しました'
          })
          
          if (this.eventListeners.error) {
            this.eventListeners.error(error)
          }
        }
      )

      this.unsubscribeCallbacks.push(unsubscribe)
    } catch (error) {
      console.error('リアルタイム同期の開始に失敗しました:', error)
      this.updateStatus({ 
        error: error instanceof Error ? error.message : 'リアルタイム同期の開始に失敗しました'
      })
    }
  }

  /**
   * リアルタイム同期を停止
   */
  stopRealtimeSync(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe())
    this.unsubscribeCallbacks = []
  }

  /**
   * Firestoreデータをメモオブジェクトに変換
   */
  private convertFirestoreDataToMemo(id: string, data: DocumentData): Memo | null {
    try {
      const memoData: MemoInterface = {
        id: id,
        title: data.title || '',
        body: data.body || '',
        tags: data.tags || [],
        projectId: data.projectId || null,
        priority: data.priority || 'medium',
        status: data.status || 'draft',
        attachmentIds: data.attachmentIds || [],
        linkedCards: data.linkedCards || [],
        authorId: data.authorId || '',
        authorName: data.authorName || '',
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      }

      return Memo.fromJSON(memoData)
    } catch (error) {
      console.error('Firestoreデータの変換に失敗しました:', error, data)
      return null
    }
  }

  /**
   * ネットワーク状態の監視を初期化
   */
  private initializeNetworkListeners(): void {
    const handleOnline = () => {
      console.log('オンラインになりました')
      this.updateStatus({ isOnline: true, error: null })
      enableNetwork(this.db).catch(console.error)
    }

    const handleOffline = () => {
      console.log('オフラインになりました')  
      this.updateStatus({ isOnline: false })
      disableNetwork(this.db).catch(console.error)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初期状態を設定
    this.updateStatus({ isOnline: navigator.onLine })
  }

  /**
   * ステータスを更新してイベントを発火
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates }
    
    if (this.eventListeners.statusChange) {
      this.eventListeners.statusChange(this.getStatus())
    }
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.stopRealtimeSync()
    this.eventListeners = {}
    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
  }
}