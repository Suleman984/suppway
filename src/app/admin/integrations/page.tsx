export const metadata = { title: "Integrations" };
export default function AdminIntegrationsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Integrations</h1>
      <p className="mt-2 text-muted-foreground">Configure Stripe, JazzCash, EasyPaisa, shipping, and email providers.</p>
    </div>
  );
}
