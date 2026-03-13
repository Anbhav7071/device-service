import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { trace } from '@opentelemetry/api';

export interface TraceContext {
  organizationId?: string;
  requestId: string; // unique identifier for the request
}

@Injectable()
export class TraceContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<TraceContext>();

  static setContext(context: TraceContext): void {
    this.asyncLocalStorage.enterWith(context);
  }

  static getContext(): TraceContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get trace ID from OpenTelemetry active span (source of truth).
   * Do NOT store traceId in ALS - get it from OTEL.
   */
  static getTraceId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      return undefined;
    }
    const spanContext = activeSpan.spanContext();
    return spanContext.traceId;
  }

  /**
   * Get span ID from OpenTelemetry active span (source of truth).
   * Do NOT store spanId in ALS - get it from OTEL.
   */
  static getSpanId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      return undefined;
    }
    const spanContext = activeSpan.spanContext();
    return spanContext.spanId;
  }
}
