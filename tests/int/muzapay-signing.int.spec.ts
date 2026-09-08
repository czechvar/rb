// @vitest-environment node
//
// The signer uses Node's crypto; jsdom's partial crypto shim is not enough.
import { describe, expect, it } from 'vitest'
import { createVerify, generateKeyPairSync } from 'node:crypto'
import { MuzaPaySignatureBuilder } from '@/payments/muzapay/signature-builder'
import { MuzaPaySigner, rawUrlEncode } from '@/payments/muzapay/signer'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

describe('MuzaPaySignatureBuilder', () => {
  const builder = new MuzaPaySignatureBuilder('|')

  it('joins values in the order given', () => {
    expect(builder.build(['a', 'b', 'c'])).toBe('a|b|c')
  })

  it('trims each value', () => {
    expect(builder.build([' a ', '\tb\n'])).toBe('a|b')
  })

  it('skips null, undefined and empty-after-trim values entirely', () => {
    // Critical: skipped values must not leave an empty delimiter segment.
    expect(builder.build(['a', null, 'b', undefined, '   ', 'c'])).toBe('a|b|c')
  })

  it('returns an empty string when everything is skipped', () => {
    expect(builder.build([null, undefined, '  '])).toBe('')
  })

  it('honours a non-default delimiter', () => {
    expect(new MuzaPaySignatureBuilder(';').build(['a', 'b'])).toBe('a;b')
  })
})

describe('MuzaPaySigner', () => {
  const signer = new MuzaPaySigner(privateKey)

  it('produces a base64 RSA-SHA256 signature the public key verifies', () => {
    const data = 'uuid-1|9900|LEISURE|RB-2026-000001'
    const signature = signer.signToBase64(data)

    const verifier = createVerify('RSA-SHA256')
    verifier.update(data, 'utf8')
    verifier.end()
    expect(verifier.verify(publicKey, signature, 'base64')).toBe(true)
  })

  it('signs UTF-8 bytes, so diacritics verify', () => {
    const data = 'Zážitkový víkend v Českém ráji'
    const signature = signer.signToBase64(data)

    const verifier = createVerify('RSA-SHA256')
    verifier.update(data, 'utf8')
    verifier.end()
    expect(verifier.verify(publicKey, signature, 'base64')).toBe(true)
  })

  it('is deterministic — PKCS#1 v1.5, not PSS', () => {
    // A PSS signature is randomised and would differ between calls; MuzaPay
    // expects PKCS#1 v1.5, so identical input must give identical output.
    expect(signer.signToBase64('same')).toBe(signer.signToBase64('same'))
  })

  it('url-encodes the base64 signature', () => {
    const encoded = signer.signToUrlEncoded('anything')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })

  it('rejects an unusable key at construction time', () => {
    expect(() => new MuzaPaySigner('not a pem')).toThrow()
    expect(() => new MuzaPaySigner('')).toThrow()
  })

  // Benefit+'s "Test keys generation" page tells integrators to run
  // `openssl genrsa`, which emits a traditional PKCS#1 key
  // (-----BEGIN RSA PRIVATE KEY-----). The tests above all use PKCS#8, so the
  // one format their documentation actually produces was the one uncovered
  // until the 2026-09-08 sandbox run happened to exercise it.
  it('accepts a PKCS#1 key, which is what `openssl genrsa` produces', () => {
    const pkcs1 = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    })
    expect(pkcs1.privateKey).toContain('BEGIN RSA PRIVATE KEY')

    const pkcs1Signer = new MuzaPaySigner(pkcs1.privateKey)
    const data = 'uuid-1|249000|LEISURE|RB-2026-000123'
    const signature = pkcs1Signer.signToBase64(data)

    const verifier = createVerify('RSA-SHA256')
    verifier.update(data, 'utf8')
    verifier.end()
    expect(verifier.verify(pkcs1.publicKey, signature, 'base64')).toBe(true)
  })
})

describe('rawUrlEncode', () => {
  it('matches PHP rawurlencode for the base64 alphabet', () => {
    expect(rawUrlEncode('a+b/c=')).toBe('a%2Bb%2Fc%3D')
  })

  it('encodes the characters encodeURIComponent leaves alone', () => {
    expect(rawUrlEncode("!*'()")).toBe('%21%2A%27%28%29')
  })

  it('leaves the RFC 3986 unreserved set untouched', () => {
    expect(rawUrlEncode('AZaz09-_.~')).toBe('AZaz09-_.~')
  })
})
