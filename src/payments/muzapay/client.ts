/**
 * Raw JSON HTTP transport for the MuzaPay REST API. No domain knowledge —
 * takes and returns plain objects. Port of snowbusters
 * `api/app/PaymentsModule/service/MuzaPay/MuzaPayClient.php`.
 */

import { PaymentGatewayError } from '../gateway'

export class MuzaPayClient {
  constructor(private readonly baseUrl: string) {}

  private url(pathWithQuery: string): string {
    if (!this.baseUrl) {
      throw new PaymentGatewayError('MuzaPay baseUrl is not configured.')
    }
    return `${this.baseUrl.replace(/\/+$/, '')}${pathWithQuery}`
  }

  private async send(
    pathWithQuery: string,
    init: RequestInit,
    expectedCode: number,
  ): Promise<Response> {
    let response: Response
    try {
      response = await fetch(this.url(pathWithQuery), init)
    } catch (cause) {
      throw new PaymentGatewayError('MuzaPay request failed.', cause)
    }
    if (response.status !== expectedCode) {
      throw new PaymentGatewayError(
        `Unexpected HTTP ${response.status} from MuzaPay (expected ${expectedCode}).`,
      )
    }
    return response
  }

  private async parse(response: Response): Promise<Record<string, unknown>> {
    let decoded: unknown
    try {
      decoded = await response.json()
    } catch (cause) {
      throw new PaymentGatewayError('Unable to parse MuzaPay JSON response.', cause)
    }
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
      throw new PaymentGatewayError('MuzaPay JSON response is not an object.')
    }
    return decoded as Record<string, unknown>
  }

  async postJson(
    pathWithQuery: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
    expectedCode = 200,
  ): Promise<Record<string, unknown>> {
    const response = await this.send(
      pathWithQuery,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
        body: JSON.stringify(body),
      },
      expectedCode,
    )
    return this.parse(response)
  }

  async getJson(
    pathWithQuery: string,
    headers: Record<string, string> = {},
    expectedCode = 200,
  ): Promise<Record<string, unknown>> {
    const response = await this.send(
      pathWithQuery,
      { method: 'GET', headers: { Accept: 'application/json', ...headers } },
      expectedCode,
    )
    return this.parse(response)
  }

  async put(
    pathWithQuery: string,
    headers: Record<string, string> = {},
    expectedCode = 202,
  ): Promise<void> {
    await this.send(pathWithQuery, { method: 'PUT', headers }, expectedCode)
  }
}
