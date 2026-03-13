import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsExactLengthNumber', async: false })
export class IsExactLengthNumber implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments) {
    const requiredLength = validationArguments.constraints[0] as number;
    if (!/^\d+$/.test(value)) {
      return false;
    }

    return value.length == requiredLength;
  }

  defaultMessage(validationArguments: ValidationArguments) {
    const requiredLength = validationArguments.constraints[0] as number;
    return `The value must be a string containing exactly ${requiredLength} numeric digits`;
  }
}
