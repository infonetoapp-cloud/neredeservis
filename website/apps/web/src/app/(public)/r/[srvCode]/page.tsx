import { RouteSharePreviewClient } from "@/components/marketing/route-share-preview-client";

type PageProps = {
  params: Promise<{
    srvCode: string;
  }>;
  searchParams?: Promise<{
    t?: string;
  }>;
};

export default async function RouteSharePreviewPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = typeof resolvedSearchParams?.t === "string" ? resolvedSearchParams.t : "";
  return (
    <RouteSharePreviewClient
      key={`${resolvedParams.srvCode}:${token}`}
      srvCode={resolvedParams.srvCode}
      token={token}
    />
  );
}
