// dateUtils.ts
export function safeToISOString(
  dateValue: any,
  fallback: string = 'NULL',
): string {
  if (!dateValue) return fallback;
  const parsedDate = new Date(dateValue);
  return isNaN(parsedDate.getTime()) ? fallback : parsedDate.toISOString();
}
