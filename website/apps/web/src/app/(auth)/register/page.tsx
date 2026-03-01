import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      scopeLabel="Register"
      title="Create your account"
      description="Sirket operasyon paneli icin yeni hesap olustur"
      topPrompt="Zaten hesabin var mi?"
      topLinkLabel="Giris Yap"
      topLinkHref="/login"
      sideImageSrc="/figma/sign-up-reference.png"
      sideImageAlt="Role based CRM sign up reference"
      sideQuote='"With NovaCRM, your customer relationship can be enjoyable as your product."'
      sideQuoteAuthor="Ntakulunda Cathy"
      footerHint="Kayit sonrasi e-posta dogrulama adimina gecilir."
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
