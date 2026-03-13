import { ClassSerializerInterceptorOptions } from '@nestjs/common';

export const serilizationOptions: ClassSerializerInterceptorOptions = {
  excludePrefixes: ['_', '__'],
};
