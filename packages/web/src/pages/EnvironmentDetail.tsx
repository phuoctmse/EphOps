import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Environment, ActionLog } from '@ephops/shared-types'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'

export default function EnvironmentDetail() {
  const { id } = useParams<{ id: string }>()
  const [environment, setEnvironment] = useState<Environment | null>(null)
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Mock data
        setEnvironment({
          id: id || 'env-001',
          name: 'Production Cluster',
          state: 'RUNNING',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          cost: 345.67,
          region: 'us-east-1',
          instanceCount: 4,
          agentReasoning: 'Auto-scaled to handle peak traffic load detected by metrics',
        })

        setLogs([
          {
            id: 'log-001',
            envId: id || 'env-001',
            toolCalled: 'CreateEC2Instance',
            durationMs: 3245,
            agentReasoning: 'CPU utilization exceeded 85% threshold',
            output: {
              instanceId: 'i-0a1b2c3d4e5f6g7h8',
              instanceType: 't3.large',
              az: 'us-east-1a',
            },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'log-002',
            envId: id || 'env-001',
            toolCalled: 'ValidateCost',
            durationMs: 245,
            agentReasoning: 'Validating monthly cost projections',
            output: {
              projectedCost: 12450,
              thresholdExceeded: false,
            },
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-ephops-text-secondary">Loading environment details...</div>
      </div>
    )
  }

  if (!environment) {
    return (
      <div className="p-6">
        <p className="text-ephops-state-failed">Environment not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-ephops-text-primary">{environment.name}</h1>
            <StatusBadge state={environment.state} />
          </div>
          <p className="text-sm text-ephops-text-secondary font-mono">{environment.id}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost">Refresh</Button>
          {environment.state !== 'DESTROYED' && (
            <Button variant="danger">Terminate</Button>
          )}
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
            Region
          </p>
          <p className="text-base font-mono text-ephops-text-primary mt-2">{environment.region}</p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
            Instances
          </p>
          <p className="text-base font-mono text-ephops-text-primary mt-2">
            {environment.instanceCount}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
            Total Cost
          </p>
          <p className="text-base font-mono text-ephops-text-primary mt-2">
            ${environment.cost.toFixed(2)}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
            Created
          </p>
          <p className="text-sm text-ephops-text-primary mt-2">
            {new Date(environment.createdAt).toLocaleDateString()}
          </p>
        </Card>
      </div>

      {/* Agent Reasoning */}
      <Card>
        <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
          Agent Reasoning
        </p>
        <p className="text-sm text-ephops-text-primary mt-2">{environment.agentReasoning}</p>
      </Card>

      {/* Action Logs */}
      <div>
        <h2 className="text-lg font-semibold text-ephops-text-primary mb-4">Action Logs</h2>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-ephops-surface border border-ephops-border-default rounded-lg overflow-hidden"
            >
              {/* Collapsed View */}
              <button
                onClick={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-ephops-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-ephops-text-secondary">
                    {expandedLog === log.id ? '▼' : '▶'}
                  </span>
                  <span className="text-xs font-mono text-ephops-text-secondary">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="px-2 py-1 bg-ephops-elevated rounded text-xs font-medium text-ephops-text-primary">
                    {log.toolCalled}
                  </span>
                  <span className="text-xs text-ephops-text-muted">
                    {log.durationMs}ms
                  </span>
                </div>
              </button>

              {/* Expanded View */}
              {expandedLog === log.id && (
                <div className="border-t border-ephops-border-subtle px-4 py-3 space-y-3 bg-ephops-base">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary mb-1">
                      Reasoning
                    </p>
                    <p className="text-sm text-ephops-text-primary">
                      {log.agentReasoning}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ephops-text-secondary mb-1">
                      Output
                    </p>
                    <pre className="bg-ephops-elevated border border-ephops-border-default rounded p-3 text-xs font-mono text-ephops-text-primary overflow-x-auto">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
