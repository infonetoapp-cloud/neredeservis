import type { User } from "firebase/auth";

function hasPasswordProvider(user: User | null): boolean {
  if (!user) {
    return false;
  }
  return user.providerData.some((provider) => provider.providerId === "password");
}

export function requiresEmailVerification(user: User | null): boolean {
  if (!user) {
    return false;
  }
  if (!hasPasswordProvider(user)) {
    return false;
  }
  return !user.emailVerified;
}

export function requiresProfileOnboarding(user: User | null): boolean {
  if (!user) {
    return false;
  }
  const displayName = user.displayName?.trim() ?? "";
  return displayName.length < 2;
}
