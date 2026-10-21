import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";

const stats = [
  ["Open pipeline", "₹48.2L", "+12%"],
  ["New leads", "128", "+18"],
  ["Dealer visits", "34", "This week"],
  ["Follow-ups due", "19", "Today"]
];

const stages = ["Lead In", "Qualified", "Sample Sent", "Negotiation", "Won"];

export function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-omsons-orange">Sales workspace</p>
          <h2 className="text-2xl font-semibold text-graphite-900">Omsons CRM Dashboard</h2>
          <p className="text-sm text-graphite-700">Track glassware leads, dealers, visits, and revenue momentum.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border bg-white px-3 py-2 text-sm">Export CSV</button>
          <button className="rounded-md border bg-white px-3 py-2 text-sm">Filters</button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, change]) => (
          <article className="rounded-md border bg-white p-5 shadow-sm" key={label}>
            <p className="text-sm text-graphite-700">{label}</p>
            <div className="mt-3 flex items-end justify-between">
              <strong className="text-2xl text-graphite-900">{value}</strong>
              <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{change}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Pipeline health</h3>
            <select className="rounded-md border px-3 py-2 text-sm">
              <option>Current quarter</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {stages.map((stage, index) => (
              <div className="rounded-md bg-graphite-50 p-4" key={stage}>
                <p className="text-sm font-medium">{stage}</p>
                <div className="mt-4 h-28 rounded-md bg-white p-2">
                  <div className="rounded bg-omsons-orange/90" style={{ height: `${36 + index * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Recent activity</h3>
          <div className="mt-4 space-y-3">
            {["Quote sent to North India dealer", "Visit logged at Borosil cluster", "Follow-up scheduled for export buyer"].map((item) => (
              <div className="rounded-md border border-graphite-100 p-3 text-sm" key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <LoadingState />
        <EmptyState title="No stale leads in the selected view." />
        <ErrorState message="Reports API placeholder is ready for integration." />
      </section>
    </AppShell>
  );
}
