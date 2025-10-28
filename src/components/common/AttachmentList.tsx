import React, { useState } from 'react'
import { Attachment } from '../../models/Attachment'
import { AttachmentService } from '../../services/AttachmentService'
import { ImagePreview } from './ImagePreview'
import './AttachmentList.css'

interface AttachmentListProps {
  attachments: Attachment[]
  onRemove?: (attachmentId: string) => void
  showRemoveButton?: boolean
  className?: string
  gridView?: boolean
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onRemove,
  showRemoveButton = false,
  className = '',
  gridView
}) => {
  const [downloading, setDownloading] = useState<Set<string>>(new Set())
  const attachmentService = new AttachmentService()

  // Handle attachment download
  const handleDownload = async (attachment: Attachment) => {
    if (downloading.has(attachment.id)) return

    setDownloading(prev => new Set(prev).add(attachment.id))

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
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloading(prev => {
        const next = new Set(prev)
        next.delete(attachment.id)
        return next
      })
    }
  }

  // Handle attachment removal
  const handleRemove = (attachmentId: string) => {
    if (onRemove) {
      onRemove(attachmentId)
    }
  }

  // Get file icon based on type
  const getFileIcon = (attachment: Attachment): string => {
    if (attachment.isImage()) return '🖼️'
    if (attachment.fileType.includes('excel') || attachment.fileType.includes('spreadsheet')) return '📊'
    if (attachment.fileType.includes('csv')) return '📋'
    if (attachment.fileType === 'application/pdf') return '📕'
    if (attachment.fileType.startsWith('text/')) return '📄'
    return '📎'
  }

  // Render attachment preview
  const renderPreview = (attachment: Attachment) => {
    if (attachment.isImage()) {
      return (
        <div className="attachment-preview">
          <ImagePreview 
            attachment={attachment}
            className="attachment-image-preview"
          />
        </div>
      )
    }

    return (
      <div className="attachment-preview">
        <div className="preview-icon">
          {getFileIcon(attachment)}
        </div>
      </div>
    )
  }

  if (attachments.length === 0) {
    return null
  }

  // Determine if we should use grid view
  const imageCount = attachments.filter(att => att.isImage()).length
  const shouldUseGrid = gridView || (imageCount >= 3 && imageCount > attachments.length * 0.7)

  return (
    <div className={`attachment-list ${className}`}>
      <div className="attachment-list-header">
        <h4 className="attachment-count">
          📎 添付ファイル ({attachments.length})
        </h4>
      </div>

      <div className={`attachment-items ${shouldUseGrid ? 'image-grid' : ''}`}>
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-item">
            {/* Preview */}
            {renderPreview(attachment)}

            {/* File info */}
            <div className="attachment-info">
              <div className="attachment-name" title={attachment.fileName}>
                {attachment.getDisplayName(30)}
              </div>
              <div className="attachment-meta">
                <span className="attachment-size">
                  {attachment.getFormattedSize()}
                </span>
                <span className="attachment-date">
                  {attachment.getFormattedUploadedAt()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="attachment-actions">
              <button
                onClick={() => handleDownload(attachment)}
                disabled={downloading.has(attachment.id)}
                className="attachment-action-btn download-btn"
                title="ダウンロード"
              >
                {downloading.has(attachment.id) ? (
                  <span className="loading-spinner">⏳</span>
                ) : (
                  '⬇️'
                )}
              </button>

              {showRemoveButton && onRemove && (
                <button
                  onClick={() => handleRemove(attachment.id)}
                  className="attachment-action-btn remove-btn"
                  title="削除"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}