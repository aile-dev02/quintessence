import type { StorageError } from '../types'
import { StorageErrorType } from '../types'

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: ((error: Error) => void)[] = []

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  public handleError(error: Error, context?: string): void {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    
    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })
  }

  public addErrorListener(listener: (error: Error) => void): void {
    this.errorListeners.push(listener)
  }

  public removeErrorListener(listener: (error: Error) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  public isStorageError(error: Error): error is StorageError {
    return 'type' in error && Object.values(StorageErrorType).includes((error as StorageError).type)
  }

  public getErrorMessage(error: Error): string {
    if (this.isStorageError(error)) {
      switch (error.type) {
        case StorageErrorType.QUOTA_EXCEEDED:
          return 'ストレージの容量が不足しています。不要なデータを削除してください。'
        case StorageErrorType.CORRUPTED_DATA:
          return 'データが破損しています。アプリケーションを再起動してください。'
        case StorageErrorType.INVALID_FORMAT:
          return '無効なデータ形式です。'
        case StorageErrorType.NOT_FOUND:
          return '指定されたデータが見つかりません。'
        case StorageErrorType.PERMISSION_DENIED:
          return 'データへのアクセスが拒否されました。'
        default:
          return 'ストレージエラーが発生しました。'
      }
    }

    return error.message || '予期しないエラーが発生しました。'
  }

  public createStorageError(message: string, type: StorageErrorType, details?: Record<string, unknown>): StorageError {
    const error = new Error(message) as StorageError
    error.type = type
    error.details = details
    return error
  }
}