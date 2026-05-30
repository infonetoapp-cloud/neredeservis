import { HttpError } from "./http.js";

export function requirePlatformOwner(decodedToken) {
  const ownerUid = process.env.PLATFORM_OWNER_UID?.trim() ?? "";
  if (!ownerUid) {
    throw new HttpError(500, "internal", "PLATFORM_OWNER_UID sunucu degiskeni tanimlanmamis.");
  }

  if (!decodedToken?.uid || decodedToken.uid !== ownerUid) {
    throw new HttpError(
      403,
      "permission-denied",
      "Bu islem yalnizca platform sahibi tarafindan yapilabilir.",
    );
  }
}
