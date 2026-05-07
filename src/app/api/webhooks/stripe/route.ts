import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = await getPaymentProvider("stripe").verifyWebhook({ rawBody, signature });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("webhook_events")
    .insert({ provider: "stripe", external_id: event.externalId, event_type: event.type, payload: event.data });
  if (error?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // TODO: branch on event.type and update payments + orders.
  await supabase.from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("external_id", event.externalId);
  return NextResponse.json({ received: true });
}
