import { useState, useCallback, useEffect } from 'react'
import { PlusIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { MemoForm } from './components/MemoForm'
import { MemoList } from './components/MemoList'
import { MemoDetail } from './components/MemoDetail'
import { SearchAndFilterBar } from './components/SearchAndFilterBar'
import { MemoService } from './services/MemoService'
import { Memo } from './models/Memo'

// View types for navigation
type ViewType = 'list' | 'detail' | 'create' | 'edit'

interface AppState {
  currentView: ViewType
  selectedMemoId: string | null
  editingMemoId: string | null
  searchQuery: string
  memos: Memo[]
  filteredMemos: Memo[]
  isLoading: boolean
  error: string | null
}

function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'list',
    selectedMemoId: null,
    editingMemoId: null,
    searchQuery: '',
    memos: [],
    filteredMemos: [],
    isLoading: true,
    error: null
  })

  const loadMemos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const memoService = MemoService.getInstance()
      const memos = memoService.getAllMemos()
      setState(prev => ({ ...prev, memos, filteredMemos: memos, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'メモの読み込みに失敗しました',
        isLoading: false 
      }))
    }
  }, [])

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
  const errorDisplay = state.error && (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{state.error}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              onClick={() => setState(prev => ({ ...prev, error: null }))}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bars3Icon className="h-6 w-6 text-gray-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">TestMemo</h1>
            </div>
            
            {/* Header actions based on current view */}
            <div className="flex items-center space-x-4">
              {state.currentView === 'list' && (
                <button
                  onClick={() => handleViewChange('create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  新規作成
                </button>
              )}
              
              {(state.currentView === 'detail' || state.currentView === 'create' || state.currentView === 'edit') && (
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  一覧に戻る
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
