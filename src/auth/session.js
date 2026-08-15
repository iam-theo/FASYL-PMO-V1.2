/**
 * Shared session-expiry handling.
 *
 * Both HTTP clients (src/api.js and the reports module's httpClient) and the
 * realtime socket can discover an expired token independently, so the
 * logout+redirect lives in one place to guarantee identical behaviour no
 * matter which transport noticed first.
 */

/** Clears the persisted session. Safe to call when there is nothing to clear. */
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Logs the user out and sends them back to the login screen.
 *
 * Guarded: without a token we were never signed in, and wiping + reloading
 * produces a redirect loop that looks like broken login (e.g. a wrong password
 * on the SignIn form).
 */
export const handleSessionExpired = () => {
  if (!localStorage.getItem("token")) return;
  clearSession();
  window.location.assign("/");
};

/** Login attempts must never trigger the session-expired redirect. */
export const isLoginRequest = (config) =>
  config?.url?.includes("/auth/login");
