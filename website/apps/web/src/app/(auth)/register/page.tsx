import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      scopeLabel="Register"
      title="Hesabını oluştur"
      description="Şirket operasyon paneli için yeni hesap oluştur"
      topPrompt="Zaten hesabın var mı?"
      topLinkLabel="Giriş Yap"
      topLinkHref="/giris"
      sideImageSrc="/figma/sign-up-reference.png"
      sideImageAlt="Role based CRM sign up reference"
      footerHint="Kayıt sonrası e-posta doğrulama adımına geçilir."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
