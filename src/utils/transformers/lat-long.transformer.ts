import { TransformFnParams } from 'class-transformer';
import { Point } from 'typeorm';
import { MaybeType } from '../types/maybe.type';

export const latLongTransformer = (
  params: TransformFnParams,
): MaybeType<Point> => {
  if (params.value === null || params.value === undefined) {
    return undefined;
  }

  const split: string[] = params.value.split(',');
  if (split.length !== 2) {
    return undefined;
  }

  const coordinates: [number, number] = [
    parseFloat(split[0]),
    parseFloat(split[1]),
  ];

  return {
    type: 'Point',
    coordinates: coordinates,
  };
};
