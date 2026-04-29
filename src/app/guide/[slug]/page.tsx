import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/json-ld";
import { GUIDE_ARTICLES, getGuideArticle } from "@/lib/guide-content";
import { getSiteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideArticle(slug);

  if (!article) {
    return {
      title: "가이드를 찾을 수 없습니다",
    };
  }

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/guide/${article.slug}`,
    },
    openGraph: {
      url: `/guide/${article.slug}`,
      title: `${article.title} | Charto`,
      description: article.description,
      type: "article",
      publishedTime: article.updatedAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      title: `${article.title} | Charto`,
      description: article.description,
    },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getGuideArticle(slug);

  if (!article) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.updatedAt,
    dateModified: article.updatedAt,
    inLanguage: "ko-KR",
    mainEntityOfPage: `${siteUrl}/guide/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Charto",
      url: siteUrl,
    },
  } as const;

  const relatedArticles = GUIDE_ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <>
      <JsonLdScript data={structuredData} id={`guide-${article.slug}-structured-data`} />
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-8 md:px-8 md:pb-24 md:pt-12">
        <Link
          className="text-sm font-semibold text-[var(--brand-strong)] transition-opacity hover:opacity-80"
          href="/guide"
        >
          ← 가이드로 돌아가기
        </Link>

        <article className="mt-8">
          <div className="text-[11px] font-black tracking-[0.16em] text-[var(--brand-strong)]">
            {article.category}
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-[2.7rem] md:leading-[1.08]">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl break-keep text-base leading-8 text-slate-600 dark:text-slate-300">
            {article.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-200/80 px-3 py-1.5 dark:border-white/10">
              업데이트 {article.updatedAt}
            </span>
            <span className="rounded-full border border-slate-200/80 px-3 py-1.5 dark:border-white/10">
              약 {article.readingMinutes}분
            </span>
          </div>

          <section className="mt-10 border-y border-slate-200/80 py-6 dark:border-white/10">
            <h2 className="text-sm font-black tracking-[0.12em] text-slate-500 dark:text-slate-400">
              먼저 볼 기준
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
              {article.takeaways.map((takeaway) => (
                <li key={takeaway} className="break-keep">
                  {takeaway}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 space-y-10">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="break-keep text-[15px] leading-8 text-slate-700 dark:text-slate-200"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-5 grid gap-2 border-l-2 border-[var(--brand-strong)] pl-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="break-keep">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-12 border-t border-slate-200/80 pt-8 dark:border-white/10">
            <h2 className="text-base font-black text-slate-950 dark:text-slate-50">
              이어서 읽기
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {relatedArticles.map((item) => (
                <Link
                  key={item.slug}
                  className="group border-t border-slate-200/80 pt-4 transition-colors hover:border-[var(--brand-strong)] dark:border-white/10"
                  href={`/guide/${item.slug}`}
                >
                  <div className="text-[11px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {item.category}
                  </div>
                  <h3 className="mt-2 break-keep text-sm font-black leading-6 text-slate-950 group-hover:text-[var(--brand-strong)] dark:text-slate-50">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
