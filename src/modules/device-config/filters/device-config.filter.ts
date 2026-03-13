export const ALLOWED_FILTER_FIELDS = [
    'deviceId',
] as const;

export const ALLOWED_SELECT_FIELDS = [
    'id',
    'deviceId',
    'desiredState',
    'reportedState',
    'configVersion',
    'reportedVersion',
    'lastSyncedAt',
    'updatedBy',
    'createdAt',
    'updatedAt',
    'version',
] as const;

export const ALLOWED_ORDER_FIELDS = [
    'createdAt',
    'updatedAt',
    'lastSyncedAt',
] as const;

export const ALLOWED_RELATIONS = [] as const;
