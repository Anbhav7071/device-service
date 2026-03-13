import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Extract securely from validated JWT payload if available, else falback to requested header
    return request.user?.tenantId || request.headers['x-tenant-id'];
  },
);
