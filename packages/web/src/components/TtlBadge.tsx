import { useTtlCountdown } from '../lib/useTtlCountdown'

interface TtlBadgeProps {
  expiresAt: string | null | undefined
  state: string
}

export default function TtlBadge({ expiresAt, state }: TtlBadgeProps) {
  const countdown = useTtlCountdown(
    state === 'RUNNING' || state === 'CREATING' ? expiresAt : null,
  )

  if (!countdown) return <span className="text-ephops-text-muted text-xs">—</span>

  const isExpired = countdown === 'Expired'
  const isUrgent =
    !isExpired &&
    expiresAt != null &&
    new Date(expiresAt).getTime() - Date.now() < 5 * 60 * 1000 // < 5 min

  return (
    <span
      className={[
        'font-mono text-xs tabular-nums',
        isExpired ? 'text-ephops-state-failed' : isUrgent ? 'text-amber-400' : 'text-ephops-text-secondary',
      ].join(' ')}
    >
      {countdown}
    </span>
  )
}
