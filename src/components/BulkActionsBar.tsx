import React, { useState, useCallback } from 'react'
import { 
  TrashIcon, 
  TagIcon, 
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Memo } from '../models/Memo'
import type { MemoStatus, Priority } from '../types'

interface BulkActionsBarProps {
  selectedMemos: Memo[]
  onBulkDelete: (memoIds: string[]) => Promise<void>
  onBulkStatusChange: (memoIds: string[], status: MemoStatus) => Promise<void>
  onBulkPriorityChange: (memoIds: string[], priority: Priority) => Promise<void>
  onBulkTagAdd: (memoIds: string[], tags: string[]) => Promise<void>
  onBulkDuplicate: (memoIds: string[]) => Promise<void>
  onClearSelection: () => void
  isProcessing?: boolean
}

const STATUS_OPTIONS: Array<{ value: MemoStatus; label: string; color: string }> = [
  { value: 'draft', label: '下書き', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'published', label: '公開済み', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'アーカイブ', color: 'bg-gray-100 text-gray-800' }
]

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; color: string }> = [
  { value: 'critical', label: '緊急', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: '高', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: '中', color: 'bg-blue-100 text-blue-800' },
  { value: 'low', label: '低', color: 'bg-gray-100 text-gray-800' }
]

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedMemos,
  onBulkDelete,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkTagAdd,
  onBulkDuplicate,
  onClearSelection,
  isProcessing = false
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const selectedIds = selectedMemos.map(memo => memo.id)

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`選択した${selectedMemos.length}件のメモを削除しますか？`)) return
    
    try {
      await onBulkDelete(selectedIds)
      onClearSelection()
    } catch (error) {
      console.error('Bulk delete failed:', error)
    }
  }, [selectedMemos.length, selectedIds, onBulkDelete, onClearSelection])

  // Handle bulk status change
  const handleStatusChange = useCallback(async (status: MemoStatus) => {
    try {
      await onBulkStatusChange(selectedIds, status)
      setShowStatusMenu(false)
      onClearSelection()
    } catch (error) {
      console.error('Bulk status change failed:', error)
    }
  }, [selectedIds, onBulkStatusChange, onClearSelection])

  // Handle bulk priority change
  const handlePriorityChange = useCallback(async (priority: Priority) => {
    try {
      await onBulkPriorityChange(selectedIds, priority)
      setShowPriorityMenu(false)
      onClearSelection()
    } catch (error) {
      console.error('Bulk priority change failed:', error)
    }
  }, [selectedIds, onBulkPriorityChange, onClearSelection])

  // Handle bulk tag add
  const handleTagAdd = useCallback(async () => {
    const tags = tagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    if (tags.length === 0) return

    try {
      await onBulkTagAdd(selectedIds, tags)
      setTagInput('')
      setShowTagInput(false)
      onClearSelection()
    } catch (error) {
      console.error('Bulk tag add failed:', error)
    }
  }, [tagInput, selectedIds, onBulkTagAdd, onClearSelection])

  // Handle bulk duplicate
  const handleBulkDuplicate = useCallback(async () => {
    try {
      await onBulkDuplicate(selectedIds)
      onClearSelection()
    } catch (error) {
      console.error('Bulk duplicate failed:', error)
    }
  }, [selectedIds, onBulkDuplicate, onClearSelection])

  if (selectedMemos.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Selection info */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              {selectedMemos.length}件選択中
            </span>
            <button
              onClick={onClearSelection}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              disabled={isProcessing}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Status Change */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={isProcessing}
              >
                <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                ステータス変更
              </button>
              
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    {STATUS_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Change */}
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={isProcessing}
              >
                優先度変更
              </button>
              
              {showPriorityMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="py-1">
                    {PRIORITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handlePriorityChange(option.value)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tag Add */}
            <div className="relative">
              {showTagInput ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleTagAdd()
                      } else if (e.key === 'Escape') {
                        setShowTagInput(false)
                        setTagInput('')
                      }
                    }}
                    placeholder="タグをカンマ区切りで入力"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-64"
                    autoFocus
                  />
                  <button
                    onClick={handleTagAdd}
                    className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                    disabled={!tagInput.trim()}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowTagInput(false)
                      setTagInput('')
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  <TagIcon className="h-4 w-4 mr-2" />
                  タグ追加
                </button>
              )}
            </div>

            {/* Duplicate */}
            <button
              onClick={handleBulkDuplicate}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              disabled={isProcessing}
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              複製
            </button>

            {/* Delete */}
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              disabled={isProcessing}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              削除
            </button>
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-2"></div>
              処理中...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}