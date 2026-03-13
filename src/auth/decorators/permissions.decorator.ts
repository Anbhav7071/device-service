import { SetMetadata } from '@nestjs/common';
import { Resource } from 'src/permissions/resource.enum';
import { Action } from 'src/permissions/entities/action.enum';

export const PERMISSIONS_KEY = 'permissions';
export const PUBLIC_PERMISSION_KEY = 'public_permission';

export type RequiredPermission = {
    resource: Resource;
    action?: Action;
};

/**
 * Declare a required permission for a controller class or a single route method.
 *
 * **On a controller class (recommended):**
 *   Omit `action` — the guard will infer it from the HTTP method:
 *   - GET / HEAD → READ
 *   - POST / PUT / PATCH / DELETE → MANAGE
 *
 *   Individual methods can override by applying their own @RequirePermission.
 *
 * @example
 *   // Class-level: action inferred from HTTP method
 *   @RequirePermission(Resource.DEVICE)
 *   export class DevicesController { ... }
 *
 *   // Method-level override
 *   @RequirePermission(Resource.DEVICE, Action.EXPORT)
 *   async exportDevices() { ... }
 */
export const RequirePermission = (
    resource: Resource,
    action?: Action,
): MethodDecorator & ClassDecorator =>
    SetMetadata<string, RequiredPermission[]>(PERMISSIONS_KEY, [
        { resource, action },
    ]);

/**
 * Mark a route (or entire controller) as public — no permission check OR authentication check is performed.
 * This bypasses both JwtAuthGuard and RolesGuard.
 *
 * @example
 *   @PublicRoute()
 *   async healthCheck() { ... }
 */
export const PublicRoute = (): MethodDecorator & ClassDecorator =>
    SetMetadata<string, boolean>(PUBLIC_PERMISSION_KEY, true);
