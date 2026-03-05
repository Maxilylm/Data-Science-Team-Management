import { useEffect, useRef } from 'react'
import { overlayStyle } from '../../constants/dialogStyles'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  isDarkMode?: boolean
}

// ConfirmDialog stacks above other modals — override the default z-index
const confirmOverlayStyle: React.CSSProperties = { ...overlayStyle, zIndex: 1100 }

const getDialogStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1f2937' : 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '400px',
  maxWidth: '90vw',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const buttonBaseStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'background-color 0.2s, transform 0.1s'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isDarkMode = false
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button for safety (prevents accidental confirmation)
      confirmButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: confirmVariant === 'danger' ? '#ef4444' : '#3b82f6',
    color: 'white'
  }

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
    color: isDarkMode ? '#e5e7eb' : '#374151',
    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db'
  }

  return (
    <div
      style={confirmOverlayStyle}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div style={getDialogStyle(isDarkMode)} onClick={e => e.stopPropagation()}>
        <h2
          id="confirm-dialog-title"
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 600
          }}
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            lineHeight: 1.5
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={cancelButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#e5e7eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            style={confirmButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = confirmVariant === 'danger' ? '#dc2626' : '#2563eb'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = confirmVariant === 'danger' ? '#ef4444' : '#3b82f6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
