import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Stats } from '../dto/stats.dto';
import { plainToInstance } from 'class-transformer';

function getTotal(data: Stats) {
  let total = 0;
  data.stats.forEach((obj) => (total += obj.count));

  return total;
}

export async function statsQuery<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  selection: string,
): Promise<Stats> {
  const stats = await queryBuilder
    .select(selection)
    .addSelect(`COUNT(*) as count, ${selection} as type`)
    .groupBy(selection)
    .getRawMany();

  const data = plainToInstance(
    Stats,
    { stats },
    {
      enableImplicitConversion: true,
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    },
  );

  data.total = getTotal(data);

  return data;
}
