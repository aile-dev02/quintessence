import React, { useState } from 'react'
import { ReplyService } from '../../services/ReplyService'
import { AuthService } from '../../services/AuthService'
import { NotificationService } from '../../services/NotificationService'
import { Reply } from '../../models/Reply'
import { Attachment } from '../../models/Attachment'
import { MentionInput } from './MentionInput'
import { FileUpload } from './FileUpload'
import { AttachmentList } from './AttachmentList'
import { getMentionedUserIds } from '../../utils/mentions'
import type { CreateReplyRequest } from '../../types'
import './ReplyForm.css'

interface ReplyFormProps {
  memoId: string
  memoAuthorId: string
  memoTitle: string
  onReplyCreated: (reply: Reply) => void
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  memoId,
  memoAuthorId,
  memoTitle,
  onReplyCreated
}) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)

  const replyService = ReplyService.getInstance()
  const authService = AuthService.getInstance()
  const notificationService = NotificationService.getInstance()
  const currentUser = authService.getCurrentUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      setError('返信するにはログインが必要です')
      return
    }

    if (!content.trim()) {
      setError('返信内容を入力してください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const createRequest: CreateReplyRequest = {
        content: content.trim(),
        attachmentIds: attachments.map(att => att.id)
      }

      const newReply = await replyService.createReply(memoId, createRequest)
      
      // Create notifications for mentions
      if (mentionedUserIds.length > 0) {
        await notificationService.createMentionNotifications(
          mentionedUserIds,
          currentUser.id,
          currentUser.username,
          newReply.id,
          'reply',
          content.trim()
        )
      }

      // Create reply notification for memo author (if not self and not already mentioned)
      if (memoAuthorId !== currentUser.id && !mentionedUserIds.includes(memoAuthorId)) {
        await notificationService.createReplyNotification(
          memoAuthorId,
          currentUser.id,
          currentUser.username,
          memoId,
          memoTitle,
          content.trim()
        )
      }

      onReplyCreated(newReply)
      setContent('')
      setMentionedUserIds([])
      setAttachments([])
      setShowFileUpload(false)
    } catch (error) {
      console.error('Error creating reply:', error)
      setError(error instanceof Error ? error.message : '返信の投稿に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload completion
  const handleFilesUploaded = (newAttachments: Attachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments])
  }

  // Handle file removal
  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId))
  }

  if (!currentUser) {
    return (
      <div className="reply-form-login-prompt">
        <p>返信するにはログインが必要です。</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <div className="reply-form-header">
        <h4 className="reply-form-title">返信を投稿</h4>
        <span className="reply-form-user">
          {currentUser.username} として投稿
        </span>
      </div>

      <div className="reply-form-content">
        <MentionInput
          value={content}
          onChange={setContent}
          placeholder="返信内容を入力してください... (@username でメンション)"
          rows={4}
          disabled={isLoading}
          className="reply-form-textarea"
          onMentions={setMentionedUserIds}
        />

        {/* ファイルアップロード */}
        <div className="reply-form-attachments">
          <div className="attachment-section">
            <h4 className="attachment-title">ファイル添付</h4>
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              maxFiles={5}
              disabled={isLoading}
            />
          </div>
          
          {attachments.length > 0 && (
            <div className="attachment-list-section">
              <AttachmentList
                attachments={attachments}
                onRemove={handleRemoveAttachment}
                showRemoveButton={true}
              />
            </div>
          )}
        </div>
        
        <div className="reply-form-footer">
          <div className="reply-form-info">
            <span className="character-count">
              {content.length}/1000文字
            </span>
            {attachments.length > 0 && (
              <span className="attachment-count">
                • {attachments.length}個のファイル添付
              </span>
            )}
          </div>
          
          <div className="reply-form-actions">
            <button
              type="button"
              onClick={() => {
                setContent('')
                setAttachments([])
              }}
              disabled={isLoading || (!content && attachments.length === 0)}
              className="btn btn-secondary"
            >
              クリア
            </button>
            <button
              type="submit"
              disabled={isLoading || (!content.trim() && attachments.length === 0)}
              className="btn btn-primary"
            >
              {isLoading ? '投稿中...' : '返信を投稿'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="reply-form-error">
          {error}
        </div>
      )}
    </form>
  )
}