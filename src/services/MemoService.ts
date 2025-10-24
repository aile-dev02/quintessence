import type { 
  Memo as MemoInterface, 
  CreateMemoRequest, 
  UpdateMemoRequest, 
  MemoFilters,
  MemoSearchResult 
} from '../types'
import { Memo } from '../models/Memo'
import { LocalStorageService } from './storage/LocalStorageService'
import { IndexedDBService } from './storage/IndexedDBService'
import { ValidationError, StorageError } from '../utils/errors'

export class MemoService {
  private static readonly STORAGE_KEY = 'memos'
  private static instance: MemoService
  
  private localStorageService: LocalStorageService
  private indexedDBService: IndexedDBService

  private constructor() {
    this.localStorageService = LocalStorageService.getInstance()
    this.indexedDBService = IndexedDBService.getInstance()
  }

  static getInstance(): MemoService {
    if (!MemoService.instance) {
      MemoService.instance = new MemoService()
    }
    return MemoService.instance
  }

  /**
   * Create a new memo
   */
  async createMemo(request: CreateMemoRequest): Promise<Memo> {
    try {
      const memo = Memo.create({
        title: request.title,
        body: request.body,
        tags: request.tags || [],
        projectId: request.projectId,
        priority: 'medium'
      })

      // Store memo in LocalStorage
      this.storeMemo(memo)
      
      // Update search index for IndexedDB
      try {
        await this.indexedDBService.updateSearchIndex(memo)
      } catch (error) {
        console.warn('Search index update failed:', error)
      }

      return memo
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new StorageError('メモの作成に失敗しました', 'CREATE_FAILED', { error })
    }
  }

  /**
   * Get memo by ID
   */
  getMemo(id: string): Memo | null {
    try {
      const memos = this.localStorageService.get<MemoInterface[]>(MemoService.STORAGE_KEY) || []
      const memoFound = memos.find(m => m.id === id)
      return memoFound ? Memo.fromJSON(memoFound) : null
    } catch (error) {
      throw new StorageError('メモの取得に失敗しました', 'GET_FAILED', { id, error })
    }
  }

  /**
   * Get all memos with optional filters
   */
  getAllMemos(filters?: MemoFilters): Memo[] {
    try {
      const storedMemos = this.localStorageService.get<MemoInterface[]>(MemoService.STORAGE_KEY) || []
      let memos = storedMemos.map(m => Memo.fromJSON(m))

      // Apply filters
      if (filters) {
        memos = this.applyFilters(memos, filters)
      }

      // Sort by updated date (newest first)
      return memos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    } catch (error) {
      throw new StorageError('メモ一覧の取得に失敗しました', 'GET_ALL_FAILED', { error })
    }
  }

  /**
   * Update an existing memo
   */
  async updateMemo(id: string, request: UpdateMemoRequest): Promise<Memo> {
    try {
      const memo = this.getMemo(id)
      if (!memo) {
        throw new StorageError('更新対象のメモが見つかりません', 'NOT_FOUND', { id })
      }

      memo.update({
        title: request.title,
        body: request.body,
        tags: request.tags,
        projectId: request.projectId
      })

      this.storeMemo(memo)
      
      try {
        await this.indexedDBService.updateSearchIndex(memo)
      } catch (error) {
        console.warn('Search index update failed:', error)
      }

      return memo
    } catch (error) {
      if (error instanceof ValidationError || error instanceof StorageError) {
        throw error
      }
      throw new StorageError('メモの更新に失敗しました', 'UPDATE_FAILED', { id, error })
    }
  }

  /**
   * Delete a memo
   */
  async deleteMemo(id: string): Promise<void> {
    try {
      // Remove from LocalStorage
      const memos = this.localStorageService.get<MemoInterface[]>(MemoService.STORAGE_KEY) || []
      const filteredMemos = memos.filter(m => m.id !== id)
      this.localStorageService.set(MemoService.STORAGE_KEY, filteredMemos)

      // Remove from search index
      try {
        await this.indexedDBService.removeFromSearchIndex(id)
      } catch (error) {
        console.warn('Search index removal failed:', error)
      }
    } catch (error) {
      throw new StorageError('メモの削除に失敗しました', 'DELETE_FAILED', { id, error })
    }
  }

  /**
   * Search memos by query using IndexedDB search
   */
  async searchMemos(query: string, maxResults: number = 10): Promise<MemoSearchResult[]> {
    try {
      if (!query.trim()) {
        return []
      }

      // Use IndexedDB search functionality
      const searchResults = await this.indexedDBService.searchMemos(query)
      const results: MemoSearchResult[] = []

      for (let i = 0; i < Math.min(searchResults.length, maxResults); i++) {
        const searchRecord = searchResults[i]
        const memo = this.getMemo(searchRecord.id)
        
        if (memo) {
          const searchTerms = query.toLowerCase().split(' ').filter(term => term.length >= 2)
          const highlights = this.generateHighlights(memo, searchTerms)
          
          results.push({
            memo,
            score: searchResults.length - i, // Simple scoring based on order
            highlights
          })
        }
      }

      return results
    } catch (error) {
      // Fallback to simple local search
      return this.simpleSearch(query, maxResults)
    }
  }

