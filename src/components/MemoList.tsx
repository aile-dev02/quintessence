import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Memo } from '../models/Memo'
import { MemoService } from '../services/MemoService'

interface MemoListProps {
  onMemoSelect: (memo: Memo) => void
  onMemoEdit: (memo: Memo) => void
  onMemoDelete: (memo: Memo) => void
  selectedMemoId?: string
  searchQuery?: string
  onSelectionChange?: (selectedMemos: Memo[]) => void
  bulkSelectionMode?: boolean
}

interface SortOption {
  field: 'createdAt' | 'updatedAt' | 'title' | 'priority'
  direction: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 12
const PRIORITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 }
const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS = {
  draft: '下書き',
  published: '公開済み', 
  archived: 'アーカイブ'
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const PRIORITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急'
}

export const MemoList: React.FC<MemoListProps> = ({
  onMemoSelect,
  onMemoEdit,
  onMemoDelete,
  selectedMemoId,
  searchQuery = '',
  onSelectionChange: _onSelectionChange,
  bulkSelectionMode: _bulkSelectionMode = false
}) => {
  // Suppress unused variable warnings for future features
  void _onSelectionChange
  void _bulkSelectionMode
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOption] = useState<SortOption>({ field: 'updatedAt', direction: 'desc' })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Future feature: bulk selection
  // const [selectedMemoIds] = useState<Set<string>>(new Set())

  const memoService = useMemo(() => MemoService.getInstance(), [])

  // Load memos
  const loadMemos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const loadedMemos = memoService.getAllMemos()
      setMemos(loadedMemos)
    } catch (err) {
      setError('メモの読み込みに失敗しました')
      console.error('Failed to load memos:', err)
    } finally {
      setLoading(false)
    }
  }, [memoService])

  // Effect to load memos on mount
  useEffect(() => {
    loadMemos()
  }, [loadMemos])

  // Note: Selection handlers removed as they are not currently used
  // but bulkSelectionMode and onSelectionChange props are kept for future use

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    memos.forEach(memo => {
      memo.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [memos])

  // Filter and sort memos
  const filteredAndSortedMemos = useMemo(() => {
    let filtered = memos

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(memo =>
        memo.title.toLowerCase().includes(query) ||
        memo.body.toLowerCase().includes(query) ||
        memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(memo =>
        selectedTags.some(tag => memo.tags.includes(tag))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(memo => memo.status === statusFilter)
    }

    // Sort memos
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number

      switch (sortOption.field) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'priority':
          aValue = PRIORITY_ORDER[a.priority]
          bValue = PRIORITY_ORDER[b.priority]
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updatedAt':
        default:
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
      }

      if (sortOption.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [memos, searchQuery, selectedTags, statusFilter, sortOption])

  // Paginate memos
  const paginatedMemos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedMemos.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedMemos, currentPage])

  const totalPages = Math.ceil(filteredAndSortedMemos.length / ITEMS_PER_PAGE)

  // Handle memo deletion
  const handleDelete = async (memo: Memo) => {
    if (!confirm(`「${memo.title}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      await memoService.deleteMemo(memo.id)
      setMemos(prev => prev.filter(m => m.id !== memo.id))
      onMemoDelete(memo)
    } catch (err) {
      setError('メモの削除に失敗しました')
      console.error('Failed to delete memo:', err)
    }
  }

  // Handle tag filter toggle
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    setCurrentPage(1) // Reset to first page
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([])
    setStatusFilter('all')
    setCurrentPage(1)
  }

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'たった今'
    if (diffMinutes < 60) return `${diffMinutes}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    
    return date.toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>メモを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
        <button 
          onClick={loadMemos}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">メモ一覧</h2>
          <p className="text-gray-600">
            {filteredAndSortedMemos.length} 件のメモ
            {searchQuery && ` (「${searchQuery}」で検索)`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="draft">下書き</option>
              <option value="published">公開済み</option>
              <option value="archived">アーカイブ</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className={`px-2 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-gray-500">タグがありません</p>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedTags.length > 0 || statusFilter !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                フィルタをクリア
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Memo Cards */}
      {filteredAndSortedMemos.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">メモがありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedTags.length > 0 || statusFilter !== 'all'
              ? '検索条件に一致するメモが見つかりませんでした'
              : '最初のメモを作成してみましょう'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedMemos.map(memo => (
            <div
              key={memo.id}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                selectedMemoId === memo.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onMemoSelect(memo)}
            >
              {/* Card Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    {memo.title}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[memo.status]}`}>
                      {STATUS_LABELS[memo.status]}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[memo.priority]}`}>
                      {PRIORITY_LABELS[memo.priority]}
                    </span>
                  </div>
                </div>
                
                {/* Author info in header */}
                <div className="flex items-center mb-2">
                  <svg className="h-3 w-3 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-gray-600">by</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {memo.authorName || '不明なユーザー'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3">
                  {memo.getSummary(100)}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Tags */}
                {memo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {memo.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {memo.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{memo.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>作成: {formatRelativeTime(memo.createdAt)}</span>
                    {memo.attachmentIds.length > 0 && (
                      <span className="flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {memo.attachmentIds.length}
                      </span>
                    )}
                  </div>

                  {memo.isModified() && (
                    <div>更新: {formatRelativeTime(memo.updatedAt)}</div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMemoEdit(memo)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  編集
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(memo)
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedMemos.length)} / {filteredAndSortedMemos.length} 件
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i
              
              if (pageNumber < 1 || pageNumber > totalPages) return null
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 text-sm border-t border-b border-gray-300 hover:bg-gray-50 ${
                    currentPage === pageNumber ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}