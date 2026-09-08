// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { muzapayConfigFromEnv, isBenefitPlusConfigured } from '@/payments/muzapay/config'

const KEYS = [
  'MUZAPAY_BASE_URL',
  'MUZAPAY_ESHOP_ID',
  'MUZAPAY_ESHOP_PASSWORD',
  'MUZAPAY_PRIVATE_KEY',
  'MUZAPAY_PRIVATE_KEY_PASSPHRASE',
  'MUZAPAY_PRODUCT_CODE',
  'MUZAPAY_LANGUAGE',
  'MUZAPAY_COUNTRY',
  'MUZAPAY_TOKEN_SCOPE',
] as const

const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function setMinimalEnv() {
  process.env.MUZAPAY_BASE_URL = 'https://api.gate.int.pay.muza.cz'
  process.env.MUZAPAY_ESHOP_ID = 'ESHOP1'
  process.env.MUZAPAY_ESHOP_PASSWORD = 'pw'
  // "-----BEGIN..." base64-encoded
  process.env.MUZAPAY_PRIVATE_KEY = Buffer.from('-----BEGIN PRIVATE KEY-----\nx\n').toString(
    'base64',
  )
}

describe('muzapayConfigFromEnv', () => {
  it('throws when credentials are missing', () => {
    expect(() => muzapayConfigFromEnv()).toThrow(/MUZAPAY_/)
  })

  it('decodes the base64 private key and applies defaults', () => {
    setMinimalEnv()
    const config = muzapayConfigFromEnv()
    expect(config.privateKeyPem).toBe('-----BEGIN PRIVATE KEY-----\nx\n')
    expect(config.productCode).toBe('LEISURE')
    expect(config.language).toBe('cs')
    expect(config.country).toBe('CZ')
    expect(config.tokenScope).toBe('SINGLE_PAYMENT')
    expect(config.signatureDelimiter).toBe('|')
    expect(config.privateKeyPassphrase).toBeUndefined()
  })

  it('accepts a raw PEM that was not base64-encoded', () => {
    setMinimalEnv()
    process.env.MUZAPAY_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nraw\n'
    expect(muzapayConfigFromEnv().privateKeyPem).toBe('-----BEGIN PRIVATE KEY-----\nraw\n')
  })

  it('lets the defaults be overridden', () => {
    setMinimalEnv()
    process.env.MUZAPAY_PRODUCT_CODE = 'HEALTHCARE'
    process.env.MUZAPAY_LANGUAGE = 'en'
    expect(muzapayConfigFromEnv().productCode).toBe('HEALTHCARE')
    expect(muzapayConfigFromEnv().language).toBe('en')
  })
})

describe('isBenefitPlusConfigured', () => {
  it('is false with no credentials, and never throws', () => {
    expect(isBenefitPlusConfigured()).toBe(false)
  })

  it('is true once the required variables are set', () => {
    setMinimalEnv()
    expect(isBenefitPlusConfigured()).toBe(true)
  })

  // A variable present but blank is what a half-filled Vercel dashboard looks
  // like. It must read as unconfigured, or the button renders and the payment
  // fails at the gateway instead of simply not being offered.
  it('treats a blank required variable as unconfigured', () => {
    setMinimalEnv()
    process.env.MUZAPAY_ESHOP_ID = ''
    expect(isBenefitPlusConfigured()).toBe(false)
  })
})
