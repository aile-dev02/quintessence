import type { Attachment as AttachmentInterface, UploadProgress } from '../types'
import { Attachment } from '../models/Attachment'
import { LocalStorageService } from './storage/LocalStorageService'
import { IndexedDBService } from './storage/IndexedDBService'
import { ValidationError, StorageError, FileProcessingError } from '../utils/errors'

export class AttachmentService {
  private static readonly STORAGE_KEY = 'attachments'
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024 // 50MB limit
  
  private localStorageService: LocalStorageService
  private indexedDBService: IndexedDBService
  private uploadProgressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map()

  constructor() {
    this.localStorageService = LocalStorageService.getInstance()
    this.indexedDBService = IndexedDBService.getInstance()
  }

  /**
   * Upload and create new attachment from File
   */
  async uploadAttachment(
    file: File, 
    memoId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Attachment> {
    try {
      // Check storage quota
      await this.checkStorageQuota(file.size)

      // Create attachment from file
      const attachment = await this.createAttachmentWithProgress(file, memoId, onProgress)

      // Store attachment
      await this.storeAttachment(attachment)

      return attachment
    } catch (error) {
      if (error instanceof ValidationError || error instanceof FileProcessingError) {
        throw error
      }
      throw new StorageError('ファイルのアップロードに失敗しました', 'UPLOAD_FAILED', { error })
    }
  }

  /**
   * Upload multiple attachments
   */
  async uploadMultipleAttachments(
    files: File[], 
    memoId: string, 
    onProgress?: (attachmentId: string, progress: UploadProgress) => void
  ): Promise<Attachment[]> {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    await this.checkStorageQuota(totalSize)

    const attachments: Attachment[] = []
    const uploadPromises = files.map(async (file, index) => {
      try {
        const attachment = await this.createAttachmentWithProgress(
          file, 
          memoId, 
          onProgress ? (progress) => onProgress(progress.attachmentId, progress) : undefined
        )
        await this.storeAttachment(attachment)
        attachments[index] = attachment
        return attachment
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        throw error
      }
    })

    await Promise.all(uploadPromises)
    return attachments
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(id: string): Promise<Attachment | null> {
    try {
      // Try IndexedDB first for better performance with large files
      const attachmentData = await this.indexedDBService.getAttachment(id)
      if (attachmentData) {
        return Attachment.fromJSON(attachmentData)
      }

      // Fallback to LocalStorage
      const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
      const attachmentFound = attachments.find(a => a.id === id)
      
      return attachmentFound ? Attachment.fromJSON(attachmentFound) : null
    } catch (error) {
      throw new StorageError('添付ファイルの取得に失敗しました', 'GET_FAILED', { id, error })
    }
  }

  /**
   * Get all attachments for a memo
   */
  async getAttachmentsByMemo(memoId: string): Promise<Attachment[]> {
    try {
      // Try IndexedDB first
      const indexedDBAttachments = await this.indexedDBService.getAttachmentsByMemo(memoId)
      if (indexedDBAttachments.length > 0) {
        return indexedDBAttachments.map(a => Attachment.fromJSON(a))
      }

      // Fallback to LocalStorage
      const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
      const memoAttachments = attachments.filter(a => a.memoId === memoId)
      
      return memoAttachments.map(a => Attachment.fromJSON(a))
    } catch (error) {
      throw new StorageError('メモの添付ファイル取得に失敗しました', 'GET_BY_MEMO_FAILED', { memoId, error })
    }
  }

  /**
   * Get all attachments
   */
  getAllAttachments(): Attachment[] {
    try {
      const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
      return attachments.map(a => Attachment.fromJSON(a))
    } catch (error) {
      throw new StorageError('添付ファイル一覧の取得に失敗しました', 'GET_ALL_FAILED', { error })
    }
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(id: string, updates: { fileName?: string; memoId?: string }): Promise<Attachment> {
    try {
      const attachment = await this.getAttachment(id)
      if (!attachment) {
        throw new StorageError('更新対象の添付ファイルが見つかりません', 'NOT_FOUND', { id })
      }

      attachment.update(updates)
      await this.storeAttachment(attachment)

      return attachment
    } catch (error) {
      if (error instanceof ValidationError || error instanceof StorageError) {
        throw error
      }
      throw new StorageError('添付ファイルの更新に失敗しました', 'UPDATE_FAILED', { id, error })
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    try {
      // Remove from IndexedDB
      await this.indexedDBService.deleteAttachment(id)

      // Remove from LocalStorage
      const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
      const filteredAttachments = attachments.filter(a => a.id !== id)
      this.localStorageService.set(AttachmentService.STORAGE_KEY, filteredAttachments)
    } catch (error) {
      throw new StorageError('添付ファイルの削除に失敗しました', 'DELETE_FAILED', { id, error })
    }
  }

  /**
   * Delete all attachments for a memo
   */
  async deleteAttachmentsByMemo(memoId: string): Promise<void> {
    try {
      // Remove from IndexedDB
      await this.indexedDBService.deleteAttachmentsByMemo(memoId)

      // Remove from LocalStorage
      const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
      const filteredAttachments = attachments.filter(a => a.memoId !== memoId)
      this.localStorageService.set(AttachmentService.STORAGE_KEY, filteredAttachments)
    } catch (error) {
      throw new StorageError('メモの添付ファイル削除に失敗しました', 'DELETE_BY_MEMO_FAILED', { memoId, error })
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{
    totalSize: number
    attachmentCount: number
    largestFile: { name: string; size: number } | null
    oldestFile: { name: string; date: Date } | null
  }> {
    try {
      const attachments = this.getAllAttachments()
      let totalSize = 0
      let largestFile: { name: string; size: number } | null = null
      let oldestFile: { name: string; date: Date } | null = null

      attachments.forEach(attachment => {
        totalSize += attachment.fileSize

        if (!largestFile || attachment.fileSize > largestFile.size) {
          largestFile = { name: attachment.fileName, size: attachment.fileSize }
        }

        if (!oldestFile || attachment.uploadedAt < oldestFile.date) {
          oldestFile = { name: attachment.fileName, date: attachment.uploadedAt }
        }
      })

      return {
        totalSize,
        attachmentCount: attachments.length,
        largestFile,
        oldestFile
      }
    } catch (error) {
      throw new StorageError('ストレージ使用量の取得に失敗しました', 'USAGE_FAILED', { error })
    }
  }

  /**
   * Download attachment as blob
   */
  async downloadAttachment(id: string): Promise<{ blob: Blob; fileName: string }> {
    try {
      const attachment = await this.getAttachment(id)
      if (!attachment) {
        throw new StorageError('ダウンロード対象の添付ファイルが見つかりません', 'NOT_FOUND', { id })
      }

      const blob = attachment.createDownloadBlob()
      return { blob, fileName: attachment.fileName }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError('ファイルのダウンロードに失敗しました', 'DOWNLOAD_FAILED', { id, error })
    }
  }

  /**
   * Get attachment metadata only (without file content)
   */
  async getAttachmentMetadata(id: string): Promise<Omit<AttachmentInterface, 'content'> | null> {
    try {
      const attachment = await this.getAttachment(id)
      return attachment ? attachment.getMetadata() : null
    } catch (error) {
      throw new StorageError('添付ファイルのメタデータ取得に失敗しました', 'METADATA_FAILED', { id, error })
    }
  }

  /**
   * Clone attachment to another memo
   */
  async cloneAttachment(id: string, newMemoId: string): Promise<Attachment> {
    try {
      const originalAttachment = await this.getAttachment(id)
      if (!originalAttachment) {
        throw new StorageError('複製対象の添付ファイルが見つかりません', 'NOT_FOUND', { id })
      }

      const clonedAttachment = originalAttachment.clone(newMemoId)
      await this.storeAttachment(clonedAttachment)

      return clonedAttachment
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError('添付ファイルの複製に失敗しました', 'CLONE_FAILED', { id, error })
    }
  }

  /**
   * Cleanup old or large attachments to free space
   */
  async cleanupStorage(options: {
    maxAge?: number // days
    maxSize?: number // bytes
    keepMostRecent?: number // number of files to keep
  } = {}): Promise<{ deletedCount: number; freedSpace: number }> {
    try {
      const attachments = this.getAllAttachments()
      let deletedCount = 0
      let freedSpace = 0

      // Sort by upload date (oldest first)
      const sortedAttachments = attachments.sort((a, b) => 
        a.uploadedAt.getTime() - b.uploadedAt.getTime()
      )

      for (const attachment of sortedAttachments) {
        let shouldDelete = false

        // Check age
        if (options.maxAge) {
          const ageInDays = (Date.now() - attachment.uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
          if (ageInDays > options.maxAge) {
            shouldDelete = true
          }
        }

        // Check size
        if (options.maxSize && attachment.fileSize > options.maxSize) {
          shouldDelete = true
        }

        // Keep most recent files
        if (options.keepMostRecent) {
          const recentFiles = sortedAttachments.slice(-options.keepMostRecent)
          if (!recentFiles.includes(attachment)) {
            shouldDelete = true
          }
        }

        if (shouldDelete) {
          await this.deleteAttachment(attachment.id)
          deletedCount++
          freedSpace += attachment.fileSize
        }
      }

      return { deletedCount, freedSpace }
    } catch (error) {
      throw new StorageError('ストレージクリーンアップに失敗しました', 'CLEANUP_FAILED', { error })
    }
  }

  /**
   * Create attachment with progress tracking
   */
  private async createAttachmentWithProgress(
    file: File, 
    memoId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Attachment> {
    const attachmentId = crypto.randomUUID ? crypto.randomUUID() : `attachment_${Date.now()}_${Math.random()}`
    
    const updateProgress = (status: UploadProgress['status'], progress: number, error?: string) => {
      const progressData: UploadProgress = {
        attachmentId,
        progress,
        status,
        error
      }
      
      if (onProgress) {
        onProgress(progressData)
      }
    }

    try {
      updateProgress('uploading', 10)
      
      // Create attachment from file
      const attachment = await Attachment.createFromFile(file, memoId)
      attachment.id = attachmentId

      updateProgress('processing', 80)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100))

      updateProgress('complete', 100)

      return attachment
    } catch (error) {
      updateProgress('error', 0, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Check storage quota before upload
   */
  private async checkStorageQuota(fileSize: number): Promise<void> {
    try {
      const usage = await this.getStorageUsage()
      const availableSpace = AttachmentService.MAX_STORAGE_SIZE - usage.totalSize

      if (fileSize > availableSpace) {
        throw new StorageError(
          `ストレージ容量が不足しています。利用可能: ${Math.round(availableSpace / 1024 / 1024)}MB, 必要: ${Math.round(fileSize / 1024 / 1024)}MB`,
          'QUOTA_EXCEEDED',
          { available: availableSpace, required: fileSize }
        )
      }
    } catch (error) {
      if (error instanceof StorageError && error.type === 'QUOTA_EXCEEDED') {
        throw error
      }
      // If usage check fails, allow upload but warn
      console.warn('Storage quota check failed:', error)
    }
  }

  /**
   * Store attachment in both storage systems
   */
  private async storeAttachment(attachment: Attachment): Promise<void> {
    const attachmentData = attachment.toJSON()

    try {
      // Store in IndexedDB (preferred for large files)
      await this.indexedDBService.saveAttachment(attachmentData)
    } catch (error) {
      console.warn('IndexedDB storage failed, using LocalStorage:', error)
    }

    // Store in LocalStorage as fallback
    const attachments = this.localStorageService.get<AttachmentInterface[]>(AttachmentService.STORAGE_KEY) || []
    const existingIndex = attachments.findIndex(a => a.id === attachment.id)
    
    if (existingIndex >= 0) {
      attachments[existingIndex] = attachmentData
    } else {
      attachments.push(attachmentData)
    }
    
    this.localStorageService.set(AttachmentService.STORAGE_KEY, attachments)
  }

  /**
   * Register progress callback for upload tracking
   */
  registerProgressCallback(attachmentId: string, callback: (progress: UploadProgress) => void): void {
    this.uploadProgressCallbacks.set(attachmentId, callback)
  }

  /**
   * Unregister progress callback
   */
  unregisterProgressCallback(attachmentId: string): void {
    this.uploadProgressCallbacks.delete(attachmentId)
  }

  /**
   * Get file type statistics
   */
  getFileTypeStatistics(): Record<string, { count: number; totalSize: number }> {
    const attachments = this.getAllAttachments()
    const stats: Record<string, { count: number; totalSize: number }> = {}

    attachments.forEach(attachment => {
      const type = attachment.fileType
      if (!stats[type]) {
        stats[type] = { count: 0, totalSize: 0 }
      }
      stats[type].count++
      stats[type].totalSize += attachment.fileSize
    })

    return stats
  }
}