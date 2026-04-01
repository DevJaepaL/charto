export function JsonLdScript({
  data,
  id,
}: {
  data: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
  id?: string;
}) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      id={id}
      type="application/ld+json"
    />
  );
}
