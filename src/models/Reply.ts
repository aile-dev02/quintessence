import type { Reply as ReplyInterface } from '../types'
import { generateId } from '../utils/uuid'
import { formatDate } from '../utils/dateUtils'
import { validateReplyContent, sanitizeInput } from '../utils/validation'
import { ValidationError } from '../utils/errors'

export class Reply implements ReplyInterface {
  id: string
  memoId: string
  content: string
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
  isEdited: boolean

  constructor(data: Partial<ReplyInterface> = {}) {
    this.id = data.id || generateId()
    this.memoId = data.memoId || ''
    this.content = data.content || ''
    this.authorId = data.authorId || ''
    this.authorName = data.authorName || ''
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.isEdited = data.isEdited ?? false
  }

  /**
   * Create a new reply with validation
   */
  static create(data: {
    memoId: string
    content: string
    authorId: string
    authorName: string
  }): Reply {
    // Validate inputs
    const contentError = validateReplyContent(data.content)
    if (contentError) {
      throw new ValidationError(contentError)
    }

    // Sanitize inputs
    const sanitizedContent = sanitizeInput(data.content)

    return new Reply({
      memoId: data.memoId,
      content: sanitizedContent,
      authorId: data.authorId,
      authorName: data.authorName
    })
  }

  /**
   * Update reply content with validation
   */
  update(content: string): void {
    const contentError = validateReplyContent(content)
    if (contentError) {
      throw new ValidationError(contentError)
    }

    const sanitizedContent = sanitizeInput(content)
    
    // Only update if content actually changed
    if (this.content !== sanitizedContent) {
      this.content = sanitizedContent
      this.updatedAt = new Date()
      this.isEdited = true
    }
  }

  /**
   * Check if reply matches search query
   */
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase()
    return this.content.toLowerCase().includes(searchTerm)
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
   * Check if reply has been modified since creation
   */
  isModified(): boolean {
    return this.isEdited || this.updatedAt.getTime() !== this.createdAt.getTime()
  }

  /**
   * Get reply summary (first 100 characters of content)
   */
  getSummary(maxLength: number = 100): string {
    if (this.content.length <= maxLength) {
      return this.content
    }
    return this.content.substring(0, maxLength).trim() + '...'
  }

  /**
   * Get reply word count
   */
  getWordCount(): number {
    const text = this.content.trim()
    if (!text) return 0
    
    // Count Japanese characters and English words
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    
    return japaneseChars + englishWords
  }

  /**
   * Convert reply to plain object for storage
   */
  toJSON(): ReplyInterface {
    return {
      id: this.id,
      memoId: this.memoId,
      content: this.content,
      authorId: this.authorId,
      authorName: this.authorName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isEdited: this.isEdited
    }
  }

  /**
   * Create reply instance from stored data
   */
  static fromJSON(data: ReplyInterface): Reply {
    return new Reply({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    })
  }
}