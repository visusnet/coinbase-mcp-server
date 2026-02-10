import { CoinbaseCredentials } from './CoinbaseCredentials';

const API_BASE_URL = 'https://api.coinbase.com/api/v3/brokerage/';
const USER_AGENT = 'coinbase-mcp-server/1.0.0';
const TIMEOUT_MS = 10_000;

/**
 * HTTP method enum for REST API requests.
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

/**
 * Request options for the Coinbase API client.
 */
export interface CoinbaseRequestOptions {
  /** API endpoint path (e.g., 'accounts', 'orders/historical') */
  url: string;
  /** HTTP method (defaults to GET) */
  method?: HttpMethod;
  /** Query parameters */
  queryParams?: Record<string, unknown>;
  /** Request body for POST/PUT requests */
  bodyParams?: Record<string, unknown>;
}

/**
 * Response wrapper matching the SDK's response format.
 */
export interface CoinbaseResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * Minimal Coinbase API client using native fetch.
 *
 * Features:
 * - ES256 JWT authentication via CoinbaseCredentials
 * - Automatic snake_case → camelCase response transformation
 * - Query string building with array support
 */
export class CoinbaseClient {
  constructor(private readonly credentials: CoinbaseCredentials) {}

  /**
   * Sends a request to the Coinbase API.
   */
  public async request<T = unknown>(
    options: CoinbaseRequestOptions,
  ): Promise<CoinbaseResponse<T>> {
    const method = options.method ?? HttpMethod.GET;
    const queryString = buildQueryString(options.queryParams);
    const fullUrl = `${API_BASE_URL}${options.url}${queryString}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      ...this.credentials.generateAuthHeaders(method, fullUrl),
    };

    const body =
      options.bodyParams !== undefined
        ? JSON.stringify(options.bodyParams)
        : undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const responseHeaders = extractHeaders(response.headers);
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof responseData === 'object' &&
          responseData !== null &&
          'message' in responseData
            ? String(responseData.message)
            : response.statusText;
        throw new CoinbaseApiError(response.status, errorMessage, responseData);
      }

      return {
        data: toCamelCase(responseData) as T,
        status: response.status,
        headers: responseHeaders,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Error thrown when the Coinbase API returns an error response.
 */
class CoinbaseApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly response?: unknown,
  ) {
    super(`Coinbase API error (${status}): ${message}`);
    this.name = 'CoinbaseApiError';
  }
}

/**
 * Builds a query string from parameters, supporting arrays.
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!isValidValue(value)) {
      continue;
    }

    if (Array.isArray(value)) {
      // Add each array element as a separate parameter with the same key
      for (const item of value) {
        if (isValidValue(item)) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Checks if a value should be included in the query string.
 */
function isValidValue(value: unknown): boolean {
  return (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    value !== 'null' &&
    value !== 'undefined'
  );
}

/**
 * Extracts headers from a Headers object into a plain object.
 */
function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Recursively converts snake_case keys to camelCase.
 */
function toCamelCase(obj: unknown, seen = new WeakSet<object>()): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent circular references
  if (seen.has(obj)) {
    throw new Error('Circular reference detected');
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, letter: string) =>
      letter.toUpperCase(),
    );
    result[camelKey] = toCamelCase(value, seen);
  }
  return result;
}
