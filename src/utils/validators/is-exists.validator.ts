import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1];
    const entity: unknown = await this.dataSource
      .getRepository(repository)
      .findOne({
        where: {
          [pathToProperty ? pathToProperty : validationArguments.property]:
            pathToProperty && value?.[pathToProperty]
              ? value[pathToProperty]
              : value,
        },
        withDeleted: true,
      });

    return Boolean(entity);
  }
}

export function checkVariableExistence(variable: any) {
  let value: string | number | boolean | undefined = process.env[variable.name];
  if (variable.type === 'number' && typeof value === 'string') {
    value = parseInt(value);
  } else if (variable.type === 'boolean' && typeof value === 'string') {
    value = stringToBool(value); // Convert string to boolean
  }
  //case handle boolean variable
  if (variable.type === 'boolean') {
    if (typeof value !== 'boolean') {
      const errorMessage = `Validation failed for "${variable.name}"`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } else if (!value || value === '' || typeof value !== variable.type) {
    //for handling other type variables
    const errorMessage = `Required environment variable "${variable.name}" of type ${variable.type} is either not set, empty or incorrect type.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

function stringToBool(variable: any) {
  if (variable.toLowerCase() === 'true') return true;
  else if (variable.toLowerCase() === 'false') return false;
  return variable;
}
