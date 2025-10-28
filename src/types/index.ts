export type MemoStatus = 'draft' | 'published' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: Date
  lastLoginAt: Date | null
  isActive: boolean
}

export interface Memo {
  id: string
  title: string
  body: string
  tags: string[]
  attachmentIds: string[]
  status: MemoStatus
  priority: Priority
  projectId: string | null
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
  linkedCards: string[]
}

export interface Reply {
  id: string
  memoId: string
  content: string
  authorId: string
  authorName: string
  attachmentIds: string[]
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
}

export interface Attachment {
  id: string
  memoId: string
  fileName: string
  fileType: string
  fileSize: number
  content: string
  thumbnailUrl?: string
  uploadedAt: Date
}

export interface KnowledgeCard {
  id: string
  title: string
  body: string
  tags: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  linkedMemos: string[]
}

export interface Project {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  memoCount: number
}

export interface Tag {
  name: string
  color?: string
  category: string
  usageCount: number
  lastUsed: Date
}

// Authentication types
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthState {
  isAuthenticated: boolean
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

// Request/Response types for services
export interface CreateMemoRequest {
  title: string
  body: string
  tags?: string[]
  projectId?: string
  priority?: Priority
  attachmentIds?: string[]
}

export interface UpdateMemoRequest {
  title?: string
  body?: string
  tags?: string[]
  projectId?: string
  priority?: Priority
  status?: MemoStatus
  attachmentIds?: string[]
}

export interface CreateReplyRequest {
  content: string
  attachmentIds?: string[]
}

export interface UpdateReplyRequest {
  content: string
  attachmentIds?: string[]
}

export interface MemoFilters {
  tags?: string[]
  projectId?: string
  dateFrom?: Date
  dateTo?: Date
  hasAttachments?: boolean
}

export interface MemoSearchResult {
  memo: Memo
  score: number
  highlights: string[]
}

export interface CreateCardRequest {
  title: string
  body: string
  tags?: string[]
}

export interface UpdateCardRequest {
  title?: string
  body?: string
  tags?: string[]
}

export interface CardFilters {
  tags?: string[]
  linkedToMemo?: string
}

export interface SearchOptions {
  type?: 'memo' | 'card' | 'both'
  tags?: string[]
  maxResults?: number
}

export interface SearchResult {
  id: string
  type: 'memo' | 'card'
  title: string
  snippet: string
  score: number
  highlights: string[]
}

export interface StorageUsage {
  totalBytes: number
  localStorageBytes: number
  indexedDBBytes: number
  memoCount: number
  attachmentCount: number
  quotaBytes: number
}

export interface ExportData {
  version: string
  exportedAt: Date
  memos: Memo[]
  knowledgeCards: KnowledgeCard[]
  projects: Project[]
  tags: Record<string, Tag>
}

export interface ImportData {
  version?: string
  memos?: Memo[]
  knowledgeCards?: KnowledgeCard[]
  projects?: Project[]
  tags?: Record<string, Tag>
}

export interface ImportResult {
  success: boolean
  imported: {
    memos: number
    cards: number
    projects: number
    tags: number
  }
  errors: string[]
}

export const StorageErrorType = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CORRUPTED_DATA: 'CORRUPTED_DATA',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const

export type StorageErrorType = typeof StorageErrorType[keyof typeof StorageErrorType]

export interface StorageError extends Error {
  type: StorageErrorType
  details?: Record<string, unknown>
}

export interface UploadProgress {
  attachmentId: string
  progress: number // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

// Mention and Notification types
export interface Mention {
  id: string
  userId: string
  username: string
  position: {
    start: number
    end: number
  }
}

export interface Notification {
  id: string
  type: 'mention' | 'reply' | 'memo_update' | 'system'
  title: string
  message: string
  relatedId: string // memoId, replyId, etc.
  relatedType: 'memo' | 'reply'
  fromUserId: string
  fromUsername: string
  toUserId: string
  createdAt: Date
  readAt: Date | null
  isRead: boolean
  data?: Record<string, unknown> // Additional context data
}

export interface CreateNotificationRequest {
  type: Notification['type']
  title: string
  message: string
  relatedId: string
  relatedType: Notification['relatedType']
  fromUserId: string
  fromUsername: string
  toUserId: string
  data?: Record<string, unknown>
}

export interface NotificationFilters {
  type?: Notification['type']
  isRead?: boolean
  dateFrom?: Date
  dateTo?: Date
}