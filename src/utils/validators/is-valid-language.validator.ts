import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

export enum Language {
  en = 'en',
  hi = 'hi',
  gj = 'gj',
  bn = 'bn',
  pu = 'pu',
  mr = 'mr',
  ta = 'ta',
  te = 'te',
  ml = 'ml',
  od = 'od',
  ka = 'ka',
  as = 'as',
}

export const LanguageMap: Record<string, Language> = {
  English: Language.en,
  Hindi: Language.hi,
  Gujarati: Language.gj,
  Bengali: Language.bn,
  Punjabi: Language.pu,
  Marathi: Language.mr,
  Tamil: Language.ta,
  Telugu: Language.te,
  Malayalam: Language.ml,
  Odia: Language.od,
  Kannada: Language.ka,
  Assamese: Language.as,
};

@Injectable()
@ValidatorConstraint({ name: 'IsLanguage', async: false })
export class IsLanguage implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments) {
    if (typeof value !== 'string') return false;

    const normalizedValue = value.toLowerCase();
    return Object.keys(Language).includes(normalizedValue);
  }

  defaultMessage(validationArguments: ValidationArguments) {
    return `Invalid language. Allowed options are: ${Object.keys(Language).join(', ')} or ${Object.keys(LanguageMap).join(', ')}`;
  }
}
