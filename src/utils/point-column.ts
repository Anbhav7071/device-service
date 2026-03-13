import { ColumnOptions, Column } from 'typeorm';

interface PointColumnOptions extends Omit<
  ColumnOptions,
  'transformer' | 'type'
> { }

export function pointSerialize(p: any) {
  if (!p) {
    return p;
  }

  return `${p.x},${p.y}`;
}

export function definePointColumn(options?: PointColumnOptions): ColumnOptions {
  options = options || {};

  return {
    ...options,
    type: 'point',
    transformer: {
      from: pointSerialize,
      to: (p) => p,
    },
  };
}

export function PointColumn(options?: PointColumnOptions): PropertyDecorator {
  return function (target: object, propertyName: string) {
    const pointOptions = definePointColumn(options);

    // Call the original @Column decorator provided by TypeORM
    Column(pointOptions)(target, propertyName);
  };
}
