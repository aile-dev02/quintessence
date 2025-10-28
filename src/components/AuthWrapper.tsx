import { useState, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { AuthService } from '../services/AuthService'
import type { LoginRequest, RegisterRequest, AuthState } from '../types'

interface AuthWrapperProps {
  children: React.ReactNode
}

type AuthView = 'login' | 'register'

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    isLoading: true,
    error: null
  })
  const [currentView, setCurrentView] = useState<AuthView>('login')

  const authService = AuthService.getInstance()

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const state = authService.getAuthState()
        setAuthState({
          ...state,
          isLoading: false
        })
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          currentUser: null,
          isLoading: false,
          error: error instanceof Error ? error.message : '認証状態の確認に失敗しました'
        })
      }
    }

    checkAuth()
  }, [authService])

  const handleLogin = async (data: LoginRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await authService.login(data)
      setAuthState({
        isAuthenticated: true,
        currentUser: user,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'ログインに失敗しました'
      }))
      throw error // Re-throw to let form handle it
    }
  }

  const handleRegister = async (data: RegisterRequest) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const user = await authService.register(data)
      // Auto login after registration
      await authService.login({ email: data.email, password: data.password })
      setAuthState({
        isAuthenticated: true,
        currentUser: user,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '登録に失敗しました'
      }))
      throw error // Re-throw to let form handle it
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setAuthState({
        isAuthenticated: false,
        currentUser: null,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // Show loading spinner while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // Show authentication forms if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <>
        {currentView === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
            isLoading={authState.isLoading}
            error={authState.error}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
            isLoading={authState.isLoading}
            error={authState.error}
          />
        )}
      </>
    )
  }

  // Render children with authenticated context
  return (
    <AuthenticatedApp 
      user={authState.currentUser!} 
      onLogout={handleLogout}
    >
      {children}
    </AuthenticatedApp>
  )
}

// Component that provides authenticated context to children
interface AuthenticatedAppProps {
  user: NonNullable<AuthState['currentUser']>
  onLogout: () => void
  children: React.ReactNode
}

function AuthenticatedApp({ user, onLogout, children }: AuthenticatedAppProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* User menu can be added here if needed */}
      <div className="hidden">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">こんにちは、{user.username}さん</span>
          <button
            onClick={onLogout}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ログアウト
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}