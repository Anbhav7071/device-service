import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform<any> {
  transform(value: any): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new BadRequestException('Invalid JSON string');
    }
  }
}
