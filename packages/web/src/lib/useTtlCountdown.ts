import { useState, useEffect } from 'react'

/**
 * Returns a human-readable countdown string for a given expiry ISO timestamp.
 * Updates every second while the environment is active.
 *
 * Returns null if expiresAt is not provided.
 * Returns "Expired" if the time has passed.
 */
export function useTtlCountdown(expiresAt: string | undefined | null): string | null {
  const [remaining, setRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null)
      return
    }

    const compute = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Expired')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      if (h > 0) {
        setRemaining(`${h}h ${m}m ${s}s`)
      } else if (m > 0) {
        setRemaining(`${m}m ${s}s`)
      } else {
        setRemaining(`${s}s`)
      }
    }

    compute()
    const id = setInterval(compute, 1_000)
    return () => clearInterval(id)
  }, [expiresAt])

  return remaining
}
