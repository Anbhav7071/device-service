import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsObject,
  IsArray,
} from 'class-validator';
import { SortOrder } from '../../utils/enums/sort-order.enum';
import { IsAllowedFilters } from '../../utils/validators/is-allowed-filters.validator';

export function getListQueryDto<
  TFilter extends string = string,
  TSelect extends string = string,
  TOrder extends string = string,
  TRelation extends string = string
>(
  allowedFilterFields: readonly TFilter[],
  allowedSelectFields: readonly TSelect[],
  allowedOrderFields: readonly TOrder[],
  allowedRelations: readonly TRelation[] = []
) {
  class ListQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @IsOptional()
    @IsObject()
    @IsAllowedFilters(allowedFilterFields)
    whereFilter?: Record<string, unknown>;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(allowedSelectFields, {
      each: true,
      message: 'Select contains invalid entity fields',
    })
    select?: TSelect[];

    @IsOptional()
    @IsString()
    @IsIn(Object.values(SortOrder))
    orderDirection?: SortOrder = SortOrder.DESC;

    @IsOptional()
    @IsString()
    @IsIn(allowedOrderFields, { message: 'OrderBy must be a valid entity field' })
    orderBy?: TOrder = (allowedOrderFields[0] || 'createdAt') as TOrder;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(allowedRelations, {
      each: true,
      message: 'Relations contain invalid entity relations',
    })
    relations?: TRelation[];
  }

  return ListQueryDto;
}


