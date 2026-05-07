import "server-only";
import type { PaymentProvider, PaymentProviderKey } from "./provider";
import { createStripeProvider } from "./stripe";
import { createJazzCashProvider } from "./jazzcash";
import { createEasyPaisaProvider } from "./easypaisa";

export function getPaymentProvider(provider: PaymentProviderKey): PaymentProvider {
  switch (provider) {
    case "stripe":
      return createStripeProvider();
    case "jazzcash":
      return createJazzCashProvider();
    case "easypaisa":
      return createEasyPaisaProvider();
    case "safepay":
    case "paypal":
      throw new Error(`Provider ${provider} not implemented yet`);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

export type { PaymentProvider, PaymentProviderKey } from "./provider";
