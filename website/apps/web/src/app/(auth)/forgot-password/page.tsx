import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      scopeLabel="Forgot Password"
      title="Şifreni sıfırla"
      description="E-posta adresine şifre sıfırlama linki gönderelim"
      topPrompt="Şifreni hatırladın mı?"
      topLinkLabel="Giriş Yap"
      topLinkHref="/giris"
      sideImageSrc="/figma/sign-in-reference.png"
      sideImageAlt="Role based CRM reset password reference"
      footerHint="Link geldikten sonra yeni şifreni güvenli şekilde belirle."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
