import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParseLimitPipe implements PipeTransform<any> {
  transform(value: any): any {
    //default retrieval Limit Size
    const retrievalLimit = process.env.MAX_OBJECTS_RETRIVAL_LIMIT || 10;
    //hard Limit Size
    const hardLimit = process.env.MAX_OBJECTS_HARD_LIMIT || 25;
    try {
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue < 0) {
        return retrievalLimit;
      } else if (parsedValue > 50) {
        return hardLimit;
      } else {
        return parsedValue;
      }
    } catch (error) {
      console.error('Error parsing limit value:', error);
      return retrievalLimit;
    }
  }
}
