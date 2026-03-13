import { TransformFnParams } from 'class-transformer';
import { MaybeType } from '../types/maybe.type';

export const dateTransformer = (params: TransformFnParams): MaybeType<Date> => {
  if (params.value === null || params.value === undefined) {
    return undefined;
  }

  return new Date(params.value);
};
