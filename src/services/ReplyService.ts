import { Reply } from '../models/Reply'
import { AuthService } from './AuthService'
import type { CreateReplyRequest, UpdateReplyRequest } from '../types'
import { ValidationError, StorageError } from '../utils/errors'

export class ReplyService {
  private static instance: ReplyService | null = null
  private readonly STORAGE_KEY = 'quintessence_replies'

  private constructor() {}

  static getInstance(): ReplyService {
    if (!ReplyService.instance) {
      ReplyService.instance = new ReplyService()
    }
    return ReplyService.instance
  }

  /**
   * Create a new reply
   */
  async createReply(memoId: string, request: CreateReplyRequest): Promise<Reply> {
    const authService = AuthService.getInstance()
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser) {
      throw new ValidationError('返信するにはログインが必要です')
    }

    const reply = Reply.create({
      memoId: memoId,
      content: request.content,
      authorId: currentUser.id,
      authorName: currentUser.username
    })

    // Store reply
    this.storeReply(reply)

    return reply
  }

  /**
   * Update an existing reply
   */
  async updateReply(replyId: string, request: UpdateReplyRequest): Promise<Reply> {
    const authService = AuthService.getInstance()
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser) {
      throw new ValidationError('返信を編集するにはログインが必要です')
    }

    const reply = this.getReply(replyId)
    if (!reply) {
      throw new StorageError('更新対象の返信が見つかりません', 'NOT_FOUND', { id: replyId })
    }

    // Check if current user is the author of the reply
    if (reply.authorId !== currentUser.id) {
      throw new ValidationError('自分の返信のみ編集できます')
    }

    reply.update(request.content)

    // Update stored reply
    this.storeReply(reply)

    return reply
  }

  /**
   * Delete a reply
   */
  async deleteReply(replyId: string): Promise<void> {
    const authService = AuthService.getInstance()
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser) {
      throw new ValidationError('返信を削除するにはログインが必要です')
    }

    const reply = this.getReply(replyId)
    if (!reply) {
      throw new StorageError('削除対象の返信が見つかりません', 'NOT_FOUND', { id: replyId })
    }

    // Check if current user is the author of the reply
    if (reply.authorId !== currentUser.id) {
      throw new ValidationError('自分の返信のみ削除できます')
    }

    const replies = this.getStoredReplies()
    const filteredReplies = replies.filter(r => r.id !== replyId)
    
    this.storeReplies(filteredReplies)
  }

  /**
   * Get all replies for a memo
   */
  getRepliesByMemo(memoId: string): Reply[] {
    const replies = this.getStoredReplies()
    return replies
      .filter(reply => reply.memoId === memoId)
      .map(replyData => Reply.fromJSON(replyData))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Sort by creation time
  }

  /**
   * Get a single reply by ID
   */
  getReply(replyId: string): Reply | null {
    const replies = this.getStoredReplies()
    const replyData = replies.find(r => r.id === replyId)
    
    if (!replyData) {
      return null
    }
    
    return Reply.fromJSON(replyData)
  }

  /**
   * Get reply count for a memo
   */
  getReplyCount(memoId: string): number {
    const replies = this.getStoredReplies()
    return replies.filter(reply => reply.memoId === memoId).length
  }

  /**
   * Search replies by content
   */
  searchReplies(query: string, memoId?: string): Reply[] {
    const replies = this.getStoredReplies()
    let filteredReplies = replies

    if (memoId) {
      filteredReplies = filteredReplies.filter(reply => reply.memoId === memoId)
    }

    return filteredReplies
      .map(replyData => Reply.fromJSON(replyData))
      .filter(reply => reply.matchesSearch(query))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Check if current user can edit a reply
   */
  canEditReply(replyId: string): boolean {
    const authService = AuthService.getInstance()
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser) {
      return false
    }

    const reply = this.getReply(replyId)
    if (!reply) {
      return false
    }

    return reply.authorId === currentUser.id
  }

  // Private helper methods

  private getStoredReplies(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load replies from storage:', error)
      return []
    }
  }

  private storeReplies(replies: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(replies))
    } catch (error) {
      console.error('Failed to store replies:', error)
      throw new StorageError('返信データの保存に失敗しました', 'QUOTA_EXCEEDED')
    }
  }

  private storeReply(reply: Reply): void {
    const replies = this.getStoredReplies()
    const existingIndex = replies.findIndex(r => r.id === reply.id)
    
    if (existingIndex !== -1) {
      replies[existingIndex] = reply.toJSON()
    } else {
      replies.push(reply.toJSON())
    }
    
    this.storeReplies(replies)
  }

  /**
   * Clear all replies (development/testing only)
   */
  clearAllReplies(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}