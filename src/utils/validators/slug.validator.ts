import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsSlugConstraint', async: false })
export class IsSlugConstraint implements ValidatorConstraintInterface {
  validate(slug: any) {
    const regex = /^[a-z]+([._]*[a-z]+)*$/;
    return typeof slug === 'string' && regex.test(slug);
  }

  defaultMessage() {
    return 'Slug is not valid. It must start with a lowercase letter, can have dots or underscores in the middle, but cannot start or end with them.';
  }
}

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSlugConstraint,
    });
  };
}
