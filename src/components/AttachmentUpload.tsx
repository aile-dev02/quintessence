import React, { useState, useRef, useCallback } from 'react'
import { Attachment } from '../models/Attachment'
import { AttachmentService } from '../services/AttachmentService'
import type { UploadProgress } from '../types'

interface AttachmentUploadProps {
  memoId: string
  onUploadComplete: (attachments: Attachment[]) => void
  onUploadProgress?: (attachmentId: string, progress: UploadProgress) => void
  onError?: (error: string) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedFileTypes?: string[]
  disabled?: boolean
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  memoId,
  onUploadComplete,
  onUploadProgress,
  onError,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentService = new AttachmentService()

  // Validate and process files
  const handleFiles = useCallback((files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    // Check file count
    if (files.length > maxFiles) {
      errors.push(`最大${maxFiles}ファイルまでアップロード可能です`)
      files = files.slice(0, maxFiles)
    }

    files.forEach(file => {
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        errors.push(`${file.name}: サポートされていないファイル形式です`)
        return
      }

      // Check file size
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        errors.push(`${file.name}: ファイルサイズが${maxSizeMB}MBを超えています`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0 && onError) {
      onError(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setPreviewFiles(validFiles)
    }
  }, [maxFiles, maxFileSize, acceptedFileTypes, onError])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled, handleFiles])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  // Upload files
  const uploadFiles = async () => {
    if (previewFiles.length === 0) return

    setIsUploading(true)
    const progressMap: Record<string, UploadProgress> = {}

    const handleProgress = (attachmentId: string, progress: UploadProgress) => {
      progressMap[attachmentId] = progress
      setUploadProgress({ ...progressMap })
      
      if (onUploadProgress) {
        onUploadProgress(attachmentId, progress)
      }
    }

    try {
      const uploadedAttachments = await attachmentService.uploadMultipleAttachments(
        previewFiles,
        memoId,
        handleProgress
      )

      onUploadComplete(uploadedAttachments)
      setPreviewFiles([])
      setUploadProgress({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました'
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Remove file from preview
  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Clear all preview files
  const clearPreviewFiles = () => {
    setPreviewFiles([])
    setUploadProgress({})
  }

  // Get file type icon
  const getFileTypeIcon = (file: File): string => {
    if (file.type.startsWith('image/')) return '📷'
    if (file.type.startsWith('text/')) return '📄'
    if (file.type === 'application/pdf') return '📕'
    if (file.type.includes('json')) return '📋'
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

  // Get accepted file types for display
  const getAcceptedTypesDisplay = (): string => {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'text/plain': 'テキスト',
      'text/csv': 'CSV',
      'application/json': 'JSON',
      'application/pdf': 'PDF'
    }
    
    return acceptedFileTypes
      .map(type => typeMap[type] || type)
      .join(', ')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="text-4xl">
            {isDragOver ? '📁' : '📎'}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'ファイルをドロップしてください' : 'ファイルをアップロード'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ドラッグ&ドロップ、またはクリックしてファイルを選択
            </p>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <div>対応形式: {getAcceptedTypesDisplay()}</div>
            <div>最大ファイルサイズ: {formatFileSize(maxFileSize)}</div>
            <div>最大ファイル数: {maxFiles}個</div>
          </div>
        </div>

        {disabled && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-lg">
            <span className="text-gray-500">アップロード無効</span>
          </div>
        )}
      </div>

      {/* Preview Area */}
      {previewFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              選択されたファイル ({previewFiles.length})
            </h3>
            <button
              onClick={clearPreviewFiles}
              disabled={isUploading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              すべてクリア
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {previewFiles.map((file, index) => {
              const progressData = Object.values(uploadProgress).find(p => 
                p.attachmentId.includes(file.name)
              )
              
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-2xl mr-3">
                    {getFileTypeIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {progressData && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`
                            ${progressData.status === 'complete' ? 'text-green-600' : ''}
                            ${progressData.status === 'error' ? 'text-red-600' : ''}
                            ${progressData.status === 'uploading' ? 'text-blue-600' : ''}
                          `}>
                            {progressData.status === 'uploading' && 'アップロード中...'}
                            {progressData.status === 'processing' && '処理中...'}
                            {progressData.status === 'complete' && '完了'}
                            {progressData.status === 'error' && `エラー: ${progressData.error}`}
                          </span>
                          <span>{progressData.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progressData.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressData.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!isUploading && (
                    <button
                      onClick={() => removePreviewFile(index)}
                      className="ml-3 text-gray-400 hover:text-red-600 focus:outline-none"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Upload Actions */}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={clearPreviewFiles}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={uploadFiles}
              disabled={isUploading || previewFiles.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  アップロード中...
                </span>
              ) : (
                `${previewFiles.length}個のファイルをアップロード`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}