export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "http://example.com";
  const appId = import.meta.env.VITE_APP_ID || "dev-app-id";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // In case of invalid URL or missing env
  let baseUrl = oauthPortalUrl;
  try {
    new URL(baseUrl);
  } catch (e) {
    baseUrl = "http://example.com";
  }

  const url = new URL(`${baseUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
