// import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { CustomLoggerService } from './logger.service';
// import { TraceContextService } from './trace-context.service';
// import { randomUUID } from 'crypto';

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   constructor(private readonly logger: CustomLoggerService) {}

//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const req = ctx.getRequest<Request>();
//     const res = ctx.getResponse<Response>();

//     const trace = TraceContextService.getContext();
//     // Never generate new IDs here; reuse established ones to keep correlation stable
//     const headerTraceId = req.headers['x-trace-id'] as string | undefined;
//     const headerSpanId = req.headers['x-span-id'] as string | undefined;
//     const effectiveTraceId = trace?.traceId || headerTraceId;
//     const effectiveSpanId = trace?.spanId || headerSpanId;

//     // Resolve HTTP status and safe response body
//     const status = this.resolveStatus(exception);
//     const errorBody = this.buildErrorBody(exception);

//     // Structured log (single-line JSON emitted by CustomLoggerService)
//     this.logger.error('HttpException', (exception as any)?.stack, {
//       traceId: effectiveTraceId,
//       spanId: effectiveSpanId,
//       organizationId: trace?.organizationId,
//       className: 'GlobalExceptionFilter',
//       methodName: 'catch',
//       request: {
//         method: req.method,
//         url: req.originalUrl || req.url,
//         headers: this.safeHeaders(req.headers),
//         params: req.params,
//         query: req.query,
//         body: this.safeBody(req.body),
//       },
//       response: {
//         statusCode: status,
//         error: errorBody,
//         traceId: effectiveTraceId,
//         spanId: effectiveSpanId,
//       },
//     });

//     // Return the raw exception body without wrapping
//     const rawBody = (exception instanceof HttpException)
//       ? (exception.getResponse?.() as any)
//       : (errorBody?.response && typeof errorBody.response === 'object'
//           ? errorBody.response
//           : { name: errorBody?.name, message: errorBody?.message });

//     res.status(status).json(rawBody);
//   }

//   private resolveStatus(exception: unknown): number {
//     if (exception instanceof HttpException) {
//       try {
//         return exception.getStatus();
//       } catch {}
//     }
//     return HttpStatus.INTERNAL_SERVER_ERROR;
//   }

//   private buildErrorBody(exception: unknown): any {
//     if (exception instanceof HttpException) {
//       const response = exception.getResponse();
//       const errMessage = (response as any)?.message || (exception.message ?? 'HttpException');
//       return {
//         name: exception.name,
//         message: Array.isArray(errMessage) ? errMessage.join(', ') : errMessage,
//         status: exception.getStatus(),
//         response: typeof response === 'object' ? response : { message: response },
//       };
//     }
//     const err = exception as any;
//     return {
//       name: err?.name || 'Error',
//       message: err?.message || 'Unexpected error occurred',
//     };
//   }

//   private safeHeaders(headers: Record<string, any>): Record<string, any> {
//     const clone = { ...headers };
//     const redact = ['authorization', 'cookie', 'set-cookie'];
//     redact.forEach((h) => {
//       if (clone[h]) clone[h] = '[REDACTED]';
//     });
//     return clone;
//   }

//   private safeBody(body: any): any {
//     if (!body || typeof body !== 'object') return body;
//     const clone: any = Array.isArray(body) ? [...body] : { ...body };
//     const redactKeys = ['password', 'token', 'secret', 'authorization'];
//     Object.keys(clone).forEach((k) => {
//       if (redactKeys.some((s) => k.toLowerCase().includes(s))) {
//         clone[k] = '[REDACTED]';
//       }
//     });
//     return clone;
//   }
// }
