import {
  Transform,
  TransformFnParams,
  TransformOptions,
} from 'class-transformer';

function afterTransformOptions(options?: TransformOptions): TransformOptions {
  const groups = options?.groups || [];

  return {
    ...options,
    groups: [...groups, 'afterTransform'],
  };
}

export function AfterTransform(
  transformFn: (params: TransformFnParams) => any,
  options?: TransformOptions,
): PropertyDecorator {
  return Transform(transformFn, { groups: ['afterTransform'] });
}
