import "server-only";
import { createHmac } from "node:crypto";
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
 * EasyPaisa adapter (Pakistan). Redirect-based with HMAC-signed payloads.
 */
export function createEasyPaisaProvider(): PaymentProvider {
  const storeId = env.EASYPAISA_STORE_ID;
  const hashKey = env.EASYPAISA_HASH_KEY;
  const returnUrl = env.EASYPAISA_RETURN_URL;

  if (!storeId || !hashKey) {
    throw new PaymentProviderError("easypaisa", "EasyPaisa credentials are not configured");
  }

  function sign(payload: Record<string, string>): string {
    const sorted = Object.keys(payload).sort().map((k) => `${k}=${payload[k]}`).join("&");
    return createHmac("sha256", hashKey!).update(sorted).digest("hex");
  }

  return {
    key: "easypaisa",

    async charge(req: ChargeRequest): Promise<ChargeResult> {
      const payload: Record<string, string> = {
        storeId,
        amount: (req.amountCents / 100).toFixed(2),
        orderRefNum: `EP${Date.now()}`,
        postBackURL: returnUrl ?? "",
        merchantHashedReq: "",
        emailAddr: req.customerEmail,
      };
      payload.merchantHashedReq = sign(payload);

      const params = new URLSearchParams(payload).toString();
      const redirectUrl = `https://easypay.easypaisa.com.pk/easypay/Index.jsf?${params}`;

      return {
        status: "requires_action",
        providerPaymentId: payload.orderRefNum!,
        redirectUrl,
        raw: payload,
      };
    },

    async refund(_req: RefundRequest): Promise<RefundResult> {
      return { status: "failed", providerRefundId: null, failureReason: "Not implemented" };
    },

    async tokenize(_req: TokenizeRequest): Promise<TokenizeResult> {
      throw new PaymentProviderError("easypaisa", "EasyPaisa does not support card tokenization");
    },

    async verifyWebhook(req: WebhookVerifyRequest): Promise<WebhookEvent> {
      const payload = Object.fromEntries(new URLSearchParams(req.rawBody)) as Record<string, string>;
      const received = payload.merchantHashedReq;
      const computed = sign({ ...payload, merchantHashedReq: "" });
      if (!received || received !== computed) {
        throw new PaymentProviderError("easypaisa", "Invalid IPN signature");
      }
      return {
        externalId: payload.orderRefNum ?? "",
        type: payload.status === "0000" ? "payment.succeeded" : "payment.failed",
        data: payload,
      };
    },
  };
}
