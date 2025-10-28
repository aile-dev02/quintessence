import type { Memo as MemoInterface, MemoStatus, Priority } from '../types'
import { generateId } from '../utils/uuid'
import { formatDate } from '../utils/dateUtils'
import { 
  validateMemoTitle, 
  validateMemoBody, 
  validateTags,
  sanitizeInput 
} from '../utils/validation'
import { ValidationError } from '../utils/errors'

export class Memo implements MemoInterface {
  id: string
  title: string
  body: string
  tags: string[]
  attachmentIds: string[]
  status: MemoStatus
  priority: Priority
  projectId: string | null
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
  linkedCards: string[]

  constructor(data: Partial<MemoInterface> = {}) {
    this.id = data.id || generateId()
    this.title = data.title || ''
    this.body = data.body || ''
    this.tags = data.tags || []
    this.attachmentIds = data.attachmentIds || []
    this.status = data.status || 'draft'
    this.priority = data.priority || 'medium'
    this.projectId = data.projectId || null
    this.authorId = data.authorId || ''
    this.authorName = data.authorName || ''
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.linkedCards = data.linkedCards || []
  }

  /**
   * Create a new memo with validation
   */
  static create(data: {
    title: string
    body: string
    tags?: string[]
    attachmentIds?: string[]
    projectId?: string
    priority?: Priority
    authorId: string
    authorName: string
  }): Memo {
    // Validate inputs
    const titleError = validateMemoTitle(data.title)
    if (titleError) {
      throw new ValidationError(titleError)
    }

    const bodyError = validateMemoBody(data.body)
    if (bodyError) {
      throw new ValidationError(bodyError)
    }

    if (data.tags) {
      const tagsError = validateTags(data.tags)
      if (tagsError) {
        throw new ValidationError(tagsError)
      }
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(data.title)
    const sanitizedBody = sanitizeInput(data.body)
    const sanitizedTags = (data.tags || []).map(tag => sanitizeInput(tag))

    return new Memo({
      title: sanitizedTitle,
      body: sanitizedBody,
      tags: sanitizedTags,
      attachmentIds: data.attachmentIds || [],
      projectId: data.projectId || null,
      priority: data.priority || 'medium',
      status: 'draft',
      authorId: data.authorId,
      authorName: data.authorName
    })
  }

  /**
   * Update memo properties with validation
   */
  update(updates: {
    title?: string
    body?: string
    tags?: string[]
    attachmentIds?: string[]
    status?: MemoStatus
    priority?: Priority
    projectId?: string | null
  }): void {
    if (updates.title !== undefined) {
      const titleError = validateMemoTitle(updates.title)
      if (titleError) {
        throw new ValidationError(titleError)
      }
      this.title = sanitizeInput(updates.title)
    }

    if (updates.body !== undefined) {
      const bodyError = validateMemoBody(updates.body)
      if (bodyError) {
        throw new ValidationError(bodyError)
      }
      this.body = sanitizeInput(updates.body)
    }

    if (updates.tags !== undefined) {
      const tagsError = validateTags(updates.tags)
      if (tagsError) {
        throw new ValidationError(tagsError)
      }
      this.tags = updates.tags.map(tag => sanitizeInput(tag))
    }

    if (updates.status !== undefined) {
      this.status = updates.status
    }

    if (updates.priority !== undefined) {
      this.priority = updates.priority
    }

    if (updates.projectId !== undefined) {
      this.projectId = updates.projectId
    }

    if (updates.attachmentIds !== undefined) {
      this.attachmentIds = updates.attachmentIds
    }

    this.updatedAt = new Date()
  }

  /**
   * Add an attachment ID to the memo
   */
  addAttachment(attachmentId: string): void {
    if (!this.attachmentIds.includes(attachmentId)) {
      this.attachmentIds.push(attachmentId)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove an attachment ID from the memo
   */
  removeAttachment(attachmentId: string): void {
    const index = this.attachmentIds.indexOf(attachmentId)
    if (index !== -1) {
      this.attachmentIds.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Add a tag to the memo
   */
  addTag(tag: string): void {
    const sanitizedTag = sanitizeInput(tag)
    const tagsError = validateTags([...this.tags, sanitizedTag])
    if (tagsError) {
      throw new ValidationError(tagsError)
    }

    if (!this.tags.includes(sanitizedTag)) {
      this.tags.push(sanitizedTag)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove a tag from the memo
   */
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag)
    if (index !== -1) {
      this.tags.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Mark memo as published
   */
  publish(): void {
    this.status = 'published'
    this.updatedAt = new Date()
  }

  /**
   * Archive the memo
   */
  archive(): void {
    this.status = 'archived'
    this.updatedAt = new Date()
  }

  /**
   * Check if memo matches search query
   */
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      this.title.toLowerCase().includes(searchTerm) ||
      this.body.toLowerCase().includes(searchTerm) ||
      this.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * Get formatted creation date
   */
  getFormattedCreatedAt(): string {
    return formatDate(this.createdAt)
  }

  /**
   * Get formatted update date
   */
  getFormattedUpdatedAt(): string {
    return formatDate(this.updatedAt)
  }

  /**
   * Check if memo has been modified since creation
   */
  isModified(): boolean {
    return this.updatedAt.getTime() !== this.createdAt.getTime()
  }

  /**
   * Get memo summary (first 100 characters of body)
   */
  getSummary(maxLength: number = 100): string {
    if (this.body.length <= maxLength) {
      return this.body
    }
    return this.body.substring(0, maxLength).trim() + '...'
  }

  /**
   * Convert memo to plain object for storage
   */
  toJSON(): MemoInterface {
    return {
      id: this.id,
      title: this.title,
      body: this.body,
      tags: [...this.tags],
      attachmentIds: [...this.attachmentIds],
      status: this.status,
      priority: this.priority,
      projectId: this.projectId,
      authorId: this.authorId,
      authorName: this.authorName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      linkedCards: [...this.linkedCards]
    }
  }

  /**
   * Create memo instance from stored data
   */
  static fromJSON(data: MemoInterface): Memo {
    return new Memo({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    })
  }

  /**
   * Clone the memo
   */
  clone(): Memo {
    return new Memo({
      id: generateId(), // Generate new ID for clone
      title: `${this.title} (コピー)`,
      body: this.body,
      tags: [...this.tags],
      attachmentIds: [...this.attachmentIds],
      status: 'draft', // Reset to draft
      priority: this.priority,
      projectId: this.projectId,
      authorId: this.authorId,
      authorName: this.authorName
    })
  }

  /**
   * Get memo word count
   */
  getWordCount(): number {
    // Simple word count for Japanese and English text
    const text = `${this.title} ${this.body}`.trim()
    if (!text) return 0
    
    // Count Japanese characters and English words
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    
    return japaneseChars + englishWords
  }

  /**
   * Get reading time estimate (minutes)
   */
  getReadingTime(): number {
    const wordCount = this.getWordCount()
    // Assume 200 words per minute reading speed
    return Math.ceil(wordCount / 200)
  }
}