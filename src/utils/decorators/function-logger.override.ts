import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import {
  FN_LOGGER_METHOD_OPTS,
  FN_LOGGER_METHOD_DISABLED,
} from './function-logger.keys';
import type { FunctionLoggerOptions } from './function-logger.decorator';

export const FunctionLoggerOverride = (opts: FunctionLoggerOptions) =>
  SetMetadata(FN_LOGGER_METHOD_OPTS, opts);

export const NoFunctionLogger = () =>
  SetMetadata(FN_LOGGER_METHOD_DISABLED, true);
