import React, { useState, useEffect, useMemo } from 'react'
import { Memo } from '../models/Memo'
import { Attachment } from '../models/Attachment'
import { Reply } from '../models/Reply'
import { MemoService } from '../services/MemoService'
import { AttachmentService } from '../services/AttachmentService'
import { ReplyService } from '../services/ReplyService'
import { ReplyForm } from './common/ReplyForm'
import { ReplyItem } from './common/ReplyItem'
import { AttachmentList } from './common/AttachmentList'

interface MemoDetailProps {
  memo: Memo
  onEdit: (memo: Memo) => void
  onDelete: (memo: Memo) => void
  onClose: () => void
  onMemoUpdate?: (updatedMemo: Memo) => void
}

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_LABELS = {
  draft: '下書き',
  published: '公開済み',
  archived: 'アーカイブ'
}

const STATUS_DESCRIPTIONS = {
  draft: '作成中のメモ。まだ完成していない状態です。',
  published: '完成したメモ。他の人と共有可能な状態です。',
  archived: '保存されているが、普段の表示からは隠されているメモです。'
}

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-gray-800 border-blue-200',
  medium: 'bg-yellow-100 text-blue-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

const PRIORITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急'
}

export const MemoDetail: React.FC<MemoDetailProps> = ({
  memo: initialMemo,
  onEdit,
  onDelete,
  onClose,
  onMemoUpdate
}) => {
  const [memo, setMemo] = useState<Memo>(initialMemo)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const memoService = useMemo(() => MemoService.getInstance(), [])
  const attachmentService = useMemo(() => new AttachmentService(), [])
  const replyService = useMemo(() => ReplyService.getInstance(), [])

  // Update local memo state when initialMemo changes
  useEffect(() => {
    setMemo(initialMemo)
  }, [initialMemo])

  // Load attachments
  useEffect(() => {
    const loadAttachments = async () => {
      console.log(`Loading attachments for memo ${memo.id}:`, {
        attachmentIds: memo.attachmentIds,
        attachmentCount: memo.attachmentIds.length
      })
      
      if (memo.attachmentIds.length === 0) return

      try {
        setLoading(true)
        const loadedAttachments = await attachmentService.getAttachmentsByMemo(memo.id)
        console.log(`Loaded ${loadedAttachments.length} attachments:`, loadedAttachments.map(a => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          hasContent: !!a.content,
          contentLength: a.content?.length || 0
        })))
        setAttachments(loadedAttachments)
      } catch (err) {
        console.error('Failed to load attachments:', err)
        setError('添付ファイルの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadAttachments()
  }, [memo.id, memo.attachmentIds, attachmentService])

  // Load replies
  useEffect(() => {
    const loadReplies = () => {
      try {
        const loadedReplies = replyService.getRepliesByMemo(memo.id)
        setReplies(loadedReplies)
      } catch (err) {
        console.error('Failed to load replies:', err)
        setError('返信の読み込みに失敗しました')
      }
    }

    loadReplies()
  }, [memo.id, replyService])

  // Handle memo status change
  const handleStatusChange = async (newStatus: 'published' | 'archived' | 'draft') => {
    try {
      setLoading(true)
      let updatedMemo: Memo
      
      if (newStatus === 'published') {
        updatedMemo = await memoService.publishMemo(memo.id)
      } else if (newStatus === 'archived') {
        updatedMemo = await memoService.archiveMemo(memo.id)
      } else {
        // For draft status, update memo directly
        updatedMemo = await memoService.updateMemo(memo.id, { status: 'draft' })
      }

      // Update local state immediately for instant feedback
      setMemo(updatedMemo)

      // Notify parent component of the update
      if (onMemoUpdate) {
        onMemoUpdate(updatedMemo)
      }

      // Clear any previous errors and show success message
      setError(null)
      setSuccessMessage(`ステータスを「${STATUS_LABELS[newStatus]}」に変更しました`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to update memo status:', err)
      setError('ステータスの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Handle memo clone
  const handleClone = async () => {
    try {
      const clonedMemo = await memoService.cloneMemo(memo.id)
      if (onMemoUpdate) {
        onMemoUpdate(clonedMemo)
      }
    } catch (err) {
      console.error('Failed to clone memo:', err)
      setError('メモの複製に失敗しました')
    }
  }

  // These functions are now handled by AttachmentList component
  // (removed as they're no longer needed)

  // Handle reply operations
  const handleReplyCreated = (reply: Reply) => {
    setReplies(prev => [...prev, reply])
    setSuccessMessage('返信を投稿しました')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleReplyUpdated = (updatedReply: Reply) => {
    setReplies(prev => prev.map(reply => 
      reply.id === updatedReply.id ? updatedReply : reply
    ))
    setSuccessMessage('返信を更新しました')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleReplyDeleted = (replyId: string) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId))
    setSuccessMessage('返信を削除しました')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // File icons are now handled by AttachmentList component

  // Attachment preview is now handled by AttachmentList component

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-5xl mx-auto">
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {memo.title}
            </h1>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span 
                className={`px-2 py-1 rounded-full border ${STATUS_COLORS[memo.status]}`}
                title={STATUS_DESCRIPTIONS[memo.status]}
              >
                {STATUS_LABELS[memo.status]}
              </span>
              <span className={`px-2 py-1 rounded-full border ${PRIORITY_COLORS[memo.priority]}`}>
                優先度: {PRIORITY_LABELS[memo.priority]}
              </span>
              {memo.projectId && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                  📁 {memo.projectId}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1 text-xs text-red-500 hover:text-red-700 underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-8 py-6">
        {/* Tags */}
        {memo.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">🏷️ タグ</h3>
            <div className="flex flex-wrap gap-2">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body - Main Content */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">📄 メインコンテンツ</h3>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 shadow-sm">
            <div className={`prose prose-lg max-w-none ${!isExpanded && memo.body.length > 500 ? 'line-clamp-8' : ''}`}>
              <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed text-base">
                {memo.body}
              </pre>
            </div>
            
            {memo.body.length > 500 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-blue-700 hover:text-blue-900 underline font-medium transition-colors duration-200"
                >
                  {isExpanded ? '📤 折りたたむ' : '📥 全文を表示'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        {memo.attachmentIds.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-3">📎 添付ファイル</h3>
            {loading ? (
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">添付ファイルを読み込み中...</span>
              </div>
            ) : (
              <AttachmentList
                attachments={attachments}
                gridView={true}
                className="memo-detail-attachments"
              />
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">ℹ️ メモ情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">投稿者:</span> 
                <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                  {memo.authorName || '不明なユーザー'}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-medium">ステータス:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[memo.status]}`}>
                  {STATUS_LABELS[memo.status]}
                </span>
              </div>
              <div className="mb-2 text-xs text-gray-500">
                {STATUS_DESCRIPTIONS[memo.status]}
              </div>
              <div className="mb-2">
                <span className="font-medium">作成日時:</span> {formatDate(memo.createdAt)}
              </div>
              {memo.isModified() && (
                <div className="mb-2">
                  <span className="font-medium">更新日時:</span> {formatDate(memo.updatedAt)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Help Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 ステータスについて</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                <strong>下書き:</strong> 作成中のメモ。完成したら「公開」にしましょう。
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                <strong>公開済み:</strong> 完成したメモ。アクティブなコンテンツとして表示されます。
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                <strong>アーカイブ:</strong> 削除せずに保存。普段の一覧には表示されません。
              </div>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💬 返信 ({replies.length})
            </h3>
            <p className="text-sm text-gray-600">
              このメモについて質問や意見を投稿できます
            </p>
          </div>

          {/* Reply Form */}
          <div className="mb-6">
            <ReplyForm
              memoId={memo.id}
              memoAuthorId={memo.authorId}
              memoTitle={memo.title}
              onReplyCreated={handleReplyCreated}
            />
          </div>

          {/* Replies List */}
          {replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  isMemoAuthor={reply.authorId === memo.authorId}
                  onReplyUpdated={handleReplyUpdated}
                  onReplyDeleted={handleReplyDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💭</div>
              <p className="text-sm">まだ返信がありません</p>
              <p className="text-xs">最初の返信を投稿してみましょう！</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* Primary Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => onEdit(memo)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              編集
            </button>
            
            {memo.status !== 'published' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                title="メモを完成状態にして、共有可能にします"
              >
                公開
              </button>
            )}
            
            {memo.status !== 'archived' && (
              <button
                onClick={() => handleStatusChange('archived')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title="メモを保存したまま、普段の表示から隠します"
              >
                アーカイブ
              </button>
            )}

            {memo.status !== 'draft' && (
              <button
                onClick={() => handleStatusChange('draft' as any)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                title="メモを下書き状態に戻します"
              >
                下書きに戻す
              </button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClone}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              複製
            </button>
            
            <button
              onClick={() => onDelete(memo)}
              className="px-4 py-2 text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}