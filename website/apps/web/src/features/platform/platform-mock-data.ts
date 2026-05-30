import type {
  PlatformCompanySummary,
  PlatformCompanyDetail,
} from "@/features/platform/platform-types";

/**
 * Mock veri. Backend callable'lar hazır olduğunda bu dosya silinecek,
 * gerçek API çağrıları platform-callables.ts üzerinden yapılacak.
 */

export const MOCK_COMPANIES: PlatformCompanySummary[] = [
  {
    id: "comp_001",
    name: "Atlas Servis A.S.",
    ownerEmail: "yonetim@atlasservis.com",
    ownerUid: "uid_atlas_owner",
    status: "active",
    vehicleLimit: 25,
    vehicleCount: 18,
    memberCount: 12,
    routeCount: 8,
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "comp_002",
    name: "Yildiz Ulasim Ltd.",
    ownerEmail: "info@yildizulasim.com",
    ownerUid: "uid_yildiz_owner",
    status: "active",
    vehicleLimit: 10,
    vehicleCount: 10,
    memberCount: 6,
    routeCount: 4,
    createdAt: "2025-02-20T14:30:00Z",
  },
  {
    id: "comp_003",
    name: "Deniz Tasimacilik",
    ownerEmail: "operasyon@deniztasima.com",
    ownerUid: null,
    status: "suspended",
    vehicleLimit: 5,
    vehicleCount: 3,
    memberCount: 2,
    routeCount: 1,
    createdAt: "2025-03-10T09:15:00Z",
  },
  {
    id: "comp_004",
    name: "Anadolu Personel Tasimacilik",
    ownerEmail: "admin@anadolupersonel.com",
    ownerUid: "uid_anadolu_owner",
    status: "active",
    vehicleLimit: 50,
    vehicleCount: 32,
    memberCount: 20,
    routeCount: 15,
    createdAt: "2024-11-05T08:00:00Z",
  },
];

export function getMockCompanyDetail(companyId: string): PlatformCompanyDetail | null {
  const summary = MOCK_COMPANIES.find((c) => c.id === companyId);
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    members: [
      {
        uid: summary.ownerUid ?? "uid_placeholder",
        email: summary.ownerEmail,
        displayName: summary.name.split(" ")[0] + " Yönetici",
        role: "owner",
        status: "active",
        joinedAt: summary.createdAt,
      },
      {
        uid: "uid_member_1",
        email: "sofor1@" + summary.ownerEmail.split("@")[1],
        displayName: "Ahmet Şoför",
        role: "member",
        status: "active",
        joinedAt: "2025-03-01T10:00:00Z",
      },
      {
        uid: "uid_member_2",
        email: "sofor2@" + summary.ownerEmail.split("@")[1],
        displayName: "Mehmet Şoför",
        role: "member",
        status: "active",
        joinedAt: "2025-03-15T10:00:00Z",
      },
    ],
    vehicles: [
      {
        id: "veh_001",
        plate: "34 ABC 123",
        brand: "Mercedes",
        model: "Sprinter",
        capacity: 16,
        status: "active",
      },
      {
        id: "veh_002",
        plate: "34 DEF 456",
        brand: "Ford",
        model: "Transit",
        capacity: 14,
        status: "active",
      },
      {
        id: "veh_003",
        plate: "06 GHI 789",
        brand: "Iveco",
        model: "Daily",
        capacity: 20,
        status: "inactive",
      },
    ],
    routes: [
      {
        id: "route_001",
        name: "Kadikoy - Atasehir Sabah",
        stopCount: 8,
        passengerCount: 12,
        status: "active",
      },
      {
        id: "route_002",
        name: "Kadikoy - Atasehir Aksam",
        stopCount: 8,
        passengerCount: 10,
        status: "active",
      },
      {
        id: "route_003",
        name: "Besiktas - Levent",
        stopCount: 5,
        passengerCount: 0,
        status: "draft",
      },
    ],
  };
}

