import './Skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  className?: string
  style?: React.CSSProperties
}

export default function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className = '',
  style = {}
}: SkeletonProps) {
  const baseClass = 'skeleton'
  const variantClass = `skeleton--${variant}`
  const animationClass = animation !== 'none' ? `skeleton--${animation}` : ''

  const computedStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style
  }

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`.trim()}
      style={computedStyle}
      aria-hidden="true"
    />
  )
}

// Preset skeleton components for common use cases
export function SkeletonText({ lines = 1, width = '100%' }: { lines?: number; width?: string | number }) {
  return (
    <div className="skeleton-text-container">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? '60%' : width}
          height={14}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__header">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="skeleton-card__header-text">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={80} />
      <div className="skeleton-card__footer">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
    </div>
  )
}

export function SkeletonTicketCard() {
  return (
    <div className="skeleton-ticket">
      <div className="skeleton-ticket__header">
        <Skeleton variant="rounded" width={60} height={20} />
        <Skeleton variant="rounded" width={50} height={20} />
      </div>
      <Skeleton variant="text" width="80%" height={16} />
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="60%" height={14} />
      <div className="skeleton-ticket__tags">
        <Skeleton variant="rounded" width={50} height={18} />
        <Skeleton variant="rounded" width={40} height={18} />
      </div>
    </div>
  )
}

export function SkeletonAgentColumn() {
  return (
    <div className="skeleton-agent-column">
      <div className="skeleton-agent-column__header">
        <Skeleton variant="circular" width={8} height={8} />
        <div style={{ flex: 1 }}>
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="30%" height={12} />
        </div>
        <Skeleton variant="rounded" width={50} height={28} />
      </div>
      <SkeletonTicketCard />
      <SkeletonTicketCard />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-dashboard__header">
        <Skeleton variant="text" width={200} height={24} />
        <div className="skeleton-dashboard__stats">
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={100} height={28} />
          <Skeleton variant="rounded" width={90} height={28} />
        </div>
      </div>
      <div className="skeleton-dashboard__grid">
        <SkeletonAgentColumn />
        <SkeletonAgentColumn />
        <SkeletonAgentColumn />
      </div>
    </div>
  )
}
