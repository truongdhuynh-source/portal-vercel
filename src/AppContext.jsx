import React from "react";
import { ConfigService } from "./services";
import UserStorage from "./services/UserStorage";
import ClientFactory from "./oda-sdk/ClientFactory";
import axiosInstance from "./plugins/axios";
import Cookies from "js-cookie";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_VINA,
  USER_ODA,
  AUTH_USERS,
  LOGOUT_SYNC_KEY,
  USER_ID,
  VINA_CAD_APP,
  VINA_BIM_APP,
} from "./constants";
import getUserIdLogin from "./utils/getUserIdLogin";
export const AppContext = React.createContext();
import { Options } from "@inweb/viewer-core";
import { setIsAdminMode } from "./redux/features/app/appSlice";
import { store } from "./redux/store";
import redirectToPortalLogin from "./utils/syncAuthAcrossTabs";
import { createEventToTrackingSession, createTeraTrackingPageMeta } from "./utils/teraTracking";

export class AppContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      config: null,
      project: null,
      authUser: JSON.parse(localStorage.getItem(AUTH_USERS)) || [],
      options: new Options(),
    };

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("u");
    this.user_vina_id =
      this.state.authUser[
        userId && !(Number(userId) > Number(this.state.authUser.length - 1))
          ? Number(userId)
          : 0
      ]?.id || "";
  }

  get user() {
    return this.state.user;
  }

  get config() {
    return this.state.config;
  }

  get options() {
    return this.state.options;
  }

  get project() {
    return this.state.project;
  }

  async loadConfig() {
    const config = await ConfigService.getConfig();
    this.setState({ config });
    return config;
  }

  async getDataMyself(accessToken, refreshToken) {
    const apiUrl = import.meta.env.VITE_APP_API_BASE_URL;
    const response = await fetch(`${apiUrl}/users/myself`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const res = { data: await response.json() };
    if (res.data?.id) {
      sessionStorage.setItem(USER_ID, res.data.id);
      let authUserArr = Object.assign(this.state.authUser);
      const userId = res.data.id;
      const mailUser = res.data.email;
      const fullName = res.data.fullName;
      if (!this.state.authUser.some((item) => item.id === userId)) {
        authUserArr.push({
          id: userId,
          email: mailUser,
          fullName,
        });
        localStorage.setItem(AUTH_USERS, JSON.stringify(authUserArr));
      }
      const user_vina_id = getUserIdLogin();
      this.user_vina_id = user_vina_id;
      localStorage.setItem(`${USER_VINA}_${userId}`, JSON.stringify(res.data));
      Cookies.set(`${ACCESS_TOKEN_KEY}_${userId}`, accessToken, {
        expires: new Date(Date.now() + 60 * 60 * 24 * 1 * 1000),
      });
      Cookies.set(`${REFRESH_TOKEN_KEY}_${userId}`, refreshToken, {
        expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
      });
    }
    return res;
  }

  async loginFromStorage() {
    await this.loadConfig();
    const client = ClientFactory.get();
    let user = "";
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("ac"); //get accessToken
    const refreshToken = urlParams.get("rf"); //get refreshToken
    const odaToken = urlParams.get("ot"); // get odaToken
    const appVersion = urlParams.get("version");
    const isReturnApp = urlParams.get("isReturnApp");
    const isReturnVinaCAD = urlParams.get("isReturnVinaCAD"); // return VinaCAD
    const isReturnVinaBIM = urlParams.get("isReturnVinaBIM"); // return VinaBIM
    const isAdminMode = urlParams.get("isAdminMode"); // login with admin mode

    const scope = urlParams.get("scope");
    if (scope) {
      localStorage.setItem("scope", scope);
    }
    const userId = urlParams.get("u") || urlParams.get("userId");
    if (userId) {
      sessionStorage.setItem(USER_ID, userId);
    }
    if (urlParams && accessToken) {
      if (appVersion) {
        localStorage.setItem("appVersion", appVersion);
      }
      const res = await this.getDataMyself(accessToken, refreshToken);

      if (isAdminMode === "true") {
        store.dispatch(setIsAdminMode(true));
      }
      if (res.data?.id) {
        const userOda = await client.signInWithToken(odaToken);
        user = userOda;
        if (userOda._data) {
          this.setUser(userOda, this.user_vina_id);
          if (isReturnApp === "true") {
            const appType =
              isReturnVinaCAD === "true"
                ? VINA_CAD_APP
                : isReturnVinaBIM === "true"
                  ? VINA_BIM_APP
                  : null;

            this.handleOpenApp(
              appType,
              accessToken,
              refreshToken,
              odaToken,
              userId,
            );
          }
        }
      }

      createEventToTrackingSession({
        event: "user_login",
        meta: createTeraTrackingPageMeta("login", {
          action: "login",
          path: window.location.pathname,
          isAdminMode,
          user: res?.data
        }),
      });
    } else {
      const vinaId = getUserIdLogin();
      this.user_vina_id = vinaId;
      const data = JSON.parse(
        UserStorage.getToken(`user_${this.user_vina_id}`),
      );
      if (!data) throw new Error("No user token found in the storage");
      const userOda = await client.signInWithToken(data.tokenInfo.token);
      user = userOda;
      this.setUser(userOda, this.user_vina_id);
      if (userId) {
        const appType =
          isReturnVinaCAD === "true"
            ? VINA_CAD_APP
            : isReturnVinaBIM === "true"
              ? VINA_BIM_APP
              : null;

        if (appType) {
          const { isExistAccessToken, isExistRefreshToken, isExistOdaToken } =
            this.getToken();
          this.handleOpenApp(
            appType,
            isExistAccessToken,
            isExistRefreshToken,
            isExistOdaToken,
            userId,
          );
        }
      }
    }
    //login by VinaCAD
    if (urlParams.get("redirectUrl") && urlParams.get("clientId")) {
      const rf = Cookies.get(`${REFRESH_TOKEN_KEY}_${this.user_vina_id}`);
      const url = `${urlParams.get("redirectUrl")}?code=${rf}`;
      window.location.replace(url);
    }
    return user;
  }

  getToken() {
    const isExistAccessToken = Cookies.get(
      `${ACCESS_TOKEN_KEY}_${this.user_vina_id}`,
    );
    const isExistRefreshToken = Cookies.get(
      `${REFRESH_TOKEN_KEY}_${this.user_vina_id}`,
    );
    const userOda = JSON.parse(
      localStorage.getItem(`${USER_ODA}_${this.user_vina_id}`),
    );
    return {
      isExistAccessToken,
      isExistRefreshToken,
      isExistOdaToken: userOda?.tokenInfo?.token,
    };
  }

  handleOpenApp(app, accessToken, refreshToken, odaToken, userId) {
    window.open(
      `${app}://app=${app}&ac=${accessToken}&rf=${refreshToken}&ot=${odaToken}&u=${userId}`,
      "_self",
    );
  }

  handleClearCaches(idUser) {
    Cookies.remove(`${ACCESS_TOKEN_KEY}_${idUser}`);
    Cookies.remove(`${REFRESH_TOKEN_KEY}_${idUser}`);
    localStorage.removeItem(`${USER_VINA}_${idUser}`);
    localStorage.removeItem(`${USER_ODA}_${idUser}`);
  }

  handleRemoveUser() {
    if (this.state.authUser.length > 1) {
      this.state.authUser.map((item) => {
        this.handleClearCaches(item.id);
      });
    } else {
      this.handleClearCaches(this.user_vina_id);
    }
    localStorage.removeItem(AUTH_USERS);
  }

  async logout(isLogoutMulti = false) {
    try {
      const body = this.state.authUser.map((item) => {
        const accessTokenCookie = Cookies.get(`${ACCESS_TOKEN_KEY}_${item.id}`);

        return {
          accessToken: accessTokenCookie,
        };
      });

      const res = await (isLogoutMulti
        ? axiosInstance.post("/auth/logout-multiple", body)
        : axiosInstance.post("/auth/logout", {
          currentToken: Cookies.get(
            `${ACCESS_TOKEN_KEY}_${this.user_vina_id}`,
          ),
        }));

      if (res) {
        this.handleRemoveUser();
        localStorage.setItem(LOGOUT_SYNC_KEY, `${Date.now()}`);
        this.setUser();
        redirectToPortalLogin();
        return res;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  setUser(user, user_vina_id) {
    if (user) {
      this.options.data = user?.data.customFields;
    }
    UserStorage.setToken(
      JSON.stringify(user?.data),
      true,
      `user_${user_vina_id}`,
    );
    this.setState({ user });
  }

  setProject(project) {
    this.setState({ project });
  }

  async saveUserOptions(optionsData) {
    const data = {
      ...this.user.data,
      customFields: { ...this.user.data.customfields, ...optionsData },
    };
    const user = await this.user.update(data);
    this.setState({ user });
  }

  async createShareFileForMembers({
    sharedLinkToken,
    members,
    ownerId,
    permission,
    fileName,
    locale,
  }) {
    await axiosInstance.post("/shared-files", {
      sharedLinkToken,
      members,
      ownerId,
      permission,
      fileName,
      locale,
    });
  }

  async getShareFileForUser() {
    const res = await axiosInstance.get("/shared-files");
    return res.data;
  }

  async updateShareFileDetail({
    sharedLinkToken,
    members,
    permission,
    fileName,
    locale,
  }) {
    const res = await axiosInstance.put(`/shared-files/${sharedLinkToken}`, {
      members,
      permission,
      fileName,
      locale,
    });
    return res.data;
  }

  async deleteShareFile(sharedLinkToken) {
    await axiosInstance.delete(`/shared-files/${sharedLinkToken}`);
  }

  async getUserById(userId) {
    const res = await axiosInstance.get(`/users/${userId}/name`);
    return res.data;
  }

  async getCurrentUser() {
    const res = await axiosInstance.get("/users/me");
    return res.data;
  }

  async getUserByEmail(email) {
    const res = await axiosInstance.get(
      `/users/get-user-by-email?email=${email}`,
    );
    return res.data;
  }

  async getSharedFileUsers(sharedLinkToken) {
    const res = await axiosInstance.get(
      `/shared-files/file/${sharedLinkToken}/users`,
    );
    return res.data;
  }

  async checkTrashWebDav({
    provider,
    connectionId
  }) {
    const { data } = await axiosInstance.get(
      `/storage/${provider}/${connectionId}/check-trash`,
    );

    return !!data.recycleBin;
  }

  render() {
    return (
      <AppContext.Provider value={{ app: this }}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}
