import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsIndianPhoneNumber', async: false })
export class IsIndianPhoneNumber implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments) {
    const containsInvalidChars = /[^0-9+]/.test(value);
    if (containsInvalidChars) {
      return false;
    }

    const phoneNumberRegex = /^(?:\+91)?[6-9]\d{9}$/;
    return phoneNumberRegex.test(value);
  }

  defaultMessage(validationArguments: ValidationArguments) {
    return `Invalid Indian phone number format`;
  }
}
