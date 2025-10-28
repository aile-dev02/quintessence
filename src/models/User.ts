import type { User as UserInterface } from '../types'
import { generateId } from '../utils/uuid'
import { 
  validateEmail, 
  validatePassword,
  validateUsername,
  sanitizeInput 
} from '../utils/validation'
import { ValidationError } from '../utils/errors'

export class User implements UserInterface {
  id: string
  username: string
  email: string
  passwordHash: string
  createdAt: Date
  lastLoginAt: Date | null
  isActive: boolean

  constructor(data: Partial<UserInterface> = {}) {
    this.id = data.id || generateId()
    this.username = data.username || ''
    this.email = data.email || ''
    this.passwordHash = data.passwordHash || ''
    this.createdAt = data.createdAt || new Date()
    this.lastLoginAt = data.lastLoginAt || null
    this.isActive = data.isActive ?? true
  }

  /**
   * Create a new user with validation
   */
  static create(data: {
    username: string
    email: string
    password: string
  }): User {
    // Validate inputs
    const usernameError = validateUsername(data.username)
    if (usernameError) {
      throw new ValidationError(usernameError)
    }

    const emailError = validateEmail(data.email)
    if (emailError) {
      throw new ValidationError(emailError)
    }

    const passwordError = validatePassword(data.password)
    if (passwordError) {
      throw new ValidationError(passwordError)
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(data.username)
    const sanitizedEmail = sanitizeInput(data.email).toLowerCase()

    // Simple password hashing (in production, use bcrypt or similar)
    const passwordHash = User.hashPassword(data.password)

    return new User({
      username: sanitizedUsername,
      email: sanitizedEmail,
      passwordHash: passwordHash
    })
  }

  /**
   * Simple password hashing (not secure for production)
   * In production, use bcrypt or similar libraries
   */
  static hashPassword(password: string): string {
    // This is a very basic hash - use bcrypt in production
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  /**
   * Verify password against stored hash
   */
  verifyPassword(password: string): boolean {
    return this.passwordHash === User.hashPassword(password)
  }

  /**
   * Update user profile
   */
  updateProfile(updates: {
    username?: string
    email?: string
  }): void {
    if (updates.username !== undefined) {
      const usernameError = validateUsername(updates.username)
      if (usernameError) {
        throw new ValidationError(usernameError)
      }
      this.username = sanitizeInput(updates.username)
    }

    if (updates.email !== undefined) {
      const emailError = validateEmail(updates.email)
      if (emailError) {
        throw new ValidationError(emailError)
      }
      this.email = sanitizeInput(updates.email).toLowerCase()
    }
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): void {
    if (!this.verifyPassword(currentPassword)) {
      throw new ValidationError('現在のパスワードが正しくありません')
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      throw new ValidationError(passwordError)
    }

    this.passwordHash = User.hashPassword(newPassword)
  }

  /**
   * Mark user as logged in
   */
  markAsLoggedIn(): void {
    this.lastLoginAt = new Date()
  }

  /**
   * Deactivate user account
   */
  deactivate(): void {
    this.isActive = false
  }

  /**
   * Activate user account
   */
  activate(): void {
    this.isActive = true
  }

  /**
   * Get user display name
   */
  getDisplayName(): string {
    return this.username
  }

  /**
   * Get formatted last login time
   */
  getFormattedLastLogin(): string {
    if (!this.lastLoginAt) {
      return 'ログイン履歴なし'
    }
    return this.lastLoginAt.toLocaleString('ja-JP')
  }

  /**
   * Convert user to plain object for storage (excluding password)
   */
  toJSON(): UserInterface {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive
    }
  }

  /**
   * Convert user to safe object for client (excluding password hash)
   */
  toSafeJSON(): Omit<UserInterface, 'passwordHash'> {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive
    }
  }

  /**
   * Create user instance from stored data
   */
  static fromJSON(data: UserInterface): User {
    return new User({
      ...data,
      createdAt: new Date(data.createdAt),
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null
    })
  }
}