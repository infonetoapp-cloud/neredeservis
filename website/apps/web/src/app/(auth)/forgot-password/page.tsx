import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      scopeLabel="Forgot Password"
      title="Reset your password"
      description="E-posta adresine sifre sifirlama linki gonderelim"
      topPrompt="Sifreni hatirladin mi?"
      topLinkLabel="Giris Yap"
      topLinkHref="/login"
      sideImageSrc="/figma/sign-in-reference.png"
      sideImageAlt="Role based CRM reset password reference"
      footerHint="Link geldikten sonra yeni sifreni guvenli belirle."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
