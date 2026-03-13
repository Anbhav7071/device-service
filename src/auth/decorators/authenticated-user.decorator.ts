import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthenticatedRequestUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);

export const AuthenticatedUser = AuthenticatedRequestUser;
