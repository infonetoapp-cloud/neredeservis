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
};
