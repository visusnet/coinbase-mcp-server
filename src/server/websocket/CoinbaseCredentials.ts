import { CoinbaseAdvTradeCredentials } from '@coinbase-sample/advanced-trade-sdk-ts/dist/index.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_ISSUER = 'cdp';
const ALGORITHM = 'ES256';
const TOKEN_LIFETIME_SECONDS = 120;

/**
 * Extended credentials class that adds WebSocket JWT generation.
 * Inherits REST API authentication from CoinbaseAdvTradeCredentials.
 */
export class CoinbaseCredentials extends CoinbaseAdvTradeCredentials {
  public constructor(
    private readonly apiKey: string,
    private readonly privateKey: string,
  ) {
    super(apiKey, privateKey);
  }

  /**
   * Generates a JWT token for Coinbase WebSocket authentication.
   * Unlike REST API JWTs, WebSocket JWTs do not include a URI field.
   */
  public generateWebSocketJwt(): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: JWT_ISSUER,
      nbf: now,
      exp: now + TOKEN_LIFETIME_SECONDS,
      sub: this.apiKey,
    };

    const header = {
      alg: ALGORITHM,
      kid: this.apiKey,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: ALGORITHM,
      header,
    });
  }
}
