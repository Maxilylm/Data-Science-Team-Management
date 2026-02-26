import { useState } from 'react'

interface LoginScreenProps {
  onLogin: (token: string) => void
  isDarkMode: boolean
}

export function LoginScreen({ onLogin, isDarkMode }: LoginScreenProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Token is required')
      return
    }
    setError('')
    onLogin(token.trim())
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6'
    }}>
      <div style={{
        width: '400px',
        padding: '32px',
        borderRadius: '12px',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
          color: isDarkMode ? '#e5e7eb' : '#111827'
        }}>
          Agent Team Dashboard
        </h1>
        <p style={{
          fontSize: '14px',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          marginBottom: '24px'
        }}>
          Enter your access token to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter access token"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: error
                ? '1px solid #ef4444'
                : isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
              backgroundColor: isDarkMode ? '#111827' : 'white',
              color: isDarkMode ? '#e5e7eb' : '#111827',
              marginBottom: '8px',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
