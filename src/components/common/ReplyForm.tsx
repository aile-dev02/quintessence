import React, { useState } from 'react'
import { ReplyService } from '../../services/ReplyService'
import { AuthService } from '../../services/AuthService'
import { Reply } from '../../models/Reply'
import type { CreateReplyRequest } from '../../types'
import './ReplyForm.css'

interface ReplyFormProps {
  memoId: string
  onReplyCreated: (reply: Reply) => void
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  memoId,
  onReplyCreated
}) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const replyService = ReplyService.getInstance()
  const authService = AuthService.getInstance()
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
        content: content.trim()
      }

      const newReply = await replyService.createReply(memoId, createRequest)
      onReplyCreated(newReply)
      setContent('')
    } catch (error) {
      console.error('Error creating reply:', error)
      setError(error instanceof Error ? error.message : '返信の投稿に失敗しました')
    } finally {
      setIsLoading(false)
    }
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="返信内容を入力してください..."
          rows={4}
          disabled={isLoading}
          className="reply-form-textarea"
          maxLength={1000}
        />
        
        <div className="reply-form-footer">
          <div className="reply-form-info">
            <span className="character-count">
              {content.length}/1000文字
            </span>
          </div>
          
          <div className="reply-form-actions">
            <button
              type="button"
              onClick={() => setContent('')}
              disabled={isLoading || !content}
              className="btn btn-secondary"
            >
              クリア
            </button>
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
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