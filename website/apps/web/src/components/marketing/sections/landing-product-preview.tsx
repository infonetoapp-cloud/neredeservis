import dynamic from "next/dynamic";
import type { LandingProductPreviewConfig } from "../landing-config-types";

/* Leaflet needs `window` — load client-only */
const GebzeLiveMap = dynamic(
  () => import("./gebze-live-map").then((m) => m.GebzeLiveMap),
  { ssr: false, loading: () => <div className="h-[340px] w-full animate-pulse bg-slate-100 sm:h-[380px]" /> },
);

interface Props {
  preview: LandingProductPreviewConfig;
}

export function LandingProductPreview({ preview }: Props) {
  if (!preview.visible) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-300" />
            <div className="h-3 w-3 rounded-full bg-amber-300" />
            <div className="h-3 w-3 rounded-full bg-green-300" />
            <div className="ml-4 flex-1 rounded-md bg-slate-200/60 px-3 py-1 text-xs text-slate-400">
              app.neredeservis.app/c/dashboard
            </div>
          </div>

          {/* Content */}
          {preview.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.screenshotUrl} alt="NeredeServis Dashboard" className="w-full" />
          ) : (
            <div className="p-6">
              {/* KPI cards */}
              <div className="grid gap-3 sm:grid-cols-4">
                <MockCard label="Aktif Sefer" value="24" dot="bg-teal-400" />
                <MockCard label="Canlı Araç" value="18" dot="bg-sky-400" />
                <MockCard label="Toplam Rota" value="42" dot="bg-amber-400" />
                <MockCard label="Şoför" value="31" dot="bg-violet-400" />
              </div>

              {/* Real Gebze map with animated vehicles — OpenStreetMap, zero cost */}
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                <GebzeLiveMap />
              </div>
            </div>
          )}
        </div>
        {preview.caption && (
          <p className="mt-4 text-center text-sm text-slate-400">{preview.caption}</p>
        )}
      </div>
    </section>
  );
}

