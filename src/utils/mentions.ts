import type { Mention } from '../types'

/**
 * Extract mentions from text content
 * Format: @username
 */
export const extractMentions = (text: string): Mention[] => {
  const mentions: Mention[] = []
  const mentionRegex = /@([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+)/g
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1]
    const start = match.index
    const end = match.index + match[0].length

    mentions.push({
      id: `mention_${start}_${username}`,
      userId: '', // Will be resolved later
      username,
      position: { start, end }
    })
  }

  return mentions
}

/**
 * Replace mentions in text with styled elements
 * Returns HTML string with mention spans
 */
export const renderMentions = (text: string, mentions: Mention[]): string => {
  if (mentions.length === 0) return text

  let result = text
  let offset = 0

  // Sort mentions by position to process them in order
  const sortedMentions = [...mentions].sort((a, b) => a.position.start - b.position.start)

  for (const mention of sortedMentions) {
    const start = mention.position.start + offset
    const end = mention.position.end + offset
    const originalText = result.substring(start, end)
    
    const mentionElement = `<span class="mention" data-user-id="${mention.userId}" data-username="${mention.username}" title="@${mention.username}">@${mention.username}</span>`
    
    result = result.substring(0, start) + mentionElement + result.substring(end)
    offset += mentionElement.length - originalText.length
  }

  return result
}

/**
 * Validate if a username exists
 * This would typically check against a user database
 * For now, we'll use localStorage to check existing users
 */
export const validateMentionedUser = async (username: string): Promise<{ exists: boolean; userId?: string }> => {
  try {
    const usersData = localStorage.getItem('quintessence_users')
    if (!usersData) {
      return { exists: false }
    }

    const users = JSON.parse(usersData) as Array<{ id: string; username: string }>
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    
    return user ? { exists: true, userId: user.id } : { exists: false }
  } catch (error) {
    console.error('Error validating mentioned user:', error)
    return { exists: false }
  }
}

/**
 * Resolve user IDs for mentions
 */
export const resolveMentions = async (mentions: Mention[]): Promise<Mention[]> => {
  const resolvedMentions: Mention[] = []

  for (const mention of mentions) {
    const validation = await validateMentionedUser(mention.username)
    if (validation.exists && validation.userId) {
      resolvedMentions.push({
        ...mention,
        userId: validation.userId
      })
    }
  }

  return resolvedMentions
}

/**
 * Get mentioned user IDs from text
 */
export const getMentionedUserIds = async (text: string): Promise<string[]> => {
  const mentions = extractMentions(text)
  const resolvedMentions = await resolveMentions(mentions)
  return resolvedMentions.map(m => m.userId).filter(id => id.length > 0)
}

/**
 * Format mention text for display
 */
export const formatMentionText = (text: string): string => {
  // Convert @username to clickable mentions in plain text
  return text.replace(
    /@([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+)/g,
    '<span class="text-blue-600 font-medium">@$1</span>'
  )
}

/**
 * Strip mention formatting from text (for storage)
 */
export const stripMentionFormatting = (text: string): string => {
  // Remove HTML mention elements and keep just the @username
  return text.replace(
    /<span[^>]*class="mention"[^>]*>(@[^<]+)<\/span>/g,
    '$1'
  )
}

/**
 * Get unique mentioned usernames from text
 */
export const getUniqueMentionedUsernames = (text: string): string[] => {
  const mentions = extractMentions(text)
  const uniqueUsernames = new Set(mentions.map(m => m.username.toLowerCase()))
  return Array.from(uniqueUsernames)
}

/**
 * Check if text contains mentions
 */
export const hasMentions = (text: string): boolean => {
  const mentionRegex = /@([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+)/
  return mentionRegex.test(text)
}

/**
 * Generate mention suggestion based on input
 */
export const generateMentionSuggestions = async (query: string): Promise<Array<{ id: string; username: string; displayName: string }>> => {
  try {
    const usersData = localStorage.getItem('quintessence_users')
    if (!usersData) {
      return []
    }

    const users = JSON.parse(usersData) as Array<{ id: string; username: string }>
    const lowerQuery = query.toLowerCase()

    return users
      .filter(user => user.username.toLowerCase().includes(lowerQuery))
      .slice(0, 10) // Limit to 10 suggestions
      .map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.username
      }))
  } catch (error) {
    console.error('Error generating mention suggestions:', error)
    return []
  }
}