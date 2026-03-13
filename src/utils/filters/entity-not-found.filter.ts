import { Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(EntityNotFoundError)
export class EntityNotFoundExceptionFilter extends BaseExceptionFilter {
  protected message: string = 'Entity not found.';

  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const customBadRequestError = new BadRequestException(this.message);
    return super.catch(customBadRequestError, host);
  }
}
