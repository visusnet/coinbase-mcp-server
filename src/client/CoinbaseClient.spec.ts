import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CoinbaseClient, HttpMethod } from './CoinbaseClient';
import { CoinbaseCredentials } from './CoinbaseCredentials';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock CoinbaseCredentials
jest.mock('./CoinbaseCredentials', () => ({
  CoinbaseCredentials: jest.fn().mockImplementation(() => ({
    generateAuthHeaders: jest.fn().mockReturnValue({
      Authorization: 'Bearer mock-jwt',
    }),
  })),
}));

describe('CoinbaseClient', () => {
  let client: CoinbaseClient;
  let mockCredentials: CoinbaseCredentials;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCredentials = new CoinbaseCredentials('api-key', 'private-key');
    client = new CoinbaseClient(mockCredentials);
  });

  describe('request', () => {
    it('should make a GET request and return parsed data', async () => {
      const mockResponseData = { account: { uuid: '123', name: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponseData),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.request({ url: 'accounts/123' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/accounts/123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-jwt',
          }),
        }),
      );
      expect(result.data).toEqual(mockResponseData);
      expect(result.status).toBe(200);
    });

    it('should make a POST request with body', async () => {
      const mockResponseData = { success: true, orderId: 'order-123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponseData),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'orders',
        method: HttpMethod.POST,
        bodyParams: { productId: 'BTC-USD', side: 'BUY' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ productId: 'BTC-USD', side: 'BUY' }),
        }),
      );
    });

    it('should append query params to URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accounts: [] }),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'accounts',
        queryParams: { limit: 10, cursor: 'abc' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/accounts?limit=10&cursor=abc',
        expect.any(Object),
      );
    });

    it('should handle array query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ products: [] }),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'products',
        queryParams: { productIds: ['BTC-USD', 'ETH-USD'] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/products?productIds=BTC-USD&productIds=ETH-USD',
        expect.any(Object),
      );
    });

    it('should filter out null/undefined/empty query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'accounts',
        queryParams: {
          valid: 'value',
          empty: '',
          nullVal: null,
          undefinedVal: undefined,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/accounts?valid=value',
        expect.any(Object),
      );
    });

    it('should return no query string when all params are filtered out', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'accounts',
        queryParams: {
          empty: '',
          nullVal: null,
          undefinedVal: undefined,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coinbase.com/api/v3/brokerage/accounts',
        expect.any(Object),
      );
    });

    it('should convert snake_case response keys to camelCase', async () => {
      const snakeCaseResponse = {
        account_uuid: '123',
        available_balance: { current_value: '100.50' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(snakeCaseResponse),
        headers: new Headers(),
      } as Response);

      const result = await client.request({ url: 'accounts' });

      expect(result.data).toEqual({
        accountUuid: '123',
        availableBalance: { currentValue: '100.50' },
      });
    });

    it('should convert snake_case response keys in arrays to camelCase', async () => {
      const snakeCaseResponse = {
        accounts: [
          { account_uuid: '123', display_name: 'Account 1' },
          { account_uuid: '456', display_name: 'Account 2' },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(snakeCaseResponse),
        headers: new Headers(),
      } as Response);

      const result = await client.request({ url: 'accounts' });

      expect(result.data).toEqual({
        accounts: [
          { accountUuid: '123', displayName: 'Account 1' },
          { accountUuid: '456', displayName: 'Account 2' },
        ],
      });
    });

    it('should throw CoinbaseApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid API key' }),
        headers: new Headers(),
      } as Response);

      await expect(client.request({ url: 'accounts' })).rejects.toMatchObject({
        status: 401,
        message: expect.stringContaining('Invalid API key'),
      });
    });

    it('should use statusText when no message in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await expect(client.request({ url: 'accounts' })).rejects.toThrow(
        'Internal Server Error',
      );
    });

    it('should handle PUT requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'portfolios/123',
        method: HttpMethod.PUT,
        bodyParams: { name: 'Updated Portfolio' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('should handle DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await client.request({
        url: 'portfolios/123',
        method: HttpMethod.DELETE,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should pass abort signal to fetch for timeout support', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await client.request({ url: 'accounts' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should abort request after timeout', () => {
      jest.useFakeTimers();

      let capturedSignal: AbortSignal | undefined;
      mockFetch.mockImplementationOnce((_, init) => {
        capturedSignal = init?.signal as AbortSignal;
        return new Promise(() => {}); // Never resolves
      });

      const requestPromise = client.request({ url: 'accounts' });

      // Advance past 10 second timeout
      jest.advanceTimersByTime(10_001);

      expect(capturedSignal?.aborted).toBe(true);

      void requestPromise.catch(() => {}); // Prevent unhandled rejection
      jest.useRealTimers();
    });

    it('should throw on circular references in response', async () => {
      // Create a circular reference
      const circularObj: Record<string, unknown> = { name: 'test' };
      circularObj.self = circularObj;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(circularObj),
        headers: new Headers(),
      } as Response);

      await expect(client.request({ url: 'accounts' })).rejects.toThrow(
        'Circular reference detected',
      );
    });
  });
});
