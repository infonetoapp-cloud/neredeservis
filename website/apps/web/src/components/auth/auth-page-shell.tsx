import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { FirebaseClientBootstrapProbe } from "@/components/auth/firebase-client-bootstrap-probe";
import { ArrowRightIcon } from "@/components/shared/app-icons";
import { ConfigValidationBanner } from "@/components/shared/config-validation-banner";

type Props = {
  scopeLabel: string;
  title: string;
  description: string;
  topPrompt: string;
  topLinkLabel: string;
  topLinkHref: string;
  sideImageSrc: string;
  sideImageAlt: string;
  sideQuote?: string;
  sideQuoteAuthor?: string;
  footerHint: string;
  children: ReactNode;
};

export function AuthPageShell({
  scopeLabel,
  title,
  description,
  topPrompt,
  topLinkLabel,
  topLinkHref,
  sideImageSrc,
  sideImageAlt,
  sideQuote,
  sideQuoteAuthor,
  footerHint,
  children,
}: Props) {
  return (
    <main className="app-auth-bg min-h-screen px-4 py-6 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1360px] items-center">
        <section className="grid w-full overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_3px_14px_rgba(16,24,40,0.08)] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="fade-slide-in p-6 sm:p-10 lg:p-12">
            <div className="mb-10 flex items-center justify-between text-sm">
              <div className="text-base font-bold text-[#0f9ea0]">NeredeServis</div>
              <div className="text-right text-[#8b9098]">
                {topPrompt}{" "}
                <Link href={topLinkHref} className="font-semibold text-[#2f3237] hover:opacity-75">
                  {topLinkLabel}
                </Link>
              </div>
            </div>

            <div className="mx-auto max-w-[420px]">
              <h1 className="text-center text-[40px] font-semibold tracking-tight text-[#2f3237] sm:text-[46px]">
                {title}
              </h1>
              <p className="mt-2 text-center text-base text-[#7f8691]">{description}</p>

              <div className="mt-6">
                <ConfigValidationBanner scopeLabel={scopeLabel} />
                <div className="mb-4">
                  <FirebaseClientBootstrapProbe />
                </div>
                {children}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-xs text-[#8b9098]">{footerHint}</span>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 font-semibold text-[#4c5561] transition hover:opacity-75"
                >
                  Ana sayfa
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative hidden min-h-[700px] border-l border-line bg-[#eceff2] lg:block">
            <Image src={sideImageSrc} alt={sideImageAlt} fill className="object-cover object-right" priority />
            {sideQuote ? (
              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/45 bg-black/25 p-4 text-white backdrop-blur-sm">
                <p className="text-sm leading-6">{sideQuote}</p>
                {sideQuoteAuthor ? <p className="mt-3 text-xs font-semibold">{sideQuoteAuthor}</p> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
