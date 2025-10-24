import type { StorageError } from '../../types'
import { StorageErrorType } from '../../types'

class TestMemoStorageError extends Error implements StorageError {
  type: StorageErrorType
  details?: Record<string, unknown>

  constructor(message: string, type: StorageErrorType, details?: Record<string, unknown>) {
    super(message)
    this.name = 'TestMemoStorageError'
    this.type = type
    this.details = details
  }
}

export class LocalStorageService {
  private static instance: LocalStorageService
  private readonly keyPrefix = 'testmemo_'

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService()
    }
    return LocalStorageService.instance
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  public set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(this.getKey(key), serializedValue)
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new TestMemoStorageError('Storage quota exceeded', StorageErrorType.QUOTA_EXCEEDED)
      }
      throw new TestMemoStorageError('Failed to store data', StorageErrorType.INVALID_FORMAT)
    }
  }

  public get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (item === null) {
        return null
      }
      return JSON.parse(item) as T
    } catch {
      throw new TestMemoStorageError('Failed to retrieve data', StorageErrorType.CORRUPTED_DATA)
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(this.getKey(key))
  }

  public clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.keyPrefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  public exists(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null
  }

  public getAllKeys(): string[] {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(this.keyPrefix))
      .map(key => key.substring(this.keyPrefix.length))
  }

  public getUsage(): { used: number; total: number } {
    let used = 0
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith(this.keyPrefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    })

    // Approximate localStorage limit (5MB in most browsers)
    const total = 5 * 1024 * 1024

    return { used, total }
  }
}