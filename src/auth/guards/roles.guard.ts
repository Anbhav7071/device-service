import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomLoggerService } from 'src/logger/logger.service';
import {
    PERMISSIONS_KEY,
    RequiredPermission,
    PUBLIC_PERMISSION_KEY,
} from 'src/auth/decorators/permissions.decorator';
import { PermissionPolicy } from 'src/permissions/permission-policy';
import { getUserRoleName } from 'src/utils/role.utils';
import { Action } from 'src/permissions/entities/action.enum';
import { HttpMethod } from 'src/utils/httpmethod.util';
import { Permission } from 'src/permissions/entities/permission.entity';

/**
 * Derives the required Action from the HTTP method.
 * GET / HEAD → READ, everything else → MANAGE.
 */
function actionFromMethod(method: string): Action {
    const m = String(method || '').toUpperCase();
    return m === HttpMethod.GET || m === HttpMethod.HEAD ? Action.READ : Action.MANAGE;
}

/**
 * Guard checks access by the user's role permissions matching against token claims.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly logger: CustomLoggerService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic =
            this.reflector.getAllAndOverride<boolean>(PUBLIC_PERMISSION_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? false;

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;
        if (!user) {
            throw new UnauthorizedException();
        }

        // 2) Superadmin: full access.
        if (getUserRoleName(user) === 'superadmin') {
            return true;
        }

        // If token inherently carries *:*, grant instant Superadmin pass globally
        if (user.permissions?.includes('*:*')) {
            return true;
        }

        const method = String(request.method || '').toUpperCase();

        // 3 & 4) Explicit @RequirePermission on the method handler.
        const methodPermissions =
            this.reflector.get<RequiredPermission[] | undefined>(
                PERMISSIONS_KEY,
                context.getHandler(),
            );

        if (methodPermissions && methodPermissions.length > 0) {
            const resolved = methodPermissions.map((p) => ({
                resource: p.resource,
                action: p.action ?? actionFromMethod(method),
            }));
            return this.checkPermissions(user, resolved);
        }

        // 5) @RequirePermission on the controller class.
        const classPermissions =
            this.reflector.get<RequiredPermission[] | undefined>(
                PERMISSIONS_KEY,
                context.getClass(),
            );

        if (classPermissions && classPermissions.length > 0) {
            const resolved = classPermissions.map((p) => ({
                resource: p.resource,
                action: p.action ?? actionFromMethod(method),
            }));
            return this.checkPermissions(user, resolved);
        }

        // 6) Nothing declared → allow (or default deny). By the user's provided logic: allow.
        // However, for strict security in a microservice, usually if no decorator is present but it's not marked public, we should probably default to true if the spec implies. The original snippet returned true.
        return true;
    }

    private checkPermissions(
        user: any,
        required: { resource: any; action: Action }[],
    ): boolean {
        // Accommodate flattened stateless token permissions array
        let rawPermissions = user.permissions || user.role?.permissions || [];

        // Parse token strings if needed
        let permissions: Permission[] = [];
        if (rawPermissions.length > 0 && typeof rawPermissions[0] === 'string') {
            permissions = PermissionPolicy.parseStringPermissions(rawPermissions);
        } else {
            permissions = rawPermissions;
        }

        const hasPerm = PermissionPolicy.hasAnyRequiredPermission(permissions, required);

        if (!hasPerm) {
            this.logger.error(
                `Permission check failed for user ${user.id || user.sub}`,
            );
            throw new ForbiddenException({
                errors: 'You are not authorized to access this resource',
            });
        }

        return true;
    }
}
