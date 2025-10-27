import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoService } from '../../src/services/MemoService'
import { Memo } from '../../src/models/Memo'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock IndexedDB related methods
vi.mock('../../src/services/storage/IndexedDBService', () => ({
  IndexedDBService: {
    getInstance: () => ({
      updateSearchIndex: vi.fn().mockResolvedValue(undefined),
      removeFromSearchIndex: vi.fn().mockResolvedValue(undefined),
      searchMemos: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
      init: vi.fn().mockResolvedValue(true)
    })
  }
}))

describe('MemoService', () => {
  let service: MemoService

  beforeEach(() => {
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})
    
    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(MemoService as any).instance = null
    
    service = MemoService.getInstance()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MemoService.getInstance()
      const instance2 = MemoService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('createMemo', () => {
    it('should create a new memo', async () => {
      const memoData = {
        title: 'Test Memo',
        body: 'Test content',
        tags: ['test']
      }

      const result = await service.createMemo(memoData)

      expect(result).toBeInstanceOf(Memo)
      expect(result.title).toBe('Test Memo')
      expect(result.body).toBe('Test content')
      expect(result.tags).toEqual(['test'])
      expect(result.status).toBe('draft')
    })

    it('should throw error for invalid memo data', async () => {
      const invalidData = {
        title: '', // Empty title should cause validation error
        body: 'Test content'
      }

      await expect(service.createMemo(invalidData)).rejects.toThrow()
    })
  })

  describe('getMemo', () => {
    it('should return memo by id when memo exists', () => {
      const testMemo = new Memo({
        id: 'test-id',
        title: 'Test Memo',
        body: 'Test content'
      })

      // Mock localStorage to return test memo
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([testMemo.toJSON()]))

      const result = service.getMemo('test-id')

      expect(result).toBeInstanceOf(Memo)
      expect(result?.id).toBe('test-id')
      expect(result?.title).toBe('Test Memo')
    })

    it('should return null for non-existent memo', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = service.getMemo('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getAllMemos', () => {
    it('should return all memos', () => {
      const testMemos = [
        new Memo({ id: '1', title: 'Memo 1', body: 'Content 1' }),
        new Memo({ id: '2', title: 'Memo 2', body: 'Content 2' })
      ]

      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(testMemos.map(m => m.toJSON()))
      )

      const result = service.getAllMemos()

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Memo)
      expect(result[1]).toBeInstanceOf(Memo)
      expect(result[0].title).toBe('Memo 1')
      expect(result[1].title).toBe('Memo 2')
    })

    it('should return empty array when no memos exist', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)

      const result = service.getAllMemos()

      expect(result).toEqual([])
    })
  })

  describe('updateMemo', () => {
    it('should update existing memo', async () => {
      const existingMemo = new Memo({
        id: 'test-id',
        title: 'Original Title',
        body: 'Original content'
      })

      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify([existingMemo.toJSON()])
      )

      const updates = {
        title: 'Updated Title',
        body: 'Updated content'
      }

      const result = await service.updateMemo('test-id', updates)

      expect(result).toBeInstanceOf(Memo)
      expect(result.title).toBe('Updated Title')
      expect(result.body).toBe('Updated content')
    })

    it('should throw error for non-existent memo', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([]))

      await expect(service.updateMemo('non-existent', { title: 'New Title' }))
        .rejects.toThrow('更新対象のメモが見つかりません')
    })
  })

  describe('deleteMemo', () => {
    it('should delete existing memo', async () => {
      const existingMemo = new Memo({
        id: 'test-id',
        title: 'To Delete',
        body: 'Content'
      })

      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify([existingMemo.toJSON()])
      )

      await service.deleteMemo('test-id')

      // Should save empty array after deletion
      expect(localStorage.setItem).toHaveBeenCalledWith('testmemo_memos', JSON.stringify([]))
    })
  })

  describe('searchMemos', () => {
    it('should return empty array for empty query', async () => {
      const results = await service.searchMemos('')

      expect(results).toEqual([])
    })

    it('should return empty array for whitespace query', async () => {
      const results = await service.searchMemos('   ')

      expect(results).toEqual([])
    })
  })
})