import Link from "next/link";
import { Bus } from "lucide-react";
import type { LandingFooterConfig } from "../landing-config-types";

interface Props {
  footer: LandingFooterConfig;
}

export function LandingFooter({ footer }: Props) {
  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600">
                <Bus className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Nerede<span className="text-teal-400">Servis</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
              {footer.brandDescription}
            </p>
          </div>

          {/* Dynamic columns */}
          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-200">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-slate-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">{footer.copyrightText}</p>
          <div className="flex gap-6">
            <Link href="/gizlilik" className="text-xs text-slate-500 transition hover:text-slate-300">
              Gizlilik
            </Link>
            <Link href="/kvkk" className="text-xs text-slate-500 transition hover:text-slate-300">
              KVKK
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
