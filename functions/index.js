import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";

setGlobalOptions({
  region: "europe-west3",
  timeoutSeconds: 30,
  memory: "256MiB",
});

export const healthCheck = onCall(() => {
  return {
    ok: true,
    timestamp: Date.now(),
    region: "europe-west3",
  };
});
