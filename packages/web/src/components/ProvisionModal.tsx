import { useState, useEffect, useRef } from 'react'
import {
  createProvisionStream,
  openProvisionEventStream,
  provisionEnvironmentWithStream,
  type ProvisionStreamEvent,
} from '../lib/api'
import { ApiError } from '../lib/ApiError'
import Button from './Button'
import Card from './Card'

interface ProvisionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StreamStep {
  step: string
  message: string
  done?: boolean
  error?: boolean
}

const STEP_ICONS: Record<string, string> = {
  intent: '🧠',
  finops: '🛡️',
  provisioning: '⚙️',
  done: '✅',
  error: '❌',
}

export default function ProvisionModal({ open, onClose, onSuccess }: ProvisionModalProps) {
  const [prompt, setPrompt] = useState('')
  const [instanceType, setInstanceType] = useState<'t3.micro' | 't4g.nano' | ''>('')
  const [ttlHours, setTtlHours] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StreamStep[]>([])
  const closeRef = useRef(openProvisionEventStream)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Clean up SSE on unmount or close
  useEffect(() => {
    if (!open) {
      cleanupRef.current?.()
      cleanupRef.current = null
      setSteps([])
      setError(null)
    }
  }, [open])

  if (!open) return null

  const addStep = (event: ProvisionStreamEvent) => {
    setSteps((prev) => {
      // Replace existing step with same key, or append
      const idx = prev.findIndex((s) => s.step === event.step)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = event
        return next
      }
      return [...prev, event]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSteps([])
    setSubmitting(true)

    try {
      // Step 1: register stream
      const requestId = await createProvisionStream()

      // Step 2: open SSE before firing POST so we don't miss early events
      cleanupRef.current = closeRef.current(requestId, (event) => {
        addStep(event)
      })

      // Step 3: fire provision request
      await provisionEnvironmentWithStream(
        {
          prompt,
          instanceType: instanceType || undefined,
          ttlHours: ttlHours !== '' ? ttlHours : undefined,
        },
        requestId,
      )

      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to provision environment')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isFinished = steps.some((s) => s.done || s.error)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-lg">
        <h2 className="text-lg font-semibold text-ephops-text-primary mb-4">Provision Environment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ephops-text-secondary mb-1">Prompt</label>
            <textarea
              className="w-full bg-ephops-surface border border-ephops-border-default rounded px-3 py-2 text-sm text-ephops-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-ephops-accent-blue"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ephops-text-secondary mb-1">Instance Type</label>
              <select
                className="w-full bg-ephops-surface border border-ephops-border-default rounded px-3 py-2 text-sm text-ephops-text-primary focus:outline-none focus:ring-1 focus:ring-ephops-accent-blue"
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value as 't3.micro' | 't4g.nano' | '')}
                disabled={submitting}
              >
                <option value="">Auto-detect</option>
                <option value="t3.micro">t3.micro</option>
                <option value="t4g.nano">t4g.nano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-ephops-text-secondary mb-1">TTL (hours)</label>
              <input
                type="number"
                className="w-full bg-ephops-surface border border-ephops-border-default rounded px-3 py-2 text-sm text-ephops-text-primary focus:outline-none focus:ring-1 focus:ring-ephops-accent-blue"
                value={ttlHours}
                onChange={(e) => setTtlHours(e.target.value === '' ? '' : Number(e.target.value))}
                min={0.5}
                step={0.5}
                disabled={submitting}
                placeholder="1"
              />
            </div>
          </div>

          {/* Real-time step log */}
          {steps.length > 0 && (
            <div className="rounded-lg bg-ephops-base border border-ephops-border-subtle p-3 space-y-2">
              {steps.map((s) => (
                <div key={s.step} className="flex items-start gap-2">
                  <span className="text-base leading-5 shrink-0">
                    {STEP_ICONS[s.step] ?? '⏳'}
                  </span>
                  <span
                    className={[
                      'text-xs',
                      s.error
                        ? 'text-ephops-state-failed'
                        : s.done
                          ? 'text-emerald-400'
                          : 'text-ephops-text-secondary',
                    ].join(' ')}
                  >
                    {s.message}
                  </span>
                </div>
              ))}
              {submitting && !isFinished && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-ephops-accent-blue border-t-transparent animate-spin" />
                  <span className="text-xs text-ephops-text-muted">Working…</span>
                </div>
              )}
            </div>
          )}

          {/* Fallback progress hint when no SSE steps yet */}
          {submitting && steps.length === 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-ephops-accent-blue border-t-transparent animate-spin" />
              <p className="text-ephops-text-secondary text-xs">Connecting…</p>
            </div>
          )}

          {error && <p className="text-ephops-state-failed text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Provisioning…' : 'Provision'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
