import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface ProvisionEvent {
  step: string;
  message: string;
  done?: boolean;
  error?: boolean;
}

/**
 * Simple in-process pub/sub for provision progress events.
 * Each provision request gets its own Subject keyed by a requestId.
 * The SSE controller subscribes; the SandboxEnvService publishes.
 */
@Injectable()
export class ProvisionEventsService {
  private readonly subjects = new Map<string, Subject<ProvisionEvent>>();

  create(requestId: string): Subject<ProvisionEvent> {
    const subject = new Subject<ProvisionEvent>();
    this.subjects.set(requestId, subject);
    return subject;
  }

  emit(requestId: string, event: ProvisionEvent): void {
    this.subjects.get(requestId)?.next(event);
  }

  complete(requestId: string): void {
    const subject = this.subjects.get(requestId);
    if (subject) {
      subject.complete();
      this.subjects.delete(requestId);
    }
  }

  get(requestId: string): Subject<ProvisionEvent> | undefined {
    return this.subjects.get(requestId);
  }
}
