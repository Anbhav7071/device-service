export const ALLOWED_FILTER_FIELDS = [
    'status',
    'deviceType',
    'brokerType',
    'serialNumber',
] as const;

export const ALLOWED_SELECT_FIELDS = [
    'id',
    'name',
    'status',
    'deviceType',
    'serialNumber',
    'createdAt',
    'updatedAt',
] as const;

export const ALLOWED_ORDER_FIELDS = [
    'createdAt',
    'updatedAt',
    'name',
    'status',
] as const;

export const ALLOWED_RELATIONS = [
    'connectivity',
    'assignment',
    'telemetryMeta',
    'credential',
] as const;
