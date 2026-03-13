import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '../types/maybe.type';

export const readOnlyTransformer = (
  params: TransformFnParams,
): MaybeType<undefined> => undefined;
