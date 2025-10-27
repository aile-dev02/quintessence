import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'

export interface SortOption {
  field: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status'
  direction: 'asc' | 'desc'
  label: string
}

interface SortSelectorProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  options?: SortOption[]
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { field: 'updatedAt', direction: 'desc', label: '更新日時（新しい順）' },
  { field: 'updatedAt', direction: 'asc', label: '更新日時（古い順）' },
  { field: 'createdAt', direction: 'desc', label: '作成日時（新しい順）' },
  { field: 'createdAt', direction: 'asc', label: '作成日時（古い順）' },
  { field: 'title', direction: 'asc', label: 'タイトル（A-Z）' },
  { field: 'title', direction: 'desc', label: 'タイトル（Z-A）' },
  { field: 'priority', direction: 'desc', label: '優先度（高い順）' },
  { field: 'priority', direction: 'asc', label: '優先度（低い順）' },
  { field: 'status', direction: 'asc', label: 'ステータス順' }
]

export const SortSelector: React.FC<SortSelectorProps> = ({
  currentSort,
  onSortChange,
  options = DEFAULT_SORT_OPTIONS
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle sort selection
  const handleSortSelect = (option: SortOption) => {
    onSortChange(option)
    setIsOpen(false)
  }

  // Get current sort label
  const currentLabel = options.find(
    option => option.field === currentSort.field && option.direction === currentSort.direction
  )?.label || currentSort.field

  // Get sort icon
  const getSortIcon = (option: SortOption) => {
    if (option.direction === 'asc') {
      return <ArrowUpIcon className="h-4 w-4 text-gray-400" />
    }
    return <ArrowDownIcon className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="mr-2">並び順:</span>
        <span className="text-gray-900">{currentLabel}</span>
        <ChevronDownIcon
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {options.map((option, index) => {
              const isSelected = 
                option.field === currentSort.field && 
                option.direction === currentSort.direction

              return (
                <button
                  key={`${option.field}-${option.direction}-${index}`}
                  onClick={() => handleSortSelect(option)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getSortIcon(option)}
                    <span>{option.label}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}