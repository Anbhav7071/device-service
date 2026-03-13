import {
  HttpException,
  HttpStatus,
  ValidationError,
  ValidationPipeOptions,
} from '@nestjs/common';

function joinConstraints(constraints: ValidationError['constraints']) {
  return Object.values(constraints ?? {}).join(', ');
}

function formatErrorRecursive(
  currentValue: ValidationError,
  parentProperty = '',
): Record<string, string> {
  const property = parentProperty
    ? `${parentProperty}.${currentValue.property}`
    : currentValue.property;
  const children = currentValue.children;

  if (Array.isArray(children) && children.length > 0) {
    const errorObj = {};

    for (const child of children) {
      Object.assign(errorObj, formatErrorRecursive(child, property));
    }

    return errorObj;
  }

  return {
    [property]: joinConstraints(currentValue.constraints),
  };
}

const validationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  stopAtFirstError: true,
  errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  exceptionFactory: (errors: ValidationError[]) =>
    new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        errors: errors.reduce(
          (accumulator, currentValue) => ({
            ...accumulator,
            ...formatErrorRecursive(currentValue),
          }),
          {},
        ),
      },
      HttpStatus.BAD_REQUEST,
    ),
};

export default validationOptions;