/* ─── Old SVG map removed — replaced by GebzeLiveMap (Leaflet + OSM) ─────── */
function _GebzeMapSvg_DEPRECATED() {
  // Road paths reused for both rendering and animateMotion
  const d100 = "M 0,195 C 120,192 240,197 360,193 C 480,189 600,195 720,192";
  const tem  = "M 0,138 C 150,134 300,140 450,136 C 580,132 660,136 720,135";
  const con1 = "M 218,0 C 220,60 216,120 218,195 C 220,260 216,300 218,350";
  const con2 = "M 460,136 C 462,158 458,178 460,195 C 462,240 458,310 460,380";

  return (
    <svg
      viewBox="0 0 720 320"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      style={{ display: "block", background: "#F0F9FF" }}
    >
      {/* ── Sea (İzmit Körfezi) ── */}
      <path
        d="M 0,280 C 180,270 360,276 540,272 C 630,270 690,273 720,272 L 720,320 L 0,320 Z"
        fill="#BAE6FD"
        opacity="0.55"
      />

      {/* ── City block grid (faint) ── */}
      {[80, 140, 200, 260, 320, 380, 440, 500, 560, 620].map((x) => (
        <line key={`vg${x}`} x1={x} y1="0" x2={x} y2="280" stroke="#E2E8F0" strokeWidth="0.5" />
      ))}
      {[60, 110, 160, 210, 260].map((y) => (
        <line key={`hg${y}`} x1="0" y1={y} x2="720" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
      ))}

      {/* ── Block fills ── */}
      {[
        [90,62,100,42],[210,62,80,42],[330,62,90,42],[450,62,100,42],[570,62,110,42],
        [90,115,80,36],[210,115,70,36],[360,115,80,36],[580,115,100,36],
        [90,210,70,50],[180,210,90,50],[300,210,80,50],[420,210,100,50],[540,210,80,50],
      ].map(([x,y,w,h], i) => (
        <rect key={`b${i}`} x={x} y={y} width={w} height={h} rx="3" fill="#EFF6FF" stroke="#E2E8F0" strokeWidth="0.8" />
      ))}

      {/* ── Road backgrounds ── */}
      <path d={tem}  fill="none" stroke="#CBD5E1" strokeWidth="14" strokeLinecap="round" />
      <path d={d100} fill="none" stroke="#CBD5E1" strokeWidth="18" strokeLinecap="round" />
      <path d={con1} fill="none" stroke="#CBD5E1" strokeWidth="10" strokeLinecap="round" />
      <path d={con2} fill="none" stroke="#CBD5E1" strokeWidth="10" strokeLinecap="round" />
      <path d="M 460,195 C 510,193 560,196 600,194 C 640,192 680,195 720,193" fill="none" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />

      {/* ── Road surfaces (white) ── */}
      <path d={tem}  fill="none" stroke="white" strokeWidth="8"  strokeLinecap="round" />
      <path d={d100} fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" />
      <path d={con1} fill="none" stroke="white" strokeWidth="5"  strokeLinecap="round" />
      <path d={con2} fill="none" stroke="white" strokeWidth="5"  strokeLinecap="round" />
      <path d="M 460,195 C 510,193 560,196 600,194 C 640,192 680,195 720,193" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />

      {/* ── Road labels ── */}
      <text x="30" y="188" fontSize="8" fill="#94A3B8" fontWeight="600" letterSpacing="1">D-100</text>
      <text x="30" y="131" fontSize="7" fill="#94A3B8" fontWeight="600" letterSpacing="1">TEM</text>

      {/* ── Route lines (vehicle paths, semi-transparent) ── */}
      <path d={d100} fill="none" stroke="#0D9488" strokeWidth="2" strokeDasharray="6 4" opacity="0.25" />
      <path d={tem}  fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="6 4" opacity="0.25" />
      <path d={`${con1} ${d100.replace("M", "L").split("C")[0]}`} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 4" opacity="0.2" />

      {/* ── Animated vehicles ── */}

      {/* S-01 — teal, D-100 W→E */}
      <g>
        <circle r="7" fill="#0D9488" stroke="white" strokeWidth="1.5" opacity="0.95">
          <animateMotion dur="9s" repeatCount="indefinite" path={d100} rotate="auto" />
        </circle>
        <text fontSize="5.5" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700">
          <animateMotion dur="9s" repeatCount="indefinite" path={d100} rotate="auto" />
          S1
        </text>
      </g>

      {/* S-02 — sky, TEM E→W */}
      <g>
        <circle r="7" fill="#0EA5E9" stroke="white" strokeWidth="1.5" opacity="0.95">
          <animateMotion dur="13s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"
            path={tem} rotate="auto" />
        </circle>
        <text fontSize="5.5" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700">
          <animateMotion dur="13s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear"
            path={tem} rotate="auto" />
          S2
        </text>
      </g>

      {/* S-03 — amber, south connector + D-100 */}
      <g>
        <circle r="7" fill="#F59E0B" stroke="white" strokeWidth="1.5" opacity="0.95">
          <animateMotion dur="11s" repeatCount="indefinite"
            path="M 218,0 C 220,60 216,120 218,195 C 340,192 460,190 600,193 C 660,194 700,192 720,193"
            rotate="auto" />
        </circle>
        <text fontSize="5.5" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700">
          <animateMotion dur="11s" repeatCount="indefinite"
            path="M 218,0 C 220,60 216,120 218,195 C 340,192 460,190 600,193 C 660,194 700,192 720,193"
            rotate="auto" />
          S3
        </text>
      </g>

      {/* S-04 — violet, short city loop */}
      <g>
        <circle r="7" fill="#7C3AED" stroke="white" strokeWidth="1.5" opacity="0.95">
          <animateMotion dur="7s" repeatCount="indefinite" begin="2s"
            path="M 460,136 C 462,158 458,178 460,195 C 380,192 300,194 218,195 L 218,136 C 300,138 380,136 460,136"
            rotate="auto" />
        </circle>
        <text fontSize="5.5" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700">
          <animateMotion dur="7s" repeatCount="indefinite" begin="2s"
            path="M 460,136 C 462,158 458,178 460,195 C 380,192 300,194 218,195 L 218,136 C 300,138 380,136 460,136"
            rotate="auto" />
          S4
        </text>
      </g>

      {/* ── Map attribution ── */}
      <text x="710" y="316" fontSize="6" fill="#94A3B8" textAnchor="end">Gebze, Kocaeli</text>
    </svg>
  );
}

function MockCard({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
