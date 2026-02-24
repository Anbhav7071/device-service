import { Logger } from 'typeorm';
import { TraceContextService } from './trace-context.service';
import { trace, Span } from '@opentelemetry/api';

export class TypeOrmTraceLogger implements Logger {
  private logger: any;
  private activeSpans = new Map<string, Span>();

  constructor() {}

  private getLogger() {
    if (!this.logger) {
      try {
        this.logger = (global as any).customLogger;
      } catch (error) {
        this.logger = console;
      }
    }
    return this.logger;
  }

  logQuery(query: string, parameters?: any[]): void {
    const traceContext = TraceContextService.getContext();
    if (!traceContext) {
      return;
    }

    const logger = this.getLogger();
    const queryName = this.generateQueryName(query);
    
    const tracer = trace.getTracer('soundbox-backend');
    const span = tracer.startSpan(`DB_${queryName}`, {
      attributes: {
        'code.class': 'Database',
        'code.function': queryName,
        'db.system': 'postgresql',
        'db.operation': this.getQueryType(query),
        'db.query': this.truncateQuery(query),
        ...(parameters && { 'db.parameters': JSON.stringify(this.sanitizeParameters(parameters)) }),
      },
    });
    
    // Store the span for later finishing
    this.activeSpans.set(queryName, span);
    
    if (logger && logger.debug) {
      const spanContext = span.spanContext();
      const spanId = spanContext.spanId;
      const traceId = spanContext.traceId;
      logger.debug('Database_query_started', {
        traceId: traceId,
        spanId: spanId,
        organizationId: traceContext.organizationId,
        queryName,
        query: this.truncateQuery(query),
        parameters: parameters ? this.sanitizeParameters(parameters) : undefined,
        timings: {
          startTime: new Date().toISOString(),
        },
      });
    } else {
      console.log(`[DB_QUERY] ${queryName} - ${this.truncateQuery(query)}`);
    }
  }

  logQueryError(error: string, query: string, parameters?: any[]): void {
    const traceContext = TraceContextService.getContext();
    if (!traceContext) {
      return;
    }

    const logger = this.getLogger();
    const queryName = this.generateQueryName(query);
    
    // Mark span as error before finishing
    const span = this.activeSpans.get(queryName);
    if (span) {
      try {
        const dbError = new Error(error);
        span.recordException(dbError);
        span.setStatus({
          code: 2, // ERROR
          message: error,
        });
      } catch (e) {
        // Ignore errors when setting span error
      }
    }
    
    // Finish the span for this query
    this.finishQuerySpan(queryName);
    
    if (logger && logger.error) {
      const exception: any = { message: error };
      // keep structure similar to function errors
      logger.error('Database_query_error', undefined, {
        traceId: TraceContextService.getTraceId(),
        spanId: TraceContextService.getSpanId(),
        organizationId: traceContext.organizationId,
        queryName,
        query: this.truncateQuery(query),
        parameters: parameters ? this.sanitizeParameters(parameters) : undefined,
        exception,
      });
    } else {
      console.error(`[DB_ERROR] ${queryName} - ${error}`);
    }
  }

  logQuerySlow(time: number, query: string, parameters?: any[]): void {
    const traceContext = TraceContextService.getContext();
    if (!traceContext) {
      return;
    }

    const logger = this.getLogger();
    const queryName = this.generateQueryName(query);
    
    // Add slow query attribute to span before finishing
    const span = this.activeSpans.get(queryName);
    if (span) {
      span.setAttribute('db.query.slow', true);
      span.setAttribute('db.query.duration_ms', time);
    }
    
    // Finish the span for this query
    this.finishQuerySpan(queryName);
    
    if (logger && logger.warn) {
      logger.warn('Database_query_slow', {
        traceId: TraceContextService.getTraceId(),
        spanId: TraceContextService.getSpanId(),
        organizationId: traceContext.organizationId,
        queryName,
        query: this.truncateQuery(query),
        parameters: parameters ? this.sanitizeParameters(parameters) : undefined,
        timings: {
          duration: time,
        },
      });
    } else {
      console.warn(`[DB_SLOW] ${queryName} - ${time}ms`);
    }
  }

  private finishQuerySpan(queryName: string): void {
    const span = this.activeSpans.get(queryName);
    if (span) {
      // Finish the OTEL span directly
      span.end();
      this.activeSpans.delete(queryName);
    }
  }

  logSchemaBuild(message: string): void {
    // Skip schema build messages for cleaner logs
  }

  logMigration(message: string): void {
    // Skip migration messages for cleaner logs
  }

  log(level: 'log' | 'info' | 'warn', message: any): void {
    const traceContext = TraceContextService.getContext();
    if (!traceContext) {
      return;
    }

    const logger = this.getLogger();
    
    if (logger && logger[level === 'info' ? 'log' : level]) {
      logger[level === 'info' ? 'log' : level](`Database_${level}`, {
        traceId: TraceContextService.getTraceId(),
        spanId: TraceContextService.getSpanId(),
        organizationId: traceContext.organizationId,
        message,
      });
    } else {
      console.log(`[DB_${level.toUpperCase()}] ${message}`);
    }
  }

  private generateQueryName(query: string): string {
    const queryType = this.getQueryType(query);
    const tableName = this.getTableName(query);
    return `${tableName}_${queryType}`;
  }

  private getQueryType(query: string): string {
    const upperQuery = query.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    if (upperQuery.startsWith('CREATE')) return 'CREATE';
    if (upperQuery.startsWith('DROP')) return 'DROP';
    if (upperQuery.startsWith('ALTER')) return 'ALTER';
    if (upperQuery.startsWith('START TRANSACTION')) return 'TRANSACTION_START';
    if (upperQuery.startsWith('COMMIT')) return 'TRANSACTION_COMMIT';
    if (upperQuery.startsWith('ROLLBACK')) return 'TRANSACTION_ROLLBACK';
    return 'UNKNOWN';
  }

  private getTableName(query: string): string {
    const match = query.match(/FROM\s+["`]?(\w+)["`]?/i) || 
                  query.match(/INTO\s+["`]?(\w+)["`]?/i) ||
                  query.match(/UPDATE\s+["`]?(\w+)["`]?/i) ||
                  query.match(/DELETE\s+FROM\s+["`]?(\w+)["`]?/i);
    return match ? match[1] : 'UnknownTable';
  }

  private truncateQuery(query: string): string {
    return query.length > 500 ? query.substring(0, 500) + '...[TRUNCATED]' : query;
  }

  private sanitizeParameters(parameters: any[]): any[] {
    return parameters.map(param => {
      if (typeof param === 'string') {
        // Check if it looks like sensitive data
        if (param.length > 50 || 
            param.includes('password') || 
            param.includes('token') ||
            param.includes('secret')) {
          return '[REDACTED]';
        }
      }
      return param;
    });
  }
}

