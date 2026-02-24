import { Module, Global, forwardRef } from '@nestjs/common'; // for creating the Module and Global instances
import { CustomLoggerService } from './logger.service'; // for creating the CustomLoggerService instance
import { LoggerConfig, defaultLoggerConfig } from './logger.config'; // for creating the LoggerConfig and defaultLoggerConfig instances
import { TraceContextService } from './trace-context.service';
import { TypeOrmTraceLogger } from './typeorm-trace-logger';
import { OtelMetricsService } from './otel-metrics.service';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: 'LOGGER_CONFIG', 
      useValue: {
        ...defaultLoggerConfig, // for setting the default values of the logs
        // Override with environment variables
        level: (process.env.LOG_LEVEL as any) || defaultLoggerConfig.level, // for setting the level of the logs        
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false', // for enabling the console logging
        enableFile: process.env.LOG_ENABLE_FILE === 'true', // for enabling the file logging
        enableOpenTelemetry: process.env.LOG_ENABLE_OTEL !== 'false', // for enabling the open telemetry in the logs
        timestampFormat: (process.env.LOG_TIMESTAMP_FORMAT as any) || defaultLoggerConfig.timestampFormat, // for setting the timestamp format of the logs
        includeStackTrace: process.env.LOG_INCLUDE_STACK_TRACE !== 'false', // for including the stack trace in the logs
      } as LoggerConfig,
    },
    {
      provide: CustomLoggerService, // for providing the CustomLoggerService instance
      useFactory: (config: LoggerConfig) => {
        const logger = new CustomLoggerService(config);
        // Make logger globally available for database logger
        (global as any).customLogger = logger;
        return logger;
      },
      inject: ['LOGGER_CONFIG'], // for injecting the LOGGER_CONFIG instanc e
    },
    TraceContextService,
    TypeOrmTraceLogger,
    OtelMetricsService,
  ],
  exports: [CustomLoggerService, TraceContextService, TypeOrmTraceLogger, OtelMetricsService], // for exporting the services
})
export class LoggerModule {} // for creating the LoggerModule instance
