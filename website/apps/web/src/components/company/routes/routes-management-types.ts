import type { CompanyRouteTimeSlot } from "@/features/company/company-client";

export type RouteTimeSlotOption = Exclude<CompanyRouteTimeSlot, null>;

export type RouteDraft = {
  name: string;
  scheduledTime: string;
  timeSlot: RouteTimeSlotOption;
  allowGuestTracking: boolean;
  isArchived: boolean;
};
