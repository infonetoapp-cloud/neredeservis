import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ProfileOnboardingForm } from "@/components/auth/profile-onboarding-form";

export default function ProfileOnboardingPage() {
  return (
    <AuthPageShell
      scopeLabel="Profile Onboarding"
      title="Complete your profile"
      description="Şirket panelinde gorunecek temel profil bilgisini tamamla"
      topPrompt="Zaten tamamladin mi?"
      topLinkLabel="Giriş Yap"
      topLinkHref="/giris"
      sideImageSrc="/figma/sign-up-reference.png"
      sideImageAlt="Role based CRM profile setup reference"
      footerHint="Bu bilgi tüm şirket modullerinde görünür."
    >
      <ProfileOnboardingForm />
    </AuthPageShell>
  );
}

