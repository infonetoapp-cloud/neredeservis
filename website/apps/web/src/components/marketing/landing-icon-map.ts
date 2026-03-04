import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Route,
  Car,
  Users,
  Shield,
  FileSpreadsheet,
  Zap,
  Bus,
  Globe,
  Clock,
  BarChart3,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  Star,
  Heart,
  Lock,
  Bell,
  Calendar,
  Settings,
  Truck,
  Navigation,
  Compass,
  Target,
  Award,
  TrendingUp,
  Headphones,
  Building2,
} from "lucide-react";

/* ================================================================== */
/*  Icon whitelist map — tree-shake safe                                */
/*  Only these ~30 icons are included in the bundle                    */
/*  Admin CMS icon picker shows this list                              */
/* ================================================================== */

export const LANDING_ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  Route,
  Car,
  Users,
  Shield,
  FileSpreadsheet,
  Zap,
  Bus,
  Globe,
  Clock,
  BarChart3,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Star,
  Heart,
  Lock,
  Bell,
  Calendar,
  Settings,
  Truck,
  Navigation,
  Compass,
  Target,
  Award,
  TrendingUp,
  Headphones,
  Building2,
  HelpCircle,
};

/** Resolve icon name to component, fallback to HelpCircle */
export function resolveIcon(name: string): LucideIcon {
  return LANDING_ICON_MAP[name] ?? HelpCircle;
}

/** All available icon names for CMS picker */
export const AVAILABLE_ICON_NAMES = Object.keys(LANDING_ICON_MAP);
