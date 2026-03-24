import { getBackendApiBaseUrl } from "@/lib/env/public-env";

type Props = {
  scopeLabel: string;
};

export function ConfigValidationBanner({ scopeLabel }: Props) {
  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (backendApiBaseUrl) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-200/85 bg-amber-50/85 p-3 text-sm text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="font-semibold">
        Config eksik ({scopeLabel}) - backend API env tamamlanmadi
      </div>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        NEXT_PUBLIC_BACKEND_API_BASE_URL ayari eksik veya bos.
      </p>
    </div>
  );
}
