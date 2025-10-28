import React, { useState, useEffect } from 'react'
import { NotificationService } from '../../services/NotificationService'
import { AuthService } from '../../services/AuthService'
import { NotificationPanel } from './NotificationPanel'
import { Notification } from '../../models/Notification'
import './NotificationBell.css'

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick
}) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  const notificationService = NotificationService.getInstance()
  const authService = AuthService.getInstance()
  const currentUser = authService.getCurrentUser()

  // Update unread count
  const updateUnreadCount = () => {
    if (!currentUser) {
      setUnreadCount(0)
      return
    }

    const count = notificationService.getUnreadCount(currentUser.id)
    const prevCount = unreadCount
    
    setUnreadCount(count)
    
    // Show animation if new notifications arrived
    if (count > prevCount && prevCount > 0) {
      setHasNewNotification(true)
      setTimeout(() => setHasNewNotification(false), 1000)
    }
  }

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!currentUser) return

    updateUnreadCount()
    
    const interval = setInterval(updateUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [currentUser])

  // Update count when panel opens/closes
  useEffect(() => {
    if (!showPanel) {
      updateUnreadCount()
    }
  }, [showPanel])

  const handleBellClick = () => {
    setShowPanel(true)
    setHasNewNotification(false)
  }

  const handleNotificationClick = (notification: Notification) => {
    setShowPanel(false)
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <>
      <button
        onClick={handleBellClick}
        className={`notification-bell ${hasNewNotification ? 'new-notification' : ''}`}
        title="通知"
      >
        <div className="bell-icon">
          🔔
        </div>
        {unreadCount > 0 && (
          <div className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      <NotificationPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onNotificationClick={handleNotificationClick}
      />
    </>
  )
}