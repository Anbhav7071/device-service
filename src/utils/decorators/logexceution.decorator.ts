import { SetMetadata } from '@nestjs/common'; // for setting the metadata

// Custom metadata key
export const LOG_EXECUTION_KEY = 'logExecution';

export const LogExecution = () => SetMetadata(LOG_EXECUTION_KEY, true);
