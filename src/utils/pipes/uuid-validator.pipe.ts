import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate, IsUUID } from 'class-validator';
import { plainToClass } from 'class-transformer';

class UUIDValidationDTO {
  @IsUUID('4')
  id: string;
}

@Injectable()
export class UUIDValidationPipe implements PipeTransform<
  string | undefined,
  Promise<string | undefined>
> {
  async transform(value: string | undefined): Promise<string | undefined> {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const validatedValue = plainToClass(UUIDValidationDTO, { id: value });
    const errors = await validate(validatedValue);

    if (errors.length > 0) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value;
  }
}
