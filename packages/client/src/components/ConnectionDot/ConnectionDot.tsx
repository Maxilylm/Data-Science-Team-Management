import './ConnectionDot.css'
import type { SSEStatus } from '../../hooks/useSSE'

interface ConnectionDotProps {
  status: SSEStatus
}

const STATUS_LABELS: Record<SSEStatus, string> = {
  connected: 'Live — connected',
  reconnecting: 'Reconnecting…',
  disconnected: 'Disconnected',
}

export function ConnectionDot({ status }: ConnectionDotProps) {
  return (
    <span
      className={`connection-dot connection-dot--${status}`}
      role="status"
      aria-label={STATUS_LABELS[status]}
      title={STATUS_LABELS[status]}
    >
      <span className="connection-dot__ring" aria-hidden="true" />
      <span className="connection-dot__core" aria-hidden="true" />
    </span>
  )
}
