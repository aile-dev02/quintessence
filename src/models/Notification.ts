import type { Notification as INotification, CreateNotificationRequest } from '../types'
import { validateNotificationData } from '../utils/validation'
import { generateId } from '../utils/uuid'

export class Notification implements INotification {
  readonly id: string
  readonly type: INotification['type']
  readonly title: string
  readonly message: string
  readonly relatedId: string
  readonly relatedType: INotification['relatedType']
  readonly fromUserId: string
  readonly fromUsername: string
  readonly toUserId: string
  readonly createdAt: Date
  private _readAt: Date | null
  readonly data?: Record<string, unknown>

  constructor(data: INotification) {
    this.id = data.id
    this.type = data.type
    this.title = data.title
    this.message = data.message
    this.relatedId = data.relatedId
    this.relatedType = data.relatedType
    this.fromUserId = data.fromUserId
    this.fromUsername = data.fromUsername
    this.toUserId = data.toUserId
    this.createdAt = data.createdAt
    this._readAt = data.readAt
    this.data = data.data
  }

  get readAt(): Date | null {
    return this._readAt
  }

  get isRead(): boolean {
    return this._readAt !== null
  }

  /**
   * Create a new notification
   */
  static create(request: CreateNotificationRequest): Notification {
    // Validate the notification data
    const validationResult = validateNotificationData({
      title: request.title,
      message: request.message,
      type: request.type,
      relatedId: request.relatedId,
      relatedType: request.relatedType,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId
    })

    if (!validationResult.isValid) {
      throw new Error(`Invalid notification data: ${validationResult.errors.join(', ')}`)
    }

    const now = new Date()

    return new Notification({
      id: generateId(),
      type: request.type,
      title: request.title.trim(),
      message: request.message.trim(),
      relatedId: request.relatedId,
      relatedType: request.relatedType,
      fromUserId: request.fromUserId,
      fromUsername: request.fromUsername,
      toUserId: request.toUserId,
      createdAt: now,
      readAt: null,
      isRead: false,
      data: request.data
    })
  }

  /**
   * Mark notification as read
   */
  markAsRead(): Notification {
    if (this._readAt) {
      return this // Already read
    }

    return new Notification({
      ...this.toJSON(),
      readAt: new Date(),
      isRead: true
    })
  }

  /**
   * Mark notification as unread
   */
  markAsUnread(): Notification {
    if (!this._readAt) {
      return this // Already unread
    }

    return new Notification({
      ...this.toJSON(),
      readAt: null,
      isRead: false
    })
  }

  /**
   * Get formatted time ago string
   */
  getTimeAgo(): string {
    const now = new Date()
    const diffMs = now.getTime() - this.createdAt.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return 'たった今'
    } else if (diffMins < 60) {
      return `${diffMins}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return this.createdAt.toLocaleDateString('ja-JP')
    }
  }

  /**
   * Get notification icon based on type
   */
  getIcon(): string {
    switch (this.type) {
      case 'mention':
        return '📢'
      case 'reply':
        return '💬'
      case 'memo_update':
        return '📝'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  /**
   * Get notification color based on type
   */
  getColor(): string {
    switch (this.type) {
      case 'mention':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'reply':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'memo_update':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'system':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  /**
   * Check if this notification matches the search query
   */
  matchesSearch(query: string): boolean {
    if (!query.trim()) return true

    const searchText = query.toLowerCase()
    return (
      this.title.toLowerCase().includes(searchText) ||
      this.message.toLowerCase().includes(searchText) ||
      this.fromUsername.toLowerCase().includes(searchText)
    )
  }

  /**
   * Convert to JSON for storage
   */
  toJSON(): INotification {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      fromUserId: this.fromUserId,
      fromUsername: this.fromUsername,
      toUserId: this.toUserId,
      createdAt: this.createdAt,
      readAt: this._readAt,
      isRead: this.isRead,
      data: this.data
    }
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data: any): Notification {
    return new Notification({
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      fromUserId: data.fromUserId,
      fromUsername: data.fromUsername,
      toUserId: data.toUserId,
      createdAt: new Date(data.createdAt),
      readAt: data.readAt ? new Date(data.readAt) : null,
      isRead: data.isRead || false,
      data: data.data
    })
  }
}