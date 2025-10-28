import React, { useState, useEffect } from 'react'
import { Notification } from '../../models/Notification'
import { NotificationService } from '../../services/NotificationService'
import { AuthService } from '../../services/AuthService'
import './NotificationPanel.css'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions' | 'replies'>('all')

  const notificationService = NotificationService.getInstance()
  const authService = AuthService.getInstance()
  const currentUser = authService.getCurrentUser()

  // Load notifications
  const loadNotifications = () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const filters = filter === 'all' ? {} : 
        filter === 'unread' ? { isRead: false } :
        filter === 'mentions' ? { type: 'mention' as const } :
        { type: 'reply' as const }

      const userNotifications = notificationService.getNotifications(currentUser.id, filters)
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && currentUser) {
      loadNotifications()
    }
  }, [isOpen, currentUser, filter])

  // Mark notification as read
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id)
        loadNotifications() // Refresh list
      }

      if (onNotificationClick) {
        onNotificationClick(notification)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return

    try {
      await notificationService.markAllAsRead(currentUser.id)
      loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    try {
      await notificationService.deleteNotification(notificationId)
      loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!isOpen) return null

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <div className="notification-title">
            <h3>通知</h3>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="notification-action-btn"
                title="すべて既読にする"
              >
                ✓
              </button>
            )}
            <button
              onClick={onClose}
              className="notification-action-btn"
              title="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="notification-filters">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            すべて
          </button>
          <button
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            未読
          </button>
          <button
            className={`filter-tab ${filter === 'mentions' ? 'active' : ''}`}
            onClick={() => setFilter('mentions')}
          >
            メンション
          </button>
          <button
            className={`filter-tab ${filter === 'replies' ? 'active' : ''}`}
            onClick={() => setFilter('replies')}
          >
            返信
          </button>
        </div>

        {/* Content */}
        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">
              <div className="loading-spinner"></div>
              <span>読み込み中...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <div className="empty-icon">🔔</div>
              <p>通知がありません</p>
              <span className="empty-subtitle">
                {filter === 'unread' ? '未読の通知はありません' :
                 filter === 'mentions' ? 'メンションはありません' :
                 filter === 'replies' ? '返信通知はありません' :
                 '通知がありません'}
              </span>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.getIcon()}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-item-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-from">
                        @{notification.fromUsername}
                      </span>
                      <span className="notification-time">
                        {notification.getTimeAgo()}
                      </span>
                    </div>
                  </div>

                  <div className="notification-item-actions">
                    {!notification.isRead && (
                      <div className="unread-indicator" title="未読"></div>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      className="notification-delete-btn"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="notification-footer">
          <div className="notification-settings">
            <label className="setting-item">
              <input
                type="checkbox"
                checked={notificationService.isNotificationSoundEnabled()}
                onChange={(e) => notificationService.setNotificationSoundEnabled(e.target.checked)}
              />
              <span>通知音を有効にする</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}