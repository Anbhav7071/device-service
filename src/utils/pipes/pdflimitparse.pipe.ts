import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParsePdfLimitPipe implements PipeTransform<any> {
  transform(value: any): any {
    //default retrieval Limit Size
    const retrievalLimit = process.env.MAX_PDF_OBJECTS_RETRIVAL_LIMIT || 500;
    //hard Limit Size
    const hardLimit = process.env.MAX_PDF_OBJECTS_HARD_LIMIT || 100;
    try {
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue < 0) {
        return retrievalLimit;
      } else if (parsedValue > 500) {
        return hardLimit;
      } else {
        return parsedValue;
      }
    } catch (error) {
      console.error('Error parsing PDF limit value:', error);
      return retrievalLimit;
    }
  }
}
