import React, { useState, useRef } from 'react'
import { AttachmentService } from '../../services/AttachmentService'
import { Attachment } from '../../models/Attachment'
import { validateReplyFileType, validateReplyFileSize } from '../../utils/validation'
import './FileUpload.css'

interface FileUploadProps {
  onFilesUploaded: (attachments: Attachment[]) => void
  onError?: (error: string) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  attachment?: Attachment
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onError,
  maxFiles = 5,
  disabled = false,
  className = ''
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentService = new AttachmentService()

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const selectedFiles = Array.from(files)
    
    // Check file count limit
    if (selectedFiles.length > maxFiles) {
      onError?.(`最大${maxFiles}ファイルまでアップロード可能です`)
      return
    }

    // Validate files and start upload
    const validFiles: UploadingFile[] = []
    
    for (const file of selectedFiles) {
      // Validate file type
      const typeError = validateReplyFileType(file.type)
      if (typeError) {
        onError?.(`${file.name}: ${typeError}`)
        continue
      }

      // Validate file size
      const sizeError = validateReplyFileSize(file.size)
      if (sizeError) {
        onError?.(`${file.name}: ${sizeError}`)
        continue
      }

      validFiles.push({
        file,
        progress: 0
      })
    }

    if (validFiles.length > 0) {
      setUploadingFiles(validFiles)
      uploadFiles(validFiles)
    }
  }

  // Upload files
  const uploadFiles = async (filesToUpload: UploadingFile[]) => {
    const uploadedAttachments: Attachment[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const uploadingFile = filesToUpload[i]
      
      try {
        // Update progress
        setUploadingFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, progress: 10 } : f
        ))

        // Create attachment
        const attachment = await attachmentService.uploadAttachment(
          uploadingFile.file,
          'temp', // Will be updated when reply is created
          (progress) => {
            setUploadingFiles(prev => prev.map((f, index) => 
              index === i ? { ...f, progress: Math.min(10 + (progress.progress * 0.9), 100) } : f
            ))
          }
        )

        // Update progress to complete
        setUploadingFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, progress: 100, attachment } : f
        ))

        uploadedAttachments.push(attachment)

      } catch (error) {
        console.error('File upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'ファイルのアップロードに失敗しました'
        
        setUploadingFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, error: errorMessage } : f
        ))
      }
    }

    // Notify parent of successful uploads
    if (uploadedAttachments.length > 0) {
      onFilesUploaded(uploadedAttachments)
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([])
    }, 2000)
  }



  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  // Handle file input click
  const handleUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  // Get file icon based on type
  const getFileIcon = (file: File): string => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
    if (file.type.includes('csv')) return '📋'
    if (file.type === 'application/pdf') return '📕'
    return '📎'
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`file-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
      >
        <div className="upload-content">
          <div className="upload-icon">📎</div>
          <div className="upload-text">
            <p className="upload-title">
              ファイルをドラッグ&ドロップまたはクリックしてアップロード
            </p>
            <p className="upload-subtitle">
              画像、CSV、Excelファイル（最大{maxFiles}ファイル、各10MB以内）
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="upload-progress">
          <h4 className="progress-title">アップロード中...</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="progress-item">
              <div className="progress-info">
                <span className="file-icon">
                  {getFileIcon(uploadingFile.file)}
                </span>
                <div className="file-details">
                  <span className="file-name">{uploadingFile.file.name}</span>
                  <span className="file-size">
                    {formatFileSize(uploadingFile.file.size)}
                  </span>
                </div>
                <div className="progress-status">
                  {uploadingFile.error ? (
                    <span className="error-status">❌ エラー</span>
                  ) : uploadingFile.progress === 100 ? (
                    <span className="success-status">✅ 完了</span>
                  ) : (
                    <span className="uploading-status">⏳ {uploadingFile.progress}%</span>
                  )}
                </div>
              </div>
              
              {!uploadingFile.error && uploadingFile.progress < 100 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
              )}

              {uploadingFile.error && (
                <div className="error-message">
                  {uploadingFile.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}