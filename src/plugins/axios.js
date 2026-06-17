import axios from "axios";
import axiosRetry from "axios-retry";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  ERROR_CODE_UNPROCESSABLE_ENTITY,
  ERROR_CODE_UNAUTHORIZED,
  USER_VINA,
  USER_ODA,
  AUTH_USERS,
  LOGOUT_SYNC_KEY,
  ERROR_CODE_STORAGE_UNAUTHORIZED_LIST,
} from "../constants";
import Cookies from "js-cookie";
import getUserIdLogin from "../utils/getUserIdLogin";
import redirectToPortalLogin from "../utils/syncAuthAcrossTabs";

const handleRefreshTokenExpired = () => {
  const user_vina_id = getUserIdLogin();
  Cookies.remove(`${ACCESS_TOKEN_KEY}_${user_vina_id}`);
  Cookies.remove(`${REFRESH_TOKEN_KEY}_${user_vina_id}`);
  localStorage.removeItem(`${USER_VINA}_${user_vina_id}`);
  localStorage.removeItem(`${USER_ODA}_${user_vina_id}`);
  localStorage.removeItem(AUTH_USERS);
  localStorage.setItem(LOGOUT_SYNC_KEY, `${Date.now()}`);
  redirectToPortalLogin({ deferIfHidden: true });
};

const API_URL =
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:3004/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosRetry(axios, {
  retries: 1,
  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`);
    return retryCount * 2000;
  },
  retryCondition: (error) => {
    return error.response.status === ERROR_CODE_UNAUTHORIZED;
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.lang = localStorage.getItem("i18nextLng") || "en";
    config.timeout = 120000;
    const user_vina_id = getUserIdLogin();
    const accessToken = Cookies.get(`${ACCESS_TOKEN_KEY}_${user_vina_id}`);
    if (accessToken) {
      const url = config.url.toString();
      const isExcluded =
        url.includes("/files/all-size") || url.includes("/file-public");

      config.headers.Authorization = isExcluded
        ? JSON.parse(localStorage.getItem(`${USER_ODA}_${user_vina_id}`))
          .tokenInfo.token
        : `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === ERROR_CODE_UNPROCESSABLE_ENTITY) {
      handleRefreshTokenExpired(error);
      return Promise.reject(error);
    }
    if (
      error.response.status === ERROR_CODE_UNAUTHORIZED &&
      !ERROR_CODE_STORAGE_UNAUTHORIZED_LIST.includes(error.response.data.message)
    ) {
      const user_vina_id = getUserIdLogin();
      const refreshToken = Cookies.get(`${REFRESH_TOKEN_KEY}_${user_vina_id}`);
      if (refreshToken && refreshToken.length) {
        try {
          const refreshResponse = await axios.post(
            `${API_URL}/token/access-token`,
            {
              refreshToken,
            },
            {
              headers: { "Content-Type": "application/json" },
            },
          );
          const newAccessToken = refreshResponse.data.accessToken;
          Cookies.set(`${ACCESS_TOKEN_KEY}_${user_vina_id}`, newAccessToken, {
            expires: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
          });
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return axiosInstance(originalRequest);
        } catch (err) {
          if (err.response.status === ERROR_CODE_UNPROCESSABLE_ENTITY) {
            handleRefreshTokenExpired(error);
            return Promise.reject(error);
          }
          return Promise.reject(err);
        }
      } else {
        handleRefreshTokenExpired(error);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error.response);
  },
);

export default axiosInstance;
