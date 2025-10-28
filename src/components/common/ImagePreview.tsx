import React, { useState } from 'react'
import { Attachment } from '../../models/Attachment'
import { AttachmentService } from '../../services/AttachmentService'
import './ImagePreview.css'

interface ImagePreviewProps {
  attachment: Attachment
  className?: string
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  attachment,
  className = ''
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const attachmentService = new AttachmentService()

  // Check if file is image
  const isImage = (fileType: string, fileName: string): boolean => {
    // Check MIME type first
    if (fileType.startsWith('image/')) return true
    
    // Fallback to file extension
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
    return imageExtensions.test(fileName)
  }

  // Load image preview
  const loadImagePreview = async () => {
    if (!isImage(attachment.fileType, attachment.fileName) || imageUrl || isLoading) return

    console.log(`Loading image for ${attachment.fileName}:`, {
      fileType: attachment.fileType,
      hasContent: !!attachment.content,
      contentLength: attachment.content?.length || 0,
      contentPreview: attachment.content?.substring(0, 50) + '...',
      isDataUrl: attachment.content?.startsWith('data:')
    })

    setIsLoading(true)
    setError(null)

    try {
      // Try to use attachment content if available (base64 data URL)
      if (attachment.content && attachment.content.startsWith('data:')) {
        console.log(`Using direct content for ${attachment.fileName}`)
        setImageUrl(attachment.content)
      } else {
        console.log(`Fallback to blob download for ${attachment.fileName}`)
        // Fallback to downloading the attachment
        const { blob } = await attachmentService.downloadAttachment(attachment.id)
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
      }
    } catch (err) {
      console.error('Failed to load image preview:', err)
      setError('画像の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image click for modal
  const handleImageClick = () => {
    if (imageUrl) {
      setIsModalOpen(true)
    }
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
  }

  // Load image on mount
  React.useEffect(() => {
    if (isImage(attachment.fileType, attachment.fileName)) {
      loadImagePreview()
    }
  }, [attachment.id, attachment.fileType, attachment.fileName])

  // Cleanup URL on unmount
  React.useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  if (!isImage(attachment.fileType, attachment.fileName)) {
    return null
  }

  return (
    <>
      <div className={`image-preview ${className}`}>
        {isLoading && (
          <div className="image-preview-loading">
            <div className="loading-spinner"></div>
            <span>読み込み中...</span>
          </div>
        )}
        
        {error && (
          <div className="image-preview-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {imageUrl && (
          <div className="image-preview-container">
            <img
              src={imageUrl}
              alt={attachment.fileName}
              className="image-preview-img"
              onClick={handleImageClick}
              loading="lazy"
            />
            <div className="image-preview-overlay">
              <button
                className="image-preview-expand"
                onClick={handleImageClick}
                title="クリックして拡大表示"
              >
                🔍
              </button>
            </div>
            <div className="image-preview-info">
              <span className="image-filename">{attachment.fileName}</span>
              <span className="image-size">
                {Math.round(attachment.fileSize / 1024)}KB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal for enlarged view */}
      {isModalOpen && imageUrl && (
        <div className="image-modal" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeModal}>
              ✕
            </button>
            <img
              src={imageUrl}
              alt={attachment.fileName}
              className="image-modal-img"
            />
            <div className="image-modal-info">
              <h3>{attachment.fileName}</h3>
              <p>サイズ: {Math.round(attachment.fileSize / 1024)}KB</p>
              <p>形式: {attachment.fileType}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}