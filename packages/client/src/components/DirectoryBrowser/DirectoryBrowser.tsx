import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import type { DirectoryEntry } from '../../types'

interface DirectoryBrowserProps {
  onSelect: (path: string) => void
  onCancel: () => void
  isDarkMode: boolean
}

export function DirectoryBrowser({ onSelect, onCancel, isDarkMode }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [entries, setEntries] = useState<DirectoryEntry[]>([])
  const [parentPath, setParentPath] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const browse = async (path?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.browseDirectory(path)
      setCurrentPath(result.currentPath)
      setEntries(result.entries)
      setParentPath(result.parentPath)
      setIsHome(result.isHome)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to browse')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    browse()
  }, [])

  const bg = isDarkMode ? '#1f2937' : '#ffffff'
  const text = isDarkMode ? '#e5e7eb' : '#1f2937'
  const border = isDarkMode ? '#4b5563' : '#d1d5db'
  const hoverBg = isDarkMode ? '#374151' : '#f3f4f6'

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 12px',
        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
        borderBottom: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', color: text, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentPath}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {!isHome && (
            <button
              onClick={() => browse(parentPath)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: text
              }}
            >
              Up
            </button>
          )}
        </div>
      </div>

      <div style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: bg }}>
        {isLoading && (
          <div style={{ padding: '16px', textAlign: 'center', color: text }}>Loading...</div>
        )}
        {error && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        )}
        {!isLoading && !error && entries.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: text, opacity: 0.6 }}>
            No subdirectories
          </div>
        )}
        {!isLoading && !error && entries.map(entry => (
          <button
            key={entry.path}
            onClick={() => browse(entry.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: text,
              fontSize: '13px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ opacity: 0.5 }}>📁</span>
            {entry.name}
          </button>
        ))}
      </div>

      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${border}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        backgroundColor: isDarkMode ? '#374151' : '#f9fafb'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: text
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSelect(currentPath)}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Select This Directory
        </button>
      </div>
    </div>
  )
}
