import { getPublicConfigValidation } from "@/lib/env/firebase-public-config";

type Props = {
  scopeLabel: string;
};

export function ConfigValidationBanner({ scopeLabel }: Props) {
  const validation = getPublicConfigValidation();

  if (validation.ok) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="font-semibold">
        Config eksik ({scopeLabel}) - Firebase public env tamamlanmadi
      </div>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        Eksik anahtarlar: {validation.missingFirebaseKeys.join(", ")}
      </p>
    </div>
  );
}
