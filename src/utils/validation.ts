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

export const validateReplyFileType = (fileType: string): string | null => {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    // Documents
    'text/plain',
    'text/csv',
    'application/json',
    'application/pdf',
    // Excel files
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.ms-excel.template.macroEnabled.12',
    // CSV alternatives
    'text/comma-separated-values',
    'application/csv'
  ]
  
  if (!allowedTypes.includes(fileType)) {
    return '対応していないファイル形式です。画像、CSV、Excelファイルのみアップロード可能です'
  }
  
  return null
}

export const validateReplyFileSize = (fileSize: number): string | null => {
  const maxSize = 10 * 1024 * 1024 // 10MB for reply attachments
  if (fileSize > maxSize) {
    return 'ファイルサイズは10MB以内にしてください'
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

// User validation functions
export const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return 'ユーザー名は必須です'
  }
  
  if (username.length < 3) {
    return 'ユーザー名は3文字以上で入力してください'
  }
  
  if (username.length > 20) {
    return 'ユーザー名は20文字以内で入力してください'
  }
  
  // Allow alphanumeric, Japanese, hyphens, and underscores
  const usernameRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+$/
  if (!usernameRegex.test(username)) {
    return 'ユーザー名に使用できない文字が含まれています'
  }
  
  return null
}

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'メールアドレスは必須です'
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '有効なメールアドレスを入力してください'
  }
  
  if (email.length > 100) {
    return 'メールアドレスは100文字以内で入力してください'
  }
  
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password || password.length === 0) {
    return 'パスワードは必須です'
  }
  
  if (password.length < 6) {
    return 'パスワードは6文字以上で入力してください'
  }
  
  if (password.length > 50) {
    return 'パスワードは50文字以内で入力してください'
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return 'パスワードは英字と数字を両方含む必要があります'
  }
  
  return null
}

export const validateReplyContent = (content: string): string | null => {
  if (!content || content.trim().length === 0) {
    return '返信内容は必須です'
  }
  
  if (content.length > 1000) {
    return '返信内容は1000文字以内で入力してください'
  }
  
  return null
}

// Notification validation functions
export const validateNotificationData = (data: {
  title: string
  message: string
  type: string
  relatedId: string
  relatedType: string
  fromUserId: string
  toUserId: string
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Validate title
  if (!data.title || data.title.trim().length === 0) {
    errors.push('通知タイトルは必須です')
  } else if (data.title.length > 200) {
    errors.push('通知タイトルは200文字以内で入力してください')
  }
  
  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    errors.push('通知メッセージは必須です')
  } else if (data.message.length > 500) {
    errors.push('通知メッセージは500文字以内で入力してください')
  }
  
  // Validate type
  const validTypes = ['mention', 'reply', 'memo_update', 'system']
  if (!validTypes.includes(data.type)) {
    errors.push('無効な通知タイプです')
  }
  
  // Validate relatedType
  const validRelatedTypes = ['memo', 'reply']
  if (!validRelatedTypes.includes(data.relatedType)) {
    errors.push('無効な関連タイプです')
  }
  
  // Validate IDs
  if (!data.relatedId || data.relatedId.trim().length === 0) {
    errors.push('関連IDは必須です')
  }
  
  if (!data.fromUserId || data.fromUserId.trim().length === 0) {
    errors.push('送信者IDは必須です')
  }
  
  if (!data.toUserId || data.toUserId.trim().length === 0) {
    errors.push('受信者IDは必須です')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}