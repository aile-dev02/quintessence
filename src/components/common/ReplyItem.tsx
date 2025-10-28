import React, { useState } from 'react'
import { Reply } from '../../models/Reply'
import { ReplyService } from '../../services/ReplyService'
import { AuthService } from '../../services/AuthService'
import { formatDateTime } from '../../utils/dateUtils'
import type { UpdateReplyRequest } from '../../types'
import './ReplyItem.css'

interface ReplyItemProps {
  reply: Reply
  isMemoAuthor: boolean
  onReplyUpdated: (reply: Reply) => void
  onReplyDeleted: (replyId: string) => void
}

export const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  isMemoAuthor,
  onReplyUpdated,
  onReplyDeleted
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const replyService = ReplyService.getInstance()
  const authService = AuthService.getInstance()
  const currentUser = authService.getCurrentUser()

  const isAuthor = currentUser?.id === reply.authorId
  const canEdit = replyService.canEditReply(reply.id)

  const handleEditStart = () => {
    setIsEditing(true)
    setEditContent(reply.content)
    setError(null)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditContent(reply.content)
    setError(null)
  }

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      setError('返信内容を入力してください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const updateRequest: UpdateReplyRequest = {
        content: editContent.trim()
      }

      const updatedReply = await replyService.updateReply(reply.id, updateRequest)
      onReplyUpdated(updatedReply)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating reply:', error)
      setError(error instanceof Error ? error.message : '返信の更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この返信を削除しますか？')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await replyService.deleteReply(reply.id)
      onReplyDeleted(reply.id)
    } catch (error) {
      console.error('Error deleting reply:', error)
      setError(error instanceof Error ? error.message : '返信の削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`reply-item ${isAuthor ? 'reply-item--author' : ''} ${isMemoAuthor ? 'reply-item--memo-author' : ''}`}>
      <div className="reply-header">
        <div className="reply-author">
          <span className={`author-name ${isAuthor ? 'current-user' : ''}`}>
            {reply.authorName}
          </span>
          {isMemoAuthor && (
            <span className="author-badge">投稿者</span>
          )}
          {isAuthor && (
            <span className="author-badge author-badge--self">あなた</span>
          )}
        </div>
        <div className="reply-meta">
          <time className="reply-date" title={reply.createdAt.toLocaleString()}>
            {formatDateTime(reply.createdAt)}
          </time>
          {reply.isEdited && (
            <span className="edited-indicator" title={`編集日時: ${reply.updatedAt.toLocaleString()}`}>
              編集済み
            </span>
          )}
        </div>
      </div>

      <div className="reply-content">
        {isEditing ? (
          <div className="reply-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="返信内容を入力..."
              rows={3}
              disabled={isLoading}
              className="reply-edit-textarea"
            />
            {error && (
              <div className="reply-error">
                {error}
              </div>
            )}
            <div className="reply-edit-actions">
              <button
                onClick={handleEditSave}
                disabled={isLoading || !editContent.trim()}
                className="btn btn-primary btn-sm"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleEditCancel}
                disabled={isLoading}
                className="btn btn-secondary btn-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="reply-text">
            {reply.content}
          </div>
        )}
      </div>

      {canEdit && !isEditing && (
        <div className="reply-actions">
          <button
            onClick={handleEditStart}
            disabled={isLoading}
            className="reply-action-btn"
            title="編集"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="reply-action-btn reply-action-btn--danger"
            title="削除"
          >
            削除
          </button>
        </div>
      )}

      {error && !isEditing && (
        <div className="reply-error">
          {error}
        </div>
      )}
    </div>
  )
}