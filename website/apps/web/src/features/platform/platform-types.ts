/**
 * Platform panel veri tipleri.
 * Backend callable'lar hazır olduğunda bu tipler API response'larına hizalanacak.
 */

export type PlatformCompanyStatus = "active" | "suspended";

export type PlatformCompanySummary = {
  id: string;
  name: string;
  ownerEmail: string;
  ownerUid: string | null;
  status: PlatformCompanyStatus;
  vehicleLimit: number;
  vehicleCount: number;
  memberCount: number;
  routeCount: number;
  createdAt: string;
};

export type PlatformCompanyDetail = PlatformCompanySummary & {
  members: PlatformCompanyMember[];
  vehicles: PlatformCompanyVehicle[];
  routes: PlatformCompanyRoute[];
};

export type PlatformCompanyMember = {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  joinedAt: string;
};

export type PlatformCompanyVehicle = {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  capacity: number | null;
  status: "active" | "inactive";
};

export type PlatformCompanyRoute = {
  id: string;
  name: string;
  stopCount: number;
  passengerCount: number;
  status: "active" | "draft";
};

export type CreateCompanyInput = {
  companyName: string;
  ownerEmail: string;
  vehicleLimit: number;
};
