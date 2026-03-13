import { Expose, Type } from 'class-transformer';

export class StatsEntry {
  @Expose()
  type: string;

  @Expose()
  count: number;
}

export class Stats {
  @Expose()
  total: number = 0;

  @Expose()
  @Type(() => StatsEntry)
  stats: StatsEntry[];
}
