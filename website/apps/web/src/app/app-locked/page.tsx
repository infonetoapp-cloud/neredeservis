import { AppLockPanel, type AppLockReason } from "@/components/shared/app-lock-panel";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

function readReason(value: string | undefined): AppLockReason {
  if (
    value === "force_update" ||
    value === "billing_lock" ||
    value === "company_suspended" ||
    value === "company_archived" ||
    value === "membership_suspended"
  ) {
    return value;
  }
  return "force_update";
}

export default async function AppLockedPage({ searchParams }: Props) {
  const params = await searchParams;
  const reason = readReason(params.reason);

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center">
      <AppLockPanel reason={reason} />
    </section>
  );
}
