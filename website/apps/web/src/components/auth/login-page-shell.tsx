import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { LoginForm } from "@/components/auth/login-form";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

type LoginPageShellProps = {
  title?: string;
  description?: string;
  mobilePreviewSrc?: string;
};

function IPhoneMockup({ mobilePreviewSrc }: { mobilePreviewSrc?: string }) {
  return (
    <div className="relative h-[500px] w-[250px] rounded-[44px] border-[5px] border-[#1e2a44] bg-[#1e2a44] p-1.5 shadow-[0_22px_48px_-24px_rgba(15,23,42,0.55)]">
      <div className="absolute left-1/2 top-0 z-20 h-5 w-26 -translate-x-1/2 rounded-b-2xl bg-[#1e2a44]" />

      <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-gradient-to-b from-[#225ef2] to-[#31369a]">
        {mobilePreviewSrc ? (
          <img
            src={mobilePreviewSrc}
            alt="Mobil uygulama önizlemesi"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
            <h3 className="mt-5 text-[33px] font-semibold leading-tight tracking-tight text-white">Mobil uygulama önizleme</h3>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.12),transparent_34%)]" />
      </div>
    </div>
  );
}

function MobilePreviewPanel({ mobilePreviewSrc }: { mobilePreviewSrc?: string }) {
  return (
    <section className="flex h-full min-h-screen items-center justify-center bg-[#dfe4f3] px-8 py-10">
      <IPhoneMockup mobilePreviewSrc={mobilePreviewSrc} />
    </section>
  );
}

export function LoginPageShell({
  title = "NeredeServis kurumsal giriş",
  description = "Operasyon ekibinizin paneline güvenli şekilde erişin.",
  mobilePreviewSrc,
}: LoginPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f3f4f8] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center bg-[#f5f5f7] px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px] rounded-3xl border border-[#dbe0ea] bg-white p-7 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="mb-6">
              <h1 className="text-[46px] font-semibold leading-[1.04] tracking-tight text-slate-950">{title}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
            </div>

            <ConfigValidationBanner scopeLabel="Login Shell" />
            <div className="mb-4">
              <FirebaseClientBootstrapProbe />
            </div>

            <LoginForm />
          </div>
        </section>

        <div className="hidden lg:block">
          <MobilePreviewPanel mobilePreviewSrc={mobilePreviewSrc} />
        </div>
      </div>
    </main>
  );
}
