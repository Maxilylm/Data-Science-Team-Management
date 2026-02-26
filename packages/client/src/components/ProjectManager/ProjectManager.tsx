import { useState } from 'react'
import type { Project } from '../../types'
import { DirectoryBrowser } from '../DirectoryBrowser/DirectoryBrowser'

type FormMode = 'list' | 'add-existing' | 'create-new' | 'browse'

interface ProjectManagerProps {
  isOpen: boolean
  projects: Project[]
  activeProjectId: string | null
  onClose: () => void
  onAddExisting: (data: { name: string; path: string }) => void
  onCreateNew: (data: { name: string; path: string }) => void
  onRemove: (id: string) => void
  onActivate: (id: string) => void
  isDarkMode: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function ProjectManager({
  isOpen,
  projects,
  activeProjectId,
  onClose,
  onAddExisting,
  onCreateNew,
  onRemove,
  onActivate,
  isDarkMode
}: ProjectManagerProps) {
  const [mode, setMode] = useState<FormMode>('list')
  const [name, setName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) return null

  const bg = isDarkMode ? '#1f2937' : '#ffffff'
  const text = isDarkMode ? '#e5e7eb' : '#1f2937'
  const subText = isDarkMode ? '#9ca3af' : '#6b7280'
  const border = isDarkMode ? '#4b5563' : '#d1d5db'
  const hoverBg = isDarkMode ? '#374151' : '#f3f4f6'
  const inputBg = isDarkMode ? '#374151' : '#ffffff'

  const resetForm = () => {
    setName('')
    setProjectPath('')
    setFormError(null)
    setMode('list')
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!projectPath.trim()) {
      setFormError('Path is required')
      return
    }

    if (mode === 'add-existing') {
      onAddExisting({ name: name.trim(), path: projectPath.trim() })
    } else if (mode === 'create-new') {
      onCreateNew({ name: name.trim(), path: projectPath.trim() })
    }
    resetForm()
  }

  const handleRemove = (id: string) => {
    if (confirmRemoveId === id) {
      onRemove(id)
      setConfirmRemoveId(null)
    } else {
      setConfirmRemoveId(id)
    }
  }

  const renderForm = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', color: text }}>
        {mode === 'add-existing' ? 'Add Existing Folder' : 'Create New Project'}
      </h3>

      {formError && (
        <div style={{ color: '#ef4444', fontSize: '13px' }}>{formError}</div>
      )}

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '4px' }}>
          Project Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setFormError(null) }}
          placeholder="My Project"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${border}`,
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: inputBg,
            color: text,
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '4px' }}>
          Directory Path
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={projectPath}
            onChange={(e) => { setProjectPath(e.target.value); setFormError(null) }}
            placeholder="/Users/you/projects/my-project"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${border}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: inputBg,
              color: text
            }}
          />
          <button
            onClick={() => setMode('browse')}
            style={{
              padding: '8px 12px',
              border: `1px solid ${border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: hoverBg,
              color: text,
              fontSize: '13px'
            }}
          >
            Browse
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          onClick={resetForm}
          style={{
            padding: '8px 16px',
            border: `1px solid ${border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: text,
            fontSize: '13px'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          {mode === 'add-existing' ? 'Add Project' : 'Create Project'}
        </button>
      </div>
    </div>
  )

  const renderBrowse = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: text }}>Select Directory</h3>
      <DirectoryBrowser
        onSelect={(path) => {
          setProjectPath(path)
          setMode(name ? 'add-existing' : 'add-existing')
        }}
        onCancel={() => setMode('add-existing')}
        isDarkMode={isDarkMode}
      />
    </div>
  )

  const renderList = () => (
    <div>
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {projects.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: subText }}>
            No projects registered yet
          </div>
        )}
        {projects.map(project => {
          const isActive = project.id === activeProjectId
          return (
            <div
              key={project.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${border}`,
                backgroundColor: isActive ? (isDarkMode ? '#1e3a5f20' : '#dbeafe40') : 'transparent'
              }}
            >
              <div
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => { if (!isActive) onActivate(project.id) }}
              >
                <div style={{ fontWeight: 500, fontSize: '14px', color: text }}>
                  {isActive && <span style={{ color: '#3b82f6' }}>● </span>}
                  {project.name}
                </div>
                <div style={{ fontSize: '12px', color: subText, fontFamily: 'monospace' }}>
                  {project.path}
                </div>
                <div style={{ fontSize: '11px', color: subText, marginTop: '2px' }}>
                  Last accessed: {formatDate(project.lastAccessedAt)}
                </div>
              </div>
              <button
                onClick={() => handleRemove(project.id)}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  backgroundColor: confirmRemoveId === project.id ? '#ef4444' : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                  color: confirmRemoveId === project.id ? '#ffffff' : text
                }}
              >
                {confirmRemoveId === project.id ? 'Confirm?' : 'Remove'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '8px',
        borderTop: `1px solid ${border}`
      }}>
        <button
          onClick={() => setMode('add-existing')}
          style={{
            flex: 1,
            padding: '8px',
            border: `1px solid ${border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: text,
            fontSize: '13px'
          }}
        >
          Add Existing Folder
        </button>
        <button
          onClick={() => setMode('create-new')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          Create New Project
        </button>
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { resetForm(); onClose() } }}
    >
      <div style={{
        backgroundColor: bg,
        borderRadius: '12px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text }}>
            Manage Projects
          </h2>
          <button
            onClick={() => { resetForm(); onClose() }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: subText,
              padding: '4px 8px'
            }}
          >
            x
          </button>
        </div>

        {mode === 'list' && renderList()}
        {(mode === 'add-existing' || mode === 'create-new') && renderForm()}
        {mode === 'browse' && renderBrowse()}
      </div>
    </div>
  )
}
