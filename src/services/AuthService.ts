import { User } from '../models/User'
import type { RegisterRequest, LoginRequest, AuthState } from '../types'

export class AuthService {
  private static instance: AuthService | null = null
  private readonly STORAGE_KEY = 'quintessence_users'
  private readonly CURRENT_USER_KEY = 'quintessence_current_user'

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<User> {
    const users = this.getStoredUsers()
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === data.email.toLowerCase())
    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています')
    }

    // Check if username already exists
    const existingUsername = users.find(user => user.username === data.username)
    if (existingUsername) {
      throw new Error('このユーザー名は既に使用されています')
    }

    // Create new user
    const newUser = User.create({
      username: data.username,
      email: data.email,
      password: data.password
    })

    // Store user
    users.push(newUser.toJSON())
    this.storeUsers(users)

    return newUser
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<User> {
    const users = this.getStoredUsers()
    
    // Find user by email
    const userData = users.find(user => user.email === data.email.toLowerCase())
    if (!userData) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    const user = User.fromJSON(userData)

    // Check if user is active
    if (!user.isActive) {
      throw new Error('このアカウントは無効化されています')
    }

    // Verify password
    if (!user.verifyPassword(data.password)) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    // Update last login time
    user.markAsLoggedIn()
    
    // Update stored user data
    const userIndex = users.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = user.toJSON()
      this.storeUsers(users)
    }

    // Store current user session
    this.setCurrentUser(user)

    return user
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.CURRENT_USER_KEY)
      if (!userData) {
        return null
      }

      const parsedData = JSON.parse(userData)
      return User.fromJSON(parsedData)
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  /**
   * Get authentication state
   */
  getAuthState(): AuthState {
    const currentUser = this.getCurrentUser()
    return {
      isAuthenticated: currentUser !== null,
      currentUser: currentUser,
      isLoading: false,
      error: null
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: {
    username?: string
    email?: string
  }): Promise<User> {
    const users = this.getStoredUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      throw new Error('ユーザーが見つかりません')
    }

    // Check if new email already exists (if email is being updated)
    if (updates.email && updates.email !== users[userIndex].email) {
      const newEmail = updates.email.toLowerCase()
      const existingUser = users.find(user => user.email === newEmail && user.id !== userId)
      if (existingUser) {
        throw new Error('このメールアドレスは既に使用されています')
      }
    }

    // Check if new username already exists (if username is being updated)
    if (updates.username && updates.username !== users[userIndex].username) {
      const newUsername = updates.username
      const existingUsername = users.find(user => user.username === newUsername && user.id !== userId)
      if (existingUsername) {
        throw new Error('このユーザー名は既に使用されています')
      }
    }

    const user = User.fromJSON(users[userIndex])
    user.updateProfile(updates)

    // Update stored data
    users[userIndex] = user.toJSON()
    this.storeUsers(users)

    // Update current user session if it's the current user
    const currentUser = this.getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(user)
    }

    return user
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const users = this.getStoredUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      throw new Error('ユーザーが見つかりません')
    }

    const user = User.fromJSON(users[userIndex])
    user.changePassword(currentPassword, newPassword)

    // Update stored data
    users[userIndex] = user.toJSON()
    this.storeUsers(users)
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | null {
    const users = this.getStoredUsers()
    const userData = users.find(u => u.id === userId)
    
    if (!userData) {
      return null
    }
    
    return User.fromJSON(userData)
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    const users = this.getStoredUsers()
    const userData = users.find(u => u.email === email.toLowerCase())
    
    if (!userData) {
      return null
    }
    
    return User.fromJSON(userData)
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    const users = this.getStoredUsers()
    const filteredUsers = users.filter(u => u.id !== userId)
    
    if (users.length === filteredUsers.length) {
      throw new Error('ユーザーが見つかりません')
    }

    this.storeUsers(filteredUsers)

    // Clear current user session if it's the deleted user
    const currentUser = this.getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      await this.logout()
    }
  }

  /**
   * Get all users (admin function)
   */
  getAllUsers(): User[] {
    const users = this.getStoredUsers()
    return users.map(userData => User.fromJSON(userData))
  }

  // Private helper methods

  private getStoredUsers(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load users from storage:', error)
      return []
    }
  }

  private storeUsers(users: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
    } catch (error) {
      console.error('Failed to store users:', error)
      throw new Error('ユーザーデータの保存に失敗しました')
    }
  }

  private setCurrentUser(user: User): void {
    try {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user.toJSON()))
    } catch (error) {
      console.error('Failed to store current user:', error)
      throw new Error('ログイン情報の保存に失敗しました')
    }
  }

  /**
   * Clear all users (development/testing only)
   */
  clearAllUsers(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.CURRENT_USER_KEY)
  }
}