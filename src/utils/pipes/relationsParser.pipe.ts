// relations.pipe.ts

import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class RelationsPipe implements PipeTransform<string, string[]> {
  transform(value: string): string[] {
    if (!value) {
      return [];
    }

    // Split the string by commas and trim each value
    const relations = value.split(',').map((relation) => relation.trim());

    return relations;
  }
}
