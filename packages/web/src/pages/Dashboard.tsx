import { useState, useEffect } from 'react'
import { Environment, Metrics } from '@ephops/shared-types'
import MetricCard from '../components/MetricCard'
import EnvironmentTable from '../components/EnvironmentTable'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Mock data - replace with actual API calls
        setMetrics({
          totalCost: 1234.56,
          averageLatency: 245,
          environmentCount: 12,
          activeAgents: 6,
        })

        setEnvironments([
          {
            id: 'env-001-abc-def',
            name: 'Production Cluster',
            state: 'RUNNING',
            createdAt: new Date().toISOString(),
            cost: 345.67,
            region: 'us-east-1',
            instanceCount: 4,
            agentReasoning: 'Auto-scaled based on CPU metrics',
          },
          {
            id: 'env-002-xyz-uvw',
            name: 'Staging Environment',
            state: 'CREATING',
            createdAt: new Date().toISOString(),
            cost: 89.23,
            region: 'us-west-2',
            instanceCount: 2,
            agentReasoning: 'Provisioning new instances for testing',
          },
          {
            id: 'env-003-123-456',
            name: 'Dev Environment',
            state: 'RUNNING',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            cost: 45.12,
            region: 'eu-west-1',
            instanceCount: 1,
            agentReasoning: 'Single instance for local development',
          },
        ])

        setError(null)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-ephops-text-secondary">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ephops-text-primary">Dashboard</h1>
          <p className="text-sm text-ephops-text-secondary mt-1">
            Operational overview of ephemeral environments and FinOps metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Refresh</Button>
          <Button variant="primary">Provision</Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-950 border-ephops-state-failed">
          <p className="text-ephops-state-failed text-sm">{error}</p>
        </Card>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Cost" value={`$${metrics.totalCost.toFixed(2)}`} />
          <MetricCard label="Avg Latency" value={metrics.averageLatency} unit="ms" />
          <MetricCard label="Environments" value={metrics.environmentCount} />
          <MetricCard label="Active Agents" value={metrics.activeAgents} />
        </div>
      )}

      {/* Environments Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ephops-text-primary">Environments</h2>
          <p className="text-sm text-ephops-text-secondary mt-1">
            {environments.length} environments across all regions
          </p>
        </div>
        <EnvironmentTable environments={environments} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium uppercase tracking-wider text-ephops-text-secondary">
            Most Expensive
          </h3>
          <div className="mt-3 space-y-2">
            <p className="text-base font-mono text-ephops-text-primary">Production Cluster</p>
            <p className="text-xs text-ephops-text-secondary">$345.67 · 4 instances</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium uppercase tracking-wider text-ephops-text-secondary">
            Last 24h Activity
          </h3>
          <div className="mt-3">
            <p className="text-base font-mono text-ephops-text-primary">23 deployments</p>
            <p className="text-xs text-ephops-text-secondary">$156.34 cost</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
