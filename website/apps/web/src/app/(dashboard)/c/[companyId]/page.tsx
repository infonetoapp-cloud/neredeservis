import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyRootRedirectPage({ params }: Props) {
  const { companyId } = await params;
  redirect(`/c/${encodeURIComponent(companyId)}/dashboard`);
}
