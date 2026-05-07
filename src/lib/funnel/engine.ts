import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Funnel engine — drives a customer's path through a funnel: tracks the
 * session, evaluates step conditions, branches on accept/decline, and
 * pipes context forward.
 */

export type StepKind = "landing" | "checkout" | "upsell" | "downsell" | "order_bump" | "thank_you" | "custom";

export interface FunnelStep {
  id: string;
  funnelId: string;
  slug: string;
  kind: StepKind;
  title: string;
  position: number;
  variantId: string | null;
  offerPriceCents: number | null;
  onAcceptStepId: string | null;
  onDeclineStepId: string | null;
  content: Record<string, unknown>;
  conditions: ConditionRule[];
}

export interface ConditionRule {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "nin";
  value: unknown;
}

export interface FunnelSession {
  id: string;
  funnelId: string;
  token: string;
  customerId: string | null;
  cartId: string | null;
  currentStepId: string | null;
  initialOrderId: string | null;
  context: Record<string, unknown>;
  attribution: Record<string, unknown>;
  status: "open" | "converted" | "abandoned" | "expired";
}

export async function startSession(params: {
  funnelId: string;
  token?: string;
  attribution?: Record<string, unknown>;
}): Promise<{ session: FunnelSession; step: FunnelStep | null }> {
  const supabase = createAdminClient();

  if (params.token) {
    const { data } = await supabase.from("funnel_sessions").select("*").eq("token", params.token).maybeSingle();
    if (data && data.status === "open") {
      const step = data.current_step_id ? await loadStep(data.current_step_id) : null;
      return { session: rowToSession(data), step };
    }
  }

  const { data: funnel, error: funnelErr } = await supabase
    .from("funnels")
    .select("id, entry_step_id")
    .eq("id", params.funnelId)
    .maybeSingle();
  if (funnelErr || !funnel) throw new Error("Funnel not found");

  const token = crypto.randomUUID();
  const { data: created, error } = await supabase
    .from("funnel_sessions")
    .insert({
      funnel_id: params.funnelId,
      token,
      current_step_id: funnel.entry_step_id,
      attribution: params.attribution ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;

  await logEvent(created.id, funnel.entry_step_id, "viewed");
  const step = funnel.entry_step_id ? await loadStep(funnel.entry_step_id) : null;
  return { session: rowToSession(created), step };
}

export async function advance(params: {
  sessionToken: string;
  decision: "accepted" | "declined";
  pipe?: Record<string, unknown>;
}): Promise<{ session: FunnelSession; step: FunnelStep | null; converted: boolean }> {
  const supabase = createAdminClient();

  const { data: sessionRow } = await supabase
    .from("funnel_sessions")
    .select("*")
    .eq("token", params.sessionToken)
    .maybeSingle();
  if (!sessionRow) throw new Error("Session not found");

  const currentStep = sessionRow.current_step_id ? await loadStep(sessionRow.current_step_id) : null;
  if (!currentStep) throw new Error("Session has no current step");

  await logEvent(sessionRow.id, currentStep.id, params.decision);

  const nextId = params.decision === "accepted" ? currentStep.onAcceptStepId : currentStep.onDeclineStepId;
  const merged = { ...(sessionRow.context ?? {}), ...(params.pipe ?? {}) };
  const status: FunnelSession["status"] = nextId ? "open" : "converted";

  const { data: updated, error } = await supabase
    .from("funnel_sessions")
    .update({ current_step_id: nextId, context: merged, status })
    .eq("id", sessionRow.id)
    .select("*")
    .single();
  if (error) throw error;

  if (status === "converted") await logEvent(sessionRow.id, currentStep.id, "converted");

  const step = nextId ? await loadStep(nextId) : null;
  return { session: rowToSession(updated), step, converted: status === "converted" };
}

export function evaluateConditions(rules: ConditionRule[], data: Record<string, unknown>): boolean {
  return rules.every((r) => evaluate(r, data));
}

function evaluate(rule: ConditionRule, data: Record<string, unknown>): boolean {
  const v = readPath(data, rule.field);
  switch (rule.op) {
    case "eq": return v === rule.value;
    case "neq": return v !== rule.value;
    case "gt": return typeof v === "number" && typeof rule.value === "number" && v > rule.value;
    case "gte": return typeof v === "number" && typeof rule.value === "number" && v >= rule.value;
    case "lt": return typeof v === "number" && typeof rule.value === "number" && v < rule.value;
    case "lte": return typeof v === "number" && typeof rule.value === "number" && v <= rule.value;
    case "in": return Array.isArray(rule.value) && rule.value.includes(v);
    case "nin": return Array.isArray(rule.value) && !rule.value.includes(v);
  }
}

function readPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

async function loadStep(id: string): Promise<FunnelStep | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("funnel_steps").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    funnelId: data.funnel_id,
    slug: data.slug,
    kind: data.kind,
    title: data.title,
    position: data.position,
    variantId: data.variant_id,
    offerPriceCents: data.offer_price_cents,
    onAcceptStepId: data.on_accept_step_id,
    onDeclineStepId: data.on_decline_step_id,
    content: data.content ?? {},
    conditions: (data.conditions ?? []) as ConditionRule[],
  };
}

async function logEvent(
  sessionId: string,
  stepId: string | null,
  kind: "viewed" | "accepted" | "declined" | "converted" | "abandoned",
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("funnel_events").insert({ session_id: sessionId, step_id: stepId, kind });
}

function rowToSession(row: Record<string, unknown>): FunnelSession {
  return {
    id: row.id as string,
    funnelId: row.funnel_id as string,
    token: row.token as string,
    customerId: (row.customer_id as string | null) ?? null,
    cartId: (row.cart_id as string | null) ?? null,
    currentStepId: (row.current_step_id as string | null) ?? null,
    initialOrderId: (row.initial_order_id as string | null) ?? null,
    context: (row.context as Record<string, unknown>) ?? {},
    attribution: (row.attribution as Record<string, unknown>) ?? {},
    status: row.status as FunnelSession["status"],
  };
}
