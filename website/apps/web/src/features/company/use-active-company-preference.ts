"use client";

import { useEffect, useState } from "react";

import {
  readActiveCompanyPreference,
  subscribeActiveCompanyPreference,
  type ActiveCompanyPreference,
} from "@/features/company/company-preferences";

export function useActiveCompanyPreference() {
  const [activeCompany, setActiveCompany] = useState<ActiveCompanyPreference | null>(() =>
    readActiveCompanyPreference(),
  );

  useEffect(() => {
    return subscribeActiveCompanyPreference(() => {
      setActiveCompany(readActiveCompanyPreference());
    });
  }, []);

  return activeCompany;
}
