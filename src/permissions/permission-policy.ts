import { Action } from './entities/action.enum';
import { Permission } from './entities/permission.entity';
import { Resource } from './resource.enum';

/**
 * Action order (higher implies all lower for the same resource):
 * READ < EXPORT < CREATE < MANAGE
 */
export class PermissionPolicy {
    static readonly ACTION_RANK: Record<Action | string, number> = {
        [Action.READ]: 0,
        [Action.EXPORT]: 1,
        [Action.CREATE]: 2,
        [Action.MANAGE]: 3,
        'write': 3, // Safely map write to manage for backwards compatibility with token payloads
    };

    /**
     * Returns true if a granted action satisfies a required action
     * according to the hierarchy.
     */
    static actionImplies(
        granted: Action | string | undefined | null,
        required: Action,
    ): boolean {
        if (!granted) return false;
        if (granted === '*') return true;
        // Map write to manage for comparison
        const normalizedGranted = granted === 'write' ? Action.MANAGE : granted;
        if (normalizedGranted === Action.MANAGE) return true;

        const rank = PermissionPolicy.ACTION_RANK;
        return (rank[normalizedGranted as string] ?? -1) >= (rank[required] ?? Number.POSITIVE_INFINITY);
    }

    /**
     * Returns true if any of the user's permissions satisfies the required
     * resource + action combination.
     */
    static hasAnyRequiredPermission(
        grantedPermissions: Permission[],
        requiredPermissions: { resource: Resource; action: Action }[],
    ): boolean {
        return requiredPermissions.some((required) =>
            grantedPermissions.some(
                (p) =>
                    (p.resource === required.resource || p.resource === '*') &&
                    PermissionPolicy.actionImplies(p.action, required.action),
            ),
        );
    }

    /**
     * Returns true if the user has the given resource/action permission.
     * Adapted to support stateless JWT tokens where permissions are in user object directly.
     */
    static userHasPermission(
        user: { permissions?: Permission[] | string[], role?: { permissions?: Permission[] } } | null | undefined,
        resource: Resource,
        action: Action,
    ): boolean {
        if (!user) return false;

        // Support parsing raw array of strings ["device:read"] from JWT directly
        let perms = user.permissions || user.role?.permissions || [];
        if (perms.length > 0 && typeof perms[0] === 'string') {
            perms = PermissionPolicy.parseStringPermissions(perms as string[]);
        }

        if (!perms.length) return false;
        return this.hasAnyRequiredPermission(perms as Permission[], [{ resource, action }]);
    }

    /**
     * Parses token strings like "device:read" to Permission objects
     */
    static parseStringPermissions(permissionStrings: string[]): Permission[] {
        return permissionStrings.map(p => {
            // split by : or .
            const parts = p.split(/[:.]/);
            return {
                resource: parts[0] as Resource || parts[0],
                action: parts[1] as Action || parts[1]
            };
        });
    }
}
