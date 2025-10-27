import { useState, useEffect, useCallback } from 'react'
import { MemoService } from '../services/MemoService'
import type { SyncStatus } from '../services/FirebaseService'
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
    isInitialSyncComplete: true, // 開発環境では常にtrue
    error: null
  })

  const memoService = MemoService.getInstance()

  // 同期状態の更新を監視（開発環境対応）
  useEffect(() => {
    const updateStatus = () => {
      try {
        const status = memoService.getSyncStatus()
        setSyncState(prev => ({
          ...prev,
          status,
          error: status.error
        }))
      } catch (error) {
        console.warn('同期ステータスの取得に失敗しました:', error)
      }
    }

    // 初期状態を設定
    updateStatus()

    // オンライン/オフライン状態の監視
    const handleOnline = () => {
      setSyncState(prev => ({
        ...prev,
        status: { ...prev.status, isOnline: true }
      }))
    }

    const handleOffline = () => {
      setSyncState(prev => ({
        ...prev,
        status: { ...prev.status, isOnline: false } 
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 定期的にステータスを更新（Firebase有効時のみ）
    const interval = setInterval(updateStatus, 10000) // 10秒間隔

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [memoService])

  // 手動同期
  const syncNow = useCallback(async (): Promise<Memo[]> => {
    try {
      setSyncState(prev => ({ 
        ...prev, 
        error: null,
        status: { ...prev.status, pendingUploads: prev.status.pendingUploads + 1 }
      }))
      
      const memos = await memoService.syncFromFirebase()
      
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        isInitialSyncComplete: true,
        status: {
          ...prev.status,
          pendingUploads: Math.max(0, prev.status.pendingUploads - 1),
          lastSyncTime: new Date(),
          error: null
        }
      }))
      
      return memos
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同期に失敗しました'
      setSyncState(prev => ({ 
        ...prev, 
        error: errorMessage,
        status: {
          ...prev.status,
          pendingUploads: Math.max(0, prev.status.pendingUploads - 1),
          error: errorMessage
        }
      }))
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