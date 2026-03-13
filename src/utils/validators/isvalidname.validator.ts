import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@Injectable()
@ValidatorConstraint({ name: 'IsValidName', async: false })
export class IsValidName implements ValidatorConstraintInterface {
  validate(name: any) {
    const nameRegex = /^[a-zA-Z0-9 ]+$/;
    return nameRegex.test(name);
  }

  defaultMessage() {
    return 'Invalid name format';
  }
}

@Injectable()
@ValidatorConstraint({ name: 'IsValidIobName', async: false })
export class IsValidIobName implements ValidatorConstraintInterface {
  validate(name: string) {
    const nameRegex = /^[a-zA-Z0-9'.& ]+$/;
    return nameRegex.test(name);
  }

  defaultMessage() {
    return 'Invalid IOB name format';
  }
}

@Injectable()
@ValidatorConstraint({ name: 'IsValidAddress', async: false })
export class IsValidAddress implements ValidatorConstraintInterface {
  validate(value: string) {
    const addressRegex = /^[a-zA-Z0-9',.\-/ ]+$/;
    return typeof value === 'string' && addressRegex.test(value);
  }

  defaultMessage() {
    return 'Invalid address format';
  }
}

@Injectable()
@ValidatorConstraint({ name: 'IsValidAlpha', async: false })
export class IsValidAlpha implements ValidatorConstraintInterface {
  validate(value: string) {
    const alphaRegex = /^[a-zA-Z ]+$/;
    return typeof value === 'string' && alphaRegex.test(value);
  }

  defaultMessage() {
    return 'Only alphabets and spaces are allowed';
  }
}
