export function EmptyState({ title }: { title: string }) {
  return <div className="rounded border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-600">{title}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>;
}

export function LoadingState() {
  return <div className="rounded border border-stone-200 bg-white p-4 text-sm text-stone-600">Loading...</div>;
}
