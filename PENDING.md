# Pending tasks

Work that's been started but isn't fully shipped, and the unblock for each.
Keep this short — promote items to issues/PRs once they're actually being worked on.

---

## Guest checkout — email impersonation defense (mostly done)

**State:** code shipped in `0011_checkout_verifications.sql`,
`src/lib/email/resend.ts`, `src/server/actions/checkout-otp.ts`,
`src/server/actions/orders.ts` (consume gate), and
`src/components/storefront/checkout-page.tsx` (OTP UI step).
Auto-link of orphan guest orders on first `/account` read is also live in
`src/server/services/account.ts`.

**Blocked on:** Resend domain verification for `fitnessarena.com`. Until SPF
and DKIM are green in https://resend.com/domains, real customers can't
receive the OTP email.

**Dev workaround:** unset `EMAIL_FROM` to log OTPs to the terminal, or set
`EMAIL_FROM="onboarding@resend.dev"` to use Resend's test sender (delivers
to your Resend account email only).

**Still to do once domain is verified:**
- Smoke-test the live email delivery against a real inbox.
- Decide rate-limit ceiling for production (currently 3 sends per email
  per 10 min in `src/server/actions/checkout-otp.ts`).

---

## Transactional emails — only the OTP is wired

The `sendEmail` helper in `src/lib/email/resend.ts` exists but is only used
for the checkout OTP. None of these are sent yet:

- Order confirmation email to the customer after `placeOrder` succeeds.
- Admin "new order" notification to the store owner.
- Shipping/fulfilled email when `fulfillOrder` runs.
- Refund confirmation email when `refundOrder` runs.
- Welcome email after signup verification.

Pick one to start — order confirmation is the most customer-facing.

---

## Stripe webhook — events received, nothing updated

`src/app/api/webhooks/stripe/route.ts` verifies + dedupes the event and
inserts a `webhook_events` row, then bails at:

```ts
// TODO: branch on event.type and update payments + orders.
```

Card payments will not flip an order from `pending` → `paid` until this
switch is implemented. At minimum needs to handle
`payment_intent.succeeded`, `payment_intent.payment_failed`, and
`charge.refunded`.

---

## Card capture UI not wired

`src/components/storefront/checkout-page.tsx` (Payment section) shows the
"Credit / Debit card" radio but the body says:

> Card capture not wired in this build — pick Cash on Delivery to test the full order flow.

Needs a Stripe Elements (or Payment Element) integration. The Stripe SDK
is already a dependency.

---

## JazzCash / EasyPaisa webhook routes

`src/app/api/webhooks/jazzcash/` and `src/app/api/webhooks/easypaisa/`
exist (env vars are scaffolded in `src/config/env.ts`). Verify whether
they're implemented or also stub-only — the order flow currently treats
both methods as immediately "paid" optimistically.
