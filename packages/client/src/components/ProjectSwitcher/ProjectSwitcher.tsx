import { useState, useRef, useEffect } from 'react'
import type { Project } from '../../types'

interface ProjectSwitcherProps {
  projects: Project[]
  activeProject: Project | null
  isActivating: boolean
  onActivate: (id: string) => void
  onManageProjects: () => void
  isDarkMode: boolean
}

function truncatePath(p: string, maxLen: number = 40): string {
  if (p.length <= maxLen) return p
  const parts = p.split('/')
  if (parts.length <= 3) return '...' + p.slice(-maxLen + 3)
  return parts[0] + '/.../' + parts.slice(-2).join('/')
}

export function ProjectSwitcher({
  projects,
  activeProject,
  isActivating,
  onActivate,
  onManageProjects,
  isDarkMode
}: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const bg = isDarkMode ? '#374151' : '#f3f4f6'
  const text = isDarkMode ? '#e5e7eb' : '#1f2937'
  const subText = isDarkMode ? '#9ca3af' : '#6b7280'
  const dropdownBg = isDarkMode ? '#1f2937' : '#ffffff'
  const border = isDarkMode ? '#4b5563' : '#d1d5db'

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isActivating}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '8px 12px',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          cursor: isActivating ? 'wait' : 'pointer',
          minWidth: '200px',
          color: text,
          opacity: isActivating ? 0.7 : 1
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {activeProject?.name || 'No project'}
        </span>
        <span style={{ fontSize: '11px', color: subText }}>
          {activeProject ? truncatePath(activeProject.path) : 'Select a project'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: dropdownBg,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '280px',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '4px', maxHeight: '300px', overflowY: 'auto' }}>
            {projects.map(project => {
              const isActive = project.id === activeProject?.id
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    if (!isActive) onActivate(project.id)
                    setIsOpen(false)
                  }}
                  className="btn btn--ghost btn--sm"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    backgroundColor: isActive ? (isDarkMode ? '#1e3a5f' : '#dbeafe') : undefined,
                    color: text
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>
                    {isActive ? '● ' : ''}{project.name}
                  </span>
                  <span style={{ fontSize: '11px', color: subText }}>
                    {truncatePath(project.path)}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ borderTop: `1px solid ${border}`, padding: '4px' }}>
            <button
              onClick={() => {
                setIsOpen(false)
                onManageProjects()
              }}
              className="btn btn--ghost btn--sm"
              style={{
                width: '100%',
                color: '#3b82f6',
                justifyContent: 'flex-start'
              }}
            >
              Manage Projects...
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
