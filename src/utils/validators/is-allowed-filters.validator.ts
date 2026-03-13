import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

export function IsAllowedFilters(
    allowedKeys: readonly string[],
    validationOptions?: ValidationOptions,
) {
    return ValidateBy(
        {
            name: 'isAllowedFilters',
            constraints: [allowedKeys],
            validator: {
                validate: (value, args): boolean => {
                    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                        return false;
                    }
                    const keys = Object.keys(value);
                    const allowed = args?.constraints[0] as string[];
                    return keys.every((key) => allowed.includes(key));
                },
                defaultMessage: buildMessage(
                    (eachPrefix) =>
                        eachPrefix +
                        '$property contains invalid filter criteria. Allowed: ' +
                        allowedKeys.join(', '),
                    validationOptions,
                ),
            },
        },
        validationOptions,
    );
}
