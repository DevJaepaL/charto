export default function SectorLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:px-6 md:pt-8">
      <div className="loading-skeleton h-5 w-32 rounded-[var(--radius-sm)] bg-[var(--surface-card-strong)]" />
      <div className="loading-skeleton mt-4 h-8 w-64 rounded-[var(--radius-sm)] bg-[var(--surface-card-strong)]" />
      <div className="loading-skeleton mt-5 h-28 rounded-[var(--radius-lg)] bg-[var(--surface-card-strong)]" />
      <div className="loading-skeleton mt-4 h-96 rounded-[var(--radius-lg)] bg-[var(--surface-card-strong)]" />
    </main>
  );
}
