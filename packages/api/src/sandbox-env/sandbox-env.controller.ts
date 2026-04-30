import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Sse,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { randomUUID } from 'crypto';
import { SandboxEnvService } from './sandbox-env.service';
import { ProvisionEventsService } from './provision-events.service';
import {
  CreateSandboxEnvDto,
  SandboxEnvResponseDto,
} from './dto/sandbox-env.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('Sandbox Environments')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('sandbox')
export class SandboxEnvController {
  constructor(
    private readonly service: SandboxEnvService,
    private readonly provisionEvents: ProvisionEventsService,
  ) {}

  @Post('stream')
  @ApiOperation({ summary: 'Create a provision stream and return a requestId' })
  createStream(): { requestId: string } {
    const requestId = randomUUID();
    this.provisionEvents.create(requestId);
    return { requestId };
  }

  @Post()
  @ApiOperation({ summary: 'Provision a new ephemeral environment' })
  @ApiResponse({
    status: 201,
    description: 'Environment created',
    type: SandboxEnvResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or guardrails violation',
  })
  @ApiResponse({
    status: 403,
    description: 'Instance type not allowed or concurrency limit reached',
  })
  async provision(
    @Body() dto: CreateSandboxEnvDto,
    @Query('requestId') requestId?: string,
  ) {
    return this.service.provision(dto, requestId);
  }

  @Sse('events')
  @ApiOperation({ summary: 'Stream provision progress events via SSE' })
  streamEvents(
    @Query('requestId') requestId: string,
  ): Observable<MessageEvent> {
    const subject = this.provisionEvents.get(requestId);
    if (!subject) {
      throw new NotFoundException(
        `No active provision stream for requestId: ${requestId}`,
      );
    }
    return subject.pipe(map((event) => ({ data: event }) as MessageEvent));
  }

  @Get()
  @ApiOperation({ summary: 'List all sandbox environments' })
  @ApiResponse({
    status: 200,
    description: 'List of environments',
    type: [SandboxEnvResponseDto],
  })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sandbox environment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Environment details',
    type: SandboxEnvResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Terminate a sandbox environment' })
  @ApiResponse({
    status: 200,
    description: 'Environment terminated',
    type: SandboxEnvResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  async terminate(@Param('id') id: string) {
    return this.service.terminate(id);
  }
}
