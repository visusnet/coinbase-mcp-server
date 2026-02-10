import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_ISSUER = 'cdp';
const ALGORITHM = 'ES256';
const TOKEN_LIFETIME_SECONDS = 120;

/**
 * Handles JWT generation for both REST API and WebSocket authentication.
 *
 * REST JWTs include the full request URI for signature verification.
 * WebSocket JWTs omit the URI field as connections are stateful.
 */
export class CoinbaseCredentials {
  constructor(
    private readonly apiKey: string,
    private readonly privateKey: string,
  ) {}

  /**
   * Generates auth headers for REST API requests.
   * The JWT includes the HTTP method and URI for request-specific signing.
   */
  public generateAuthHeaders(
    method: string,
    fullUrl: string,
  ): Record<string, string> {
    const now = Math.floor(Date.now() / 1000);

    // Format: "METHOD host/path" (no protocol, no query params)
    const jwtUri = `${method} ${fullUrl.replace('https://', '').replace('http://', '').split('?')[0]}`;

    const payload = {
      iss: JWT_ISSUER,
      nbf: now,
      exp: now + TOKEN_LIFETIME_SECONDS,
      sub: this.apiKey,
      uri: jwtUri,
    };

    const header = {
      alg: ALGORITHM,
      kid: this.apiKey,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const signature = jwt.sign(payload, this.privateKey, {
      algorithm: ALGORITHM,
      header,
    });

    return {
      Authorization: `Bearer ${signature}`,
    };
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
