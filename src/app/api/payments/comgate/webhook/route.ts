import { applyComgateWebhook } from '@/payments/order-payment-service'

export async function POST(request: Request): Promise<Response> {
  return applyComgateWebhook(request)
}
