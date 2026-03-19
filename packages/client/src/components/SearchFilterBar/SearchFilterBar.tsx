import { useState, useRef, useEffect } from 'react'
import type { Agent, TicketStatus, TicketPriority } from '../../types'

interface SearchFilterBarProps {
  onFilterChange: (filters: FilterState) => void
  isDarkMode: boolean
  agents?: Agent[]
}

export interface FilterState {
  searchQuery: string
  status: TicketStatus | null
  priority: TicketPriority | null
  agentId: string | null
}

const containerStyle = (isDarkMode: boolean): React.CSSProperties => ({
  display: 'flex',
  gap: '12px',
  padding: '12px 24px',
  backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
  borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0',
  alignItems: 'center',
  flexWrap: 'wrap'
})

const inputStyle = (isDarkMode: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  paddingLeft: '36px',
  fontSize: '14px',
  border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: isDarkMode ? '#374151' : 'white',
  color: isDarkMode ? '#f3f4f6' : '#1f2937',
  width: '280px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
})

const selectStyle = (isDarkMode: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  fontSize: '13px',
  border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
  borderRadius: '6px',
  backgroundColor: isDarkMode ? '#374151' : 'white',
  color: isDarkMode ? '#f3f4f6' : '#1f2937',
  cursor: 'pointer',
  outline: 'none'
})


export default function SearchFilterBar({ onFilterChange, isDarkMode, agents = [] }: SearchFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState<TicketStatus | null>(null)
  const [priority, setPriority] = useState<TicketPriority | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters: FilterState = {
      searchQuery: updates.searchQuery ?? searchQuery,
      status: updates.status !== undefined ? updates.status : status,
      priority: updates.priority !== undefined ? updates.priority : priority,
      agentId: updates.agentId !== undefined ? updates.agentId : agentId
    }
    onFilterChange(newFilters)
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateFilters({ searchQuery: value })
    }, 250)
  }

  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? null : value as TicketStatus
    setStatus(newStatus)
    updateFilters({ status: newStatus })
  }

  const handlePriorityChange = (value: string) => {
    const newPriority = value === 'all' ? null : value as TicketPriority
    setPriority(newPriority)
    updateFilters({ priority: newPriority })
  }

  const handleAgentChange = (value: string) => {
    const newAgentId = value === 'all' ? null : value
    setAgentId(newAgentId)
    updateFilters({ agentId: newAgentId })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatus(null)
    setPriority(null)
    setAgentId(null)
    onFilterChange({ searchQuery: '', status: null, priority: null, agentId: null })
  }

  const hasActiveFilters = searchQuery || status || priority || agentId

  return (
    <div style={containerStyle(isDarkMode)}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '14px',
          opacity: 0.5
        }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search tickets by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={inputStyle(isDarkMode)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#e2e8f0'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#64748b' }}>Status:</span>
        <select
          value={status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={selectStyle(isDarkMode)}
        >
          <option value="all">All</option>
          <option value="unassigned">Unassigned</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="needs_help">Needs Help</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#64748b' }}>Priority:</span>
        <select
          value={priority || 'all'}
          onChange={(e) => handlePriorityChange(e.target.value)}
          style={selectStyle(isDarkMode)}
        >
          <option value="all">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {agents.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#64748b' }}>Agent:</span>
          <select
            value={agentId || 'all'}
            onChange={(e) => handleAgentChange(e.target.value)}
            style={selectStyle(isDarkMode)}
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="btn btn--secondary btn--sm"
        >
          Clear filters
        </button>
      )}

      {hasActiveFilters && (
        <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#64748b', marginLeft: 'auto' }}>
          Filtering active
        </span>
      )}
    </div>
  )
}
