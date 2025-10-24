import React, { useState, useCallback, useMemo } from 'react'
import { SearchBar } from './SearchBar'
import { FilterPanel, type FilterState } from './FilterPanel'
import { SortSelector, type SortOption } from './SortSelector'
import { Memo } from '../models/Memo'
import { MemoService } from '../services/MemoService'

interface SearchAndFilterBarProps {
  memos: Memo[]
  onFilteredResults: (results: Memo[]) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  className?: string
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  memos,
  onFilteredResults,
  searchQuery,
  onSearchQueryChange,
  className = ''
}) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})
  const [currentSort, setCurrentSort] = useState<SortOption>({
    field: 'updatedAt',
    direction: 'desc',
    label: '更新日時（新しい順）'
  })

  const memoService = useMemo(() => MemoService.getInstance(), [])

  // Extract available tags and projects from memos
  const { availableTags, availableProjects } = useMemo(() => {
    const tags = new Set<string>()
    const projects = new Map<string, string>()

    memos.forEach(memo => {
      memo.tags.forEach(tag => tags.add(tag))
      if (memo.projectId) {
        projects.set(memo.projectId, `Project ${memo.projectId}`)
      }
    })

    return {
      availableTags: Array.from(tags).sort(),
      availableProjects: Array.from(projects.entries()).map(([id, name]) => ({ id, name }))
    }
  }, [memos])

  // Apply search and filters
  const applySearchAndFilters = useCallback(async (query: string, filterState: FilterState, sort: SortOption) => {
    try {
      let results: Memo[] = []

      // If there's a search query, use search functionality
      if (query.trim()) {
        const searchResults = await memoService.searchMemos(query)
        // Convert search results to Memo instances
        results = searchResults.map(result => {
          const existingMemo = memos.find(m => m.id === result.memo.id)
          return existingMemo || new Memo(result.memo)
        })
      } else {
        // Otherwise, start with all memos
        results = [...memos]
      }

      // Apply filters
      results = results.filter(memo => {
        // Status filter
        if (filterState.status && filterState.status.length > 0) {
          if (!filterState.status.includes(memo.status)) return false
        }

        // Priority filter
        if (filterState.priority && filterState.priority.length > 0) {
          if (!filterState.priority.includes(memo.priority)) return false
        }

        // Tags filter
        if (filterState.tags && filterState.tags.length > 0) {
          if (!filterState.tags.some(tag => memo.tags.includes(tag))) return false
        }

        // Project filter
        if (filterState.projectIds && filterState.projectIds.length > 0) {
          if (!memo.projectId || !filterState.projectIds.includes(memo.projectId)) return false
        }

        // Date range filter
        if (filterState.dateRange) {
          const createdAt = memo.createdAt
          if (filterState.dateRange.from && createdAt < filterState.dateRange.from) return false
          if (filterState.dateRange.to && createdAt > filterState.dateRange.to) return false
        }

        // Attachments filter
        if (filterState.hasAttachments !== undefined) {
          const hasAttachments = memo.attachmentIds.length > 0
          if (filterState.hasAttachments !== hasAttachments) return false
        }

        return true
      })

      // Apply sorting
      results.sort((a, b) => {
        let comparison = 0

        switch (sort.field) {
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime()
            break
          case 'updatedAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
            break
          case 'title':
            comparison = a.title.localeCompare(b.title, 'ja')
            break
          case 'priority': {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
            break
          }
          case 'status':
            comparison = a.status.localeCompare(b.status)
            break
        }

        return sort.direction === 'desc' ? -comparison : comparison
      })

      onFilteredResults(results)
    } catch (error) {
      console.error('Search and filter error:', error)
      onFilteredResults([])
    }
  }, [memos, memoService, onFilteredResults])

  // Handle search query change
  const handleSearchQueryChange = useCallback((query: string) => {
    onSearchQueryChange(query)
    applySearchAndFilters(query, filters, currentSort)
  }, [onSearchQueryChange, filters, currentSort, applySearchAndFilters])

  // Handle search submit
  const handleSearchSubmit = useCallback((query: string) => {
    applySearchAndFilters(query, filters, currentSort)
  }, [filters, currentSort, applySearchAndFilters])

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    applySearchAndFilters(searchQuery, newFilters, currentSort)
  }, [searchQuery, currentSort, applySearchAndFilters])

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setCurrentSort(newSort)
    applySearchAndFilters(searchQuery, filters, newSort)
  }, [searchQuery, filters, applySearchAndFilters])

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []

    const suggestions: Array<{
      id: string
      type: 'tag' | 'memo'
      text: string
    }> = []

    // Add matching tags
    availableTags
      .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .forEach(tag => {
        suggestions.push({
          id: `tag-${tag}`,
          type: 'tag',
          text: `#${tag}`
        })
      })

    // Add matching memo titles
    memos
      .filter(memo => 
        memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
      .forEach(memo => {
        suggestions.push({
          id: `memo-${memo.id}`,
          type: 'memo',
          text: memo.title
        })
      })

    return suggestions
  }, [searchQuery, availableTags, memos])

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof FilterState]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined)
      }
      return value !== undefined
    })
  }, [filters])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        onSearchSubmit={handleSearchSubmit}
        suggestions={searchSuggestions}
        showFilters={true}
        onShowFilters={() => setIsFilterPanelOpen(true)}
        placeholder="メモを検索... (タイトル、内容、タグ)"
      />

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">フィルタ適用中</span>
              <button
                onClick={() => handleFiltersChange({})}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                クリア
              </button>
            </div>
          )}
        </div>

        {/* Sort Selector */}
        <SortSelector
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableTags={availableTags}
        availableProjects={availableProjects}
      />
    </div>
  )
}