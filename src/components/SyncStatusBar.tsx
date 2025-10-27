
import { 
  WifiIcon, 
  CloudIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import type { SyncState } from '../hooks/useSync'

interface SyncStatusBarProps {
  syncState: SyncState
  onSyncNow: () => Promise<void>
  onClearError: () => void
  className?: string
}

export function SyncStatusBar({ 
  syncState, 
  onSyncNow, 
  onClearError,
  className = '' 
}: SyncStatusBarProps) {
  const { status, error, isInitialSyncComplete } = syncState
  const { isOnline, pendingUploads, lastSyncTime } = status

  const getStatusIcon = () => {
    if (error) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    }
    if (!isOnline) {
      return <WifiIcon className="h-4 w-4 text-gray-400" />
    }
    if (pendingUploads > 0) {
      return <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (isInitialSyncComplete) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    }
    return <CloudIcon className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (error) {
      return `エラー: ${error}`
    }
    if (!isOnline) {
      return 'オフライン'
    }
    if (pendingUploads > 0) {
      return `同期中... (${pendingUploads}件)`
    }
    if (lastSyncTime) {
      const timeStr = lastSyncTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      return `最終同期: ${timeStr}`
    }
    return '同期待機中'
  }

  const getStatusColor = () => {
    if (error) return 'bg-red-50 text-red-700 border-red-200'
    if (!isOnline) return 'bg-gray-50 text-gray-600 border-gray-200'
    if (pendingUploads > 0) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (isInitialSyncComplete) return 'bg-green-50 text-green-700 border-green-200'
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  const handleSyncClick = async () => {
    if (!isOnline || pendingUploads > 0) return
    
    try {
      await onSyncNow()
    } catch (error) {
      console.error('手動同期に失敗しました:', error)
    }
  }

  return (
    <div className={`${className}`}>
      <div className={`
        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border
        ${getStatusColor()}
      `}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {/* 手動同期ボタン */}
        {isOnline && pendingUploads === 0 && (
          <button
            onClick={handleSyncClick}
            className="ml-3 p-1 rounded hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="手動同期"
            aria-label="手動同期を実行"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}

        {/* エラークリアボタン */}
        {error && (
          <button
            onClick={onClearError}
            className="ml-2 text-xs px-2 py-1 rounded hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="エラーをクリア"
          >
            ×
          </button>
        )}
      </div>

      {/* 詳細情報（開発モード時のみ表示） */}
      {import.meta.env.DEV && (
        <details className="mt-2 text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            同期状態の詳細
          </summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              isOnline,
              pendingUploads,
              lastSyncTime: lastSyncTime?.toISOString(),
              isInitialSyncComplete,
              error
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}