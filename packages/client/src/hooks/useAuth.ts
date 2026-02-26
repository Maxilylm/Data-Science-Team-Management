import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const TOKEN_KEY = 'dashboard-auth-token'

interface AuthState {
  isAuthEnabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthEnabled: false,
    isAuthenticated: true,
    isLoading: true,
    token: localStorage.getItem(TOKEN_KEY)
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const config = await api.getAuthConfig()
      const token = localStorage.getItem(TOKEN_KEY)

      if (!config.enabled) {
        setState({
          isAuthEnabled: false,
          isAuthenticated: true,
          isLoading: false,
          token: null
        })
        return
      }

      setState({
        isAuthEnabled: true,
        isAuthenticated: !!token,
        isLoading: false,
        token
      })
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true
      }))
    }
  }

  const login = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      token
    }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      token: null
    }))
  }, [])

  return {
    ...state,
    login,
    logout,
    checkAuth
  }
}
