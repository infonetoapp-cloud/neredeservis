interface NsLogoMarkProps {
  /** Icon height in px. Width auto scales. */
  height?: number;
  /** Optional className passthrough for the SVG element. */
  className?: string;
  /** Color preset for icon strokes/fill. */
  tone?: "brand" | "dark" | "light";
}

interface NsLogoProps {
  /** Icon height in px. Default 28. */
  iconSize?: number;
  /** Show "Nerede Servis" wordmark text. Default true. */
  showWordmark?: boolean;
  /** Extra classes on the wordmark wrapper <span>. */
  wordmarkClass?: string;
  /** Shared tone for icon and wordmark. */
  tone?: "brand" | "dark" | "light";
}

const LOGO_TONES = {
  brand: {
    stroke: "#0A4FBF",
    dot: "#FF7A00",
    word: "#0F172A",
    accent: "#0A4FBF",
  },
  dark: {
    stroke: "#1F2937",
    dot: "#FF7A00",
    word: "#1F2937",
    accent: "#0A4FBF",
  },
  light: {
    stroke: "#F8FAFC",
    dot: "#FFB26B",
    word: "#F8FAFC",
    accent: "#8DEBFF",
  },
} as const;

/**
 * Pin mark inspired by the approved stacked logo draft.
 * Cleaned for small-size legibility (navbar, mobile header, sidebar).
 */
export function NsLogoMark({ height = 28, className, tone = "brand" }: NsLogoMarkProps) {
  const colors = LOGO_TONES[tone];
  const width = Math.round((height * 64) / 72);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 72"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 5.5C18.8 5.5 8 16.3 8 29.5c0 18.2 24 36 24 36s24-17.8 24-36C56 16.3 45.2 5.5 32 5.5Z"
        stroke={colors.stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 17.5c-6.9 0-12.5 5.6-12.5 12.5 0 9.3 12.5 20.9 12.5 20.9S44.5 39.3 44.5 30c0-6.9-5.6-12.5-12.5-12.5Z"
        stroke={colors.stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 26c-3.2 0-5.8 2.6-5.8 5.8 0 2.2 1.1 3.8 2.9 5.8L32 41l3.2-4.1"
        stroke={colors.stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="31.8" r="1.9" fill={colors.dot} />
    </svg>
  );
}

export function NsLogo({
  iconSize = 28,
  showWordmark = true,
  wordmarkClass = "text-lg font-bold tracking-tight",
  tone = "brand",
}: NsLogoProps) {
  const colors = LOGO_TONES[tone];

  return (
    <span className="inline-flex items-center gap-2.5">
      <NsLogoMark height={iconSize} tone={tone} />
      {showWordmark ? (
        <span className={wordmarkClass}>
          <span style={{ color: colors.word }}>Nerede </span>
          <span style={{ color: colors.accent }}>Servis</span>
        </span>
      ) : null}
    </span>
  );
}
