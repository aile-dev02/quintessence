import type { Attachment as AttachmentInterface } from '../types'
import { generateId } from '../utils/uuid'
import { formatDate } from '../utils/dateUtils'
import { 
  validateFileName, 
  validateFileSize, 
  validateFileType,
  sanitizeInput 
} from '../utils/validation'
import { ValidationError, FileProcessingError } from '../utils/errors'

export class Attachment implements AttachmentInterface {
  id: string
  memoId: string
  fileName: string
  fileType: string
  fileSize: number
  content: string
  thumbnailUrl?: string
  uploadedAt: Date

  constructor(data: Partial<AttachmentInterface> = {}) {
    this.id = data.id || generateId()
    this.memoId = data.memoId || ''
    this.fileName = data.fileName || ''
    this.fileType = data.fileType || ''
    this.fileSize = data.fileSize || 0
    this.content = data.content || ''
    this.thumbnailUrl = data.thumbnailUrl
    this.uploadedAt = data.uploadedAt || new Date()
  }

  /**
   * Create a new attachment from File object
   */
  static async createFromFile(file: File, memoId: string): Promise<Attachment> {
    // Validate file properties
    const fileNameError = validateFileName(file.name)
    if (fileNameError) {
      throw new ValidationError(fileNameError)
    }

    const fileSizeError = validateFileSize(file.size)
    if (fileSizeError) {
      throw new ValidationError(fileSizeError)
    }

    const fileTypeError = validateFileType(file.type)
    if (fileTypeError) {
      throw new ValidationError(fileTypeError)
    }

    try {
      // Convert file to base64 string
      const content = await Attachment.fileToBase64(file)
      
      // Generate thumbnail for images
      let thumbnailUrl: string | undefined
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await Attachment.generateImageThumbnail(file)
      }

      return new Attachment({
        memoId: memoId,
        fileName: sanitizeInput(file.name),
        fileType: file.type,
        fileSize: file.size,
        content: content,
        thumbnailUrl: thumbnailUrl
      })
    } catch (error) {
      throw new FileProcessingError(`ファイル処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create attachment from JSON data
   */
  static fromJSON(data: AttachmentInterface): Attachment {
    return new Attachment({
      ...data,
      uploadedAt: new Date(data.uploadedAt)
    })
  }

  /**
   * Convert File to base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('ファイル読み込み結果が文字列ではありません'))
        }
      }
      reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Generate thumbnail for image files
   */
  private static generateImageThumbnail(file: File, maxSize: number = 150): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context を取得できませんでした'))
        return
      }

      img.onload = () => {
        // Calculate thumbnail dimensions
        const { width, height } = Attachment.calculateThumbnailSize(
          img.width, 
          img.height, 
          maxSize
        )

        canvas.width = width
        canvas.height = height

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Calculate thumbnail dimensions while maintaining aspect ratio
   */
  private static calculateThumbnailSize(
    originalWidth: number, 
    originalHeight: number, 
    maxSize: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
      return {
        width: Math.min(maxSize, originalWidth),
        height: Math.min(maxSize, originalWidth) / aspectRatio
      }
    } else {
      return {
        width: Math.min(maxSize, originalHeight) * aspectRatio,
        height: Math.min(maxSize, originalHeight)
      }
    }
  }

  /**
   * Update attachment properties
   */
  update(updates: {
    fileName?: string
    memoId?: string
  }): void {
    if (updates.fileName !== undefined) {
      const fileNameError = validateFileName(updates.fileName)
      if (fileNameError) {
        throw new ValidationError(fileNameError)
      }
      this.fileName = sanitizeInput(updates.fileName)
    }

    if (updates.memoId !== undefined) {
      this.memoId = updates.memoId
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(): string {
    const lastDotIndex = this.fileName.lastIndexOf('.')
    return lastDotIndex !== -1 ? this.fileName.substring(lastDotIndex + 1).toLowerCase() : ''
  }

  /**
   * Check if attachment is an image
   */
  isImage(): boolean {
    return this.fileType.startsWith('image/')
  }

  /**
   * Check if attachment is a text file
   */
  isText(): boolean {
    return this.fileType.startsWith('text/')
  }

  /**
   * Check if attachment is a PDF
   */
  isPDF(): boolean {
    return this.fileType === 'application/pdf'
  }

  /**
   * Get human-readable file size
   */
  getFormattedSize(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (this.fileSize === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024))
    const size = this.fileSize / Math.pow(1024, i)
    
    return `${Math.round(size * 100) / 100} ${sizes[i]}`
  }

  /**
   * Get formatted upload date
   */
  getFormattedUploadedAt(): string {
    return formatDate(this.uploadedAt)
  }

  /**
   * Create download blob from content
   */
  createDownloadBlob(): Blob {
    // Remove data URL prefix to get pure base64
    const base64Data = this.content.split(',')[1] || this.content
    
    try {
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      return new Blob([bytes], { type: this.fileType })
    } catch (error) {
      throw new FileProcessingError(`ファイルのダウンロード準備に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create download URL for the attachment
   */
  createDownloadUrl(): string {
    const blob = this.createDownloadBlob()
    return URL.createObjectURL(blob)
  }

  /**
   * Get display name (truncated if too long)
   */
  getDisplayName(maxLength: number = 30): string {
    if (this.fileName.length <= maxLength) {
      return this.fileName
    }
    
    const extension = this.getFileExtension()
    const baseName = this.fileName.substring(0, this.fileName.lastIndexOf('.'))
    const truncatedBase = baseName.substring(0, maxLength - extension.length - 4) // 4 for "..." and "."
    
    return `${truncatedBase}...${extension ? '.' + extension : ''}`
  }

  /**
   * Convert attachment to plain object for storage
   */
  toJSON(): AttachmentInterface {
    return {
      id: this.id,
      memoId: this.memoId,
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize,
      content: this.content,
      thumbnailUrl: this.thumbnailUrl,
      uploadedAt: this.uploadedAt
    }
  }

  /**
   * Clone the attachment with a new memo ID
   */
  clone(newMemoId: string): Attachment {
    return new Attachment({
      memoId: newMemoId,
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize,
      content: this.content,
      thumbnailUrl: this.thumbnailUrl
    })
  }

  /**
   * Get attachment metadata without content (for optimization)
   */
  getMetadata(): Omit<AttachmentInterface, 'content'> {
    return {
      id: this.id,
      memoId: this.memoId,
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize,
      thumbnailUrl: this.thumbnailUrl,
      uploadedAt: this.uploadedAt
    }
  }
}