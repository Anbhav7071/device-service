export const ALLOWED_FILTER_FIELDS = [
    'deviceId',
    'status',
    'certFingerprint',
    'issuerCertId',
] as const;

export const ALLOWED_SELECT_FIELDS = [
    'id',
    'deviceId',
    'certFingerprint',
    'certPem',
    'privateKeyRef',
    'issuerCertId',
    'status',
    'issuedAt',
    'expiresAt',
    'revokedAt',
    'revocationReason',
    'revokedBy',
    'rotatedFromId',
    'gracePeriodEndsAt',
    'createdAt',
] as const;

export const ALLOWED_ORDER_FIELDS = [
    'createdAt',
    'issuedAt',
    'expiresAt',
    'revokedAt',
    'status',
] as const;

export const ALLOWED_RELATIONS = [] as const;
