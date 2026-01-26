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

  describe('generateWebSocketJwt', () => {
    it('should generate a JWT token', () => {
      const token = credentials.generateWebSocketJwt();

      expect(token).toBe('mock.jwt.token');
    });

    it('should call jwt.sign with correct parameters', () => {
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
