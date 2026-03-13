import { AnimatedLoadingStage } from "@/components/animated-loading-stage";

export default function AnalyzeLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl items-center px-4 pb-12 pt-6 md:px-6 md:pt-8">
      <div className="glass-card w-full rounded-[24px] p-4 md:rounded-[28px] md:p-6">
        <AnimatedLoadingStage />
      </div>
    </main>
  );
}
