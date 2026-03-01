type IconProps = {
  className?: string;
};

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.76-.07-1.49-.2-2.2H12v4.16h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.99-4.28 2.99-7.48Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.22-2.5c-.9.6-2.04.96-3.41.96-2.62 0-4.83-1.76-5.62-4.13H3.05v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.38 13.9a6 6 0 0 1 0-3.8V7.52H3.05a10 10 0 0 0 0 8.96l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.9 9.9 0 0 0 12 2 10 10 0 0 0 3.05 7.52l3.33 2.58C7.17 7.74 9.38 5.98 12 5.98Z"
      />
    </svg>
  );
}

export function MicrosoftIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
      focusable="false"
    >
      <path fill="#F25022" d="M2 2h9v9H2z" />
      <path fill="#00A4EF" d="M13 2h9v9h-9z" />
      <path fill="#7FBA00" d="M2 13h9v9H2z" />
      <path fill="#FFB900" d="M13 13h9v9h-9z" />
    </svg>
  );
}
