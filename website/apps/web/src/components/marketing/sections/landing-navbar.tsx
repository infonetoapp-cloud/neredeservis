"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { NsLogo } from "@/components/brand/ns-logo";
import type { LandingNavbarConfig } from "../landing-config-types";

interface Props {
  navbar: LandingNavbarConfig;
}

export function LandingNavbar({ navbar }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-line bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <NsLogo iconSize={28} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navbar.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/giris"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Giriş Yap
          </Link>
          <Link
            href={navbar.ctaLink}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-strong hover:shadow-brand/30"
          >
            {navbar.ctaText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navbar.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-slate-600"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              <Link href="/giris" className="text-sm font-medium text-slate-600">
                Giriş Yap
              </Link>
              <Link
                href={navbar.ctaLink}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
              >
                {navbar.ctaText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
