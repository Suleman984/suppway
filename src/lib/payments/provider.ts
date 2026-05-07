/**
 * Payment provider interface. Concrete adapters live next to this file:
 *   - stripe.ts    (international cards + saved methods for one-click upsells)
 *   - jazzcash.ts  (Pakistan)
 *   - easypaisa.ts (Pakistan)
 */

export type PaymentProviderKey = "stripe" | "jazzcash" | "easypaisa" | "safepay" | "paypal";

export interface ChargeRequest {
  orderId?: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  description?: string;
  metadata?: Record<string, string>;
  savedPaymentMethodId?: string;
  customerProviderId?: string;
}

export interface ChargeResult {
  status: "succeeded" | "requires_action" | "processing" | "failed";
  providerPaymentId: string | null;
  clientSecret?: string;
  redirectUrl?: string;
  failureReason?: string;
  raw?: unknown;
}

export interface RefundRequest {
  providerPaymentId: string;
  amountCents: number;
  reason?: string;
}

export interface RefundResult {
  status: "succeeded" | "pending" | "failed";
  providerRefundId: string | null;
  failureReason?: string;
  raw?: unknown;
}

export interface TokenizeRequest {
  customerEmail: string;
}

export interface TokenizeResult {
  customerProviderId: string;
  setupClientSecret?: string;
  redirectUrl?: string;
}

export interface WebhookVerifyRequest {
  rawBody: string;
  signature: string | null;
}

export interface WebhookEvent {
  externalId: string;
  type: string;
  data: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly key: PaymentProviderKey;
  charge(req: ChargeRequest): Promise<ChargeResult>;
  refund(req: RefundRequest): Promise<RefundResult>;
  tokenize(req: TokenizeRequest): Promise<TokenizeResult>;
  verifyWebhook(req: WebhookVerifyRequest): Promise<WebhookEvent>;
}

export class PaymentProviderError extends Error {
  constructor(
    public provider: PaymentProviderKey,
    message: string,
    public override cause?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = "PaymentProviderError";
  }
}
