import { BadRequestException } from '@nestjs/common';

export class MerchantValidationUtil {
  static validateBasicMerchantFields(
    rows: any[],
    options: {
      nameHeader: string;
      idHeader?: string;
      vpaHeader?: string;
    },
  ): any[] {
    const errors: any[] = [];

    const nameHeader = options.nameHeader;
    const idHeader = options.idHeader;
    const vpaHeader = options.vpaHeader;

    const vpaPattern = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/;

    rows.forEach((row, idx) => {
      if (!row[nameHeader] || (idHeader && !row[idHeader])) {
        errors.push({
          rowIndex: idx + 1,
          error: 'Missing required merchant fields',
        });
      }

      if (vpaHeader) {
        const vpaValue = row[vpaHeader];
        if (!vpaValue || !vpaPattern.test(vpaValue)) {
          errors.push({
            rowIndex: idx + 1,
            error: 'Invalid VPA format. VPA should be in format: username@bank',
          });
        }
      }
    });

    return errors;
  }

  static validateHeaders(
    actualHeaders: string[],
    expectedHeaders: string[],
  ): void {
    const missing = expectedHeaders.filter((h) => !actualHeaders.includes(h));
    if (missing.length) {
      throw new BadRequestException(`Missing headers: ${missing.join(', ')}`);
    }
  }
}
