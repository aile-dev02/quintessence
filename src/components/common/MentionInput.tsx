import React, { useState, useRef, useEffect } from 'react'
import { AuthService } from '../../services/AuthService'
import { extractMentions, formatMentionText } from '../../utils/mentions'
import './MentionInput.css'

interface MentionSuggestion {
  id: string
  username: string
  displayName: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
  onMentions?: (mentionedUserIds: string[]) => void
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'テキストを入力... (@username でメンション)',
  rows = 4,
  disabled = false,
  className = '',
  onMentions
}) => {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const authService = AuthService.getInstance()

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    onChange(newValue)
    setCursorPosition(cursorPos)

    // Check for mention trigger (@)
    checkForMentionTrigger(newValue, cursorPos)

    // Extract mentions and notify parent
    if (onMentions) {
      const mentionedUsernames = extractMentions(newValue).map(m => m.username)
      getMentionedUserIds(mentionedUsernames).then(userIds => {
        onMentions(userIds)
      })
    }
  }

  // Check if user is typing a mention
  const checkForMentionTrigger = (text: string, cursorPos: number) => {
    const beforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex === -1) {
      setShowSuggestions(false)
      return
    }

    // Check if there's a space or newline between @ and cursor
    const afterAt = beforeCursor.substring(lastAtIndex + 1)
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      setShowSuggestions(false)
      return
    }

    // Extract the query after @
    const query = afterAt
    setMentionQuery(query)
    
    if (query.length >= 0) {
      searchUsers(query)
      setShowSuggestions(true)
      setActiveSuggestionIndex(-1)
    } else {
      setShowSuggestions(false)
    }
  }

  // Search users for mention suggestions
  const searchUsers = async (query: string) => {
    try {
      const users = authService.searchUsers(query, 10)
      const currentUser = authService.getCurrentUser()
      
      // Filter out current user
      const filteredUsers = users.filter(user => 
        currentUser ? user.id !== currentUser.id : true
      )

      const suggestions = filteredUsers.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.username
      }))

      setSuggestions(suggestions)
    } catch (error) {
      console.error('Error searching users:', error)
      setSuggestions([])
    }
  }

  // Get user IDs from usernames
  const getMentionedUserIds = async (usernames: string[]): Promise<string[]> => {
    const userIds: string[] = []
    
    for (const username of usernames) {
      const user = authService.getUserByUsername(username)
      if (user) {
        userIds.push(user.id)
      }
    }
    
    return userIds
  }

  // Handle suggestion selection
  const selectSuggestion = (suggestion: MentionSuggestion) => {
    const beforeCursor = value.substring(0, cursorPosition)
    const afterCursor = value.substring(cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = beforeCursor.substring(0, lastAtIndex)
      const newValue = beforeAt + `@${suggestion.username} ` + afterCursor
      
      onChange(newValue)
      
      // Set cursor position after the mention
      const newCursorPos = lastAtIndex + suggestion.username.length + 2
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
    
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault()
          selectSuggestion(suggestions[activeSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  // Handle blur (close suggestions)
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }, 200)
  }

  // Update cursor position on selection change
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener('selectionchange', handleSelectionChange)
      return () => {
        textarea.removeEventListener('selectionchange', handleSelectionChange)
      }
    }
  }, [])

  return (
    <div className="mention-input-container">
      <div className="mention-input-wrapper">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`mention-input ${className}`}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mention-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`mention-suggestion ${
                  index === activeSuggestionIndex ? 'active' : ''
                }`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                <div className="mention-suggestion-avatar">
                  👤
                </div>
                <div className="mention-suggestion-info">
                  <div className="mention-suggestion-username">
                    @{suggestion.username}
                  </div>
                  <div className="mention-suggestion-display">
                    {suggestion.displayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview with formatted mentions */}
      {value && extractMentions(value).length > 0 && (
        <div className="mention-preview">
          <div className="mention-preview-label">プレビュー:</div>
          <div 
            className="mention-preview-content"
            dangerouslySetInnerHTML={{ __html: formatMentionText(value) }}
          />
        </div>
      )}
    </div>
  )
}