import axios, { AxiosHeaders } from 'axios';
import { trace, context, propagation } from '@opentelemetry/api';

export function setupAxiosTraceInterceptor(): void {
  if ((axios.defaults as any)._traceInterceptorInstalled) return;

  axios.interceptors.request.use((config) => {
    // ensure headers object exists
    if (!config.headers) {
      config.headers = AxiosHeaders.from({});
    }

    // Inject W3C trace headers (traceparent, tracestate)
    propagation.inject(context.active(), config.headers as any);

    // Inject custom compatibility headers
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const ctx = activeSpan.spanContext();
      config.headers['x-trace-id'] = ctx.traceId;
      config.headers['x-span-id'] = ctx.spanId;
    }

    return config;
  });

  (axios.defaults as any)._traceInterceptorInstalled = true;
}
