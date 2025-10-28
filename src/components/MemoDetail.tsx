import React, { useState, useEffect, useMemo } from 'react'
import { Memo } from '../models/Memo'
import { Attachment } from '../models/Attachment'
import { MemoService } from '../services/MemoService'
import { AttachmentService } from '../services/AttachmentService'

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
  memo,
  onEdit,
  onDelete,
  onClose,
  onMemoUpdate
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const memoService = useMemo(() => MemoService.getInstance(), [])
  const attachmentService = useMemo(() => new AttachmentService(), [])

  // Load attachments
  useEffect(() => {
    const loadAttachments = async () => {
      if (memo.attachmentIds.length === 0) return

      try {
        setLoading(true)
        const loadedAttachments = await attachmentService.getAttachmentsByMemo(memo.id)
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

  // Handle memo status change
  const handleStatusChange = async (newStatus: 'published' | 'archived') => {
    try {
      let updatedMemo: Memo
      
      if (newStatus === 'published') {
        updatedMemo = await memoService.publishMemo(memo.id)
      } else {
        updatedMemo = await memoService.archiveMemo(memo.id)
      }

      if (onMemoUpdate) {
        onMemoUpdate(updatedMemo)
      }
    } catch (err) {
      console.error('Failed to update memo status:', err)
      setError('ステータスの更新に失敗しました')
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

  // Handle attachment download
  const handleAttachmentDownload = async (attachment: Attachment) => {
    try {
      const { blob, fileName } = await attachmentService.downloadAttachment(attachment.id)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download attachment:', err)
      setError('ファイルのダウンロードに失敗しました')
    }
  }

  // Handle attachment delete
  const handleAttachmentDelete = async (attachment: Attachment) => {
    if (!confirm(`「${attachment.fileName}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      await attachmentService.deleteAttachment(attachment.id)
      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
      
      // Update memo's attachment IDs
      const updatedMemo = memo
      updatedMemo.removeAttachment(attachment.id)
      
      if (onMemoUpdate) {
        onMemoUpdate(updatedMemo)
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err)
      setError('添付ファイルの削除に失敗しました')
    }
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

  // Get file icon based on type
  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '📷'
    if (fileType.startsWith('text/')) return '📄'
    if (fileType === 'application/pdf') return '📕'
    if (fileType.includes('json')) return '📋'
    return '📎'
  }

  // Render attachment preview
  const renderAttachmentPreview = (attachment: Attachment) => {
    if (attachment.isImage() && attachment.thumbnailUrl) {
      return (
        <img
          src={attachment.thumbnailUrl}
          alt={attachment.fileName}
          className="w-full h-32 object-cover rounded"
        />
      )
    }

    return (
      <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
        <span className="text-4xl">{getFileIcon(attachment.fileType)}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
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
      <div className="px-6 py-4">
        {/* Tags */}
        {memo.tags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">内容</h3>
          <div className={`prose max-w-none ${!isExpanded && memo.body.length > 500 ? 'line-clamp-6' : ''}`}>
            <pre className="whitespace-pre-wrap text-gray-900 font-sans">
              {memo.body}
            </pre>
          </div>
          
          {memo.body.length > 500 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isExpanded ? '折りたたむ' : 'もっと見る'}
            </button>
          )}
        </div>

        {/* Attachments */}
        {memo.attachmentIds.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              添付ファイル ({attachments.length})
            </h3>
            
            {loading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">添付ファイルを読み込み中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Preview */}
                    <div className="mb-3">
                      {renderAttachmentPreview(attachment)}
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate" title={attachment.fileName}>
                        {attachment.getDisplayName(30)}
                      </h4>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{attachment.getFormattedSize()}</div>
                        <div>{attachment.getFormattedUploadedAt()}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => handleAttachmentDownload(attachment)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ダウンロード
                        </button>
                        <button
                          onClick={() => handleAttachmentDelete(attachment)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-4">
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
                <span className="font-medium">作成日時:</span> {formatDate(memo.createdAt)}
              </div>
              {memo.isModified() && (
                <div className="mb-2">
                  <span className="font-medium">更新日時:</span> {formatDate(memo.updatedAt)}
                </div>
              )}
            </div>
            
            <div>
              <div className="mb-2">
                <span className="font-medium">文字数:</span> {memo.getWordCount()} 文字
              </div>
              <div className="mb-2">
                <span className="font-medium">読了時間:</span> 約 {memo.getReadingTime()} 分
              </div>
            </div>
          </div>
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