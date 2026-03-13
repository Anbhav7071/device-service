import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsValidEmail', async: false })
export class IsValidEmail implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/; //custom logic
    return emailRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Invalid email format';
  }
}
