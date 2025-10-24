# Component Interface Contracts

**Feature**: TestMemo frontend-only implementation
**Date**: 2025-10-24
**Type**: React component prop interfaces

## Memo Components

### MemoEditor Props

```typescript
interface MemoEditorProps {
  // Editing mode
  mode: 'create' | 'edit'
  
  // Initial data for editing
  initialMemo?: Partial<Memo>
  
  // Callback handlers
  onSave: (memo: CreateMemoRequest | UpdateMemoRequest) => Promise<void>
  onCancel: () => void
  onAttachmentUpload: (file: File) => Promise<Attachment>
  
  // UI state
  isLoading?: boolean
  error?: string
  
  // Available options
  availableTags: string[]
  availableProjects: Project[]
}
```

### MemoList Props

```typescript
interface MemoListProps {
  // Data
  memos: Memo[]
  
  // Display options
  view: 'list' | 'grid' | 'timeline'
  sortBy: 'created' | 'updated' | 'title'
  sortOrder: 'asc' | 'desc'
  
  // Selection and actions
  selectedMemos: string[]
  onMemoSelect: (id: string, selected: boolean) => void
  onMemoOpen: (memo: Memo) => void
  onMemoEdit: (memo: Memo) => void
  onMemoDelete: (memo: Memo) => void
  
  // Pagination
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  
  // Loading states
  isLoading?: boolean
  error?: string
}
```

### MemoCard Props

```typescript
interface MemoCardProps {
  // Data
  memo: Memo
  
  // Display options
  showAttachments?: boolean
  showTags?: boolean
  showProject?: boolean
  
  // Interaction handlers
  onClick?: (memo: Memo) => void
  onEdit?: (memo: Memo) => void
  onDelete?: (memo: Memo) => void
  onTagClick?: (tag: string) => void
  
  // UI state
  isSelected?: boolean
  isHighlighted?: boolean
  
  // Search highlighting
  highlights?: string[]
}
```

## Search Components

### SearchBar Props

```typescript
interface SearchBarProps {
  // Current search state
  query: string
  onQueryChange: (query: string) => void
  
  // Search execution
  onSearch: (query: string) => void
  onClear: () => void
  
  // Auto-complete
  suggestions: string[]
  showSuggestions: boolean
  onSuggestionSelect: (suggestion: string) => void
  
  // UI state
  isLoading?: boolean
  placeholder?: string
}
```

### FilterPanel Props

```typescript
interface FilterPanelProps {
  // Available filter options
  availableTags: string[]
  availableProjects: Project[]
  
  // Current filter state
  filters: MemoFilters
  onFiltersChange: (filters: MemoFilters) => void
  
  // Quick actions
  onClearFilters: () => void
  onSaveFilter: (name: string, filters: MemoFilters) => void
  
  // Saved filters
  savedFilters: SavedFilter[]
  onApplySavedFilter: (filter: SavedFilter) => void
  
  // UI state
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface SavedFilter {
  id: string
  name: string
  filters: MemoFilters
  createdAt: Date
}
```

## Knowledge Card Components

### KnowledgeCardEditor Props

```typescript
interface KnowledgeCardEditorProps {
  // Editing mode
  mode: 'create' | 'edit'
  
  // Initial data
  initialCard?: Partial<KnowledgeCard>
  
  // Handlers
  onSave: (card: CreateCardRequest | UpdateCardRequest) => Promise<void>
  onCancel: () => void
  
  // Link management
  linkableMemos: Memo[]
  onLinkMemo: (memoId: string) => void
  onUnlinkMemo: (memoId: string) => void
  
  // UI state
  isLoading?: boolean
  error?: string
  
  // Available options
  availableTags: string[]
}
```

### KnowledgeCardList Props

```typescript
interface KnowledgeCardListProps {
  // Data
  cards: KnowledgeCard[]
  
  // Display options
  view: 'list' | 'grid'
  sortBy: 'created' | 'updated' | 'title' | 'usage'
  sortOrder: 'asc' | 'desc'
  
  // Actions
  onCardOpen: (card: KnowledgeCard) => void
  onCardEdit: (card: KnowledgeCard) => void
  onCardDelete: (card: KnowledgeCard) => void
  onCardLink: (cardId: string, memoId: string) => void
  
  // UI state
  isLoading?: boolean
  error?: string
}
```

## Attachment Components

### AttachmentUploader Props

```typescript
interface AttachmentUploaderProps {
  // Target memo
  memoId: string
  
  // Upload handling
  onUploadStart: (file: File) => void
  onUploadProgress: (progress: UploadProgress) => void
  onUploadComplete: (attachment: Attachment) => void
  onUploadError: (error: string) => void
  
  // UI options
  multiple?: boolean
  acceptedTypes?: string[]
  maxFileSize?: number
  
  // Drag and drop
  isDragOver?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
}
```

### AttachmentViewer Props

```typescript
interface AttachmentViewerProps {
  // Attachment data
  attachment: Attachment
  
  // Display options
  showMetadata?: boolean
  showThumbnail?: boolean
  
  // Actions
  onDownload?: (attachment: Attachment) => void
  onDelete?: (attachment: Attachment) => void
  onView?: (attachment: Attachment) => void
  
  // UI state
  isLoading?: boolean
  error?: string
}
```

## Common UI Components

### Modal Props

```typescript
interface ModalProps {
  // Visibility
  isOpen: boolean
  onClose: () => void
  
  // Content
  title?: string
  children: React.ReactNode
  
  // Actions
  actions?: ModalAction[]
  
  // UI options
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
}

interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}
```

### Toast Props

```typescript
interface ToastProps {
  // Message
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  
  // Behavior
  duration?: number
  onDismiss: () => void
  
  // Actions
  action?: {
    label: string
    onClick: () => void
  }
}
```

### LoadingSpinner Props

```typescript
interface LoadingSpinnerProps {
  // Size and appearance
  size?: 'sm' | 'md' | 'lg'
  color?: string
  
  // Text
  message?: string
  
  // Overlay
  overlay?: boolean
}
```

## Event Handler Types

```typescript
// Common event handlers used across components
type MemoEventHandler = (memo: Memo) => void
type AttachmentEventHandler = (attachment: Attachment) => void
type TagEventHandler = (tag: string) => void
type FilterEventHandler = (filters: MemoFilters) => void
type SearchEventHandler = (query: string, filters?: MemoFilters) => void

// Generic handlers
type ChangeEventHandler<T> = (value: T) => void
type AsyncEventHandler<T> = (value: T) => Promise<void>
type ErrorEventHandler = (error: string) => void
```