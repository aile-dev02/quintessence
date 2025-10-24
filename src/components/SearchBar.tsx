import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { ClockIcon, TagIcon, DocumentTextIcon } from '@heroicons/react/24/solid'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchSubmit: (query: string) => void
  suggestions?: SearchSuggestion[]
  isLoading?: boolean
  placeholder?: string
  showFilters?: boolean
  onShowFilters?: () => void
}

interface SearchSuggestion {
  id: string
  type: 'recent' | 'tag' | 'memo'
  text: string
  icon?: React.ReactNode
}

const RECENT_SEARCHES_KEY = 'testmemo_recent_searches'
const MAX_RECENT_SEARCHES = 10

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  suggestions = [],
  isLoading = false,
  placeholder = 'メモを検索...',
  showFilters = false,
  onShowFilters
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onSearchChange(value)
    setShowSuggestions(value.length > 0 || isFocused)
  }, [onSearchChange, isFocused])

  // Add to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return

    setRecentSearches(prev => {
      const newSearches = [query, ...prev.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches))
      } catch (error) {
        console.warn('Failed to save recent searches:', error)
      }
      return newSearches
    })
  }, [])

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim())
      addToRecentSearches(searchQuery.trim())
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }, [searchQuery, onSearchSubmit, addToRecentSearches])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion | string) => {
    const query = typeof suggestion === 'string' ? suggestion : suggestion.text
    onSearchChange(query)
    onSearchSubmit(query)
    addToRecentSearches(query)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }, [onSearchChange, onSearchSubmit, addToRecentSearches])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (error) {
      console.warn('Failed to clear recent searches:', error)
    }
  }, [])

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setShowSuggestions(true)
  }, [])

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setIsFocused(false)
        setShowSuggestions(false)
      }
    }, 150)
  }, [])

  // Clear search
  const handleClear = useCallback(() => {
    onSearchChange('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [onSearchChange])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }, [])

  // Create combined suggestions
  const allSuggestions = [
    ...suggestions,
    ...recentSearches.map(search => ({
      id: `recent-${search}`,
      type: 'recent' as const,
      text: search,
      icon: <ClockIcon className="h-4 w-4 text-gray-400" />
    }))
  ]

  const showSuggestionsPanel = showSuggestions && (allSuggestions.length > 0 || searchQuery.length > 0)

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
              ${isLoading ? 'bg-gray-50' : 'bg-white'}
            `}
            disabled={isLoading}
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                aria-label="検索をクリア"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}

            {showFilters && onShowFilters && (
              <button
                type="button"
                onClick={onShowFilters}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                aria-label="フィルタを表示"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </button>
            )}

            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Panel */}
      {showSuggestionsPanel && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {/* No results message */}
          {searchQuery.length > 0 && allSuggestions.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              検索結果が見つかりませんでした
            </div>
          )}

          {/* Suggestions */}
          {allSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {suggestion.icon || (
                  suggestion.type === 'tag' ? (
                    <TagIcon className="h-4 w-4 text-blue-500" />
                  ) : suggestion.type === 'memo' ? (
                    <DocumentTextIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                  )
                )}
                <span className="text-sm text-gray-900">{suggestion.text}</span>
                {suggestion.type === 'recent' && (
                  <span className="text-xs text-gray-500 ml-auto">最近の検索</span>
                )}
              </div>
            </button>
          ))}

          {/* Clear recent searches */}
          {recentSearches.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                検索履歴をクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}