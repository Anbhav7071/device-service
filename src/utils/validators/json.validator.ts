import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

type KeyValueLengthConstraints = {
  keyLength: number;
  valueLength: number;
};

function checkValueType(value: any) {
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return true;
  }

  if (value === null) {
    return true;
  }

  return false;
}

@ValidatorConstraint({ name: 'JsonKeyValueLength', async: false })
export class JsonKeyValueLength implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value || typeof value !== 'object') {
      return true; // Skip validation if value is not an object
    }

    const constraints: KeyValueLengthConstraints = args.constraints[0];

    const keyMinLength = 1;
    const keyMaxLength = constraints.keyLength;

    const valueMinLength = 1;
    const valueMaxLength = constraints.valueLength;

    for (const key of Object.keys(value)) {
      const keyValue = value[key];

      if (
        typeof key !== 'string' ||
        key.length < keyMinLength ||
        key.length > keyMaxLength
      ) {
        return false; // Key length exceeds the limit
      }

      if (!checkValueType(keyValue)) {
        return false; // Value type is invalid
      }

      if (typeof value === 'string') {
        if (
          keyValue.length < valueMinLength ||
          keyValue.length > valueMaxLength
        ) {
          return false; // Value length is invalid
        }
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const constraints: KeyValueLengthConstraints = args.constraints[0];

    return `The key and value length should not exceed ${constraints.keyLength} and ${constraints.valueLength} respectively.`;
  }
}
