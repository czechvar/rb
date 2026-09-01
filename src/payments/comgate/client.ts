/**
 * Raw HTTP transport for the Comgate REST API. No domain knowledge — takes
 * and returns plain string maps. Mirrors snowbusters
 * `ComgateGateway::sendRequest` (form-urlencoded request AND response body).
 */

import { PaymentGatewayError } from '../gateway'

export async function comgatePostForm(
  url: string,
  params: Record<string, string>,
): Promise<Record<string, string>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })
  } catch (cause) {
    throw new PaymentGatewayError('Comgate request failed.', cause)
  }

  if (response.status !== 200) {
    throw new PaymentGatewayError(`Unexpected HTTP ${response.status} from Comgate.`)
  }

  const text = await response.text()
  const parsed = new URLSearchParams(text)
  const result: Record<string, string> = {}
  for (const [key, value] of parsed.entries()) result[key] = value
  return result
}
