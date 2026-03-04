import type { Metadata } from "next";
import { LandingCmsPanel } from "@/components/platform/landing/landing-cms-panel";

export const metadata: Metadata = {
  title: "Ana Sayfa Yönetimi — NeredeServis Platform",
};

export default function PlatformLandingPage() {
  return <LandingCmsPanel />;
}
