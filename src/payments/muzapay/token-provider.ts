/**
 * MuzaPay OAuth token provider — DRAFT
 *
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/MuzaPay/MuzaPayTokenProvider.php
 *
 * Fetches a bearer token from `POST /{apiVersion}/auth/token` (HTTP Basic auth with
 * eshop credentials) and caches it until shortly before it expires.
 *
 * Caching: the PHP version layered a per-request static var over a Nette
 * cache. `MuzaPayGateway` is built fresh per operation (see
 * `order-payment-service.ts`), so an instance field on the provider itself
 * would never survive between calls — the cron sweep alone would issue 50+
 * auth requests per pass. `getMuzaPayTokenProvider` below keeps a
 * module-level cache of providers, keyed by config, so all gateway instances
 * sharing the same MuzaPay credentials share one token for the life of the
 * process. Swap in a shared cache (Redis) only if multiple *processes* need
 * to share tokens — see the note at the bottom.
 *
 * VERIFICATION: confirm the auth endpoint, request body, and response shape
 * against the MuzaPay sandbox.
 */

import { PaymentGatewayError } from '../gateway';

/** 30s safety margin before `validTo`, mirrors the PHP original. */
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

export interface MuzaPayToken {
  accessToken: string;
  /** Absolute expiry as reported by the gateway. */
  validTo: Date;
}

export interface MuzaPayTokenProviderConfig {
  /** e.g. "https://api.gate.int.pay.muza.cz" */
  baseUrl: string;
  eshopId: string;
  eshopPassword: string;
  /** e.g. "CZ" */
  country: string;
  /** e.g. "SINGLE_PAYMENT" */
  tokenScope: string;
  /** API version path segment, e.g. "v4". */
  apiVersion: string;
}

export class MuzaPayTokenProvider {
  private cached: MuzaPayToken | null = null;
  /** De-dupes concurrent refreshes so parallel requests share one auth call. */
  private inFlight: Promise<MuzaPayToken> | null = null;

  constructor(private readonly config: MuzaPayTokenProviderConfig) {}

  /** Returns a valid token, fetching/refreshing if the cached one is stale. */
  async getToken(): Promise<MuzaPayToken> {
    if (this.cached && this.isFresh(this.cached)) {
      return this.cached;
    }
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.authenticate()
      .then((token) => {
        this.cached = token;
        return token;
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  /** Drop the cached token; the next getToken() re-authenticates. */
  invalidate(): void {
    this.cached = null;
  }

  private isFresh(token: MuzaPayToken): boolean {
    return token.validTo.getTime() > Date.now() + EXPIRY_SAFETY_MARGIN_MS;
  }

  private async authenticate(): Promise<MuzaPayToken> {
    const { baseUrl, eshopId, eshopPassword, country, tokenScope, apiVersion } = this.config;
    if (!baseUrl) {
      throw new PaymentGatewayError('MuzaPay baseUrl is not configured.');
    }
    if (!eshopId || !eshopPassword) {
      throw new PaymentGatewayError('MuzaPay credentials are not configured.');
    }

    const authHeader =
      'Basic ' + Buffer.from(`${eshopId}:${eshopPassword}`, 'utf8').toString('base64');

    let response: Response;
    try {
      response = await fetch(new URL(`/${apiVersion}/auth/token`, baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ country, tokenScope }),
      });
    } catch (cause) {
      throw new PaymentGatewayError('MuzaPay auth request failed.', cause);
    }

    if (response.status !== 200) {
      throw new PaymentGatewayError(
        `Unexpected HTTP ${response.status} from MuzaPay auth.`,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (cause) {
      throw new PaymentGatewayError('Unable to parse MuzaPay auth response.', cause);
    }

    return parseTokenResponse(data);
  }
}

/**
 * Process-lifetime cache of token providers, keyed by the credentials they
 * authenticate with. `MuzaPayGateway` is constructed fresh per operation
 * (following the same factory pattern as `comgateGateway()` in
 * `order-payment-service.ts`), so without this, each gateway instance would
 * get its own provider and its own token cache — defeating the cache
 * entirely and re-authenticating on every `begin`/`checkStatus`/`cancel`
 * call, including the cron sweep's up-to-50-transactions-per-pass loop.
 *
 * Keyed on the same fields the PHP original hashed (sha1) into its cache
 * key: `baseUrl`, `eshopId`, `country`, `tokenScope`, `apiVersion`. `JSON.stringify` of
 * the tuple is used instead of a hash — easier to debug, and collision-safe
 * because each field is individually quoted/escaped in the JSON output, so
 * the combination is unambiguous. The password is deliberately excluded
 * from the key.
 */
const tokenProviders = new Map<string, MuzaPayTokenProvider>();

function tokenProviderCacheKey(
  config: Pick<
    MuzaPayTokenProviderConfig,
    'baseUrl' | 'eshopId' | 'country' | 'tokenScope' | 'apiVersion'
  >,
): string {
  return JSON.stringify([
    config.baseUrl,
    config.eshopId,
    config.country,
    config.tokenScope,
    config.apiVersion,
  ]);
}

/**
 * Returns the shared `MuzaPayTokenProvider` for this config, creating it on
 * first use. Callers with identical `baseUrl`/`eshopId`/`country`/
 * `tokenScope` share one provider (and therefore one cached token) for the
 * lifetime of the process, regardless of how many `MuzaPayGateway`
 * instances are constructed.
 */
export function getMuzaPayTokenProvider(config: MuzaPayTokenProviderConfig): MuzaPayTokenProvider {
  const key = tokenProviderCacheKey(config);
  const existing = tokenProviders.get(key);
  if (existing) {
    return existing;
  }
  const provider = new MuzaPayTokenProvider(config);
  tokenProviders.set(key, provider);
  return provider;
}

function parseTokenResponse(data: unknown): MuzaPayToken {
  if (typeof data !== 'object' || data === null) {
    throw new PaymentGatewayError('MuzaPay auth response is not an object.');
  }
  const record = data as Record<string, unknown>;
  const accessToken = record.accessToken;
  const validToRaw = record.validTo;

  if (typeof accessToken !== 'string' || accessToken === '') {
    throw new PaymentGatewayError('MuzaPay auth response is missing accessToken.');
  }
  if (typeof validToRaw !== 'string') {
    throw new PaymentGatewayError('MuzaPay auth response is missing validTo.');
  }

  const validTo = new Date(validToRaw);
  if (Number.isNaN(validTo.getTime())) {
    throw new PaymentGatewayError('MuzaPay token has an invalid validTo.');
  }

  return { accessToken, validTo };
}

/**
 * DRAFT — open question: cross-process token sharing.
 *
 * `getMuzaPayTokenProvider` above shares one token per process — solved: all
 * `MuzaPayGateway` instances built from the same credentials within a single
 * Node process (including every call in one cron sweep pass) now share one
 * cached token instead of each re-authenticating.
 *
 * What remains open is sharing *across* processes: if the backend runs as
 * multiple instances (or serverless functions that cold-start often), each
 * process still keeps its own provider map and re-auths independently. That
 * is usually fine — tokens are cheap and short-lived — but if MuzaPay
 * rate-limits auth, introduce a shared `TokenCache` port here:
 *
 *   interface TokenCache {
 *     get(key: string): Promise<MuzaPayToken | null>;
 *     set(key: string, token: MuzaPayToken, ttlMs: number): Promise<void>;
 *   }
 *
 * with the PHP cache key: sha1(`${baseUrl}|${eshopId}|${country}|${tokenScope}`).
 */
