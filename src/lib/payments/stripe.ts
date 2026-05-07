import "server-only";
import Stripe from "stripe";
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
 * Stripe adapter for international card processing. Single-tenant — uses
 * the platform Stripe account configured via env.
 */
export function createStripeProvider(): PaymentProvider {
  if (!env.STRIPE_SECRET_KEY) {
    throw new PaymentProviderError("stripe", "STRIPE_SECRET_KEY is not configured");
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-10-28.acacia" as Stripe.LatestApiVersion,
  });

  return {
    key: "stripe",

    async charge(req: ChargeRequest): Promise<ChargeResult> {
      try {
        if (req.savedPaymentMethodId && req.customerProviderId) {
          const intent = await stripe.paymentIntents.create({
            amount: req.amountCents,
            currency: req.currency.toLowerCase(),
            customer: req.customerProviderId,
            payment_method: req.savedPaymentMethodId,
            off_session: true,
            confirm: true,
            description: req.description,
            metadata: { ...req.metadata, order_id: req.orderId ?? "" },
          });
          return {
            status: intent.status === "succeeded" ? "succeeded" : "processing",
            providerPaymentId: intent.id,
            raw: intent,
          };
        }

        const intent = await stripe.paymentIntents.create({
          amount: req.amountCents,
          currency: req.currency.toLowerCase(),
          receipt_email: req.customerEmail,
          description: req.description,
          metadata: { ...req.metadata, order_id: req.orderId ?? "" },
          automatic_payment_methods: { enabled: true },
        });
        return {
          status: "requires_action",
          providerPaymentId: intent.id,
          clientSecret: intent.client_secret ?? undefined,
          raw: intent,
        };
      } catch (err) {
        const e = err as Stripe.errors.StripeError;
        return { status: "failed", providerPaymentId: null, failureReason: e.message, raw: e };
      }
    },

    async refund(req: RefundRequest): Promise<RefundResult> {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: req.providerPaymentId,
          amount: req.amountCents,
          reason: (req.reason as Stripe.RefundCreateParams.Reason) ?? "requested_by_customer",
        });
        return {
          status: refund.status === "succeeded" ? "succeeded" : "pending",
          providerRefundId: refund.id,
          raw: refund,
        };
      } catch (err) {
        return { status: "failed", providerRefundId: null, failureReason: (err as Error).message };
      }
    },

    async tokenize(req: TokenizeRequest): Promise<TokenizeResult> {
      const customer = await stripe.customers.create({ email: req.customerEmail });
      const setup = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ["card"],
      });
      return { customerProviderId: customer.id, setupClientSecret: setup.client_secret ?? undefined };
    },

    async verifyWebhook(req: WebhookVerifyRequest): Promise<WebhookEvent> {
      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new PaymentProviderError("stripe", "STRIPE_WEBHOOK_SECRET is not configured");
      }
      if (!req.signature) {
        throw new PaymentProviderError("stripe", "Missing Stripe signature header");
      }
      const event = stripe.webhooks.constructEvent(req.rawBody, req.signature, env.STRIPE_WEBHOOK_SECRET);
      return {
        externalId: event.id,
        type: event.type,
        data: event.data as unknown as Record<string, unknown>,
      };
    },
  };
}
