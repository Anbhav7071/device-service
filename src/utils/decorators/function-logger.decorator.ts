import { TraceContextService } from 'src/logger/trace-context.service';
import { trace } from '@opentelemetry/api';

export interface FunctionLoggerOptions {
  level?: 'log' | 'debug' | 'warn' | 'error' | 'verbose';
  includeArgs?: boolean;
  includeResult?: boolean;
  excludeArgs?: string[];
  includeTiming?: boolean;
  maxDepth?: number;
}

export function FunctionLogger(options: FunctionLoggerOptions = {}) {
  const config = {
    level: 'log',
    includeArgs: true,
    includeResult: false,
    excludeArgs: ['password', 'token', 'secret', 'authorization'],
    includeTiming: true,
    maxDepth: 3,
    ...options,
  };

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = function (...args: any[]) {
      const logger = this.logger;
      const traceContext = TraceContextService.getContext();

      if (!logger) {
        console.log(
          `FunctionLogger: No logger found for ${className}.${propertyName}`,
        );
        return method.apply(this, args);
      }

      // Get trace/span IDs from OTEL (source of truth)
      const activeSpan = trace.getActiveSpan();
      const traceId =
        activeSpan?.spanContext().traceId || TraceContextService.getTraceId();
      const organizationId = traceContext?.organizationId;

      // Get SpanManager from global or create span directly with OTEL
      // For now, use OTEL directly - SpanManager is just a thin wrapper
      const tracer = trace.getTracer('soundbox-backend');
      const span = tracer.startSpan(`${className}.${propertyName}`, {
        attributes: {
          'code.class': className,
          'code.function': propertyName,
          ...(config.includeArgs && {
            args: JSON.stringify(
              sanitizeArgs(args, config.excludeArgs, config.maxDepth),
            ),
          }),
        },
      });

      // Get formatted span ID for logging
      const spanContext = span.spanContext();
      const spanId =
        spanContext.spanId && spanContext.spanId !== '0000000000000000'
          ? spanContext.spanId
          : undefined;
      const startTime = new Date().toISOString();
      const startNs = process.hrtime.bigint();

      logger[config.level]('Function_started', {
        traceId,
        spanId,
        organizationId,
        className,
        methodName: propertyName,
        args: config.includeArgs
          ? sanitizeArgs(args, config.excludeArgs, config.maxDepth)
          : undefined,
        timings: { startTime },
      });

      const finishOk = (result: any) => {
        const endTime = new Date().toISOString();
        const totalMs = Number(process.hrtime.bigint() - startNs) / 1e6;
        // Finish the OTEL span directly
        if (span) {
          span.end();
        }
        logger[config.level]('Function_finished', {
          traceId,
          spanId,
          organizationId,
          className,
          methodName: propertyName,
          result: config.includeResult
            ? sanitizeResult(result, config.excludeArgs, config.maxDepth)
            : undefined,
          timings: config.includeTiming
            ? { startTime, endTime, totalMs: Math.round(totalMs) }
            : undefined,
        });
        return result;
      };

      const finishErr = (error: any) => {
        const endTime = new Date().toISOString();
        const totalMs = Number(process.hrtime.bigint() - startNs) / 1e6;

        // Mark span as error and finish it
        if (span) {
          try {
            span.recordException(error);
            span.setStatus({
              code: 2, // ERROR
              message: error.message,
            });
          } catch (e) {
            // Ignore errors when setting span error
          }
          span.end();
        }

        const exception: any = {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        };
        try {
          if (typeof error?.getStatus === 'function')
            exception.status = error.getStatus();
          if (typeof error?.getResponse === 'function')
            exception.response = error.getResponse();
        } catch {}
        logger.error('Function_error', error?.stack, {
          traceId,
          spanId,
          organizationId,
          className,
          methodName: propertyName,
          error: { name: error?.name, message: error?.message },
          exception,
          timings: config.includeTiming
            ? { startTime, endTime, totalMs: Math.round(totalMs) }
            : undefined,
        });
        throw error;
      };

      try {
        const result = method.apply(this, args);
        // If it looks like a Promise, chain logging without converting sync to async
        if (result && typeof result.then === 'function') {
          return (result as Promise<any>).then(finishOk).catch(finishErr);
        }
        return finishOk(result);
      } catch (error) {
        return finishErr(error);
      }
    };
  };
}

function sanitizeArgs(
  args: any[],
  excludeFields: string[] = [],
  maxDepth: number = 3,
): any[] {
  return args.map((arg) =>
    sanitizeObject(arg, excludeFields, maxDepth, 0, new WeakSet()),
  );
}

function sanitizeResult(
  result: any,
  excludeFields: string[] = [],
  maxDepth: number = 3,
): any {
  return sanitizeObject(result, excludeFields, maxDepth, 0, new WeakSet());
}

function sanitizeObject(
  obj: any,
  excludeFields: string[],
  maxDepth: number,
  currentDepth: number,
  seen: WeakSet<any> = new WeakSet(),
): any {
  // Prevent deep recursion
  if (currentDepth >= maxDepth) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check for circular references
  if (seen.has(obj)) {
    return '[CIRCULAR_REFERENCE]';
  }

  // Add to seen set
  seen.add(obj);

  // Handle special object types
  if (obj.constructor && obj.constructor.name) {
    const constructorName = obj.constructor.name;

    // Handle NestJS services and repositories
    if (
      constructorName.includes('Service') ||
      constructorName.includes('Repository') ||
      constructorName.includes('Controller') ||
      constructorName.includes('Module')
    ) {
      seen.delete(obj);
      return `[${constructorName}]`;
    }

    // Handle other complex objects
    if (
      [
        'Request',
        'Response',
        'Socket',
        'Server',
        'IncomingMessage',
        'EventEmitter',
      ].includes(constructorName)
    ) {
      seen.delete(obj);
      return `[${constructorName}]`;
    }
  }

  if (Array.isArray(obj)) {
    if (obj.length > 10) {
      seen.delete(obj);
      return `[ARRAY_LENGTH_${obj.length}]`;
    }
    const result = obj.map((item) =>
      sanitizeObject(item, excludeFields, maxDepth, currentDepth + 1, seen),
    );
    seen.delete(obj);
    return result;
  }

  const sanitized: any = {};
  const keys = Object.keys(obj);

  // Limit number of keys to prevent large objects
  if (keys.length > 20) {
    seen.delete(obj);
    return `[OBJECT_WITH_${keys.length}_KEYS]`;
  }

  keys.forEach((key) => {
    if (
      excludeFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(
        obj[key],
        excludeFields,
        maxDepth,
        currentDepth + 1,
        seen,
      );
    } else if (typeof obj[key] === 'function') {
      sanitized[key] = '[FUNCTION]';
    } else {
      sanitized[key] = obj[key];
    }
  });

  // Remove from seen set when done processing
  seen.delete(obj);
  return sanitized;
}