  /**
   * Simple fallback search using LocalStorage only
   */
  private simpleSearch(query: string, maxResults: number): MemoSearchResult[] {
    try {
      const allMemos = this.getAllMemos()
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length >= 2)
      const results: MemoSearchResult[] = []

      allMemos.forEach(memo => {
        let score = 0
        const highlights: string[] = []

        searchTerms.forEach(term => {
          if (memo.title.toLowerCase().includes(term)) {
            score += 3
            highlights.push(`タイトル: ${memo.title}`)
          }
          if (memo.body.toLowerCase().includes(term)) {
            score += 2
            const context = this.extractContext(memo.body, term)
            if (context) highlights.push(`内容: ${context}`)
          }
          if (memo.tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 1
            const matchingTags = memo.tags.filter(tag => tag.toLowerCase().includes(term))
            highlights.push(`タグ: ${matchingTags.join(', ')}`)
          }
        })

        if (score > 0) {
          results.push({
            memo,
            score,
            highlights: highlights.slice(0, 3)
          })
        }
      })

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
    } catch (error) {
      console.error('Simple search failed:', error)
      return []
    }
  }

  /**
   * Extract context around search term
   */
  private extractContext(text: string, term: string, contextLength: number = 40): string {
    const lowerText = text.toLowerCase()
    const termIndex = lowerText.indexOf(term)
    
    if (termIndex === -1) return ''
    
    const start = Math.max(0, termIndex - contextLength)
    const end = Math.min(text.length, termIndex + term.length + contextLength)
    
    return `...${text.substring(start, end)}...`
  }

  /**
   * Get memos by project ID
   */
  getMemosByProject(projectId: string): Memo[] {
    const allMemos = this.getAllMemos()
    return allMemos.filter(memo => memo.projectId === projectId)
  }

  /**
   * Get memos by tags
   */
  getMemosByTags(tags: string[]): Memo[] {
    const allMemos = this.getAllMemos()
    return allMemos.filter(memo => 
      tags.some(tag => memo.tags.includes(tag))
    )
  }

  /**
   * Publish a memo
   */
  async publishMemo(id: string): Promise<Memo> {
    const memo = this.getMemo(id)
    if (!memo) {
      throw new StorageError('公開対象のメモが見つかりません', 'NOT_FOUND', { id })
    }

    memo.publish()
    this.storeMemo(memo)
    return memo
  }

  /**
   * Archive a memo
   */
  async archiveMemo(id: string): Promise<Memo> {
    const memo = this.getMemo(id)
    if (!memo) {
      throw new StorageError('アーカイブ対象のメモが見つかりません', 'NOT_FOUND', { id })
    }

    memo.archive()
    this.storeMemo(memo)
    return memo
  }

  /**
   * Clone a memo
   */
  async cloneMemo(id: string): Promise<Memo> {
    const originalMemo = this.getMemo(id)
    if (!originalMemo) {
      throw new StorageError('複製対象のメモが見つかりません', 'NOT_FOUND', { id })
    }

    const clonedMemo = originalMemo.clone()
    this.storeMemo(clonedMemo)
    
    try {
      await this.indexedDBService.updateSearchIndex(clonedMemo)
    } catch (error) {
      console.warn('Search index update failed:', error)
    }

    return clonedMemo
  }

  /**
   * Get memo statistics
   */
  getMemoStatistics(): {
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    totalTags: number
    recentCount: number
  } {
    const allMemos = this.getAllMemos()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const stats = {
      total: allMemos.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      totalTags: new Set(allMemos.flatMap(m => m.tags)).size,
      recentCount: allMemos.filter(m => m.createdAt > oneWeekAgo).length
    }

    // Count by status
    allMemos.forEach(memo => {
      stats.byStatus[memo.status] = (stats.byStatus[memo.status] || 0) + 1
      stats.byPriority[memo.priority] = (stats.byPriority[memo.priority] || 0) + 1
    })

    return stats
  }

  /**
   * Store memo in LocalStorage
   */
  private storeMemo(memo: Memo): void {
    const memoData = memo.toJSON()
    const memos = this.localStorageService.get<MemoInterface[]>(MemoService.STORAGE_KEY) || []
    const existingIndex = memos.findIndex(m => m.id === memo.id)
    
    if (existingIndex >= 0) {
      memos[existingIndex] = memoData
    } else {
      memos.push(memoData)
    }
    
    this.localStorageService.set(MemoService.STORAGE_KEY, memos)
  }

  /**
   * Apply filters to memo list
   */
  private applyFilters(memos: Memo[], filters: MemoFilters): Memo[] {
    return memos.filter(memo => {
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => memo.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      if (filters.projectId && memo.projectId !== filters.projectId) {
        return false
      }

      if (filters.dateFrom && memo.createdAt < filters.dateFrom) {
        return false
      }

      if (filters.dateTo && memo.createdAt > filters.dateTo) {
        return false
      }

      if (filters.hasAttachments !== undefined) {
        const hasAttachments = memo.attachmentIds.length > 0
        if (hasAttachments !== filters.hasAttachments) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Generate search result highlights
   */
  private generateHighlights(memo: Memo, searchTerms: string[]): string[] {
    const highlights: string[] = []
    
    searchTerms.forEach(term => {
      // Check title
      if (memo.title.toLowerCase().includes(term)) {
        highlights.push(`タイトル: ${memo.title}`)
      }
      
      // Check body (show context)
      const bodyLower = memo.body.toLowerCase()
      const termIndex = bodyLower.indexOf(term)
      if (termIndex !== -1) {
        const start = Math.max(0, termIndex - 20)
        const end = Math.min(memo.body.length, termIndex + term.length + 20)
        const context = memo.body.substring(start, end)
        highlights.push(`内容: ...${context}...`)
      }
      
      // Check tags
      const matchingTags = memo.tags.filter(tag => tag.toLowerCase().includes(term))
      if (matchingTags.length > 0) {
        highlights.push(`タグ: ${matchingTags.join(', ')}`)
      }
    })
    
    return highlights.slice(0, 3) // Limit to 3 highlights
  }
}