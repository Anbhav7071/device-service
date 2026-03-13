import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isTaxonomySafeName', async: false })
export class IsTaxonomySafeName implements ValidatorConstraintInterface {
  validate(name: string, args: ValidationArguments) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // Allow letters, numbers, spaces, and underscores
    const taxonomySafePattern = /^[a-zA-Z0-9\s_]+$/;

    return taxonomySafePattern.test(name.trim());
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} can only contain letters, numbers, spaces, and underscores.`;
  }
}
