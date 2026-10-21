export function LoadingState() {
  return <div className="rounded-md border bg-white p-6 text-sm text-graphite-700">Loading CRM data...</div>;
}

export function EmptyState({ title }: { title: string }) {
  return <div className="rounded-md border border-dashed bg-white p-8 text-center text-sm text-graphite-700">{title}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}
