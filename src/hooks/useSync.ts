import { useState, useEffect, useCallback } from 'react'
import { MemoService } from '../services/MemoService'
import { FirebaseService, type SyncStatus } from '../services/FirebaseService'
import type { Memo } from '../types'

export interface SyncState {
  status: SyncStatus
  lastSyncTime: Date | null
  isInitialSyncComplete: boolean
  error: string | null
}

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: {
      isOnline: navigator.onLine,
      lastSyncTime: null,
      pendingUploads: 0,
      error: null
    },
    lastSyncTime: null,
    isInitialSyncComplete: false,
    error: null
  })

  const memoService = MemoService.getInstance()
  const firebaseService = FirebaseService.getInstance()

  // 同期状態の更新を監視
  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncState(prev => ({
        ...prev,
        status,
        error: status.error
      }))
    }

    // Firebase Service のイベントリスナーを設定
    firebaseService.on('statusChange', handleStatusChange)

    // 初期状態を設定
    setSyncState(prev => ({
      ...prev,
      status: firebaseService.getStatus()
    }))

    return () => {
      firebaseService.off('statusChange')
    }
  }, [firebaseService])

  // リアルタイム更新の処理
  useEffect(() => {
    const handleMemosUpdated = (memos: Memo[]) => {
      // メモが更新された場合の処理
      console.log('リアルタイム更新:', memos.length, '件のメモ')
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        isInitialSyncComplete: true
      }))
    }

    const handleError = (error: Error) => {
      setSyncState(prev => ({
        ...prev,
        error: error.message
      }))
    }

    firebaseService.on('memosUpdated', handleMemosUpdated)
    firebaseService.on('error', handleError)

    return () => {
      firebaseService.off('memosUpdated')
      firebaseService.off('error')
    }
  }, [firebaseService])

  // 手動同期
  const syncNow = useCallback(async (): Promise<Memo[]> => {
    try {
      setSyncState(prev => ({ ...prev, error: null }))
      const memos = await memoService.syncFromFirebase()
      
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        isInitialSyncComplete: true
      }))
      
      return memos
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同期に失敗しました'
      setSyncState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [memoService])

  // Firebase 同期の有効/無効切り替え
  const toggleSync = useCallback((enabled: boolean) => {
    memoService.setFirebaseSync(enabled)
  }, [memoService])

  // エラーをクリア
  const clearError = useCallback(() => {
    setSyncState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    syncState,
    syncNow,
    toggleSync,
    clearError,
    isOnline: syncState.status.isOnline,
    hasPendingUploads: syncState.status.pendingUploads > 0,
    canSync: syncState.status.isOnline && !syncState.status.error
  }
}