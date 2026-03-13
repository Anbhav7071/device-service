import { randomBytes } from 'crypto';

export function generateAlphanumericString(length: number): string {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }

  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  const randomValues = randomBytes(length);
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % characters.length;
    result += characters[randomIndex];
  }

  return result;
}
