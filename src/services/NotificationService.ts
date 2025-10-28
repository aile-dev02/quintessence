import { Notification } from '../models/Notification'
import { AuthService } from './AuthService'
import type { CreateNotificationRequest, NotificationFilters } from '../types'
import { ValidationError, StorageError } from '../utils/errors'

export class NotificationService {
  private static instance: NotificationService | null = null
  private readonly STORAGE_KEY = 'quintessence_notifications'
  private readonly NOTIFICATION_SOUND_KEY = 'quintessence_notification_sound'
  private readonly MAX_NOTIFICATIONS = 1000 // Keep only the latest 1000 notifications

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Create a new notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const authService = AuthService.getInstance()
    
    // Validate that the sender exists
    const fromUser = authService.getUserById(request.fromUserId)
    if (!fromUser) {
      throw new ValidationError('送信者が見つかりません')
    }

    // Validate that the recipient exists
    const toUser = authService.getUserById(request.toUserId)
    if (!toUser) {
      throw new ValidationError('受信者が見つかりません')
    }

    // Don't create notification if sender and recipient are the same
    if (request.fromUserId === request.toUserId) {
      throw new ValidationError('自分自身に通知を送ることはできません')
    }

    const notification = Notification.create(request)

    // Store notification
    this.storeNotification(notification)

    // Play notification sound if enabled
    this.playNotificationSound(request.toUserId)

