import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@Injectable()
@ValidatorConstraint({ name: 'IsValidImageUrl', async: false })
export class IsValidImageUrl implements ValidatorConstraintInterface {
  validate(imageUrl: any) {
    // Regular expression to validate image URLs (supports .jpg, .jpeg, .png)
    const imageUrlRegex = /\.(jpg|jpeg|png)$/i;
    return imageUrlRegex.test(imageUrl);
  }

  defaultMessage() {
    return 'Invalid image URL format. Must be a URL ending with .jpg, .jpeg, or .png';
  }
}
