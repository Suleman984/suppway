import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/config/env";
import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundRequest,
  RefundResult,
  TokenizeRequest,
  TokenizeResult,
  WebhookEvent,
  WebhookVerifyRequest,
} from "./provider";
import { PaymentProviderError } from "./provider";

/**
 * JazzCash adapter (Pakistan). Redirect-based flow with an IPN webhook
 * verified by an HMAC-SHA256 secure hash. Switch the URL to the production
 * endpoint once you have live credentials.
 */
export function createJazzCashProvider(): PaymentProvider {
  const merchantId = env.JAZZCASH_MERCHANT_ID;
  const password = env.JAZZCASH_PASSWORD;
  const salt = env.JAZZCASH_INTEGRITY_SALT;
  const returnUrl = env.JAZZCASH_RETURN_URL;

  if (!merchantId || !password || !salt) {
    throw new PaymentProviderError("jazzcash", "JazzCash credentials are not configured");
  }

  function buildSecureHash(payload: Record<string, string>): string {
    const sortedKeys = Object.keys(payload).sort();
    const concatenated = sortedKeys
      .filter((k) => payload[k] !== "" && payload[k] !== undefined)
      .map((k) => payload[k])
      .join("&");
    return createHash("sha256").update(`${salt}&${concatenated}`).digest("hex").toUpperCase();
  }

  return {
    key: "jazzcash",

    async charge(req: ChargeRequest): Promise<ChargeResult> {
      const now = new Date();
      const expiry = new Date(now.getTime() + 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().replace(/T|:|-/g, "").slice(0, 14);

      const payload: Record<string, string> = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",
        pp_MerchantID: merchantId,
        pp_Password: password,
        pp_TxnRefNo: `T${Date.now()}`,
        pp_Amount: String(req.amountCents),
        pp_TxnCurrency: req.currency || "PKR",
        pp_TxnDateTime: fmt(now),
        pp_BillReference: req.orderId ?? "billRef",
        pp_Description: req.description ?? "Order",
        pp_TxnExpiryDateTime: fmt(expiry),
        pp_ReturnURL: returnUrl ?? "",
      };
      payload.pp_SecureHash = buildSecureHash(payload);

      const params = new URLSearchParams(payload).toString();
      const redirectUrl = `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/?${params}`;

      return {
        status: "requires_action",
        providerPaymentId: payload.pp_TxnRefNo!,
        redirectUrl,
        raw: payload,
      };
    },

    async refund(_req: RefundRequest): Promise<RefundResult> {
      return { status: "failed", providerRefundId: null, failureReason: "Not implemented" };
    },

    async tokenize(_req: TokenizeRequest): Promise<TokenizeResult> {
      throw new PaymentProviderError("jazzcash", "JazzCash does not support tokenization");
    },

    async verifyWebhook(req: WebhookVerifyRequest): Promise<WebhookEvent> {
      const payload = Object.fromEntries(new URLSearchParams(req.rawBody)) as Record<string, string>;
      const received = payload.pp_SecureHash;
      const computed = buildSecureHash({ ...payload, pp_SecureHash: "" });
      if (!received || received !== computed) {
        throw new PaymentProviderError("jazzcash", "Invalid IPN signature");
      }
      return {
        externalId: payload.pp_TxnRefNo ?? "",
        type: payload.pp_ResponseCode === "000" ? "payment.succeeded" : "payment.failed",
        data: payload,
      };
    },
  };
}
