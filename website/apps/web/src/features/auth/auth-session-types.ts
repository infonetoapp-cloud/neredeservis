"use client";

export type AuthSessionProviderInfo = {
  providerId: string | null;
};

export type AuthSessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  providerData: AuthSessionProviderInfo[];
  signInProvider?: string | null;
  role?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  photoPath?: string | null;
  mobileOnlyAuth?: boolean;
  webPanelAccess?: boolean | null;
  isAnonymous?: boolean;
};
