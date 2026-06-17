export const OCIS_PROVIDER_KEY = "ocis";

const OCIS_OAUTH_STORAGE_KEY = "storage_ocis_oauth";
const OCIS_CALLBACK_PROVIDER_PARAM = "storage_provider";
const OCIS_CALLBACK_PROVIDER_VALUE = "ocis";
const DEFAULT_OCIS_CLIENT_ID = "vinacad-portal";
const DEFAULT_OCIS_PROMPT = "select_account consent";
const DEFAULT_OCIS_SCOPE = "openid profile email offline_access";

const getEnvValue = (key) => String(import.meta.env[key] || "").trim();

const toBase64Url = (bytes) => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const randomString = (byteLength = 48) => {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

const createCodeChallenge = async (codeVerifier) => {
  const bytes = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return toBase64Url(new Uint8Array(digest));
};

export const normalizeOcisServerUrl = (serverUrl) => {
  const url = new URL(String(serverUrl || "").trim());

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Please enter a valid URL");
  }

  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "");

  return url.toString().replace(/\/+$/, "");
};

export const getDefaultOcisConfig = () => ({
  clientId: getEnvValue("VITE_APP_OCIS_CLIENT_ID") || DEFAULT_OCIS_CLIENT_ID,
  prompt: getEnvValue("VITE_APP_OCIS_PROMPT") || DEFAULT_OCIS_PROMPT,
  scope: getEnvValue("VITE_APP_OCIS_SCOPE") || DEFAULT_OCIS_SCOPE,
  serverUrl: getEnvValue("VITE_APP_OCIS_SERVER_URL"),
});

export const buildOcisRedirectUri = () => {
  const configuredRedirectUri = getEnvValue("VITE_APP_OCIS_REDIRECT_URI");

  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  const url = new URL("/storage-cloud", window.location.origin);
  url.searchParams.set(
    OCIS_CALLBACK_PROVIDER_PARAM,
    OCIS_CALLBACK_PROVIDER_VALUE,
  );
  return url.toString();
};

export const isOcisOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get(OCIS_CALLBACK_PROVIDER_PARAM) === OCIS_CALLBACK_PROVIDER_VALUE
  );
};

export const readOcisOAuthCallback = () => {
  if (!isOcisOAuthCallback()) return null;

  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get("code"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
    state: params.get("state"),
  };
};

export const clearOcisOAuthCallbackUrl = () => {
  const url = new URL(window.location.href);
  [
    OCIS_CALLBACK_PROVIDER_PARAM,
    "code",
    "error",
    "error_description",
    "scope",
    "session_state",
    "state",
  ].forEach((key) => url.searchParams.delete(key));

  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
};

export const discoverOcisOidc = async (serverUrl) => {
  const discoveryUrl = new URL("/.well-known/openid-configuration", serverUrl);
  const response = await fetch(discoveryUrl.toString());

  if (!response.ok) {
    throw new Error("Unable to load OCIS OAuth configuration.");
  }

  const data = await response.json();

  if (!data.authorization_endpoint || !data.token_endpoint) {
    throw new Error("Invalid OCIS OAuth configuration.");
  }

  return data;
};

export const startOcisOAuth = async ({
  clientId,
  prompt,
  scope,
  serverUrl,
}) => {
  const normalizedServerUrl = normalizeOcisServerUrl(serverUrl);
  const normalizedClientId = String(clientId || DEFAULT_OCIS_CLIENT_ID).trim();

  const discovery = await discoverOcisOidc(normalizedServerUrl);
  const redirectUri = buildOcisRedirectUri();
  const state = randomString();
  const codeVerifier = randomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  sessionStorage.setItem(
    OCIS_OAUTH_STORAGE_KEY,
    JSON.stringify({
      clientId: normalizedClientId,
      codeVerifier,
      redirectUri,
      serverUrl: normalizedServerUrl,
      state,
      tokenEndpoint: discovery.token_endpoint,
    }),
  );

  const authUrl = new URL(discovery.authorization_endpoint);
  authUrl.searchParams.set("client_id", normalizedClientId);
  authUrl.searchParams.set("scope", scope || DEFAULT_OCIS_SCOPE);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  if (prompt) {
    authUrl.searchParams.set("prompt", prompt);
  }

  return authUrl.toString();
};

export const exchangeOcisAuthorizationCode = async ({ code, state }) => {
  const stored = JSON.parse(
    sessionStorage.getItem(OCIS_OAUTH_STORAGE_KEY) || "null",
  );

  if (!stored?.codeVerifier || !stored?.tokenEndpoint) {
    throw new Error("OCIS OAuth session was not found.");
  }

  if (stored.state !== state) {
    throw new Error("OCIS OAuth state is invalid.");
  }

  const body = new URLSearchParams({
    client_id: stored.clientId,
    code,
    code_verifier: stored.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: stored.redirectUri,
  });

  const response = await fetch(stored.tokenEndpoint, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error_description || data.error || "Unable to finish OCIS OAuth.",
    );
  }

  if (!data.access_token) {
    throw new Error("OCIS OAuth response is missing access token.");
  }

  sessionStorage.removeItem(OCIS_OAUTH_STORAGE_KEY);

  return {
    accessToken: data.access_token,
    clientId: stored.clientId,
    expiresIn: Number(data.expires_in || 3600),
    redirectUri: stored.redirectUri,
    refreshToken: data.refresh_token,
    serverUrl: stored.serverUrl,
    tokenEndpoint: stored.tokenEndpoint,
  };
};
