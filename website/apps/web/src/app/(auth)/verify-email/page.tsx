import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthPageShell
      scopeLabel="Verify Email"
      title="Verify your email"
      description="Sirket paneline gecmeden once e-posta adresini dogrula"
      topPrompt="Hesabi degistirmek ister misin?"
      topLinkLabel="Giris Yap"
      topLinkHref="/login?switch=1"
      sideImageSrc="/figma/sign-up-reference.png"
      sideImageAlt="Role based CRM verify email reference"
      footerHint="Mail kutusu ve spam klasorunu kontrol et."
    >
      <VerifyEmailForm />
    </AuthPageShell>
  );
}
