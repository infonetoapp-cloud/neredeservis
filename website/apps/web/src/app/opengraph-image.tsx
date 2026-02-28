import { createNeredeServisSocialImage } from "@/lib/seo/social-image";

export const alt = "NeredeServis web operasyon paneli";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createNeredeServisSocialImage({
    width: size.width,
    height: size.height,
    badgeLabel: "Open Graph",
  });
}
