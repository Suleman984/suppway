export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ funnelId: string; step: string }>;
}

export const metadata = { robots: { index: false } };

export default async function FunnelStepPage({ params }: Props) {
  const { funnelId, step } = await params;
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Funnel step</h1>
      <p className="mt-2 text-muted-foreground">
        Funnel <code>{funnelId}</code> · step <code>{step}</code>. Render the step content + accept/decline
        actions; call <code>advance()</code> from the funnel engine on submit.
      </p>
    </section>
  );
}
