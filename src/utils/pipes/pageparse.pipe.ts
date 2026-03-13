import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePagePipe implements PipeTransform<any> {
  transform(value: any): any {
    try {
      const parsedValue = parseInt(value, 10);

      if (isNaN(parsedValue) || parsedValue < 0) {
        // default page
        return 1;
      } else {
        return parsedValue;
      }
    } catch (error) {
      // default page
      return 1;
    }
  }
}
