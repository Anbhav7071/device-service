import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
export function canBeCalledWithNew(func: any) {
  return typeof func === 'function' && typeof func.prototype !== 'undefined';
}

export function isUndefinedOrEmptyArray(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export const hasOwnProperty =
  (Object as any).hasOwn ||
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

export function copyObject<T, U extends keyof T>(
  target: T,
  source: Pick<T, U>,
  to_skip: readonly U[] = [],
): void {
  for (const key in source) {
    if (
      !to_skip.includes(key) &&
      Object.prototype.hasOwnProperty.call(source, key) &&
      Object.prototype.hasOwnProperty.call(target, key)
    ) {
      if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }
}

export function mergeArrays<T = any>(arr1: T[], arr2: T[]): T[] {
  // Check if arr1 is null or undefined, and set it to an empty array if so
  arr1 = arr1 || [];
  // Check if arr2 is null or undefined, and set it to an empty array if so
  arr2 = arr2 || [];

  // Merge the arrays using the spread operator
  return [...arr1, ...arr2];
}

export function pop<T extends object, K extends keyof T>(
  dto: T | undefined,
  key: K,
): [T[K] | undefined, Omit<T, K> | undefined] {
  if (dto === undefined || dto === null) {
    return [undefined, undefined];
  }

  if (!(key in dto)) {
    return [undefined, dto]; // Return the original object if the key does not exist in the DTO
  }

  const { [key]: omittedValue, ...rest } = dto;

  return [omittedValue, rest];
}

export function extractAndOmit<T extends object, K extends keyof T>(
  dto: T,
  key: K,
): [T[K], Omit<T, K>] {
  if (dto === undefined || dto === null) {
    throw new Error('dto cannot be null or undefined');
  }

  if (!(key in dto)) {
    throw new Error(`key ${String(key)} does not exist in the DTO`);
  }

  const { [key]: omittedValue, ...rest } = dto;

  return [omittedValue, rest];
}

export function assertNotNull<T>(
  data: T | null | undefined,
): asserts data is T {
  if (data === null || data === undefined) {
    throw new Error(`null or undefined  was found unexpectedly`);
  }
}

/*
  Vernemq requires the password to be hashed using bcrypt with '$2a$' as prefix,
  but by default bcrypt generates '$2b$' as prefix. This function replaces the prefix so that vernemq can use it.
*/
function formatPassword(password: string): string {
  return password.replace('$2b$', '$2a$');
}

export async function hashPassword(password: string): Promise<string> {
  const newPassword = await bcrypt.hash(password, 12);
  return formatPassword(newPassword);
}

export function hashPasswordSync(password: string): string {
  const newPassword = bcrypt.hashSync(password, 12);
  return formatPassword(newPassword);
}

export async function comparePassword(
  inputPassword: string,
  actualPassword: string,
): Promise<boolean> {
  actualPassword = actualPassword.replace('$2a$', '$2b$');
  return bcrypt.compare(inputPassword, actualPassword);
}

export async function compareHash(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateUuid(): string {
  return uuidv4();
}

export function createHttpError(
  key: string,
  message: string,
  status: HttpStatus,
): HttpException {
  return new HttpException(
    {
      status: status,
      errors: {
        [key]: message,
      },
    },
    status,
  );
}

export async function fetchJsonFromStream<T>(stream: Readable): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('data', (chunk: string) => {
      data += chunk;
    });

    stream.on('end', () => {
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', (error: any) => {
      reject(error);
    });
  });
}

export function zipArray<T, U>(array1: T[], array2: U[]): [T, U][] {
  return array1.map((element, index) => [element, array2[index]]);
}