    return notification
  }

  /**
   * Get notifications for a specific user
   */
  getNotifications(userId: string, filters?: NotificationFilters): Notification[] {
    const notifications = this.getStoredNotifications()
    let filtered = notifications
      .filter(notification => notification.toUserId === userId)
      .map(notificationData => Notification.fromJSON(notificationData))

    // Apply filters
    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(n => n.type === filters.type)
      }
      
      if (filters.isRead !== undefined) {
        filtered = filtered.filter(n => n.isRead === filters.isRead)
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(n => n.createdAt >= filters.dateFrom!)
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(n => n.createdAt <= filters.dateTo!)
      }
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): number {
    const notifications = this.getStoredNotifications()
    return notifications.filter(n => n.toUserId === userId && !n.isRead).length
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = this.getNotification(notificationId)
    if (!notification) {
      throw new StorageError('通知が見つかりません', 'NOT_FOUND', { id: notificationId })
    }

    const readNotification = notification.markAsRead()
    this.storeNotification(readNotification)
    
    return readNotification
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const notifications = this.getStoredNotifications()
    let updated = false

    for (let i = 0; i < notifications.length; i++) {
      if (notificationIds.includes(notifications[i].id) && !notifications[i].isRead) {
        notifications[i] = {
          ...notifications[i],
          readAt: new Date().toISOString(),
          isRead: true
        }
        updated = true
      }
    }

    if (updated) {
      this.storeNotifications(notifications)
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = this.getStoredNotifications()
    let updated = false

    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].toUserId === userId && !notifications[i].isRead) {
        notifications[i] = {
          ...notifications[i],
          readAt: new Date().toISOString(),
          isRead: true
        }
        updated = true
      }
    }

    if (updated) {
      this.storeNotifications(notifications)
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const notifications = this.getStoredNotifications()
    const filteredNotifications = notifications.filter(n => n.id !== notificationId)
    
    if (filteredNotifications.length === notifications.length) {
      throw new StorageError('削除対象の通知が見つかりません', 'NOT_FOUND', { id: notificationId })
    }
    
    this.storeNotifications(filteredNotifications)
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    const notifications = this.getStoredNotifications()
    const filteredNotifications = notifications.filter(n => !notificationIds.includes(n.id))
    
    this.storeNotifications(filteredNotifications)
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    const notifications = this.getStoredNotifications()
    const filteredNotifications = notifications.filter(n => n.toUserId !== userId)
    
    this.storeNotifications(filteredNotifications)
  }

  /**
   * Get a single notification by ID
   */
  getNotification(notificationId: string): Notification | null {
    const notifications = this.getStoredNotifications()
    const notificationData = notifications.find(n => n.id === notificationId)
    
    if (!notificationData) {
      return null
    }
    
    return Notification.fromJSON(notificationData)
  }

  /**
   * Search notifications by content
   */
  searchNotifications(userId: string, query: string): Notification[] {
    const notifications = this.getStoredNotifications()
    
    return notifications
      .filter(notification => notification.toUserId === userId)
      .map(notificationData => Notification.fromJSON(notificationData))
      .filter(notification => notification.matchesSearch(query))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Create mention notifications
   */
  async createMentionNotifications(
    mentionedUserIds: string[],
    fromUserId: string,
    fromUsername: string,
    relatedId: string,
    relatedType: 'memo' | 'reply',
    content: string
  ): Promise<void> {
    const uniqueUserIds = [...new Set(mentionedUserIds)]
    
    for (const userId of uniqueUserIds) {
      if (userId === fromUserId) continue // Don't notify self

      const title = `@${fromUsername} があなたをメンションしました`
      const preview = content.length > 100 ? content.substring(0, 100) + '...' : content
      
      await this.createNotification({
        type: 'mention',
        title,
        message: preview,
        relatedId,
        relatedType,
        fromUserId,
        fromUsername,
        toUserId: userId,
        data: {
          mentionContext: content,
          originalContent: content
        }
      })
    }
  }

  /**
   * Create reply notification
   */
  async createReplyNotification(
    memoAuthorId: string,
    fromUserId: string,
    fromUsername: string,
    memoId: string,
    memoTitle: string,
    replyContent: string
  ): Promise<void> {
    if (memoAuthorId === fromUserId) return // Don't notify self

    const title = `@${fromUsername} があなたのメモに返信しました`
    const preview = replyContent.length > 100 ? replyContent.substring(0, 100) + '...' : replyContent
    
    await this.createNotification({
      type: 'reply',
      title,
      message: `「${memoTitle}」に返信: ${preview}`,
      relatedId: memoId,
      relatedType: 'memo',
      fromUserId,
      fromUsername,
      toUserId: memoAuthorId,
      data: {
        memoTitle,
        replyContent
      }
    })
  }

  /**
   * Enable/Disable notification sound
   */
  setNotificationSoundEnabled(enabled: boolean): void {
    localStorage.setItem(this.NOTIFICATION_SOUND_KEY, JSON.stringify(enabled))
  }

  /**
   * Check if notification sound is enabled
   */
  isNotificationSoundEnabled(): boolean {
    try {
      const stored = localStorage.getItem(this.NOTIFICATION_SOUND_KEY)
      return stored ? JSON.parse(stored) : true // Default to enabled
    } catch {
      return true
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(userId: string): void {
    const authService = AuthService.getInstance()
    const currentUser = authService.getCurrentUser()
    
    // Only play sound for the current user
    if (!currentUser || currentUser.id !== userId) return
    
    if (!this.isNotificationSoundEnabled()) return

    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  // Private helper methods

  private getStoredNotifications(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load notifications from storage:', error)
      return []
    }
  }

  private storeNotifications(notifications: any[]): void {
    try {
      // Keep only the latest notifications to prevent storage bloat
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, this.MAX_NOTIFICATIONS)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sortedNotifications))
    } catch (error) {
      console.error('Failed to store notifications:', error)
      throw new StorageError('通知データの保存に失敗しました', 'QUOTA_EXCEEDED')
    }
  }

  private storeNotification(notification: Notification): void {
    const notifications = this.getStoredNotifications()
    const existingIndex = notifications.findIndex(n => n.id === notification.id)
    
    if (existingIndex !== -1) {
      notifications[existingIndex] = notification.toJSON()
    } else {
      notifications.push(notification.toJSON())
    }
    
    this.storeNotifications(notifications)
  }

  /**
   * Clear all notifications (development/testing only)
   */
  clearAllNotifications(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}