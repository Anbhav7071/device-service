import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

@ValidatorConstraint({ name: 'NotPastDate', async: false })
export class NotPastDateValidator implements ValidatorConstraintInterface {
  validate(value: string) {
    const seconds = Number(value);
    if (isNaN(seconds)) return false;

    return seconds * 1000 > Date.now();
  }

  defaultMessage() {
    return 'expireAt must be a future date/time';
  }
}

export function normalizeToEpochTimestampString(
  value: any,
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  // CASE 1: UNIX timestamp (seconds or ms)
  if (!isNaN(value)) {
    const num = Number(value);
    const seconds = num > 1e12 ? Math.floor(num / 1000) : Math.floor(num);
    return seconds.toString();
  }

  // CASE 2: DATE ONLY (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T23:59:59.999`);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'expireAt must be a valid date in YYYY-MM-DD format',
      );
    }

    return Math.floor(date.getTime() / 1000).toString();
  }

  // CASE 3: DateTime string
  const date = new Date(value);

  if (!isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000).toString();
  }

  // INVALID FORMAT
  throw new BadRequestException(
    'expireAt must be a valid unix timestamp or date/datetime string',
  );
}
