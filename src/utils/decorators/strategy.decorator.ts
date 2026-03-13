export const STRATEGY_TOKEN = 'BULK_UPLOAD_STRATEGY';

import { SetMetadata } from '@nestjs/common';

export const STRATEGY_IDENTIFIER = 'STRATEGY_IDENTIFIER';
export const StrategyIdentifier = (id: string) =>
  SetMetadata(STRATEGY_IDENTIFIER, id);
