import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsAlphanumericInRange', async: false })
export class IsAlphanumericInRange implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const [minLength, maxLength] = validationArguments.constraints;

    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return false;
    }

    const length = value.length;
    return length >= minLength && length <= maxLength;
  }

  defaultMessage(validationArguments: ValidationArguments) {
    const [minLength, maxLength] = validationArguments.constraints;
    return `Invalid input. Must be an alphanumeric string with length between ${minLength} and ${maxLength} characters`;
  }
}
