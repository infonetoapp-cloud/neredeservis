import { createNeredeServisSocialImage } from "@/lib/seo/social-image";

export const alt = "NeredeServis web operasyon paneli";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return createNeredeServisSocialImage({
    width: size.width,
    height: size.height,
    badgeLabel: "X Preview",
  });
}
