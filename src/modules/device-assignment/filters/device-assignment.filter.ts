export const ALLOWED_FILTER_FIELDS = [
    'deviceId',
    'taxonomyId',
    'orgNodeId',
    'solutionId',
    'isActive',
] as const;

export const ALLOWED_SELECT_FIELDS = [
    'id',
    'deviceId',
    'solutionId',
    'taxonomyId',
    'orgNodeId',
    'isActive',
    'assignedAt',
    'assignedBy',
    'unassignedAt',
    'unassignedBy',
    'unassignReason',
    'metadata',
    'createdAt',
] as const;

export const ALLOWED_ORDER_FIELDS = [
    'createdAt',
    'assignedAt',
    'unassignedAt',
] as const;

export const ALLOWED_RELATIONS = [] as const;
