import React, { useState, useCallback } from 'react'
import { XMarkIcon, AdjustmentsHorizontalIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import type { MemoStatus, Priority } from '../types'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableTags?: string[]
  availableProjects?: Array<{ id: string; name: string }>
}

export interface FilterState {
  status?: MemoStatus[]
  priority?: Priority[]
  tags?: string[]
  projectIds?: string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  hasAttachments?: boolean
  createdBy?: string
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

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags = [],
  availableProjects = []
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  // Handle status filter change
  const handleStatusChange = useCallback((status: MemoStatus) => {
    setLocalFilters(prev => {
      const currentStatus = prev.status || []
      const newStatus = currentStatus.includes(status)
        ? currentStatus.filter(s => s !== status)
        : [...currentStatus, status]
      
      return {
        ...prev,
        status: newStatus.length > 0 ? newStatus : undefined
      }
    })
  }, [])

  // Handle priority filter change
  const handlePriorityChange = useCallback((priority: Priority) => {
    setLocalFilters(prev => {
      const currentPriority = prev.priority || []
      const newPriority = currentPriority.includes(priority)
        ? currentPriority.filter(p => p !== priority)
        : [...currentPriority, priority]
      
      return {
        ...prev,
        priority: newPriority.length > 0 ? newPriority : undefined
      }
    })
  }, [])

  // Handle tag filter change
  const handleTagChange = useCallback((tag: string) => {
    setLocalFilters(prev => {
      const currentTags = prev.tags || []
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag]
      
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined
      }
    })
  }, [])

  // Handle project filter change
  const handleProjectChange = useCallback((projectId: string) => {
    setLocalFilters(prev => {
      const currentProjects = prev.projectIds || []
      const newProjects = currentProjects.includes(projectId)
        ? currentProjects.filter(p => p !== projectId)
        : [...currentProjects, projectId]
      
      return {
        ...prev,
        projectIds: newProjects.length > 0 ? newProjects : undefined
      }
    })
  }, [])

  // Handle date range change
  const handleDateRangeChange = useCallback((field: 'from' | 'to', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value ? new Date(value) : undefined
      }
    }))
  }, [])

  // Handle attachments filter
  const handleAttachmentsChange = useCallback((hasAttachments: boolean | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      hasAttachments
    }))
  }, [])

  // Apply filters
  const handleApply = useCallback(() => {
    onFiltersChange(localFilters)
    onClose()
  }, [localFilters, onFiltersChange, onClose])

  // Reset filters
  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }, [onFiltersChange])

  // Cancel changes
  const handleCancel = useCallback(() => {
    setLocalFilters(filters)
    onClose()
  }, [filters, onClose])

  if (!isOpen) return null

  const formatDateForInput = (date?: Date) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof FilterState]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined)
    }
    return value !== undefined
  })

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">ステータス</h3>
              <div className="space-y-2">
                {STATUS_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(localFilters.status || []).includes(option.value)}
                      onChange={() => handleStatusChange(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">優先度</h3>
              <div className="space-y-2">
                {PRIORITY_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(localFilters.priority || []).includes(option.value)}
                      onChange={() => handlePriorityChange(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <TagIcon className="h-4 w-4 mr-2" />
                  タグ
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(localFilters.tags || []).includes(tag)}
                        onChange={() => handleTagChange(tag)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">#{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Filter */}
            {availableProjects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">プロジェクト</h3>
                <div className="space-y-2">
                  {availableProjects.map(project => (
                    <label key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(localFilters.projectIds || []).includes(project.id)}
                        onChange={() => handleProjectChange(project.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                作成日
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">開始日</label>
                  <input
                    type="date"
                    value={formatDateForInput(localFilters.dateRange?.from)}
                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                  <input
                    type="date"
                    value={formatDateForInput(localFilters.dateRange?.to)}
                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Attachments Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">添付ファイル</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attachments"
                    checked={localFilters.hasAttachments === undefined}
                    onChange={() => handleAttachmentsChange(undefined)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">すべて</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attachments"
                    checked={localFilters.hasAttachments === true}
                    onChange={() => handleAttachmentsChange(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">添付ファイルあり</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attachments"
                    checked={localFilters.hasAttachments === false}
                    onChange={() => handleAttachmentsChange(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">添付ファイルなし</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                リセット
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  適用
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}