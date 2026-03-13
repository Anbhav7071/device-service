export function isJSONParsable(jsonString: string): {
  parsable: boolean;
  parsedObject?: any;
} {
  try {
    const parsedObject = JSON.parse(jsonString);
    return { parsable: true, parsedObject };
  } catch (error) {
    return { parsable: false };
  }
}
