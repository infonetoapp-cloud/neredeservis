import { RouteSharePreviewClient } from "@/components/marketing/route-share-preview-client";

type PageProps = {
  params: {
    srvCode: string;
  };
  searchParams?: {
    t?: string;
  };
};

export default function RouteSharePreviewPage({ params, searchParams }: PageProps) {
  const token = typeof searchParams?.t === "string" ? searchParams.t : "";
  return (
    <RouteSharePreviewClient
      key={`${params.srvCode}:${token}`}
      srvCode={params.srvCode}
      token={token}
    />
  );
}
