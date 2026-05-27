/**
 * MuzaPay request signer — DRAFT
 *
 * TypeScript port of snowbusters
 * api/app/PaymentsModule/service/MuzaPay/MuzaPaySigner.php
 *
 * Produces an RSASSA-PKCS1-v1_5 signature over SHA-256 of the plaintext
 * built by MuzaPaySignatureBuilder, then base64- and URL-encodes it.
 *
 * BYTE-EXACTNESS — this MUST match the PHP output exactly or MuzaPay rejects
 * the request. Pinned details:
 * - Algorithm: RSA-SHA256. Node's RSA keys default to PKCS#1 v1.5 padding,
 *   which is what PHP's OPENSSL_ALGO_SHA256 (openssl_sign) uses. Do NOT
 *   switch to PSS.
 * - Plaintext encoding: signed as UTF-8 bytes. PHP signs raw string bytes
 *   and the snowbusters sources are UTF-8, so `.update(data, 'utf8')` is the
 *   match. This matters for course names with diacritics.
 * - URL encoding: PHP `rawurlencode` (RFC 3986). For base64 output the only
 *   relevant chars are `+ / =`, which both PHP and the helper below encode
 *   identically — but the helper is exact regardless.
 *
 * VERIFICATION: confirm against the MuzaPay sandbox before relying on this.
 */

import { createPrivateKey, createSign, type KeyObject } from 'node:crypto';

import { PaymentGatewayError } from '../gateway';

export class MuzaPaySigner {
  private readonly privateKey: KeyObject;

  /**
   * @param privateKeyPem PEM-encoded RSA private key (the key VALUE, not a
   *   file path — load it from an env var / secret store).
   * @param passphrase optional passphrase protecting the key.
   */
  constructor(privateKeyPem: string, passphrase?: string) {
    if (!privateKeyPem) {
      throw new PaymentGatewayError('MuzaPay private key is not configured.');
    }
    try {
      this.privateKey = createPrivateKey(
        passphrase ? { key: privateKeyPem, passphrase } : { key: privateKeyPem },
      );
    } catch (cause) {
      throw new PaymentGatewayError(
        'Unable to load MuzaPay private key (check passphrase/format).',
        cause,
      );
    }
  }

  /** RSA-SHA256 signature of `data`, base64-encoded. PHP: signToBase64(). */
  signToBase64(data: string): string {
    const sign = createSign('RSA-SHA256');
    sign.update(data, 'utf8');
    sign.end();
    try {
      return sign.sign(this.privateKey, 'base64');
    } catch (cause) {
      throw new PaymentGatewayError('Unable to sign MuzaPay request.', cause);
    }
  }

  /** Base64 signature, percent-encoded for use as a URL query value. PHP: signToUrlEncoded(). */
  signToUrlEncoded(data: string): string {
    return rawUrlEncode(this.signToBase64(data));
  }
}

/**
 * Equivalent of PHP `rawurlencode` (RFC 3986): percent-encodes everything
 * except the unreserved set `A-Z a-z 0-9 - _ . ~`.
 *
 * `encodeURIComponent` leaves `! * ' ( )` unencoded, so we encode those too.
 */
export function rawUrlEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase(),
  );
}
