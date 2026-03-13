export function getUserRoleName(user: any): string {
    // Extract role name if present in token. In our stateless token, 
    // superadmin might be denoted by a specific roleId or a roleName field.
    // We'll fallback to a property check.
    if (!user) return '';
    return typeof user.role === 'string' ? user.role : user.roleName || user.role?.name || '';
}
