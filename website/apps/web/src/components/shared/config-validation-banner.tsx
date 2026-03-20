import { getPublicConfigValidation } from "@/lib/env/firebase-public-config";
import { getBackendApiBaseUrl } from "@/lib/env/public-env";

type Props = {
  scopeLabel: string;
};

export function ConfigValidationBanner({ scopeLabel }: Props) {
  if (getBackendApiBaseUrl()) {
    return null;
  }

  const validation = getPublicConfigValidation();

  if (validation.ok) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-200/85 bg-amber-50/85 p-3 text-sm text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="font-semibold">
        Config eksik ({scopeLabel}) - Firebase public env tamamlanmadi
      </div>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        Eksik anahtarlar: {validation.missingFirebaseKeys.join(", ")}
      </p>
    </div>
  );
}
