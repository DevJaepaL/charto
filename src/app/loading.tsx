export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:px-6 md:pt-8">
      <div className="loading-skeleton h-8 w-56 rounded-[6px] bg-[var(--surface-card-strong)]" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="loading-skeleton h-16 w-36 rounded-[8px] bg-[var(--surface-card-strong)]" />
        ))}
      </div>
      <div className="loading-skeleton mt-4 h-[28rem] rounded-[12px] bg-[var(--surface-card-strong)]" />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="loading-skeleton h-72 rounded-[12px] bg-[var(--surface-card-strong)]" />
        <div className="loading-skeleton h-72 rounded-[12px] bg-[var(--surface-card-strong)]" />
      </div>
    </main>
  );
}
