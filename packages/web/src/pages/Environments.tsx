import { useState, useEffect, useCallback } from 'react'
import type { Environment } from '@ephops/shared-types'
import { fetchEnvironments } from '../lib/api'
import EnvironmentTable from '../components/EnvironmentTable'
import Button from '../components/Button'
import ProvisionModal from '../components/ProvisionModal'
import StatusBadge from '../components/StatusBadge'

type StateFilter = 'ALL' | 'RUNNING' | 'CREATING' | 'FAILED' | 'DESTROYED'

export default function Environments() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchEnvironments()
      setEnvironments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load environments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const filtered = environments.filter((env) => {
    const matchesState = stateFilter === 'ALL' || env.state === stateFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      env.id.toLowerCase().includes(q) ||
      env.name.toLowerCase().includes(q) ||
      env.region.toLowerCase().includes(q)
    return matchesState && matchesSearch
  })

  const counts: Record<StateFilter, number> = {
    ALL: environments.length,
    RUNNING: environments.filter((e) => e.state === 'RUNNING').length,
    CREATING: environments.filter((e) => e.state === 'CREATING').length,
    FAILED: environments.filter((e) => e.state === 'FAILED').length,
    DESTROYED: environments.filter((e) => e.state === 'DESTROYED').length,
  }

  const filterTabs: StateFilter[] = ['ALL', 'RUNNING', 'CREATING', 'FAILED', 'DESTROYED']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ephops-text-primary">Environments</h1>
          <p className="text-sm text-ephops-text-secondary mt-1">
            {environments.length} total environments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => void fetchData()}>Refresh</Button>
          <Button variant="primary" onClick={() => setProvisionOpen(true)}>Provision</Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-950 border border-ephops-state-failed px-4 py-3">
          <p className="text-ephops-state-failed text-sm">{error}</p>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStateFilter(tab)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                stateFilter === tab
                  ? 'bg-ephops-elevated text-ephops-text-primary border border-ephops-border-default'
                  : 'text-ephops-text-secondary hover:bg-ephops-elevated hover:text-ephops-text-primary',
              ].join(' ')}
            >
              {tab !== 'ALL' && <StatusBadge state={tab as Exclude<StateFilter, 'ALL'>} />}
              {tab === 'ALL' && <span>All</span>}
              <span className="text-ephops-text-muted">({counts[tab]})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by ID, name, or region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-ephops-surface border border-ephops-border-default rounded px-3 py-1.5 text-sm text-ephops-text-primary placeholder:text-ephops-text-muted w-64 focus:outline-none focus:ring-1 focus:ring-ephops-accent-blue"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-ephops-text-secondary text-sm">Loading environments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-ephops-text-secondary text-sm">
            {environments.length === 0
              ? 'No environments yet. Provision one to get started.'
              : 'No environments match your filters.'}
          </p>
          {environments.length === 0 && (
            <Button variant="primary" onClick={() => setProvisionOpen(true)}>
              Provision your first environment
            </Button>
          )}
        </div>
      ) : (
        <EnvironmentTable environments={filtered} onActionComplete={fetchData} />
      )}

      <ProvisionModal
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onSuccess={() => void fetchData()}
      />
    </div>
  )
}
