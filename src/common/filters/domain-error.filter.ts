import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Map status codes based on code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception.code.includes('NOT_FOUND')) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception.code.includes('INVALID') ||
      exception.code.includes('REQUIRED')
    ) {
      status = HttpStatus.BAD_REQUEST;
    } else if (
      exception.code.includes('EXISTS') ||
      exception.code.includes('UNAUTHORIZED') ||
      exception.code.includes('CONFLICT') ||
      exception.code.includes('ALREADY') ||
      exception.code.includes('STALE') ||
      exception.code.includes('PROGRESS')
    ) {
      status = HttpStatus.CONFLICT;
    }

    if (
      exception.code === 'TENANT_MISMATCH' ||
      exception.code === 'IMMUTABLE_FIELD' ||
      exception.code.includes('INSUFFICIENT')
    ) {
      status = HttpStatus.FORBIDDEN;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled domain error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `Domain error: ${exception.code} - ${exception.message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.code,
    });
  }
}
