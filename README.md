# EphOps

> **Agentic FinOps for Ephemeral Environments**

EphOps is an AI-powered FinOps system that provisions, manages, and automatically destroys ephemeral testing environments. An AI agent analyzes natural language prompts, converts them into infrastructure code, estimates costs, and enforces automatic cleanup to eliminate cloud resource waste.

## Features

- **Natural Language Provisioning** — Describe the environment you need in plain English; the AI agent translates it into AWS EC2 infrastructure.
- **Cost Estimation** — Real-time hourly and total cost estimates before any resource is created.
- **Automatic Cleanup (TTL)** — Every environment has a hard time-to-live (max 2 hours). A background worker terminates expired instances automatically.
- **Hard Guardrails** — Backend-enforced limits on concurrency, instance types, and TTL to protect your cloud budget.
- **Structured AI Reasoning** — All agent decisions are logged with reasoning, tool calls, and outputs for full auditability.
- **Zero-Risk Local Development** — Local development uses Ollama (local LLM) and Floci (AWS emulator), costing $0.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS (Node.js + TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Cloud SDK | AWS SDK for JavaScript v3 (`@aws-sdk/client-ec2`) |
| AI / LLM | AWS Bedrock (Amazon Nova) — primary; Ollama — local fallback |
| Validation | Zod + `class-validator` |
| Scheduling | `node-cron` |
| Logging | Pino (structured JSON logging) |
| API Docs | Swagger UI (`/api/docs`) |
| Testing | Jest + `aws-sdk-client-mock` |

## Architecture Overview

### Request Flow

```mermaid
graph TB
    User[User / Client] -->|POST /sandbox-envs| Controller[SandboxEnv Controller]
    Controller --> Guardrails[Guardrails Service]
    Guardrails -->|Validate| LLM[LLM Orchestrator]
    LLM -->|Primary| Bedrock[AWS Bedrock<br/>Amazon Nova]
    LLM -->|Fallback| Ollama[Ollama<br/>Local LLM]
    LLM -->|Decision JSON| Provision[EC2 Provisioning]
    Provision -->|Instance ID| DB[(PostgreSQL<br/>Prisma ORM)]
    Provision -->|Tags| EC2[AWS EC2]
    Cron[Cleanup Worker<br/>node-cron every 5m] -->|Scan expired| DB
    Cron -->|Terminate| EC2
```

### Component Breakdown

```
User Prompt
    |
    v
+----------------------------+
|  SandboxEnv Controller     |
|  - DTO validation            |
|  - REST endpoints            |
+----------------------------+
    |
    v
+----------------------------+
|  Guardrails Service        |
|  - Instance whitelist        |
|  - Concurrency limit (max 2) |
|  - TTL cap (2h)              |
+----------------------------+
    |
    v
+----------------------------+
|  LLM Orchestrator          |
|  - Primary: AWS Bedrock      |
|    (Amazon Nova)             |
|  - Fallback: Ollama (local)  |
|  - Structured JSON output    |
|  - Zod validation            |
+----------------------------+
    |
    v
+----------------------------+
|  AWS EC2 Service           |
|  - RunInstances              |
|  - CreateTags (Project)      |
|  - TerminateInstances        |
+----------------------------+
    |
    v
+----------------------------+
|  Prisma / PostgreSQL       |
|  - SandboxEnv state          |
|  - ActionLog audit trail     |
+----------------------------+
    |
    v
+----------------------------+
|  Cleanup Worker (cron)     |
|  - Scans expiresAt < now()   |
|  - Auto-terminates instances |
|  - Calculates costIncurred   |
+----------------------------+
```

## Environment Strategy

| Environment | LLM Provider | Cloud | Cost |
|-------------|--------------|-------|------|
| `local` | Ollama (`http://localhost:11434`) | Floci emulator (`http://localhost:4566`) | $0 |
| `production` | AWS Bedrock (Amazon Nova) | Real AWS Cloud | Hard cap $200/month |

## Guardrails & Limits

The system enforces the following hard limits to prevent runaway cloud costs:

- **Concurrency**: Max 2 environments in `RUNNING` status at any time.
- **Instance Whitelist**: Only `t3.micro` and `t4g.nano` are allowed.
- **Maximum TTL**: 2 hours per environment (automatically capped).
- **Budget Shield**: AWS Budgets alert at $5 estimated spend.

## Getting Started

### Prerequisites

- Node.js >= 20.17
- Docker & Docker Compose
- (Optional) Ollama CLI for local LLM management

### 1. Clone & Install

```bash
git clone <repo-url>
cd ephops
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` to match your setup:

```env
NODE_ENV=local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ephops?schema=public"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566
MAX_CONCURRENT_ENVS=2
MAX_TTL_HOURS=2
```

### 3. Start Infrastructure (Docker Compose)

```bash
docker-compose up -d
```

This starts:
- **Floci** — AWS emulator on port `4566`
- **PostgreSQL** — Database on port `5433`
- **Ollama** — Local LLM server on port `11434`

### 4. Database Migrations

```bash
npx prisma migrate dev
```

### 5. Run the Application

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api/docs`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sandbox-envs` | Provision a new ephemeral environment from a natural language prompt |
| `GET`  | `/sandbox-envs` | List all environments |
| `GET`  | `/sandbox-envs/:id` | Get environment details |
| `DELETE` | `/sandbox-envs/:id` | Manually destroy an environment |
| `GET`  | `/action-logs` | Query AI agent decision logs |

## Running Tests

All tests run 100% offline — no real AWS or Ollama connection required.

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Project Structure

```
src/
  sandbox-env/        # Environment lifecycle (controller, service, repository, dto)
  action-log/         # AI reasoning audit logs
  aws-ec2/            # AWS SDK wrapper for EC2 operations
  cleanup-worker/     # Background TTL cleanup job
  guardrails/         # Budget & safety enforcement
  llm/                # AWS Bedrock (primary) / Ollama (fallback)
  prisma/             # Prisma client & module
  common/             # Config, exceptions, filters, schemas
  app.module.ts
  main.ts
prisma/
  schema.prisma       # Database schema
docker-compose.yml    # Local infrastructure stack
```

## Database Schema (Prisma)

**`SandboxEnv`** — Tracks the lifecycle of each ephemeral environment.
- `id`, `prompt`, `resourceId`, `instanceType`
- `status` (`CREATING`, `RUNNING`, `DESTROYED`, `FAILED`)
- `hourlyCost`, `costIncurred`
- `createdAt`, `expiresAt`

**`ActionLog`** — Audit trail of AI agent reasoning and tool calls.
- `envId`, `agentReasoning`, `toolCalled`, `output`, `timestamp`

## License

UNLICENSED
