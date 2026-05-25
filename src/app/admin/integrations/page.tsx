import { CheckCircle2, CircleDashed, ExternalLink } from "lucide-react";
import { env } from "@/config/env";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

interface Integration {
  id: string;
  name: string;
  category: "Payments" | "Email" | "Security";
  description: string;
  configured: boolean;
  requiredKeys: string[];
  docsUrl?: string;
}

function buildIntegrations(): Integration[] {
  return [
    {
      id: "stripe",
      name: "Stripe",
      category: "Payments",
      description:
        "Card payments worldwide. Required for one-click upsells and saved payment methods.",
      configured: Boolean(
        env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      ),
      requiredKeys: [
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ],
      docsUrl: "https://dashboard.stripe.com/apikeys",
    },
    {
      id: "jazzcash",
      name: "JazzCash",
      category: "Payments",
      description:
        "Pakistan mobile-wallet payments. Live for storefront checkout when keys are present.",
      configured: Boolean(
        env.JAZZCASH_MERCHANT_ID &&
          env.JAZZCASH_PASSWORD &&
          env.JAZZCASH_INTEGRITY_SALT,
      ),
      requiredKeys: [
        "JAZZCASH_MERCHANT_ID",
        "JAZZCASH_PASSWORD",
        "JAZZCASH_INTEGRITY_SALT",
      ],
      docsUrl: "https://sandbox.jazzcash.com.pk/",
    },
    {
      id: "easypaisa",
      name: "EasyPaisa",
      category: "Payments",
      description:
        "Pakistan mobile-wallet payments via Telenor. Activate by adding your merchant credentials.",
      configured: Boolean(env.EASYPAISA_STORE_ID && env.EASYPAISA_HASH_KEY),
      requiredKeys: ["EASYPAISA_STORE_ID", "EASYPAISA_HASH_KEY"],
      docsUrl: "https://easypay.easypaisa.com.pk/",
    },
    {
      id: "resend",
      name: "Resend",
      category: "Email",
      description:
        "Transactional email for order confirmations, OTP verification, and password resets.",
      configured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
      requiredKeys: ["RESEND_API_KEY", "EMAIL_FROM"],
      docsUrl: "https://resend.com/api-keys",
    },
    {
      id: "encryption",
      name: "Encryption key",
      category: "Security",
      description:
        "Symmetric key used for encrypting sensitive payloads at rest. Required for production.",
      configured: Boolean(env.ENCRYPTION_KEY),
      requiredKeys: ["ENCRYPTION_KEY"],
    },
  ];
}

export default async function AdminIntegrationsPage() {
  if (!(await hasPermission(PERMISSIONS.INTEGRATIONS_MANAGE))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Integrations"
        permission={PERMISSIONS.INTEGRATIONS_MANAGE}
        roleName={staff?.roleName}
      />
    );
  }

  const integrations = buildIntegrations();
  const configuredCount = integrations.filter((i) => i.configured).length;

  const categories = Array.from(
    new Set(integrations.map((i) => i.category)),
  ) as Integration["category"][];

  return (
    <div className="container max-w-5xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {configuredCount} of {integrations.length} configured. Keys are
            read from environment variables — edit{" "}
            <code>.env.local</code> and restart to apply changes.
          </p>
        </div>
      </header>

      {categories.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {cat}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {integrations
              .filter((i) => i.category === cat)
              .map((i) => (
                <article
                  key={i.id}
                  className={`rounded-lg border bg-card p-5 ${
                    i.configured ? "" : "border-dashed"
                  }`}
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{i.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {i.description}
                      </p>
                    </div>
                    {i.configured ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <CircleDashed className="h-3 w-3" />
                        Not configured
                      </span>
                    )}
                  </header>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Required environment variables
                    </p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {i.requiredKeys.map((k) => (
                        <li
                          key={k}
                          className="flex items-center gap-2 font-mono"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              process.env[k]
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/40"
                            }`}
                          />
                          <span className="truncate">{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i.docsUrl && (
                    <a
                      href={i.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Get API keys
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              ))}
          </div>
        </section>
      ))}

      <p className="mt-10 text-xs text-muted-foreground">
        Provider credentials are stored in env, not the database — a deliberate
        choice for single-tenant deployments. A multi-tenant credentials vault
        is on the roadmap.
      </p>
    </div>
  );
}
