import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { LoggerConfig, defaultLoggerConfig } from './logger.config';
import { context, trace } from '@opentelemetry/api';

export interface LogContext {
  [key: string]: any; // for the log context
  traceId?: string; // for the trace id in the log
  spanId?: string; // for the span id in the log
  userId?: string; // for the user id in the log
  requestId?: string; // for the request id in the log
  operation?: string; // for the operation in the log
  duration?: number; // for the duration in the log
}

export interface StructuredLogEntry {
  timestamp: string; // for the timestamp in the log
  level: string; // for the level in the log
  message: string; // for the message in the log
  context: LogContext; // for the log context
  service: string; // for the service in the log
  version?: string; // for the version in the log
  environment?: string; // for the environment in the log
}

@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private readonly config: LoggerConfig; // for the logger config
  private readonly serviceName = 'AudioPod Backend'; // for the service name

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultLoggerConfig, ...config }; // for creating the logger config
  }

  log(message: string, context?: LogContext): void {
    this.logMessage('log', message, context); // for logging the message
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.logMessage('error', message, { ...context, trace }); // for logging the message
  }

  warn(message: string, context?: LogContext): void {
    this.logMessage('warn', message, context); // for logging the message
  }

  debug(message: string, context?: LogContext): void {
    this.logMessage('debug', message, context); // for logging the message
  }

  verbose(message: string, context?: LogContext): void {
    this.logMessage('verbose', message, context); // for logging the message
  }

  private logMessage(
    level: string,
    message: string,
    context: LogContext = {},
  ): void {
    // for logging the message
    if (!this.shouldLog(level)) {
      return; // for not logging the message
    }

    const sanitizedContext = this.sanitizeContext(context); // for sanitizing the context
    const structuredLog = this.createStructuredLog(
      level,
      message,
      sanitizedContext,
    ); // for creating the structured log

    if (this.config.enableConsole) {
      this.logToConsole(level, structuredLog); // for logging the message to the console
    }

    if (this.config.enableOpenTelemetry) {
      this.logToOpenTelemetry(level, structuredLog); // for logging the message to the open telemetry
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'log', 'debug', 'verbose']; // for the levels of the logs
    const currentLevelIndex = levels.indexOf(this.config.level); // for getting the current level index
    const messageLevelIndex = levels.indexOf(level); // for getting the message level index
    return messageLevelIndex <= currentLevelIndex; // for checking if the message level is less than or equal to the current level
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context }; // for creating the sanitized context

    // Sanitize known sensitive fields
    this.config.sanitizeFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'; // for sanitizing the field
      }
    });

    // Sanitize using regex patterns
    Object.keys(sanitized).forEach((key) => {
      // for sanitizing the object
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key]); // for sanitizing the string
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeObject(sanitized[key]); // for sanitizing the object
      }
    });

    return sanitized; // for returning the sanitized context
  }

  private sanitizeString(value: string): string {
    if (typeof value !== 'string') return value; // for returning the value if it is not a string

    let sanitized = value;
    this.config.sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]'); // for sanitizing the string
    });

    // Truncate if too long
    if (sanitized.length > this.config.maxLogLength) {
      sanitized =
        sanitized.substring(0, this.config.maxLogLength) + '...[TRUNCATED]'; // for truncating the string
    }

    return sanitized; // for returning the sanitized string
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj; // for returning the object if it is not an object

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)); // for sanitizing the object
    }

    const sanitized: any = {}; // for creating the sanitized object
    Object.keys(obj).forEach((key) => {
      const value = obj[key]; // for getting the value of the key
      if (this.config.sensitivePatterns.some((pattern) => pattern.test(key))) {
        sanitized[key] = '[REDACTED]'; // for sanitizing the key
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value); // for sanitizing the string
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value); // for sanitizing the object
      } else {
        sanitized[key] = value; // for returning the value of the key
      }
    });

    return sanitized;
  }

  private createStructuredLog(
    level: string,
    message: string,
    context: LogContext,
  ): StructuredLogEntry {
    const activeSpan = trace.getActiveSpan(); // for getting the active span
    const otelTraceId = activeSpan?.spanContext().traceId; // for getting the trace id
    const otelSpanId = activeSpan?.spanContext().spanId; // for getting the span id

    // Prefer explicitly provided trace/span from context if present; otherwise use active span
    const finalTraceId =
      context.traceId || (otelTraceId ? `0x${otelTraceId}` : undefined);
    const finalSpanId =
      context.spanId || (otelSpanId ? `0x${otelSpanId}` : undefined);

    return {
      timestamp: this.getTimestamp(), // for the timestamp in the log
      level, // for the level in the log
      message: this.sanitizeString(message),
      context: {
        ...context, // for the log context
        traceId: finalTraceId, // for the trace id in the log
        spanId: finalSpanId, // for the span id in the log
        parentSpanId: context.parentSpanId, // for the parent span id in the log
      },
      service: this.serviceName, // for the service in the log
      version: process.env.npm_package_version || '1.0.0', // for the version in the log
      environment: process.env.NODE_ENV || 'development', // for the environment in the log
    };
  }

  private getTimestamp(): string {
    const now = new Date(); // for getting the current date
    switch (this.config.timestampFormat) {
      case 'iso':
        return now.toISOString(); // for returning the timestamp in the log
      case 'unix':
        return Math.floor(now.getTime() / 1000).toString(); // for returning the timestamp in the log
      case 'human':
        return now.toLocaleString(); // for returning the timestamp in the log
      default:
        return now.toISOString(); // for returning the timestamp in the log
    }
  }

  private logToConsole(level: string, logEntry: StructuredLogEntry): void {
    // Emit a single JSON object per line for easy ingestion by Splunk
    const jsonLine = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(jsonLine);
        break;
      case 'warn':
        console.warn(jsonLine);
        break;
      case 'debug':
        console.debug(jsonLine);
        break;
      default:
        console.log(jsonLine);
    }
  }

  private logToOpenTelemetry(
    level: string,
    logEntry: StructuredLogEntry,
  ): void {
    // OpenTelemetry logging integration
    // This would typically send logs to your observability backend
    // For now, we'll just ensure the context is properly set
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      // Filter context to only include primitive values (OTEL requires primitives for event attributes)
      const primitiveContext: Record<string, string | number | boolean> = {};
      Object.keys(logEntry.context).forEach((key) => {
        const value = logEntry.context[key];
        // Only include primitive values (string, number, boolean)
        // Skip complex objects like request, response, timings
        if (value !== null && value !== undefined) {
          const type = typeof value;
          if (type === 'string' || type === 'number' || type === 'boolean') {
            primitiveContext[key] = value;
          } else if (type === 'object') {
            // For objects, convert to JSON string if needed, but skip known complex objects
            // Skip request, response, timings, error objects as they're too complex
            if (!['request', 'response', 'timings', 'error'].includes(key)) {
              try {
                primitiveContext[key] = JSON.stringify(value);
              } catch {
                // Skip if can't stringify
              }
            }
          }
        }
      });

      activeSpan.addEvent(`log.${level}`, {
        message: logEntry.message,
        level: logEntry.level,
        ...primitiveContext,
      });
    }
  }
}
