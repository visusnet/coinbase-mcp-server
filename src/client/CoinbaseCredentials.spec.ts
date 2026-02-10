import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CoinbaseCredentials } from './CoinbaseCredentials';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocknonce12345678'),
  }),
}));

describe('CoinbaseCredentials', () => {
  const testApiKey = 'test-api-key';
  const testPrivateKey = 'test-private-key';
  let credentials: CoinbaseCredentials;

  beforeEach(() => {
    jest.clearAllMocks();
    credentials = new CoinbaseCredentials(testApiKey, testPrivateKey);
  });

  describe('constructor', () => {
    it('should create an instance with the provided credentials', () => {
      expect(credentials).toBeInstanceOf(CoinbaseCredentials);
    });
  });

  describe('generateAuthHeaders', () => {
    it('should generate auth headers with Bearer token', () => {
      const headers = credentials.generateAuthHeaders(
        'GET',
        'https://api.coinbase.com/api/v3/brokerage/accounts',
      );

      expect(headers).toEqual({
        Authorization: 'Bearer mock.jwt.token',
      });
    });

    it('should call jwt.sign with correct parameters including URI', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      credentials.generateAuthHeaders(
        'GET',
        'https://api.coinbase.com/api/v3/brokerage/accounts?limit=10',
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          iss: 'cdp',
          nbf: 1700000000,
          exp: 1700000120,
          sub: testApiKey,
          uri: 'GET api.coinbase.com/api/v3/brokerage/accounts',
        },
        testPrivateKey,
        {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: testApiKey,
            nonce: 'mocknonce12345678',
          },
        },
      );
    });

    it('should strip query parameters from URI in JWT', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      credentials.generateAuthHeaders(
        'POST',
        'https://api.coinbase.com/api/v3/brokerage/orders?foo=bar&baz=qux',
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'POST api.coinbase.com/api/v3/brokerage/orders',
        }),
        testPrivateKey,
        expect.any(Object),
      );
    });

    it('should handle http:// URLs', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      credentials.generateAuthHeaders(
        'GET',
        'http://api.coinbase.com/api/v3/brokerage/accounts',
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: 'GET api.coinbase.com/api/v3/brokerage/accounts',
        }),
        testPrivateKey,
        expect.any(Object),
      );
    });
  });

  describe('generateWebSocketJwt', () => {
    it('should generate a JWT token', () => {
      const token = credentials.generateWebSocketJwt();

      expect(token).toBe('mock.jwt.token');
    });

    it('should call jwt.sign with correct parameters without URI', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

      credentials.generateWebSocketJwt();

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          iss: 'cdp',
          nbf: 1700000000,
          exp: 1700000120,
          sub: testApiKey,
        },
        testPrivateKey,
        {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: testApiKey,
            nonce: 'mocknonce12345678',
          },
        },
      );
    });
  });
});
