import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

type ValidationEntity =
  | {
      id?: number | string;
    }
  | undefined;

@Injectable()
@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0] as string;
    const currentValue = validationArguments.object as ValidationEntity;

    const queryColumn =
      validationArguments.constraints[1] || validationArguments.property;

    const entities = await this.dataSource.getRepository(repository).find({
      where: {
        [queryColumn]: value,
      },
      withDeleted: true,
    });

    if (entities.length > 0 && entities[0]?.id === currentValue?.id) {
      return true;
    }

    const result = entities.length === 0;
    return result;
  }

  async ValidateQr(
    vpa: string,
    qrString: string,
    validationArguments: ValidationArguments,
  ) {
    return qrString.toLowerCase().includes(vpa.toLowerCase());
  }
}
