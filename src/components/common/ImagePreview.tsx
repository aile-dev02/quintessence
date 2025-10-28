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
  const isImage = (fileType: string): boolean => {
    return fileType.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName)
  }

  // Load image preview
  const loadImagePreview = async () => {
    if (!isImage(attachment.fileType) || imageUrl || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const { blob } = await attachmentService.downloadAttachment(attachment.id)
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
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
    if (isImage(attachment.fileType)) {
      loadImagePreview()
    }
  }, [attachment.id, attachment.fileType])

  // Cleanup URL on unmount
  React.useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  if (!isImage(attachment.fileType)) {
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