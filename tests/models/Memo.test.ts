import { describe, it, expect, beforeEach } from 'vitest'
import { Memo } from '../../src/models/Memo'
import type { MemoStatus, Priority } from '../../src/types'

describe('Memo Model', () => {
  let memo: Memo
  
  beforeEach(() => {
    memo = new Memo({
      title: 'Test Memo',
      body: 'This is a test memo content',
      tags: ['test', 'unit'],
      priority: 'medium',
      status: 'draft'
    })
  })

  describe('Constructor', () => {
    it('should create a memo with default values', () => {
      const defaultMemo = new Memo()
      
      expect(defaultMemo.id).toBeDefined()
      expect(defaultMemo.title).toBe('')
      expect(defaultMemo.body).toBe('')
      expect(defaultMemo.tags).toEqual([])
      expect(defaultMemo.attachmentIds).toEqual([])
      expect(defaultMemo.status).toBe('draft')
      expect(defaultMemo.priority).toBe('medium')
      expect(defaultMemo.projectId).toBeNull()
      expect(defaultMemo.createdAt).toBeInstanceOf(Date)
      expect(defaultMemo.updatedAt).toBeInstanceOf(Date)
      expect(defaultMemo.linkedCards).toEqual([])
    })

    it('should create a memo with provided values', () => {
      expect(memo.title).toBe('Test Memo')
      expect(memo.body).toBe('This is a test memo content')
      expect(memo.tags).toEqual(['test', 'unit'])
      expect(memo.priority).toBe('medium')
      expect(memo.status).toBe('draft')
    })

    it('should generate unique IDs for different memos', () => {
      const memo1 = new Memo()
      const memo2 = new Memo()
      
      expect(memo1.id).not.toBe(memo2.id)
    })
  })

  describe('update method', () => {
    it('should update memo properties', () => {
      const originalUpdatedAt = memo.updatedAt
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        memo.update({
          title: 'Updated Title',
          body: 'Updated content',
          status: 'published' as MemoStatus
        })

        expect(memo.title).toBe('Updated Title')
        expect(memo.body).toBe('Updated content')
        expect(memo.status).toBe('published')
        expect(memo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      }, 10)
    })

    it('should not update invalid properties', () => {
      const originalId = memo.id
      const originalCreatedAt = memo.createdAt

      memo.update({
        id: 'new-id',
        createdAt: new Date('2020-01-01')
      } as Partial<Memo>)

      expect(memo.id).toBe(originalId)
      expect(memo.createdAt).toEqual(originalCreatedAt)
    })
  })

  describe('addTag method', () => {
    it('should add a new tag', () => {
      memo.addTag('important')
      
      expect(memo.tags).toContain('important')
      expect(memo.tags).toHaveLength(3)
    })

    it('should not add duplicate tags', () => {
      expect(() => memo.addTag('test')).toThrow('重複するタグがあります')
      
      expect(memo.tags).toEqual(['test', 'unit'])
      expect(memo.tags).toHaveLength(2)
    })

    it('should trim whitespace from tags', () => {
      memo.addTag('  spaced  ')
      
      expect(memo.tags).toContain('spaced')
      expect(memo.tags).not.toContain('  spaced  ')
    })

    it('should not add empty tags', () => {
      const originalLength = memo.tags.length
      
      expect(() => memo.addTag('')).toThrow('タグが空です')
      expect(() => memo.addTag('   ')).toThrow('タグが空です')
      
      expect(memo.tags).toHaveLength(originalLength)
    })
  })

  describe('removeTag method', () => {
    it('should remove an existing tag', () => {
      memo.removeTag('test')
      
      expect(memo.tags).not.toContain('test')
      expect(memo.tags).toEqual(['unit'])
    })

    it('should do nothing if tag does not exist', () => {
      const originalTags = [...memo.tags]
      
      memo.removeTag('nonexistent')
      
      expect(memo.tags).toEqual(originalTags)
    })
  })

  describe('addAttachment method', () => {
    it('should add an attachment ID', () => {
      memo.addAttachment('attachment-1')
      
      expect(memo.attachmentIds).toContain('attachment-1')
      expect(memo.attachmentIds).toHaveLength(1)
    })

    it('should not add duplicate attachment IDs', () => {
      memo.addAttachment('attachment-1')
      memo.addAttachment('attachment-1')
      
      expect(memo.attachmentIds).toEqual(['attachment-1'])
    })
  })

  describe('removeAttachment method', () => {
    beforeEach(() => {
      memo.addAttachment('attachment-1')
      memo.addAttachment('attachment-2')
    })

    it('should remove an existing attachment', () => {
      memo.removeAttachment('attachment-1')
      
      expect(memo.attachmentIds).not.toContain('attachment-1')
      expect(memo.attachmentIds).toEqual(['attachment-2'])
    })

    it('should do nothing if attachment does not exist', () => {
      const originalAttachments = [...memo.attachmentIds]
      
      memo.removeAttachment('nonexistent')
      
      expect(memo.attachmentIds).toEqual(originalAttachments)
    })
  })

  describe('linkedCards property', () => {
    it('should initialize with empty array by default', () => {
      expect(memo.linkedCards).toEqual([])
    })

    it('should handle linked cards through constructor', () => {
      const memoWithCards = new Memo({ 
        title: 'Test', 
        body: 'Test body',
        linkedCards: ['card-1', 'card-2']
      })
      
      expect(memoWithCards.linkedCards).toEqual(['card-1', 'card-2'])
    })
  })

  describe('publish and archive methods', () => {
    it('should publish memo', () => {
      memo.publish()
      expect(memo.status).toBe('published')
    })

    it('should archive memo', () => {
      memo.archive()
      expect(memo.status).toBe('archived')
    })

    it('should update timestamp when publishing', () => {
      const originalTime = memo.updatedAt.getTime()
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        memo.publish()
        expect(memo.updatedAt.getTime()).toBeGreaterThan(originalTime)
      }, 1)
    })
  })

  describe('clone method', () => {
    it('should create a copy of the memo with new ID', () => {
      const cloned = memo.clone()
      
      expect(cloned.id).not.toBe(memo.id)
      expect(cloned.title).toBe(`${memo.title} (コピー)`)
      expect(cloned.body).toBe(memo.body)
      expect(cloned.tags).toEqual(memo.tags)
      expect(cloned.priority).toBe(memo.priority)
      expect(cloned.status).toBe('draft') // Status is reset to draft
      expect(cloned.attachmentIds).toEqual(memo.attachmentIds)
      expect(cloned.linkedCards).toEqual(memo.linkedCards)
    })

    it('should create independent copies', () => {
      const cloned = memo.clone()
      
      cloned.addTag('cloned-tag')
      
      expect(memo.tags).not.toContain('cloned-tag')
      expect(cloned.tags).toContain('cloned-tag')
    })
  })

  describe('toJSON method', () => {
    it('should serialize memo to JSON', () => {
      const json = memo.toJSON()
      
      expect(json).toHaveProperty('id', memo.id)
      expect(json).toHaveProperty('title', memo.title)
      expect(json).toHaveProperty('body', memo.body)
      expect(json).toHaveProperty('tags', memo.tags)
      expect(json).toHaveProperty('status', memo.status)
      expect(json).toHaveProperty('priority', memo.priority)
      expect(json).toHaveProperty('createdAt')
      expect(json).toHaveProperty('updatedAt')
    })

    it('should include all properties in JSON', () => {
      const json = memo.toJSON()
      const expectedKeys = [
        'id', 'title', 'body', 'tags', 'attachmentIds', 
        'status', 'priority', 'projectId', 'createdAt', 
        'updatedAt', 'linkedCards'
      ]
      
      expectedKeys.forEach(key => {
        expect(json).toHaveProperty(key)
      })
    })
  })

  describe('fromJSON static method', () => {
    it('should create memo from JSON data', () => {
      const jsonData = {
        id: 'test-id',
        title: 'JSON Memo',
        body: 'Created from JSON',
        tags: ['json', 'test'],
        status: 'published' as MemoStatus,
        priority: 'high' as Priority,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        attachmentIds: ['att-1'],
        linkedCards: ['card-1'],
        projectId: 'project-1'
      }
      
      const memo = Memo.fromJSON(jsonData)
      
      expect(memo.id).toBe('test-id')
      expect(memo.title).toBe('JSON Memo')
      expect(memo.body).toBe('Created from JSON')
      expect(memo.tags).toEqual(['json', 'test'])
      expect(memo.status).toBe('published')
      expect(memo.priority).toBe('high')
      expect(memo.attachmentIds).toEqual(['att-1'])
      expect(memo.linkedCards).toEqual(['card-1'])
      expect(memo.projectId).toBe('project-1')
    })

    it('should properly convert dates in fromJSON', () => {
      const memoInterface = {
        id: 'date-test',
        title: 'Date Test',
        body: 'Testing date conversion',
        tags: [],
        status: 'draft' as MemoStatus,
        priority: 'medium' as Priority,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        attachmentIds: [],
        linkedCards: [],
        projectId: null
      }
      
      const memo = Memo.fromJSON(memoInterface)
      
      expect(memo.createdAt).toBeInstanceOf(Date)
      expect(memo.updatedAt).toBeInstanceOf(Date)
      expect(memo.title).toBe('Date Test')
    })
  })

  describe('getWordCount method', () => {
    it('should count words in title and body', () => {
      const memo = new Memo({
        title: 'Test Title Here',  // 3 words
        body: 'This is test content with multiple words.'  // 8 words
      })
      
      expect(memo.getWordCount()).toBe(10)
    })

    it('should handle empty title and body', () => {
      const memo = new Memo({
        title: '',
        body: ''
      })
      
      expect(memo.getWordCount()).toBe(0)
    })

    it('should handle extra whitespace', () => {
      const memo = new Memo({
        title: '  Test   Title  ',  // 2 words
        body: '  This   is    content  '  // 3 words
      })
      
      expect(memo.getWordCount()).toBe(5)
    })
  })

  describe('matchesSearch method', () => {
    beforeEach(() => {
      memo = new Memo({
        title: 'JavaScript Testing Guide',
        body: 'This memo covers unit testing with Jest and Vitest frameworks',
        tags: ['javascript', 'testing', 'jest', 'vitest']
      })
    })

    it('should find matches in title', () => {
      expect(memo.matchesSearch('JavaScript')).toBe(true)
      expect(memo.matchesSearch('Testing')).toBe(true)
    })

    it('should find matches in body', () => {
      expect(memo.matchesSearch('unit testing')).toBe(true)
      expect(memo.matchesSearch('frameworks')).toBe(true)
    })

    it('should find matches in tags', () => {
      expect(memo.matchesSearch('jest')).toBe(true)
      expect(memo.matchesSearch('vitest')).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(memo.matchesSearch('JAVASCRIPT')).toBe(true)
      expect(memo.matchesSearch('jest')).toBe(true)
      expect(memo.matchesSearch('TESTING')).toBe(true)
    })

    it('should return false for non-matches', () => {
      expect(memo.matchesSearch('python')).toBe(false)
      expect(memo.matchesSearch('nonexistent')).toBe(false)
    })

    it('should handle empty search query', () => {
      expect(memo.matchesSearch('')).toBe(true) // Empty search matches all (includes('') returns true)
      expect(memo.matchesSearch('   ')).toBe(false) // Multiple spaces won't match unless content has them
    })
  })
})