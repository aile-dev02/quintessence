import { useState, useCallback, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { MemoForm } from './components/MemoForm'
import { MemoList } from './components/MemoList'
import { MemoDetail } from './components/MemoDetail'
import { SearchAndFilterBar } from './components/SearchAndFilterBar'
import { SyncStatusBar } from './components/SyncStatusBar'
import { MemoService } from './services/MemoService'
import { Memo } from './models/Memo'
import { useSync } from './hooks/useSync'

// View types for navigation
type ViewType = 'list' | 'detail' | 'create' | 'edit' | 'stats'

interface AppState {
  currentView: ViewType
  selectedMemoId: string | null
  editingMemoId: string | null
  searchQuery: string
  memos: Memo[]
  filteredMemos: Memo[]
  selectedMemos: Memo[]
  isLoading: boolean
  error: string | null
  bulkProcessing: boolean
}

function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'list',
    selectedMemoId: null,
    editingMemoId: null,
    searchQuery: '',
    memos: [],
    filteredMemos: [],
    selectedMemos: [],
    isLoading: true,
    error: null,
    bulkProcessing: false
  })

  // 同期フックを使用
  const { syncState, syncNow, clearError } = useSync()

  const loadMemos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const memoService = MemoService.getInstance()
      
      // Firebase からの同期を試行（オンラインの場合）
      let memos: Memo[]
      if (syncState.status.isOnline) {
        try {
          memos = await memoService.syncFromFirebase()
        } catch (error) {
          console.warn('Firebase同期に失敗、ローカルデータを使用:', error)
          memos = memoService.getAllMemos()
        }
      } else {
        memos = memoService.getAllMemos()
      }
      
      setState(prev => ({ ...prev, memos, filteredMemos: memos, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'メモの読み込みに失敗しました',
        isLoading: false 
      }))
    }
  }, [syncState.status.isOnline])

  // Load memos on component mount
  useEffect(() => {
    loadMemos()
  }, [loadMemos])

  // Navigation handlers
  const handleViewChange = useCallback((view: ViewType, memoId?: string) => {
    setState(prev => ({
      ...prev,
      currentView: view,
      selectedMemoId: memoId || null,
      editingMemoId: view === 'edit' ? memoId || null : null
    }))
  }, [])

  const handleBackToList = useCallback(() => {
    handleViewChange('list')
  }, [handleViewChange])

  // Memo operations
  const handleMemoSelect = useCallback((memo: Memo) => {
    handleViewChange('detail', memo.id)
  }, [handleViewChange])

  const handleMemoEdit = useCallback((memo: Memo) => {
    handleViewChange('edit', memo.id)
  }, [handleViewChange])

  const handleMemoDelete = useCallback(async (memo: Memo) => {
    if (!confirm('このメモを削除しますか？')) return

    try {
      const memoService = MemoService.getInstance()
      await memoService.deleteMemo(memo.id)
      await loadMemos()
      handleBackToList()
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'メモの削除に失敗しました'
      }))
    }
  }, [loadMemos, handleBackToList])

  const handleMemoSave = useCallback(async (memo: Memo) => {
    try {
      console.log('Memo saved:', memo)
      await loadMemos()
      handleBackToList()
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'メモの保存に失敗しました'
      }))
    }
  }, [loadMemos, handleBackToList])

  // Filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const handleFilteredResults = useCallback((filteredMemos: Memo[]) => {
    setState(prev => ({ ...prev, filteredMemos }))
  }, [])

  // Get current memo for detail/edit views
  const currentMemo = state.selectedMemoId 
    ? state.memos.find(m => m.id === state.selectedMemoId)
    : undefined

  const editingMemo = state.editingMemoId
    ? state.memos.find(m => m.id === state.editingMemoId)
    : undefined

  // Error display
  // Error display component
  const errorDisplay = state.error ? (
    <div className="rounded-md bg-red-50 p-4 mb-6" role="alert" aria-live="polite">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{state.error}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              aria-label="エラーメッセージを閉じる"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 flex-shrink-0">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <rect x="4" y="2" width="20" height="26" rx="2" ry="2" fill="#3B82F6"/>
                  <line x1="7" y1="8" x2="21" y2="8" stroke="white" strokeWidth="0.5" opacity="0.7"/>
                  <line x1="7" y1="11" x2="19" y2="11" stroke="white" strokeWidth="0.5" opacity="0.7"/>
                  <line x1="7" y1="14" x2="20" y2="14" stroke="white" strokeWidth="0.5" opacity="0.7"/>
                  <line x1="7" y1="17" x2="18" y2="17" stroke="white" strokeWidth="0.5" opacity="0.7"/>
                  <line x1="7" y1="20" x2="21" y2="20" stroke="white" strokeWidth="0.5" opacity="0.7"/>
                  <circle cx="10" cy="23" r="3" fill="#10B981"/>
                  <text x="10" y="25" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">QA</text>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TestMemo</h1>
            </div>
            
            {/* Sync Status */}
            <div className="flex items-center space-x-4">
              <SyncStatusBar
                syncState={syncState}
                onSyncNow={async () => {
                  try {
                    await syncNow()
                    await loadMemos() // UIを更新
                  } catch (error) {
                    console.error('同期エラー:', error)
                  }
                }}
                onClearError={clearError}
              />
            </div>
            
            {/* Header actions based on current view */}
            <div className="flex items-center space-x-4">
              {state.currentView === 'list' && (
                <button
                  onClick={() => handleViewChange('create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="新しいメモを作成"
                >
                  <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  新規作成
                </button>
              )}
              
              {(state.currentView === 'detail' || state.currentView === 'create' || state.currentView === 'edit') && (
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="メモ一覧に戻る"
                >
                  一覧に戻る
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 同期エラーメッセージ */}
        {syncState.error && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm text-red-700">
                    同期エラー: {syncState.error}
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="エラーメッセージを閉じる"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="メインコンテンツ">
        {errorDisplay}
        
        {state.currentView === 'list' && (
          <>
            <SearchAndFilterBar
              memos={state.memos}
              onFilteredResults={handleFilteredResults}
              searchQuery={state.searchQuery}
              onSearchQueryChange={handleSearchChange}
              className="mb-6"
            />
            <MemoList
              onMemoSelect={handleMemoSelect}
              onMemoEdit={handleMemoEdit}
              onMemoDelete={handleMemoDelete}
              selectedMemoId={state.selectedMemoId || undefined}
              searchQuery={state.searchQuery}
            />
          </>
        )}

        {state.currentView === 'detail' && currentMemo && (
          <MemoDetail
            memo={currentMemo}
            onEdit={() => handleMemoEdit(currentMemo)}
            onDelete={() => handleMemoDelete(currentMemo)}
            onClose={handleBackToList}
          />
        )}

        {state.currentView === 'create' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">新しいメモを作成</h2>
            <MemoForm
              onSave={handleMemoSave}
              onCancel={handleBackToList}
            />
          </div>
        )}

        {state.currentView === 'edit' && editingMemo && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">メモを編集</h2>
            <MemoForm
              memo={editingMemo}
              onSave={handleMemoSave}
              onCancel={handleBackToList}
              isEditing={true}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
