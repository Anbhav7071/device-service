export const ALLOWED_FILTER_FIELDS = [
    'deviceId',
    'brokerType',
    'connectivityStatus',
] as const;

export const ALLOWED_SELECT_FIELDS = [
    'id',
    'deviceId',
    'brokerType',
    'brokerEndpoint',
    'connectivityStatus',
    'firmwareVersion',
    'lastSeenAt',
    'publishAcl',
    'subscribeAcl',
    'createdAt',
    'updatedAt',
] as const;

export const ALLOWED_ORDER_FIELDS = [
    'createdAt',
    'updatedAt',
    'lastSeenAt',
] as const;

export const ALLOWED_RELATIONS = [] as const;
