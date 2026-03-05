import { useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
  isDarkMode?: boolean
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  zIndex: 1200,
  maxWidth: '400px'
}

const typeConfig: Record<ToastType, { bg: string; darkBg: string; icon: string; border: string }> = {
  success: { bg: '#d1fae5', darkBg: '#065f46', icon: '✓', border: '#10b981' },
  error: { bg: '#fee2e2', darkBg: '#7f1d1d', icon: '✕', border: '#ef4444' },
  info: { bg: '#dbeafe', darkBg: '#1e3a8a', icon: 'ℹ', border: '#3b82f6' },
  warning: { bg: '#fef3c7', darkBg: '#78350f', icon: '⚠', border: '#f59e0b' }
}

function ToastItem({
  toast,
  onDismiss,
  isDarkMode
}: {
  toast: ToastMessage
  onDismiss: () => void
  isDarkMode: boolean
}) {
  const [isExiting, setIsExiting] = useState(false)
  const config = typeConfig[toast.type]
  const duration = toast.duration ?? 4000
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 300)

    const dismissTimer = setTimeout(() => {
      onDismissRef.current()
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(dismissTimer)
    }
  }, [duration])

  const toastStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: isDarkMode ? config.darkBg : config.bg,
    borderRadius: '8px',
    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
    borderLeft: `4px solid ${config.border}`,
    animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
    color: isDarkMode ? '#f3f4f6' : '#1f2937'
  }

  const iconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: config.border,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  }

  return (
    <div style={toastStyle} role="alert" aria-live="polite">
      <div style={iconStyle}>{config.icon}</div>
      <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onDismiss, 300)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '16px',
          lineHeight: 1
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default function Toast({ toasts, onDismiss, isDarkMode = false }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      <div style={containerStyle}>
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </>
  )
}
