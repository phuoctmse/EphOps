import { useState, useEffect, useCallback } from 'react'
import { fetchFullFinOpsMetrics } from '../lib/api'
import type { FinOpsMetrics } from '../lib/mappers'
import Card from '../components/Card'
import { formatUsd } from '../lib/formatters'

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ephops-border-subtle last:border-0">
      <span className="text-sm text-ephops-text-secondary">{label}</span>
      <span className="text-sm font-mono text-ephops-text-primary">{value}</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary mb-3">
        {title}
      </h3>
      {children}
    </Card>
  )
}

function ApproveRateBar({ rate }: { rate: number }) {
  const clamped = Math.min(100, Math.max(0, rate))
  const color = clamped >= 80 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-ephops-text-muted mb-1">
        <span>Approve rate</span>
        <span className="font-mono">{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-ephops-elevated overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export default function Metrics() {
  const [metrics, setMetrics] = useState<FinOpsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchFullFinOpsMetrics()
      setMetrics(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ephops-text-primary">Metrics</h1>
          <p className="text-sm text-ephops-text-secondary mt-1">
            FinOps agent performance and cost tracking
            {lastUpdated && (
              <span className="ml-2 text-ephops-text-muted">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          className="px-3 py-1.5 rounded-md border border-ephops-border-default text-sm text-ephops-text-secondary hover:bg-ephops-elevated transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950 border border-ephops-state-failed px-4 py-3">
          <p className="text-ephops-state-failed text-sm">{error}</p>
        </div>
      )}

      {loading && !metrics && (
        <div className="flex items-center justify-center py-16">
          <p className="text-ephops-text-secondary text-sm">Loading metrics…</p>
        </div>
      )}

      {metrics && (
        <>
          {/* Top KPI row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-ephops-surface border border-ephops-border-default p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
                Total Cost Incurred
              </p>
              <p className="text-2xl font-semibold font-mono text-ephops-text-primary mt-3">
                {formatUsd(metrics.cost.totalIncurredCostUsd)}
              </p>
              <p className="text-xs text-ephops-text-muted mt-1">
                est. {formatUsd(metrics.cost.totalEstimatedCostUsd)} budgeted
              </p>
            </div>

            <div className="rounded-lg bg-ephops-surface border border-ephops-border-default p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
                LLM Avg Latency
              </p>
              <p className="text-2xl font-semibold font-mono text-ephops-text-primary mt-3">
                {metrics.llm.avgDecisionLatencyMs != null
                  ? `${metrics.llm.avgDecisionLatencyMs}ms`
                  : '—'}
              </p>
              <p className="text-xs text-ephops-text-muted mt-1">
                p95:{' '}
                {metrics.llm.p95DecisionLatencyMs != null
                  ? `${metrics.llm.p95DecisionLatencyMs}ms`
                  : '—'}
              </p>
            </div>

            <div className="rounded-lg bg-ephops-surface border border-ephops-border-default p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
                Total Environments
              </p>
              <p className="text-2xl font-semibold font-mono text-ephops-text-primary mt-3">
                {metrics.environments.totalCount}
              </p>
              <p className="text-xs text-ephops-text-muted mt-1">
                {metrics.environments.activeCount} active
              </p>
            </div>

            <div className="rounded-lg bg-ephops-surface border border-ephops-border-default p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
                Guardrails Blocks
              </p>
              <p className="text-2xl font-semibold font-mono text-ephops-text-primary mt-3">
                {metrics.guardrails.blockCount}
              </p>
              <p className="text-xs text-ephops-text-muted mt-1">
                total blocked requests
              </p>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Decisions */}
            <SectionCard title="LLM Decisions">
              <StatRow label="Total decisions" value={metrics.decisions.total} />
              <StatRow label="Approved" value={metrics.decisions.approveCount} />
              <StatRow label="Rejected" value={metrics.decisions.rejectCount} />
              <ApproveRateBar rate={metrics.decisions.approveRate} />
            </SectionCard>

            {/* LLM */}
            <SectionCard title="LLM Performance">
              <StatRow
                label="Avg decision latency"
                value={
                  metrics.llm.avgDecisionLatencyMs != null
                    ? `${metrics.llm.avgDecisionLatencyMs}ms`
                    : '—'
                }
              />
              <StatRow
                label="p95 latency"
                value={
                  metrics.llm.p95DecisionLatencyMs != null
                    ? `${metrics.llm.p95DecisionLatencyMs}ms`
                    : '—'
                }
              />
              <StatRow label="Fallback used" value={metrics.llm.fallbackUsedCount} />
              <StatRow
                label="Fallback rate"
                value={`${metrics.llm.fallbackRate.toFixed(1)}%`}
              />
            </SectionCard>

            {/* Guardrails */}
            <SectionCard title="Guardrails">
              <StatRow label="Total blocks" value={metrics.guardrails.blockCount} />
              <StatRow
                label="Instance type blocks"
                value={metrics.guardrails.instanceTypeBlockCount}
              />
              <StatRow
                label="Concurrency blocks"
                value={metrics.guardrails.concurrencyBlockCount}
              />
            </SectionCard>

            {/* Cost */}
            <SectionCard title="Cost Breakdown">
              <StatRow
                label="Total incurred"
                value={formatUsd(metrics.cost.totalIncurredCostUsd)}
              />
              <StatRow
                label="Total estimated"
                value={formatUsd(metrics.cost.totalEstimatedCostUsd)}
              />
              <StatRow
                label="Avg hourly cost"
                value={
                  metrics.cost.avgHourlyCostUsd != null
                    ? formatUsd(metrics.cost.avgHourlyCostUsd) + '/hr'
                    : '—'
                }
              />
            </SectionCard>

            {/* Environments */}
            <SectionCard title="Environment States">
              <StatRow label="Total" value={metrics.environments.totalCount} />
              <StatRow label="Active (running)" value={metrics.environments.activeCount} />
              <StatRow label="Destroyed" value={metrics.environments.destroyedCount} />
              <StatRow label="Failed" value={metrics.environments.failedCount} />
            </SectionCard>

            {/* Snapshot info */}
            <SectionCard title="Snapshot">
              <StatRow
                label="Generated at"
                value={new Date(metrics.generatedAt).toLocaleString()}
              />
              <StatRow
                label="Data freshness"
                value={`${Math.round((Date.now() - new Date(metrics.generatedAt).getTime()) / 1000)}s ago`}
              />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
