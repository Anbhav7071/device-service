import { DomainError } from './domain.error';

export class InvalidQueryFieldError extends DomainError {
  readonly code = 'INVALID_QUERY_FIELD';
}
