export interface LoggerConfig {
  level: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  enableConsole: boolean; // for enabling the console logging
  enableFile: boolean; // for enabling the file logging
  enableOpenTelemetry: boolean; // for enabling the open telemetry in the logs
  sanitizeFields: string[]; // for sanitizing the fields in the logs
  maxLogLength: number; // for truncating the log length
  timestampFormat: 'iso' | 'unix' | 'human'; // for formatting the timestamp in the logs
  includeStackTrace: boolean; // for including the stack trace in the logs
  sensitivePatterns: RegExp[]; // for hiding sensitive data in logs
}

export const defaultLoggerConfig: LoggerConfig = {
  // for setting the default values of the logs
  level: 'log', // for setting the level of the logs
  enableConsole: true, // for enabling the console logging
  enableFile: false, // for enabling the file logging
  enableOpenTelemetry: true, // for enabling the open telemetry in the logs
  sanitizeFields: [
    'password', // for sanitizing the password field
    'token',
    'secret', // for sanitizing the secret field
    'key', // for sanitizing the key field
    'authorization', // for sanitizing the authorization field
    'cookie', // for sanitizing the cookie field
    'session', // for sanitizing the session field
    'ssn', // for sanitizing the ssn field
    'creditCard', // for sanitizing the credit card field
    'privateKey', // for sanitizing the private key field
    'accessToken', // for sanitizing the access token field
    'refreshToken', // for sanitizing the refresh token field
  ],
  maxLogLength: 1000, // for truncating the log length
  timestampFormat: 'iso', // for formatting the timestamp in the logs
  includeStackTrace: true, // for including the stack trace in the logs
  sensitivePatterns: [
    /password/i, // for sanitizing the password field
    /token/i, // for sanitizing the token field
    /secret/i, // for sanitizing the secret field
    /key/i, // for sanitizing the key field
    /authorization/i, // for sanitizing the authorization field
    /cookie/i, // for sanitizing the cookie field
    /session/i, // for sanitizing the session field
    /ssn/i, // for sanitizing the ssn field
    /credit.?card/i, // for sanitizing the credit card field
    /api.?key/i, // for sanitizing the api key field
    /private.?key/i, // for sanitizing the private key field
    /access.?token/i, // for sanitizing the access token field
    /refresh.?token/i, // for sanitizing the refresh token field
  ],
};
