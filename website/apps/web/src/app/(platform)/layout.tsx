import type { ReactNode } from "react";

import { PlatformOwnerGuard } from "@/components/platform/platform-owner-guard";
import { PlatformShellHeader } from "@/components/platform/platform-shell-header";
import { PlatformShellSidebar } from "@/components/platform/platform-shell-sidebar";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <PlatformShellSidebar />

        <div className="min-w-0">
          <PlatformShellHeader />
          <main className="p-4 sm:p-6">
            <ConfigValidationBanner scopeLabel="Platform Shell" />
            <PlatformOwnerGuard>{children}</PlatformOwnerGuard>
          </main>
        </div>
      </div>
    </div>
  );
}
