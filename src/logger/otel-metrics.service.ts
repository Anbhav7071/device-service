import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

@Injectable()
export class OtelMetricsService implements OnModuleInit {
  private meterProvider!: MeterProvider;
  private exporter!: PrometheusExporter;
  private httpResponseTotal: any;
  private httpResponseByOrgTotal: any;
  // Simple in-memory cache to resolve organization_id -> organization_name
  private organizationIdToName: Map<string, string> = new Map();
  // Process metrics
  private processStartTime: any;
  private processUptime: any;
  private readonly startTime: number = Date.now() / 1000;
  // HTTP response duration histogram
  private httpResponseDuration: any;
  private cronRunCounter: any;
  private cronFailCounter: any;
  private cronSkipCounter: any;
  private cronDuration: any;

  async onModuleInit(): Promise<void> {
    this.exporter = new PrometheusExporter({
      preventServerStart: false,
      port: parseInt(process.env.METRICS_PORT || '9464', 10),
      endpoint: process.env.METRICS_ENDPOINT || '/metrics', //endpoint for the metrics
    });

    this.meterProvider = new MeterProvider({ readers: [this.exporter] });
    const meter = this.meterProvider.getMeter('http-server');

    // 2 counters for the metrics
    this.httpResponseTotal = meter.createCounter('http_server_response_total', {
      description:
        'Total number of HTTP server responses classified by status class',
      unit: '1',
    });

    // Per-organization totals (can include additional labels like method/route)
    this.httpResponseByOrgTotal = meter.createCounter(
      'http_server_response_by_org_total',
      {
        description:
          'Total number of HTTP server responses per organization classified by status class',
        unit: '1',
      },
    );

    // Process metrics
    this.processStartTime = meter.createUpDownCounter(
      'process_start_time_seconds',
      {
        description: 'Start time of the process since unix epoch in seconds',
        unit: 's',
      },
    );

    this.processUptime = meter.createUpDownCounter('process_uptime_seconds', {
      description: 'Number of seconds since the process started',
      unit: 's',
    });

    // HTTP response duration histogram
    this.httpResponseDuration = meter.createHistogram(
      'soundbox_backend_http_response_duration_seconds',
      {
        description: 'HTTP response duration in seconds',
        unit: 's',
      },
    );

    // ----- CRON METRICS -----
    this.cronRunCounter = meter.createCounter('cron_runs_total', {
      description: 'Total number of successful cron executions',
    });

    this.cronFailCounter = meter.createCounter('cron_failures_total', {
      description: 'Total number of failed cron executions',
    });

    this.cronSkipCounter = meter.createCounter('cron_skipped_total', {
      description: 'Total number of skipped cron executions (due to lock)',
    });

    this.cronDuration = meter.createHistogram('cron_duration_seconds', {
      description: 'Execution duration of cron jobs in seconds',
      unit: 's',
    });

    // Set initial values
    this.processStartTime.add(this.startTime);
    this.updateUptime();
  }

  recordHttpStatus(
    statusCode: number,
    attributes?: Record<string, string | number | boolean>,
  ): void {
    const statusClass = this.toStatusClass(statusCode);
    // Increment global totals (only status_class)
    this.httpResponseTotal.add(1, { status_class: statusClass });

    // Increment per-organization totals (include provided attributes like organization_id)
    const attrs = { ...(attributes || {}) } as Record<
      string,
      string | number | boolean
    >;
    const orgId = String(attrs['organization_id'] || '');
    const orgNameAttr = attrs['organization_name'] as string | undefined;

    // If a name is provided, store/update cache
    if (orgId && orgNameAttr && orgNameAttr !== 'unknown') {
      this.organizationIdToName.set(orgId, orgNameAttr);
    }

    // If name missing but ID known, try to populate from cache
    if (orgId && (!orgNameAttr || orgNameAttr === 'unknown')) {
      const cached = this.organizationIdToName.get(orgId);
      if (cached) {
        attrs['organization_name'] = cached;
      }
    }

    this.httpResponseByOrgTotal.add(1, {
      status_class: statusClass,
      ...attrs,
    });
  }

  recordHttpDuration(
    durationSeconds: number,
    attributes?: Record<string, string | number | boolean>,
  ): void {
    try {
      this.httpResponseDuration.record(durationSeconds, attributes || {});
    } catch (error) {
      console.error('[OtelMetrics] Error recording duration:', error);
    }
  }

  recordCronRun(cronName: string, duration: number) {
    this.cronRunCounter.add(1, { cron_name: cronName });
    this.cronDuration.record(duration, { cron_name: cronName });
  }

  recordCronFailure(cronName: string, duration: number) {
    this.cronFailCounter.add(1, { cron_name: cronName });
    this.cronDuration.record(duration, { cron_name: cronName });
  }

  recordCronSkip(cronName: string) {
    this.cronSkipCounter.add(1, { cron_name: cronName });
  }

  private toStatusClass(statusCode: number): '2xx' | '3xx' | '4xx' | '5xx' {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    return '5xx';
  }

  private updateUptime(): void {
    const uptime = Date.now() / 1000 - this.startTime;
    this.processUptime.add(uptime);

    // Update uptime every 30 seconds
    setTimeout(() => this.updateUptime(), 30000);
  }
}
