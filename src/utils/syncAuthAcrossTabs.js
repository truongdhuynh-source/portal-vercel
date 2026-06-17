import Cookies from "js-cookie";
import {
  LOGOUT_SYNC_KEY,
  PENDING_LOGOUT_KEY,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_VINA,
  USER_ODA,
} from "../constants";
import getUserIdLogin from "./getUserIdLogin";

let isRedirectingToLogin = false;

const setPendingLogout = () => {
  try {
    sessionStorage.setItem(PENDING_LOGOUT_KEY, "1");
  } catch (e) {
    console.error("Failed to set pending logout flag.", e);
  }
};

const clearPendingLogout = () => {
  try {
    sessionStorage.removeItem(PENDING_LOGOUT_KEY);
  } catch (e) {
    console.error("Failed to clear pending logout flag.", e);
  }
};

const hasPendingLogout = () => {
  try {
    return sessionStorage.getItem(PENDING_LOGOUT_KEY) === "1";
  } catch (e) {
    console.error("Failed to read pending logout flag.", e);
    return false;
  }
};

const hasValidAuthInCurrentTab = () => {
  try {
    const userId = getUserIdLogin();
    if (!userId) return false;

    const accessToken = Cookies.get(`${ACCESS_TOKEN_KEY}_${userId}`);
    const refreshToken = Cookies.get(`${REFRESH_TOKEN_KEY}_${userId}`);
    if (!accessToken || !refreshToken) return false;

    const vinaUserRaw = localStorage.getItem(`${USER_VINA}_${userId}`);
    const odaUserRaw = localStorage.getItem(`${USER_ODA}_${userId}`);
    if (!vinaUserRaw || !odaUserRaw) return false;

    const odaUser = JSON.parse(odaUserRaw);
    return Boolean(odaUser?.tokenInfo?.token);
  } catch (e) {
    console.error("Failed to validate auth in current tab.", e);
    return false;
  }
};

const redirectToPortalLogin = ({
  isApp = false,
  sharedFiles = false,
  fallbackLang = "en",
  deferIfHidden = false,
} = {}) => {
  if (typeof window === "undefined") return;
  if (isRedirectingToLogin) return;

  if (deferIfHidden && document.visibilityState === "hidden") {
    setPendingLogout();
    return;
  }

  const currentPath = window.location.pathname || "";
  if (currentPath.endsWith("/login")) return;

  isRedirectingToLogin = true;

  const scope = localStorage.getItem("scope");
  // const lang = localStorage.getItem("i18nextLng") || fallbackLang || "en";
  const params = new URLSearchParams({ isPortal: "true" });

  if (isApp) params.append("isApp", "true");
  if (sharedFiles) params.append("sharedFiles", "true");

  const portalBaseUrl =
    scope === "global"
      ? import.meta.env.VITE_APP_VINACAD_APP_URL_G
      : import.meta.env.VITE_APP_VINACAD_APP_URL;

  window.location.href = `${portalBaseUrl}/login?${params.toString()}`;
};

const setupDeferredLogoutSync = ({ getFallbackLang } = {}) => {
  if (typeof window === "undefined") return () => {};

  const resolveFallbackLang = () =>
    (typeof getFallbackLang === "function" ? getFallbackLang() : "en") || "en";

  const redirectIfPendingLogout = () => {
    if (!hasPendingLogout()) return;

    if (hasValidAuthInCurrentTab()) {
      clearPendingLogout();
      return;
    }

    clearPendingLogout();
    redirectToPortalLogin({ fallbackLang: resolveFallbackLang() });
  };

  const onStorageLogoutSync = (event) => {
    if (event.key !== LOGOUT_SYNC_KEY || !event.newValue) return;
    setPendingLogout();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      redirectIfPendingLogout();
    }
  };

  const onFocus = () => {
    redirectIfPendingLogout();
  };

  window.addEventListener("storage", onStorageLogoutSync);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibilityChange);

  redirectIfPendingLogout();

  return () => {
    window.removeEventListener("storage", onStorageLogoutSync);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
};

export {
  hasPendingLogout,
  clearPendingLogout,
  setPendingLogout,
  setupDeferredLogoutSync,
};
export default redirectToPortalLogin;
