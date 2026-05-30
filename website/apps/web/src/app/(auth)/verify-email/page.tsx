import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthPageShell
      scopeLabel="Verify Email"
      title="E-posta doğrulama"
      description="Şirket paneline geçmeden önce e-posta adresini doğrula"
      topPrompt="Hesabı değiştirmek ister misin?"
      topLinkLabel="Giriş Yap"
      topLinkHref="/giris?switch=1"
      sideImageSrc="/figma/sign-up-reference.png"
      sideImageAlt="Role based CRM verify email reference"
      footerHint="Mail kutusu ve spam klasörünü kontrol et."
    >
      <VerifyEmailForm />
    </AuthPageShell>
  );
}
