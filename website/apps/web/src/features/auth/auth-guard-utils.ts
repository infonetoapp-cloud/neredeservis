import type { AuthSessionUser } from "@/features/auth/auth-session-types";

function hasPasswordProvider(user: AuthSessionUser | null): boolean {
  if (!user) {
    return false;
  }
  return user.providerData.some((provider) => provider.providerId === "password");
}

export function requiresEmailVerification(user: AuthSessionUser | null): boolean {
  if (!user) {
    return false;
  }
  if (!hasPasswordProvider(user)) {
    return false;
  }
  return !user.emailVerified;
}

export function requiresProfileOnboarding(user: AuthSessionUser | null): boolean {
  if (!user) {
    return false;
  }
  const displayName = user.displayName?.trim() ?? "";
  return displayName.length < 2;
}
