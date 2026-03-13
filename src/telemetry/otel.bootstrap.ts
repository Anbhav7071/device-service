import { NodeSDK } from "@opentelemetry/sdk-node";
import {
    ParentBasedSampler,
    TraceIdRatioBasedSampler,
    BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const isProduction = process.env.NODE_ENV === "production";
const samplingRate = isProduction ? 0.1 : 1.0; // Prod: 10%, Dev: 100%


const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || "http://localhost:14318/v1/traces", // Collector mapped port
});

export const otelSDK = new NodeSDK({
    // resource: new Resource({
    //     [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "soundbox-backend",
    //     [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || "1.0.0",
    //     environment: process.env.NODE_ENV || "development",
    // }),

    sampler: new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(samplingRate),
    }),

    spanProcessors: [
        new BatchSpanProcessor(traceExporter, {
            maxExportBatchSize: isProduction ? 256 : 64,
            scheduledDelayMillis: isProduction ? 2000 : 500,
            exportTimeoutMillis: isProduction ? 5000 : 2000,
        }),
    ],

    instrumentations: getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },

        "@opentelemetry/instrumentation-http": {
            enabled: true,
            ignoreIncomingRequestHook: (req) => {
                const ignore = ["/health", "/metrics", "/favicon.ico"];
                return ignore.some((p) => req.url?.startsWith(p));
            },
        },

        "@opentelemetry/instrumentation-pg": {
            enhancedDatabaseReporting: true,
        },
    }),
});
