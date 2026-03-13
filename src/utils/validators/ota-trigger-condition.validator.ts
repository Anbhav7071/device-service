import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const ALLOWED_CONDITIONS = new Set([
  'DEVICE_REBOOTED',
  'DAY_SUM_MONEY',
  'DEVICE_SPEAK_TXN',
  'FETCH_LAST_PAYMENTS',
  'IMMEDIATE',
]);
const CRON_STRUCTURE_REGEX = /^CRON\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+$/;

function isValidNumericField(value: string, min: number, max: number): boolean {
  if (!value || value === '*') return false;
  const parts = value.split(',');
  return parts.every((part) => {
    const num = Number(part.trim());
    return /^\d+$/.test(part.trim()) && num >= min && num <= max;
  });
}

function isValidCronField(value: string): boolean {
  if (value === '*') return true;
  // For day/month/day-of-week, we don't validate ranges strictly
  // Just check it's numeric format
  const parts = value.split(',');
  return parts.every((part) => /^\d+$/.test(part.trim()));
}

function parseCronTime(
  condition: string,
): { minute: string; hour: string } | null {
  if (!CRON_STRUCTURE_REGEX.test(condition)) return null;

  const parts = condition.trim().split(/\s+/);
  if (parts.length !== 6 || parts[0] !== 'CRON') return null;

  const minute = parts[1];
  const hour = parts[2];

  // Minute and hour must be numeric only (no wildcards) with valid ranges
  if (
    !isValidNumericField(minute, 0, 59) ||
    !isValidNumericField(hour, 0, 23)
  ) {
    return null;
  }

  // Other fields can be wildcards or numeric
  for (let i = 3; i < 6; i++) {
    if (!isValidCronField(parts[i])) {
      return null;
    }
  }

  return { minute, hour };
}

function parseTimeValues(value: string): Set<string> {
  return new Set(value.split(',').map((v) => v.trim()));
}

function hasTimeClash(
  minute1: string,
  hour1: string,
  minute2: string,
  hour2: string,
): boolean {
  const minutes1 = parseTimeValues(minute1);
  const hours1 = parseTimeValues(hour1);
  const minutes2 = parseTimeValues(minute2);
  const hours2 = parseTimeValues(hour2);

  // Check if any minute-hour combination overlaps
  for (const m1 of minutes1) {
    if (!minutes2.has(m1)) continue;
    for (const h1 of hours1) {
      if (hours2.has(h1)) return true; // Same minute and hour found
    }
  }
  return false;
}

@ValidatorConstraint({ name: 'IsValidOtaTriggerCondition', async: false })
export class IsValidOtaTriggerConditionConstraint implements ValidatorConstraintInterface {
  private clashInfo: { cron1: string; cron2: string } | null = null;

  validate(conditions: string[], args: ValidationArguments): boolean {
    if (!Array.isArray(conditions) || conditions.length === 0) return false;

    this.clashInfo = null;
    const cronExpressions: Array<{
      condition: string;
      time: { minute: string; hour: string };
    }> = [];

    for (const condition of conditions) {
      if (typeof condition !== 'string') return false;

      // Check if it's an allowed non-CRON condition
      if (ALLOWED_CONDITIONS.has(condition)) {
        continue;
      }

      // Extract minute and hour (validates CRON format internally)
      const time = parseCronTime(condition);
      if (!time) return false;

      cronExpressions.push({ condition, time });
    }

    // Check for time clashes between CRON expressions
    for (let i = 0; i < cronExpressions.length; i++) {
      for (let j = i + 1; j < cronExpressions.length; j++) {
        const { condition: condition1, time: time1 } = cronExpressions[i];
        const { condition: condition2, time: time2 } = cronExpressions[j];
        if (hasTimeClash(time1.minute, time1.hour, time2.minute, time2.hour)) {
          this.clashInfo = {
            cron1: condition1,
            cron2: condition2,
          };
          return false; // Clash detected
        }
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const clash = this.clashInfo;
    if (clash) {
      return `CRON expressions "${clash.cron1}" and "${clash.cron2}" have overlapping minute and hour times. Minute must be 0-59, hour must be 0-23, and no wildcards allowed in minute/hour fields.`;
    }
    return 'Invalid trigger condition.';
  }
}
