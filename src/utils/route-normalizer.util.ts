import { URL } from 'url';

export interface RouteNormalizerConfig {
  enableSearchParams?: boolean;
}
// RouteNormalizer - A comprehensive utility for normalizing URL routes to prevent cardinality explosion
export class RouteNormalizer {
  private readonly config: Required<RouteNormalizerConfig>;

  constructor(config?: RouteNormalizerConfig) {
    this.config = {
      enableSearchParams: true,
      ...(config || {}),
    } as Required<RouteNormalizerConfig>;
  }
  normalizeRoute(url: string): string {
    try {
      const parsedUrl = new URL(url, 'http://localhost'); // Base URL is dummy, only path/search matter
      const normalizedPath = this.normalizePath(parsedUrl.pathname);
      const normalizedQuery = this.normalizeQueryString(parsedUrl.search);
      return `${normalizedPath}${normalizedQuery}`;
    } catch (error) {
      // Fallback for malformed URLs
      return this.normalizePath(url);
    }
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }

    // If no parameter tokens present, return path as-is
    if (!path.includes(':')) {
      return this.cleanupPath(path);
    }

    const segments = path.split('/');
    const normalizedSegments: string[] = [];
    for (const segment of segments) {
      if (!segment) continue;
      if (segment.startsWith(':')) {
        // preserve original parameter token (e.g., :orgId, :deviceId)
        normalizedSegments.push(segment);
      } else {
        normalizedSegments.push(segment);
      }
    }
    return this.cleanupPath('/' + normalizedSegments.join('/'));
  }
  private normalizeQueryString(search: string): string {
    if (!this.config.enableSearchParams || !search || search === '?') {
      return '';
    }

    try {
      const params = new URLSearchParams(search);
      const normalizedParams: string[] = [];
      for (const [key, value] of params.entries()) {
        if (this.isJsonQueryValue(value)) {
          const normalizedJson = this.normalizeJsonValue(value);
          normalizedParams.push(`${key}=${normalizedJson}`);
          continue;
        }
        // For all non-JSON query params, replace value generically
        normalizedParams.push(`${key}=:value`);
      }

      const result = normalizedParams.join('&');
      return result ? `?${result}` : '';
    } catch (error) {
      return '';
    }
  }

  private cleanupPath(path: string): string {
    return path.replace(/\/\/+/g, '/').replace(/\/$/, '');
  }

  private isDynamicQueryValue(value: string): boolean {
    // UUID
    if (
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
        value,
      )
    )
      return true;
    // Numeric ID
    if (/^\d+$/.test(value)) return true;
    // Email
    if (/[^/]+@[^/]+\.[^/]+/.test(value)) return true;
    // Base64-like
    if (/[A-Za-z0-9+/]{10,}={0,2}/.test(value)) return true;
    // Common alphanumeric IDs
    if (/[a-zA-Z0-9_-]{10,}/.test(value)) return true;
    return false;
  }

  private isJsonQueryValue(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }
  private normalizeJsonValue(value: string): string {
    try {
      const parsed = JSON.parse(value);
      const normalized = this.normalizeJsonObject(parsed);
      return JSON.stringify(normalized);
    } catch {
      // If JSON parsing fails, return as-is
      return value;
    }
  }
  private normalizeJsonObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeJsonObject(item));
    } else if (obj && typeof obj === 'object') {
      const normalized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && this.isDynamicQueryValue(value)) {
          // Replace dynamic string values with placeholders
          normalized[key] = ':value';
        } else if (typeof value === 'string' && this.isNumericString(value)) {
          // Replace numeric strings with placeholders
          normalized[key] = ':value';
        } else if (typeof value === 'string' && this.isEmailString(value)) {
          // Replace email strings with placeholders
          normalized[key] = ':value';
        } else if (typeof value === 'string' && this.isUuidString(value)) {
          // Replace UUID strings with placeholders
          normalized[key] = ':value';
        } else if (typeof value === 'string' && this.isHashString(value)) {
          // Replace hash strings with placeholders
          normalized[key] = ':value';
        } else if (
          typeof value === 'string' &&
          this.isAlphanumericIdString(value)
        ) {
          // Replace alphanumeric ID strings with placeholders
          normalized[key] = ':value';
        } else {
          // Recursively normalize nested objects
          normalized[key] = this.normalizeJsonObject(value);
        }
      }
      return normalized;
    } else if (typeof obj === 'string' && this.isDynamicQueryValue(obj)) {
      return ':value';
    } else {
      return obj;
    }
  }
  private isNumericString(value: string): boolean {
    return /^\d+$/.test(value);
  }
  private isEmailString(value: string): boolean {
    return /[^/]+@[^/]+\.[^/]+/.test(value);
  }
  private isUuidString(value: string): boolean {
    return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
      value,
    );
  }
  private isHashString(value: string): boolean {
    return /[0-9a-f]{32,}/i.test(value);
  }
  private isAlphanumericIdString(value: string): boolean {
    return /[a-zA-Z0-9_-]{10,}/.test(value);
  }
}
export const defaultRouteNormalizer = new RouteNormalizer({
  enableSearchParams: true,
});
