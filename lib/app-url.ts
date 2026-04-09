/**
 * Returns the stable canonical base URL of this application.
 *
 * Priority (highest → lowest):
 *  1. NEXTAUTH_URL             — already required for NextAuth; most reliable in prod.
 *  2. NEXT_PUBLIC_APP_URL      — explicit override (also works in browser context).
 *  3. VERCEL_PROJECT_PRODUCTION_URL — Vercel system var; stable across deployments
 *                                    (unlike VERCEL_URL which is per-deployment).
 *  4. http://localhost:3000    — dev fallback only.
 *
 * Throws in production if none of the first three are configured, so the error
 * surfaces clearly in Vercel logs instead of silently redirecting to localhost.
 *
 * IMPORTANT: Never use VERCEL_URL for Stripe redirects — it is the deployment-
 * specific URL and becomes a 404 (DEPLOYMENT_NOT_FOUND) once that deployment
 * is replaced by a newer one.
 */
export function getAppUrl(): string {
  const url =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[getAppUrl] No stable base URL found in production. " +
          "Set NEXTAUTH_URL in your Vercel environment variables to your " +
          "production domain (e.g. https://yourdomain.com). " +
          "Do NOT use VERCEL_URL — it changes with every deployment and will " +
          "cause DEPLOYMENT_NOT_FOUND errors after Stripe redirects."
      );
    }
    return "http://localhost:3000";
  }

  // Strip trailing slash so callers can safely append paths.
  return url.replace(/\/$/, "");
}
