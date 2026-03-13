import { ValidationPipeOptions } from '@nestjs/common';

const transformOptions: ValidationPipeOptions = {
  transform: true,
  transformOptions: {
    groups: ['afterTransform'],
  },
};

export default transformOptions;
