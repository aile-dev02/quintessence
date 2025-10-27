import Dexie, { type Table } from 'dexie'
import type { Attachment, Memo } from '../../types'

interface AttachmentRecord {
  id: string
  memoId: string
  fileName: string
  fileType: string
  fileSize: number
  content: string
  thumbnailUrl?: string
  uploadedAt: Date
}

interface MemoSearchIndex {
  id: string
  title: string
  body: string
  tags: string
  searchText: string
  createdAt: Date
}

export class TestMemoDatabase extends Dexie {
  attachments!: Table<AttachmentRecord>
  searchIndex!: Table<MemoSearchIndex>

  constructor() {
    super('TestMemoDatabase')
    
    this.version(1).stores({
      attachments: 'id, memoId, fileName, fileType, fileSize, uploadedAt',
      searchIndex: 'id, createdAt, *tags'
    })
  }
}

export class IndexedDBService {
  private static instance: IndexedDBService
  private db: TestMemoDatabase

  private constructor() {
    this.db = new TestMemoDatabase()
  }

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService()
    }
    return IndexedDBService.instance
  }

  // Attachment operations
  public async saveAttachment(attachment: Attachment): Promise<void> {
    await this.db.attachments.put(attachment)
  }

  public async getAttachment(id: string): Promise<Attachment | undefined> {
    return await this.db.attachments.get(id)
  }

  public async getAttachmentsByMemo(memoId: string): Promise<Attachment[]> {
    return await this.db.attachments.where('memoId').equals(memoId).toArray()
  }

  public async deleteAttachment(id: string): Promise<void> {
    await this.db.attachments.delete(id)
  }

  public async deleteAttachmentsByMemo(memoId: string): Promise<void> {
    await this.db.attachments.where('memoId').equals(memoId).delete()
  }

  // Search index operations
  public async updateSearchIndex(memo: Memo): Promise<void> {
    const searchRecord: MemoSearchIndex = {
      id: memo.id,
      title: memo.title,
      body: memo.body,
      tags: memo.tags.join(' '),
      searchText: `${memo.title} ${memo.body} ${memo.tags.join(' ')}`,
      createdAt: memo.createdAt
    }
    
    await this.db.searchIndex.put(searchRecord)
  }

  public async removeFromSearchIndex(memoId: string): Promise<void> {
    await this.db.searchIndex.delete(memoId)
  }

  public async searchMemos(query: string): Promise<MemoSearchIndex[]> {
    const lowerQuery = query.toLowerCase()
    
    return await this.db.searchIndex
      .where('searchText')
      .startsWithIgnoreCase(lowerQuery)
      .or('searchText')
      .anyOfIgnoreCase(lowerQuery.split(' '))
      .limit(50)
      .toArray()
  }

  public async getUsage(): Promise<{ bytes: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return { bytes: estimate.usage || 0 }
      }
      return { bytes: 0 }
    } catch {
      return { bytes: 0 }
    }
  }

  public async clear(): Promise<void> {
    await this.db.attachments.clear()
    await this.db.searchIndex.clear()
  }
}