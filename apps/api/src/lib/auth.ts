import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env.js';

/**
 * Verifies access tokens issued by Supabase Auth.
 *
 * This project signs with ES256 and publishes its public keys at the JWKS
 * endpoint, so verification needs no shared secret — which also means the API
 * holds nothing that could forge a token.
 *
 * Verification is local: the keyset is fetched once and cached, with rotation
 * handled by refetching on an unknown key id. No network round trip per
 * request, and no dependence on the auth service being reachable.
 */

const JWKS_URL = env.SUPABASE_URL
  ? new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL)
  : null;

const jwks = JWKS_URL
  ? createRemoteJWKSet(JWKS_URL, {
      cacheMaxAge: 10 * 60 * 1000,
      cooldownDuration: 30 * 1000,
    })
  : null;

export interface VerifiedToken {
  /** The identity provider's user id — `sub`. Maps to users.auth_user_id. */
  userId: string;
  email: string | undefined;
}

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * Returns the verified claims, or throws TokenError. The caller maps that to a
 * 401 — this function never decides a status code.
 */
export async function verifyAccessToken(token: string): Promise<VerifiedToken> {
  if (!jwks) {
    throw new TokenError('Authentication is not configured on this server.');
  }

  let payload: JWTPayload;

  try {
    // The algorithm is pinned. Accepting whatever the token declares is the
    // classic JWT hole — a forged `alg: none` or an HMAC signed with the
    // public key would otherwise verify.
    ({ payload } = await jwtVerify(token, jwks, {
      algorithms: ['ES256'],
      issuer: new URL('/auth/v1', env.SUPABASE_URL).toString(),
    }));
  } catch (cause) {
    // Expiry and signature failures are deliberately indistinguishable to the
    // caller. jose has already checked exp, nbf and the signature.
    throw new TokenError(cause instanceof Error ? cause.message : 'Token verification failed.');
  }

  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new TokenError('Token carries no subject.');
  }

  return {
    userId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

/** Pulls the bearer token out of an Authorization header. */
export function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;

  return token.trim() || null;
}
