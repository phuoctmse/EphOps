import { Environment } from '@ephops/shared-types'
import StatusBadge from './StatusBadge'

interface EnvironmentTableProps {
  environments: Environment[]
}

export default function EnvironmentTable({ environments }: EnvironmentTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ephops-border-default">
      <table className="w-full">
        <thead>
          <tr className="bg-ephops-elevated border-b border-ephops-border-default">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              State
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              Cost
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              Instances
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ephops-text-secondary">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {environments.map((env) => (
            <tr
              key={env.id}
              className="bg-ephops-surface border-b border-ephops-border-subtle hover:bg-ephops-elevated transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 font-mono text-sm text-ephops-text-primary truncate">
                {env.id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-sm text-ephops-text-primary">{env.name}</td>
              <td className="px-4 py-3">
                <StatusBadge state={env.state} />
              </td>
              <td className="px-4 py-3 text-sm text-ephops-text-secondary">{env.region}</td>
              <td className="px-4 py-3 font-mono text-sm text-ephops-text-primary">
                ${env.cost.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-ephops-text-primary">{env.instanceCount}</td>
              <td className="px-4 py-3 font-mono text-sm text-ephops-text-secondary">
                {new Date(env.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
