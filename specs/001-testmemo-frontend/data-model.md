# Data Model: TestMemo QA Knowledge Sharing Tool

**Feature**: TestMemo frontend-only implementation
**Date**: 2025-10-24
**Based on**: [spec.md](spec.md) functional requirements

## Core Entities

### Memo

**Purpose**: Primary content entity storing QA insights and observations

**Fields**:
- `id`: string (UUID v4)
- `title`: string (max 200 chars, required)
- `body`: string (rich text content, required)
- `tags`: string[] (user-defined labels)
- `projectId`: string (optional reference to Project)
- `attachments`: Attachment[] (file references)
- `createdAt`: Date (ISO string)
- `updatedAt`: Date (ISO string)
- `linkedCards`: string[] (references to KnowledgeCard IDs)

**Validation Rules**:
- Title must be non-empty and trimmed
- Body must be non-empty
- Tags must be alphanumeric with hyphens/underscores
- CreatedAt cannot be modified after creation
- UpdatedAt must be set on every modification

**Storage**: LocalStorage as JSON with IndexedDB for full-text search index

### Attachment

**Purpose**: File metadata and content for memo attachments

**Fields**:
- `id`: string (UUID v4)
- `memoId`: string (foreign key to Memo)
- `fileName`: string (original file name)
- `fileType`: string (MIME type)
- `fileSize`: number (bytes)
- `content`: string (base64 encoded file content)
- `thumbnailUrl`: string (optional, for images)
- `uploadedAt`: Date (ISO string)

**Validation Rules**:
- FileName must not contain path separators
- FileSize must not exceed 5MB per file
- Content must be valid base64 encoding
- FileType must be from allowed list (images, text, logs)

**Storage**: IndexedDB for efficient large blob storage

### KnowledgeCard

**Purpose**: Reusable content blocks for common procedures and FAQs

**Fields**:
- `id`: string (UUID v4)
- `title`: string (max 100 chars, required)
- `body`: string (rich text content, required)
- `tags`: string[] (categorization labels)
- `createdBy`: string (user identifier, for future multi-user)
- `createdAt`: Date (ISO string)
- `updatedAt`: Date (ISO string)
- `linkedMemos`: string[] (references to Memo IDs)

**Validation Rules**:
- Title must be unique within user's cards
- Body must be non-empty
- Tags follow same rules as Memo tags

**Storage**: LocalStorage as JSON array

### Tag

**Purpose**: Categorization system for memos and knowledge cards

**Fields**:
- `name`: string (lowercase, alphanumeric with hyphens)
- `color`: string (hex color code, optional)
- `category`: string (feature, error, environment, etc.)
- `usageCount`: number (auto-calculated)
- `lastUsed`: Date (ISO string)

**Validation Rules**:
- Name must be unique, lowercase, 2-30 characters
- Color must be valid hex format if provided
- UsageCount updated automatically on memo/card operations

**Storage**: LocalStorage as JSON object (key-value)

### Project

**Purpose**: Grouping mechanism for organizing related memos

**Fields**:
- `id`: string (UUID v4)
- `name`: string (max 50 chars, required)
- `description`: string (optional)
- `color`: string (hex color, optional)
- `createdAt`: Date (ISO string)
- `memoCount`: number (auto-calculated)

**Validation Rules**:
- Name must be unique within user's projects
- Description limited to 500 characters
- MemoCount updated when memos are created/deleted

**Storage**: LocalStorage as JSON array

## Relationships

### Memo ↔ Attachment (One-to-Many)
- One memo can have multiple attachments
- Each attachment belongs to exactly one memo
- Cascading delete: removing memo removes all attachments

### Memo ↔ KnowledgeCard (Many-to-Many)
- Memos can link to multiple knowledge cards
- Knowledge cards can be linked from multiple memos
- Bidirectional references maintained for navigation

### Memo → Project (Many-to-One)
- Multiple memos can belong to one project
- Memo can exist without project assignment
- Project deletion requires reassignment or memo deletion confirmation

### Tag → Memo/KnowledgeCard (Many-to-Many)
- Tags are shared between memos and knowledge cards
- Auto-complete based on existing tag usage
- Unused tags can be garbage collected

## State Transitions

### Memo Lifecycle
1. **Draft** → Created with title and body
2. **Active** → Available for search and linking
3. **Archived** → Hidden from default views but searchable
4. **Deleted** → Marked for removal, actual deletion after confirmation

### Attachment Lifecycle
1. **Uploading** → File selected and being processed
2. **Processing** → Generating thumbnails and metadata
3. **Ready** → Available for display and download
4. **Error** → Upload or processing failed, retry available

## Search Index Structure

### Full-Text Search Fields
- Memo: title, body, tag names, file names
- KnowledgeCard: title, body, tag names
- Weighted scoring: title (3x), tags (2x), body (1x)

### Filterable Fields
- createdAt, updatedAt (date ranges)
- tags (exact match, multiple selection)
- projectId (exact match)
- hasAttachments (boolean)
- fileTypes (from attachments)

## Storage Quotas and Limits

- **Total LocalStorage**: ~5MB for metadata
- **Total IndexedDB**: ~50MB for attachments and search index
- **Per Memo**: Max 10 attachments, 5MB each
- **Per User**: Max 1000 memos (typical usage ~100)

## Data Migration Strategy

**Version 1.0**: Initial schema as defined above
**Future versions**: Versioned schema with migration functions
**Export format**: JSON with embedded base64 attachments
**Import compatibility**: Markdown, CSV, and JSON formats