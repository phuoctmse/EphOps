import type { Environment, ActionLog, Metrics } from '@ephops/shared-types'

// Backend DTO types
export interface SandboxEnvResponseDto {
  id: string
  prompt: string
  status: 'CREATING' | 'RUNNING' | 'FAILED' | 'DESTROYED'
  resourceId?: string | null
  costIncurred: number
  instanceType: string
  createdAt: string | Date
  expiresAt?: string | Date
}

export interface ActionLogResponseDto {
  id: string
  envId: string
  agentReasoning: string
  toolCalled: string
  output: string // JSON string
  timestamp: string | Date
}

export interface FinOpsMetrics {
  decisions: {
    approveCount: number
    rejectCount: number
    approveRate: number
    total: number
  }
  guardrails: {
    blockCount: number
    instanceTypeBlockCount: number
    concurrencyBlockCount: number
  }
  llm: {
    fallbackUsedCount: number
    fallbackRate: number
    avgDecisionLatencyMs: number | null
    p95DecisionLatencyMs: number | null
  }
  cost: {
    totalEstimatedCostUsd: number
    totalIncurredCostUsd: number
    avgHourlyCostUsd: number | null
  }
  environments: {
    activeCount: number
    destroyedCount: number
    failedCount: number
    totalCount: number
  }
  generatedAt: string
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value
}

export function mapSandboxEnvToEnvironment(dto: SandboxEnvResponseDto): Environment {
  return {
    id: dto.id,
    name: dto.prompt,
    state: dto.status,
    resourceId: dto.resourceId ?? null,
    cost: dto.costIncurred,
    region: dto.instanceType,
    instanceCount: 1,
    agentReasoning: '',
    createdAt: toIsoString(dto.createdAt),
    expiresAt: dto.expiresAt != null ? toIsoString(dto.expiresAt) : null,
    destroyedAt:
      dto.status === 'DESTROYED' && dto.expiresAt !== undefined
        ? toIsoString(dto.expiresAt)
        : undefined,
  }
}

export function mapActionLogResponseToActionLog(dto: ActionLogResponseDto): ActionLog {
  let output: unknown = dto.output
  try {
    output = JSON.parse(dto.output) as unknown
  } catch {
    output = dto.output
  }

  return {
    id: dto.id,
    envId: dto.envId,
    agentReasoning: dto.agentReasoning,
    toolCalled: dto.toolCalled,
    output,
    createdAt: toIsoString(dto.timestamp),
    durationMs: 0,
  }
}

export function mapFinOpsMetricsToMetrics(dto: FinOpsMetrics): Metrics {
  return {
    totalCost: dto.cost.totalIncurredCostUsd,
    averageLatency: dto.llm.avgDecisionLatencyMs ?? 0,
    environmentCount: dto.environments.totalCount,
    activeAgents: dto.environments.activeCount,
  }
}
