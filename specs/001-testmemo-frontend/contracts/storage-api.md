# Local Storage API Contract

**Feature**: TestMemo frontend-only implementation
**Date**: 2025-10-24
**Type**: Client-side service interfaces

Since this is a frontend-only implementation, these contracts define the TypeScript interfaces for local storage services rather than HTTP APIs.

## MemoService Interface

```typescript
interface MemoService {
  // Create new memo
  create(memo: CreateMemoRequest): Promise<Memo>
  
  // Retrieve memo by ID
  getById(id: string): Promise<Memo | null>
  
  // List all memos with optional filtering
  list(filters?: MemoFilters): Promise<Memo[]>
  
  // Update existing memo
  update(id: string, updates: UpdateMemoRequest): Promise<Memo>
  
  // Delete memo and associated attachments
  delete(id: string): Promise<void>
  
  // Search memos by text
  search(query: string, filters?: MemoFilters): Promise<MemoSearchResult[]>
}

interface CreateMemoRequest {
  title: string
  body: string
  tags?: string[]
  projectId?: string
}

interface UpdateMemoRequest {
  title?: string
  body?: string
  tags?: string[]
  projectId?: string
}

interface MemoFilters {
  tags?: string[]
  projectId?: string
  dateFrom?: Date
  dateTo?: Date
  hasAttachments?: boolean
}

interface MemoSearchResult {
  memo: Memo
  score: number
  highlights: string[]
}
```

## AttachmentService Interface

```typescript
interface AttachmentService {
  // Upload file to memo
  upload(memoId: string, file: File): Promise<Attachment>
  
  // Get attachment metadata
  getMetadata(attachmentId: string): Promise<Attachment | null>
  
  // Get attachment content as blob
  getContent(attachmentId: string): Promise<Blob | null>
  
  // List attachments for memo
  listByMemo(memoId: string): Promise<Attachment[]>
  
  // Delete attachment
  delete(attachmentId: string): Promise<void>
  
  // Generate thumbnail for image
  generateThumbnail(attachmentId: string): Promise<string>
}

interface UploadProgress {
  attachmentId: string
  progress: number // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}
```

## KnowledgeCardService Interface

```typescript
interface KnowledgeCardService {
  // Create new knowledge card
  create(card: CreateCardRequest): Promise<KnowledgeCard>
  
  // Retrieve card by ID
  getById(id: string): Promise<KnowledgeCard | null>
  
  // List all cards with optional filtering
  list(filters?: CardFilters): Promise<KnowledgeCard[]>
  
  // Update existing card
  update(id: string, updates: UpdateCardRequest): Promise<KnowledgeCard>
  
  // Delete card
  delete(id: string): Promise<void>
  
  // Link card to memo
  linkToMemo(cardId: string, memoId: string): Promise<void>
  
  // Unlink card from memo
  unlinkFromMemo(cardId: string, memoId: string): Promise<void>
}

interface CreateCardRequest {
  title: string
  body: string
  tags?: string[]
}

interface UpdateCardRequest {
  title?: string
  body?: string
  tags?: string[]
}

interface CardFilters {
  tags?: string[]
  linkedToMemo?: string
}
```

## SearchService Interface

```typescript
interface SearchService {
  // Full-text search across memos and cards
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  
  // Get search suggestions as user types
  getSuggestions(partial: string): Promise<string[]>
  
  // Update search index when content changes
  updateIndex(item: Memo | KnowledgeCard): Promise<void>
  
  // Remove item from search index
  removeFromIndex(id: string, type: 'memo' | 'card'): Promise<void>
}

interface SearchOptions {
  type?: 'memo' | 'card' | 'both'
  tags?: string[]
  maxResults?: number
}

interface SearchResult {
  id: string
  type: 'memo' | 'card'
  title: string
  snippet: string
  score: number
  highlights: string[]
}
```

## StorageService Interface

```typescript
interface StorageService {
  // Get storage usage statistics
  getUsage(): Promise<StorageUsage>
  
  // Export all data to JSON
  exportData(): Promise<ExportData>
  
  // Import data from JSON
  importData(data: ImportData): Promise<ImportResult>
  
  // Clear all data (with confirmation)
  clearAll(): Promise<void>
  
  // Backup data to file
  backup(): Promise<Blob>
}

interface StorageUsage {
  totalBytes: number
  localStorageBytes: number
  indexedDBBytes: number
  memoCount: number
  attachmentCount: number
  quotaBytes: number
}

interface ExportData {
  version: string
  exportedAt: Date
  memos: Memo[]
  knowledgeCards: KnowledgeCard[]
  projects: Project[]
  tags: Record<string, Tag>
}

interface ImportData {
  version?: string
  memos?: Memo[]
  knowledgeCards?: KnowledgeCard[]
  projects?: Project[]
  tags?: Record<string, Tag>
}

interface ImportResult {
  success: boolean
  imported: {
    memos: number
    cards: number
    projects: number
    tags: number
  }
  errors: string[]
}
```

## Error Handling

```typescript
enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  INVALID_FORMAT = 'INVALID_FORMAT',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

interface StorageError extends Error {
  type: StorageErrorType
  details?: Record<string, any>
}
```

## Event System

```typescript
interface StorageEvents {
  'memo:created': (memo: Memo) => void
  'memo:updated': (memo: Memo) => void
  'memo:deleted': (id: string) => void
  'attachment:uploaded': (attachment: Attachment) => void
  'storage:quota-warning': (usage: StorageUsage) => void
  'storage:quota-exceeded': (usage: StorageUsage) => void
}

interface EventEmitter {
  on<K extends keyof StorageEvents>(event: K, handler: StorageEvents[K]): void
  off<K extends keyof StorageEvents>(event: K, handler: StorageEvents[K]): void
  emit<K extends keyof StorageEvents>(event: K, ...args: Parameters<StorageEvents[K]>): void
}
```