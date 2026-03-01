import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function ShieldLockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 4 6v6c0 5 3.5 8.6 8 9.8 4.5-1.2 8-4.8 8-9.8V6l-8-3Z" />
      <rect x="9.25" y="11" width="5.5" height="4.75" rx="1" />
      <path d="M10.5 11V9.9a1.5 1.5 0 1 1 3 0V11" />
    </BaseIcon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h16" />
      <path d="M6 20V7l6-3 6 3v13" />
      <path d="M9 9h1M14 9h1M9 12h1M14 12h1M11 20v-4h2v4" />
    </BaseIcon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="7" y="2.75" width="10" height="18.5" rx="2.25" />
      <path d="M11 5.75h2M11.25 18.5h1.5" />
    </BaseIcon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Zm14-3 .6 1.6L21 15l-1.4.4L19 17l-.6-1.6L17 15l1.4-.4L19 13Z" />
    </BaseIcon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </BaseIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="10.5" width="14" height="10.25" rx="2" />
      <path d="M8 10.5V8.75a4 4 0 1 1 8 0v1.75" />
      <path d="M12 14.5v2.5" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.25 12.2 2.3 2.3 5.2-5.2" />
    </BaseIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 12a8 8 0 0 0-13.7-5.6L4 8.75M4 8.75V4.5M4 8.75h4.25" />
      <path d="M4 12a8 8 0 0 0 13.7 5.6L20 15.25M20 15.25v4.25M20 15.25h-4.25" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </BaseIcon>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="5.25" rx="1.5" />
      <rect x="13" y="11.5" width="7.5" height="9" rx="1.5" />
      <rect x="3.5" y="13.75" width="7.5" height="6.75" rx="1.5" />
    </BaseIcon>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12h4l2-4 3 8 2-4h7" />
    </BaseIcon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6h2a2 2 0 0 1 2 2v2.5a2 2 0 0 0 2 2H16" />
    </BaseIcon>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 14.5h17l-1.5-5.5a2.5 2.5 0 0 0-2.4-1.8H7.4A2.5 2.5 0 0 0 5 9l-1.5 5.5Z" />
      <circle cx="7.5" cy="16.75" r="1.75" />
      <circle cx="16.5" cy="16.75" r="1.75" />
    </BaseIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8.5" r="2.5" />
      <circle cx="16.5" cy="9.5" r="2" />
      <path d="M4.5 19a5 5 0 0 1 9 0M14 19a4 4 0 0 1 6 0" />
    </BaseIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H10" />
      <path d="M14 8.25 19 12l-5 3.75" />
      <path d="M19 12H9" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m16 16 3.75 3.75" />
    </BaseIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.5 10.25a5.5 5.5 0 1 1 11 0V15l1.5 2.25H5L6.5 15v-4.75Z" />
      <path d="M10 18.25a2 2 0 0 0 4 0" />
    </BaseIcon>
  );
}
