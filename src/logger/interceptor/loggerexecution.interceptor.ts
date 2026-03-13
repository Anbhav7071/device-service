import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

import { CustomLoggerService } from '../logger.service';
import { TraceContextService } from '../trace-context.service';
import { trace, context as otelContext } from '@opentelemetry/api';
import { EntityPropertyNotFoundError } from 'typeorm';
import { randomUUID } from 'crypto';
import { OtelMetricsService } from '../otel-metrics.service';

export const LOG_EXECUTION_KEY = 'LOG_EXECUTION'; // Replaced external dependency so developers can customize

@Injectable()
export class LogExecutionInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: CustomLoggerService,
    private readonly metrics: OtelMetricsService,
    // [PLACEHOLDER] Developer can inject custom contextual resolvers here instead of hardcoding business services
  ) {}

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    return '5xx';
  }

  private getRouteTemplate(req: any, rawUrl: string): string {
    try {
      const base = req.baseUrl || '';
      const path = req.route?.path || '';
      if (path) return `${base}${path}`.replace(/\/?\?.*$/, '');
    } catch {}
    // [PLACEHOLDER] Developer can customize route normalization logic here
    return rawUrl.split('?')[0] || rawUrl;
  }

  private async recordMetrics(
    statusCode: number,
    method: string,
    url: string,
    organizationId: string | undefined,
    req: any,
  ): Promise<void> {
    try {
      const routeTemplate = this.getRouteTemplate(req, url);
      const localsOrgId = req?.res?.locals?.organizationId;
      const localsOrgName = req?.res?.locals?.organizationName;

      const orgName =
        localsOrgName ||
        req?.user?.organizationName ||
        req?.user?.organization?.name ||
        req?.query?.organizationName ||
        req?.params?.organizationName ||
        req?.body?.organizationName;

      const finalOrgId = localsOrgId || organizationId || 'unknown';

      // [PLACEHOLDER] If organization name needs to be resolved from DB, developer can implement custom fetching logic here
      // if (finalOrgId !== 'unknown' && !orgName) {
      //   orgName = await customResolutionLogic(finalOrgId);
      // }

      this.metrics.recordHttpStatus(statusCode, {
        http_method: method,
        http_route: routeTemplate,
        organization_id: finalOrgId,
        organization_name: orgName || 'unknown',
      });
    } catch (e) {
      console.error('[Interceptor] metrics error:', e);
    }
  }

  // ---------------------------------------
  // MAIN INTERCEPTOR
  // ---------------------------------------
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    const shouldLog =
      this.reflector.get<boolean>(LOG_EXECUTION_KEY, handler) ||
      this.reflector.get<boolean>(LOG_EXECUTION_KEY, classRef);

    if (!shouldLog) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = req.method;
    const url = req.url;
    const className = classRef.name;
    const methodName = handler.name;
    const organizationId =
      req?.user?.organizationId ||
      req?.body?.organizationId ||
      req?.params?.organizationId ||
      req?.query?.organizationId;

    const requestId = randomUUID();
    // [PLACEHOLDER] Developer can customize service info injection
    const serviceName = process.env.SERVICE_NAME || 'nestjs-service';

    const activeCtx = otelContext.active();
    const activeSpan = activeCtx ? trace.getSpan(activeCtx) : undefined;

    // Get trace/span IDs from active span (auto-instrumentation creates this)
    let traceId: string | undefined;
    let spanId: string | undefined;

    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      traceId = spanContext.traceId;
      spanId = spanContext.spanId;

      // Add custom attributes to the existing span (DO NOT end it)
      activeSpan.setAttribute('code.class', className);
      activeSpan.setAttribute('code.function', methodName);
      activeSpan.setAttribute('organization.id', organizationId || 'unknown');
      // Events must have primitive values only (strings, numbers, booleans)
      activeSpan.addEvent('app.request.start', {
        method: String(method),
        url: String(url),
      });
    } else {
      // Fallback: only for non-HTTP contexts (cron jobs, etc.)
      // In normal HTTP requests, auto-instrumentation should always provide a span
      console.warn(
        '[Interceptor] No active span - auto-instrumentation may not be working',
      );
    }

    // Set headers for downstream services
    if (traceId && spanId) {
      req.headers['x-trace-id'] = traceId;
      req.headers['x-span-id'] = spanId;
    }

    TraceContextService.setContext({
      organizationId,
      requestId,
    });

    const startTimeIso = new Date().toISOString();
    const startNs = process.hrtime.bigint();

    this.logger.log('Request_started', {
      className,
      methodName,
      traceId,
      spanId,
      organizationId,
      serviceName,
      request: {
        method,
        url,
        body: req.body,
        params: req.params,
        query: req.query,
        headers: {
          'x-trace-id': traceId,
          'x-span-id': spanId,
        },
      },
      timings: { startTime: startTimeIso },
    });

    res.on('finish', () =>
      this.recordMetrics(res.statusCode, method, url, organizationId, req),
    );

    return otelContext.with(activeCtx || otelContext.active(), () => {
      return next.handle().pipe(
        tap((data) => {
          const endTimeIso = new Date().toISOString();
          const totalMs = Number(process.hrtime.bigint() - startNs) / 1e6;

          const finalOrgId =
            data?.organizationId ||
            data?.organization_id ||
            data?.user?.organizationId ||
            organizationId;

          const statusCode = res.statusCode;

          // Get active span again inside the context (may have changed)
          const currentSpan = trace.getActiveSpan() || activeSpan;

          // Add attributes/events to existing span (DO NOT end it)
          if (currentSpan) {
            currentSpan.setAttribute('http.status_code', statusCode);
            currentSpan.setAttribute(
              'app.response.organization_id',
              finalOrgId || 'unknown',
            );

            if (statusCode >= 400) {
              currentSpan.setStatus({
                code: statusCode >= 500 ? 2 : 1, // ERROR for 5xx, UNSET for 4xx
                message: `HTTP ${statusCode}`,
              });
            }

            // Events must have primitive values only (strings, numbers, booleans)
            currentSpan.addEvent('app.response.success', {
              statusCode: String(statusCode),
              durationMs: String(Math.round(totalMs)),
            });
          }

          // Set response headers (only if headers haven't been sent yet)
          if (traceId && spanId && !res.headersSent) {
            res.setHeader('x-trace-id', traceId);
            res.setHeader('x-span-id', spanId);
          }

          this.logger.log('Response', {
            className,
            methodName,
            traceId,
            spanId,
            organizationId: finalOrgId,
            serviceName,
            request: { method, url },
            response: data,
            statusCode,
            timings: {
              startTime: startTimeIso,
              endTime: endTimeIso,
              totalMs: Math.round(totalMs),
            },
          });
        }),

        catchError((err) => {
          if (err instanceof EntityPropertyNotFoundError) {
            err = new BadRequestException(
              `Invalid filter field: ${err.message}`,
            );
          }
          const endTimeIso = new Date().toISOString();

          // Get active span again inside the context (may have changed)
          const currentSpan = trace.getActiveSpan() || activeSpan;

          // Record exception on existing span (DO NOT end it)
          if (currentSpan) {
            currentSpan.recordException(err);
            currentSpan.setStatus({
              code: 2,
              message: err.message,
            });
            currentSpan.setAttribute('http.status_code', err.status || 500);
            // Events must have primitive values only (strings, numbers, booleans)
            currentSpan.addEvent('app.response.error', {
              error: String(err.message),
              status: String(err.status || 500),
            });
          }

          this.logger.error('Request_failed', err.stack, {
            className,
            methodName,
            traceId,
            spanId,
            organizationId,
            serviceName,
            request: { method, url },
            error: {
              message: err.message,
              status: err.status,
              stack: err.stack,
            },
            timings: {
              startTime: startTimeIso,
              endTime: endTimeIso,
            },
          });

          return throwError(() => err);
        }),
      );
    });
  }
}
