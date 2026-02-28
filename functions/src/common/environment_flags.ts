const DEV_PROJECT_IDS = new Set(['neredeservis-dev-01']);

export function isDevelopmentProject(): boolean {
  const projectId =
    process.env.GCLOUD_PROJECT?.trim().toLowerCase() ??
    process.env.GOOGLE_CLOUD_PROJECT?.trim().toLowerCase() ??
    '';
  if (!projectId) {
    return false;
  }
  if (DEV_PROJECT_IDS.has(projectId)) {
    return true;
  }
  return projectId.includes('-dev-') || projectId.endsWith('-dev');
}

