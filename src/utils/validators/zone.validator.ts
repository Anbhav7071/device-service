import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsZonePathConstraint', async: false })
export class IsZonePathConstraint implements ValidatorConstraintInterface {
  validate(zonePath: any) {
    const regex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/;
    return typeof zonePath === 'string' && regex.test(zonePath);
  }

  defaultMessage() {
    return 'Zone path is not valid. It must start with an alphanumeric character and can contain alphanumeric characters separated by dots. It cannot start or end with a dot.';
  }
}

export function IsZonePath(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsZonePathConstraint,
    });
  };
}
