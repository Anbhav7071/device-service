import { otelSDK } from './telemetry/otel.bootstrap';
import 'reflect-metadata';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  HttpStatus,
} from '@nestjs/common';
import { setupAxiosTraceInterceptor } from './logger/axios-trace.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { serilizationOptions } from './utils/options/serialization-options';
import { TransformPipe } from './utils/pipes/tansform.pipe';
import validationOptions from './utils/options/validation-options';
import transformOptions from './utils/options/transform-options';
import { checkVariableExistence } from './utils/validators/is-exists.validator';
import * as fs from 'fs';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { LogExecutionInterceptor } from './logger/interceptor/loggerexecution.interceptor';
import { CustomLoggerService } from './logger/logger.service';
import { OtelMetricsService } from './logger/otel-metrics.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

function bootstrapValidation() {
  const requiredEnvVariables = [
    {
      name: 'DATABASE_TYPE',
      message: 'DATABASE_TYPE is required',
      type: 'string',
    },
    {
      name: 'DATABASE_HOST',
      message: 'DATABASE_HOST is required',
      type: 'string',
    },
    {
      name: 'DATABASE_PORT',
      message: 'DATABASE_PORT is required',
      type: 'number',
    },
    {
      name: 'DATABASE_USERNAME',
      message: 'DATABASE_USERNAME is required',
      type: 'string',
    },
    {
      name: 'DATABASE_PASSWORD',
      message: 'DATABASE_PASSWORD is required',
      type: 'string',
    },
    {
      name: 'DATABASE_NAME',
      message: 'DATABASE_NAME is required',
      type: 'string',
    },
    {
      name: 'DATABASE_SYNCHRONIZE',
      message: 'DATABASE_SYNCHRONIZE is required',
      type: 'boolean',
    },
    {
      name: 'DATABASE_MAX_CONNECTIONS',
      message: 'DATABASE_MAX_CONNECTIONS is required',
      type: 'string',
    },
    {
      name: 'DATABASE_SSL_ENABLED',
      message: 'DATABASE_SSL_ENABLED is required',
      type: 'boolean',
    },
    {
      name: 'DATABASE_REJECT_UNAUTHORIZED',
      message: 'DATABASE_REJECT_UNAUTHORIZED is required',
      type: 'string',
    },
  ];

  try {
    requiredEnvVariables.forEach((v) => checkVariableExistence(v));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

class CORSForbiddenError extends Error {
  statusCode: HttpStatus;
  error: string;
  constructor(message: string) {
    super(message);
    this.name = 'CORSForbiddenError';
    this.statusCode = HttpStatus.FORBIDDEN;
    this.error = 'Forbidden';
  }
}

async function bootstrap() {
  otelSDK.start();
  console.log('OTEL SDK started');

  bootstrapValidation();

  setupAxiosTraceInterceptor();

  const useHTTPS = process.env.ENABLE_HTTPS === 'true';
  let httpsOptions: HttpsOptions = {};

  if (useHTTPS) {
    httpsOptions = {
      key: fs.readFileSync(process.env.KEY_PATH!, 'utf8'),
      cert: fs.readFileSync(process.env.CERT_PATH!, 'utf8'),
    };
  }

  const app = useHTTPS
    ? await NestFactory.create(AppModule, {
      httpsOptions,
      forceCloseConnections: true,
    })
    : await NestFactory.create(AppModule, { forceCloseConnections: true });

  const whitelistAPI = process.env.WHITELIST_API || 'http://127.0.0.1';
  const whitelistAPIArray = whitelistAPI.split(',').map((url) => url.trim());
  const CORS_ENABLED = process.env.CORS_ENABLED === 'true';

  if (CORS_ENABLED) {
    app.enableCors({
      origin: (origin: string, callback: Function) => {
        if (!origin) return callback(null, true);

        const parsed = new URL(origin);
        const base = `${parsed.protocol}//${parsed.hostname}`;

        if (whitelistAPIArray.includes(base)) return callback(null, true);

        callback(new CORSForbiddenError('Not allowed by CORS'), false);
      },
      methods: 'GET,PATCH,POST,DELETE,OPTIONS',
    });
  }

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<AllConfigType>);
  app.enableShutdownHooks();

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );

  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe(validationOptions),
    new TransformPipe(transformOptions),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), serilizationOptions),
    new LogExecutionInterceptor(
      new Reflector(),
      app.get(CustomLoggerService),
      app.get(OtelMetricsService),
    ),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector, app.get(CustomLoggerService))
  );

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}

bootstrap()
  .then(() => console.log('Server started'))
  .catch((err) => {
    console.error('Server failed:', err);
    otelSDK.shutdown().catch(console.error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('OTEL SDK shutdown'))
    .finally(() => process.exit(0));
});
