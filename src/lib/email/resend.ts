import "server-only";
import { Resend } from "resend";
import { env, publicEnv } from "@/config/env";

/**
 * Thin Resend wrapper. Returns a stub in dev when no API key is set so the
 * checkout flow keeps working — the OTP is logged to the server console
 * instead of emailed, which is what you want against a local stack.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendResult {
  ok: boolean;
  error?: string;
  /** True when we logged the message instead of sending — useful for tests. */
  stubbed?: boolean;
}

let cached: Resend | null = null;
function client(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const c = client();
  if (!c || !env.EMAIL_FROM) {
    console.warn(
      "[email] RESEND_API_KEY/EMAIL_FROM not set — logging instead of sending.",
      { to: args.to, subject: args.subject, text: args.text },
    );
    return { ok: true, stubbed: true };
  }
  const { error } = await c.emails.send({
    from: env.EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function fmtPKR(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function renderOrderCanceledEmail(args: {
  orderNumber: string;
}): { subject: string; html: string; text: string } {
  const store = publicEnv.storeName;
  return {
    subject: `Your ${store} order ${args.orderNumber} was canceled`,
    text:
      `Order #${args.orderNumber} has been canceled. If you were charged, the ` +
      `refund will appear on your statement within 5–10 business days. ` +
      `Reply to this email if you have any questions.`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 8px">Order canceled</h1>
        <p style="color:#555;margin:0 0 16px">Order <strong>#${args.orderNumber}</strong> has been canceled.</p>
        <p style="color:#555;margin:0 0 16px">If you were charged, the refund will appear on your statement within 5–10 business days. Reply to this email if you have questions.</p>
        <p style="color:#777;font-size:13px;margin:24px 0 0">${store}</p>
      </div>`,
  };
}

export function renderOrderRefundedEmail(args: {
  orderNumber: string;
  amountCents: number;
  isFull: boolean;
  reason: string | null;
}): { subject: string; html: string; text: string } {
  const store = publicEnv.storeName;
  const amount = fmtPKR(args.amountCents);
  const verb = args.isFull ? "fully refunded" : `refunded ${amount}`;
  return {
    subject: `${store} refund issued for order ${args.orderNumber}`,
    text:
      `We've ${verb} on order #${args.orderNumber}. ` +
      `The amount should appear on your original payment method within ` +
      `5–10 business days.` +
      (args.reason ? `\n\nNote from us: ${args.reason}` : "") +
      `\n\nThanks for shopping with ${store}.`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 8px">Refund issued</h1>
        <p style="color:#555;margin:0 0 12px">We've ${verb} on order <strong>#${args.orderNumber}</strong>.</p>
        <p style="color:#555;margin:0 0 16px">The amount should appear on your original payment method within 5–10 business days.</p>
        ${args.reason ? `<p style="color:#555;margin:0 0 16px"><strong>Note:</strong> ${args.reason}</p>` : ""}
        <p style="color:#777;font-size:13px;margin:24px 0 0">${store}</p>
      </div>`,
  };
}

export function renderReturnRequestedAdminEmail(args: {
  orderNumber: string;
  type: "refund" | "exchange";
  customerEmail: string;
  message: string;
  adminUrl: string;
}): { subject: string; html: string; text: string } {
  const store = publicEnv.storeName;
  return {
    subject: `New ${args.type} request — order ${args.orderNumber}`,
    text:
      `${args.customerEmail} submitted a ${args.type} request on order ` +
      `#${args.orderNumber}.\n\nMessage:\n${args.message}\n\n` +
      `Review and decide here: ${args.adminUrl}`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 8px">New ${args.type} request</h1>
        <p style="color:#555;margin:0 0 12px">Order <strong>#${args.orderNumber}</strong> · ${args.customerEmail}</p>
        <p style="color:#555;margin:0 0 16px;white-space:pre-wrap">${args.message}</p>
        <p style="margin:24px 0 0"><a href="${args.adminUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Review request</a></p>
        <p style="color:#777;font-size:13px;margin:24px 0 0">${store} admin</p>
      </div>`,
  };
}

export function renderReturnDecidedEmail(args: {
  orderNumber: string;
  type: "refund" | "exchange";
  outcome: "refunded" | "exchanged" | "denied";
  refundAmountCents?: number | null;
  adminNotes?: string | null;
}): { subject: string; html: string; text: string } {
  const store = publicEnv.storeName;
  const headline =
    args.outcome === "refunded"
      ? `Refund approved for order #${args.orderNumber}`
      : args.outcome === "exchanged"
        ? `Exchange approved for order #${args.orderNumber}`
        : `${args.type === "refund" ? "Refund" : "Exchange"} request declined for order #${args.orderNumber}`;
  const body =
    args.outcome === "refunded"
      ? `We've approved your refund request. ${
          args.refundAmountCents
            ? `${fmtPKR(args.refundAmountCents)} will be returned to your original payment method within 5–10 business days.`
            : "The refund will appear on your original payment method within 5–10 business days."
        }`
      : args.outcome === "exchanged"
        ? `We've approved your exchange request. Our team will follow up with shipping details for the replacement item.`
        : `We've reviewed your request and aren't able to approve it.`;
  return {
    subject: headline,
    text:
      `${body}` +
      (args.adminNotes ? `\n\nFrom our team:\n${args.adminNotes}` : "") +
      `\n\nThanks,\n${store}`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 12px">${headline}</h1>
        <p style="color:#555;margin:0 0 16px">${body}</p>
        ${args.adminNotes ? `<p style="color:#555;margin:0 0 16px"><strong>Note:</strong> ${args.adminNotes}</p>` : ""}
        <p style="color:#777;font-size:13px;margin:24px 0 0">${store}</p>
      </div>`,
  };
}

export function renderCheckoutOtpEmail(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const store = publicEnv.storeName;
  return {
    subject: `Your ${store} checkout code: ${code}`,
    text:
      `Your ${store} checkout verification code is ${code}.\n\n` +
      `Enter it in the browser tab where you're placing your order. ` +
      `The code expires in 10 minutes.\n\n` +
      `If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 8px">${store} checkout verification</h1>
        <p style="color:#555;margin:0 0 24px">Enter this code in the checkout tab to confirm it's you.</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px;padding:16px;background:#f6f6f6;border-radius:12px;text-align:center;margin:0 0 24px">${code}</p>
        <p style="color:#777;font-size:13px;margin:0">The code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };
}
