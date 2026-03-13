import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DeviceIdentifierPipe implements PipeTransform<string> {
  transform(value: string): string {
    // Check if it's a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Check if it's a valid IMEI (15 digits)
    const imeiRegex = /^\d{15}$/;

    if (!uuidRegex.test(value) && !imeiRegex.test(value)) {
      throw new BadRequestException(
        'Invalid device identifier. Must be either a valid UUID or 15-digit IMEI.',
      );
    }

    return value;
  }
}
