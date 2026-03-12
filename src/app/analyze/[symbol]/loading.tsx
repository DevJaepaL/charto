export default function AnalyzeLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-6 md:px-8 md:pt-8">
      <div className="animate-pulse space-y-6">
        <div className="h-5 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-[20px] bg-slate-200 dark:bg-white/10 md:h-20 md:w-20" />
            <div className="space-y-3 pt-2">
              <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-white/10 md:w-56" />
              <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[360px]">
            <div className="glass-card h-28 rounded-[28px]" />
            <div className="glass-card h-28 rounded-[28px]" />
          </div>
        </div>
        <div className="glass-card h-20 rounded-[28px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <div className="glass-card h-[520px] rounded-[32px]" />
          <div className="space-y-6">
            <div className="glass-card h-[280px] rounded-[32px]" />
            <div className="glass-card h-[220px] rounded-[32px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
