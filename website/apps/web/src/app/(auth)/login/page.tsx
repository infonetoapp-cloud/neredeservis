import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      scopeLabel="Login"
      title="Welcome back!"
      description="Company operasyon paneline giris yapin"
      topPrompt="Hesabin yok mu?"
      topLinkLabel="Kayit Ol"
      topLinkHref="/register"
      sideImageSrc="/figma/sign-in-reference.png"
      sideImageAlt="Role based CRM sign in reference"
      footerHint="Sadece sirket paneli girisi aktif."
    >
      <LoginForm />
    </AuthPageShell>
  );
}
