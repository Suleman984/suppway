import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const event = await getPaymentProvider("easypaisa").verifyWebhook({ rawBody, signature: null });
    return NextResponse.json({ received: true, event_type: event.type });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
