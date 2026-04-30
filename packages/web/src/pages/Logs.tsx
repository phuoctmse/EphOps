import { useState, useEffect, useCallback } from 'react'
import type { ActionLog } from '@ephops/shared-types'
import { fetchAllActionLogs } from '../lib/api'
import Card from '../components/Card'

type ToolFilter = 'ALL' | 'log_reasoning' | 'provision_resources' | 'guardrails_block' | 'guardrails_concurrency_block' | 'guardrails_intent_block'

const TOOL_LABELS: Record<string, string> = {
  log_reasoning: 'LLM Decision',
  provision_resources: 'Provision',
  guardrails_block: 'Guardrails Block',
  guardrails_concurrency_block: 'Concurrency Block',
  guardrails_intent_block: 'Intent Block',
}

const TOOL_COLORS: Record<string, string> = {
  log_reasoning: 'bg-blue-950 text-blue-300',
  provision_resources: 'bg-emerald-950 text-emerald-300',
  guardrails_block: 'bg-red-950 text-red-300',
  guardrails_concurrency_block: 'bg-orange-950 text-orange-300',
  guardrails_intent_block: 'bg-amber-950 text-amber-300',
}

function ToolBadge({ tool }: { tool: string }) {
  const label = TOOL_LABELS[tool] ?? tool
  const color = TOOL_COLORS[tool] ?? 'bg-ephops-elevated text-ephops-text-secondary'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function formatOutput(output: unknown): string {
  if (output === null || output === undefined) return 'No output'
  if (typeof output === 'string') {
    try {
      return JSON.stringify(JSON.parse(output), null, 2)
    } catch {
      return output
    }
  }
  try {
    return JSON.stringify(output, null, 2)
  } catch {
    return String(output)
  }
}

export default function Logs() {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toolFilter, setToolFilter] = useState<ToolFilter>('ALL')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchAllActionLogs()
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const toolTypes = ['ALL', ...Array.from(new Set(logs.map((l) => l.toolCalled)))] as ToolFilter[]

  const filtered = logs.filter((log) => {
    const matchesTool = toolFilter === 'ALL' || log.toolCalled === toolFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      log.id.toLowerCase().includes(q) ||
      log.envId.toLowerCase().includes(q) ||
      log.toolCalled.toLowerCase().includes(q) ||
      log.agentReasoning.toLowerCase().includes(q)
    return matchesTool && matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ephops-text-primary">Logs</h1>
          <p className="text-sm text-ephops-text-secondary mt-1">
            {logs.length} total action log entries
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

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {toolTypes.map((tool) => (
            <button
              key={tool}
              onClick={() => setToolFilter(tool)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                toolFilter === tool
                  ? 'bg-ephops-elevated text-ephops-text-primary border border-ephops-border-default'
                  : 'text-ephops-text-secondary hover:bg-ephops-elevated',
              ].join(' ')}
            >
              {tool === 'ALL' ? 'All' : (TOOL_LABELS[tool] ?? tool)}
              {tool === 'ALL' && (
                <span className="ml-1 text-ephops-text-muted">({logs.length})</span>
              )}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search reasoning, env ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-ephops-surface border border-ephops-border-default rounded px-3 py-1.5 text-sm text-ephops-text-primary placeholder:text-ephops-text-muted w-64 focus:outline-none focus:ring-1 focus:ring-ephops-accent-blue"
        />
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-ephops-text-secondary text-sm">Loading logs…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-ephops-text-secondary text-sm">No logs match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="bg-ephops-surface border border-ephops-border-default rounded-lg overflow-hidden"
            >
              {/* Collapsed row */}
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-ephops-elevated transition-colors text-left"
              >
                <span className="text-ephops-text-muted text-xs w-3">
                  {expandedId === log.id ? '▼' : '▶'}
                </span>
                <span className="text-xs font-mono text-ephops-text-muted w-20 shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <ToolBadge tool={log.toolCalled} />
                <span className="text-xs font-mono text-ephops-text-muted shrink-0">
                  env:{log.envId.slice(0, 8)}
                </span>
                {log.durationMs > 0 && (
                  <span className="text-xs text-ephops-text-muted shrink-0">
                    {log.durationMs}ms
                  </span>
                )}
                <span className="text-xs text-ephops-text-secondary truncate flex-1 text-right">
                  {log.agentReasoning}
                </span>
              </button>

              {/* Expanded detail */}
              {expandedId === log.id && (
                <div className="border-t border-ephops-border-subtle px-4 py-4 space-y-4 bg-ephops-base">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded border border-ephops-border-subtle bg-ephops-surface px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ephops-text-muted">Log ID</p>
                      <p className="mt-1 font-mono text-xs text-ephops-text-primary">{log.id.slice(0, 12)}…</p>
                    </div>
                    <div className="rounded border border-ephops-border-subtle bg-ephops-surface px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ephops-text-muted">Env ID</p>
                      <p className="mt-1 font-mono text-xs text-ephops-text-primary">{log.envId.slice(0, 12)}…</p>
                    </div>
                    <div className="rounded border border-ephops-border-subtle bg-ephops-surface px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ephops-text-muted">Timestamp</p>
                      <p className="mt-1 font-mono text-xs text-ephops-text-primary">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded border border-ephops-border-subtle bg-ephops-surface px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ephops-text-muted">Duration</p>
                      <p className="mt-1 font-mono text-xs text-ephops-text-primary">
                        {log.durationMs > 0 ? `${log.durationMs}ms` : '—'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-muted mb-1">
                      Agent Reasoning
                    </p>
                    <p className="text-sm text-ephops-text-primary">{log.agentReasoning}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-muted mb-1">
                      Output
                    </p>
                    <pre className="bg-ephops-elevated border border-ephops-border-default rounded p-3 text-xs font-mono text-ephops-text-primary overflow-x-auto max-h-64">
                      {formatOutput(log.output)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {!loading && filtered.length > 0 && (
        <Card>
          <p className="text-xs text-ephops-text-muted">
            Showing {filtered.length} of {logs.length} log entries
          </p>
        </Card>
      )}
    </div>
  )
}
