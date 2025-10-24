export const validateMemoTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'タイトルは必須です'
  }
  
  if (title.length > 200) {
    return 'タイトルは200文字以内で入力してください'
  }
  
  return null
}

export const validateMemoBody = (body: string): string | null => {
  if (!body || body.trim().length === 0) {
    return '内容は必須です'
  }
  
  return null
}

export const validateTag = (tag: string): string | null => {
  if (!tag || tag.trim().length === 0) {
    return 'タグが空です'
  }
  
  if (tag.length < 2) {
    return 'タグは2文字以上で入力してください'
  }
  
  if (tag.length > 30) {
    return 'タグは30文字以内で入力してください'
  }
  
  // Allow alphanumeric, hyphens, and underscores
  const tagRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+$/
  if (!tagRegex.test(tag)) {
    return 'タグに使用できない文字が含まれています'
  }
  
  return null
}

export const validateTags = (tags: string[]): string | null => {
  if (tags.length > 20) {
    return 'タグは20個以内で設定してください'
  }
  
  for (let i = 0; i < tags.length; i++) {
    const error = validateTag(tags[i])
    if (error) {
      return `タグ ${i + 1}: ${error}`
    }
  }
  
  // Check for duplicates
  const uniqueTags = new Set(tags)
  if (uniqueTags.size !== tags.length) {
    return '重複するタグがあります'
  }
  
  return null
}

export const validateFileName = (fileName: string): string | null => {
  if (!fileName || fileName.trim().length === 0) {
    return 'ファイル名は必須です'
  }
  
  // Check for path separators
  if (fileName.includes('/') || fileName.includes('\\')) {
    return 'ファイル名にパス区切り文字を含めることはできません'
  }
  
  return null
}

export const validateFileSize = (fileSize: number, maxSize: number = 5 * 1024 * 1024): string | null => {
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return `ファイルサイズは${maxSizeMB}MB以内にしてください`
  }
  
  return null
}

export const validateFileType = (fileType: string, allowedTypes: string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf'
]): string | null => {
  if (!allowedTypes.includes(fileType)) {
    return 'サポートされていないファイル形式です'
  }
  
  return null
}

export const validateProjectName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'プロジェクト名は必須です'
  }
  
  if (name.length > 50) {
    return 'プロジェクト名は50文字以内で入力してください'
  }
  
  return null
}

export const validateKnowledgeCardTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'ナレッジカードのタイトルは必須です'
  }
  
  if (title.length > 100) {
    return 'タイトルは100文字以内で入力してください'
  }
  
  return null
}

export const validateKnowledgeCardBody = (body: string): string | null => {
  if (!body || body.trim().length === 0) {
    return 'ナレッジカードの内容は必須です'
  }
  
  return null
}

export const sanitizeInput = (input: string): string => {
  // Remove control characters and trim whitespace
  // eslint-disable-next-line no-control-regex
  return input.trim().replace(/[\x00-\x1F\x7F]/g, '')
}

export const normalizeTag = (tag: string): string => {
  return tag.toLowerCase().trim()
}