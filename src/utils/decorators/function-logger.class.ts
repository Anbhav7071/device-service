import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import {
  FN_LOGGER_CLASS_OPTS,
  FN_LOGGER_METHOD_OPTS,
  FN_LOGGER_METHOD_DISABLED,
} from './function-logger.keys';
import {
  FunctionLogger,
  FunctionLoggerOptions,
} from './function-logger.decorator';

export const FunctionLoggerClass = (
  classDefaults: FunctionLoggerOptions = {},
) => {
  return (target: any) => {
    // Save class defaults for potential reflector-based discovery
    SetMetadata(FN_LOGGER_CLASS_OPTS, classDefaults)(target);

    const proto = target.prototype;
    const propertyNames = Object.getOwnPropertyNames(proto);

    for (const name of propertyNames) {
      if (name === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      // Skip if explicitly disabled on method
      const disabled: boolean | undefined = Reflect.getMetadata(
        FN_LOGGER_METHOD_DISABLED,
        proto,
        name,
      );
      if (disabled) continue;

      // Merge class defaults with method overrides, method wins
      const methodOverride: FunctionLoggerOptions | undefined =
        Reflect.getMetadata(FN_LOGGER_METHOD_OPTS, proto, name);

      const effectiveOpts: FunctionLoggerOptions = {
        ...classDefaults,
        ...(methodOverride || {}),
      };

      // Wrap method using existing FunctionLogger decorator
      FunctionLogger(effectiveOpts)(proto, name, descriptor);
      Object.defineProperty(proto, name, descriptor);
    }
  };
};
