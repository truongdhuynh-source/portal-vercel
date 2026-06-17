import React, { useCallback, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Button, Avatar, Dropdown } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import "@/components/PortalHeader.css";
import getUserIdLogin from "@/utils/getUserIdLogin";
import {
  ACCESS_TOKEN_KEY,
  AUTH_USERS,
  LANGUAGE_MAP,
  REFRESH_TOKEN_KEY,
  USER_ODA,
  USER_VINA,
  accountColorList,
} from "@/constants";
import { AppContext } from "@/AppContext";
import logo from "@/assets/images/logo-vinacad.png";
import logoVinas from "@/assets/images/logo-vinas.png";
import axiosInstance from "@/plugins/axios";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import "./LayoutHeader.css";
import useScreen from "@/hooks/useScreen";
import { ChevronRightIcon, LanguagesIcon, MenuIcon } from "lucide-react";
import classNames from "classnames";
import PortalHeader from "../../components/PortalHeader";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const LayoutHeader = ({ onMenuClick }) => {
  const { app } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isExpandLangSwitcher, setIsExpandLangSwitcher] = useState(false);

  const { isMobile, isTablet } = useScreen();
  const location = useLocation();
  const navigate = useNavigate();
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const userId = urlParams.get("u") || sessionStorage.getItem("userId");
  const user_vina_id = getUserIdLogin();
  const rf = Cookies.get(`${REFRESH_TOKEN_KEY}_${user_vina_id}`);
  const ac = Cookies.get(`${ACCESS_TOKEN_KEY}_${user_vina_id}`);
  const odaToken = JSON.parse(
    localStorage.getItem(`${USER_ODA}_${user_vina_id}`),
  )?.tokenInfo.token;
  const authUser = JSON.parse(localStorage.getItem(AUTH_USERS)) || [];
  const [user, setUser] = useState({});
  const lang = localStorage.getItem("i18nextLng");
  const { t, i18n } = useTranslation();
  const userObj = localStorage.getItem(`${USER_VINA}_${user_vina_id}`) || "{}";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const parsedUser = JSON.parse(userObj);
    setUser(parsedUser);
  }, [userObj]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = useCallback(
    (code) => {
      i18n.changeLanguage(code);
      createEventToTrackingSession({
        event: "change_language",
        meta: createTeraTrackingPageMeta("layout_header", {
          action: "change_language",
          language: code,
        }),
      });
      setIsExpandLangSwitcher(false);
    },
    [i18n],
  );

  if (!mounted) return null;
  const getRedirectLink = (uid) => `/files?userId=${uid}`;

  const handleLogout = () => {
    createEventToTrackingSession({
      event: "logout",
      meta: createTeraTrackingPageMeta("layout_header", {
        action: "logout",
        hasMultipleAccounts: authUser.length > 1,
      }),
    });
    app
      .logout(authUser.length > 1)
      .catch((e) => console.log("Cannot logout.", e.message))
      .finally(() => setLoading(false));
  };

  const items = [
    // ...(isMobile
    //   ? [
    //       {
    //         key: "username",
    //         className: "px-2 py-1",
    //         label: (
    //           <div className="d-flex align-items-center">
    //             <Avatar
    //               className="cursor-pointer mr-2"
    //               style={{ backgroundColor: accountColorList[0] }}
    //               size={22}
    //             >
    //               <div
    //                 style={{
    //                   fontSize: 12,
    //                   textTransform: "uppercase",
    //                 }}
    //               >
    //                 {user.fullName.slice(0, 1)}
    //               </div>
    //             </Avatar>
    //             <span style={{ fontWeight: 500 }}>
    //               {user.fullName || user.email}
    //             </span>
    //           </div>
    //         ),
    //       },
    //       { key: "separator", type: "divider" },
    //     ]
    //   : []),
    // ...(authUser.length > 1
    //   ? authUser.map(
    //       (item, index) =>
    //         item.email !== user.email && {
    //           key: `account_${index}`,
    //           label: (
    //             <a
    //               className="cursor-pointer"
    //               target="_blank"
    //               href={`${getRedirectLink(item.id)}`}
    //             >
    //               {item.fullName || item.email}
    //             </a>
    //           ),
    //           icon: (
    //             <Avatar
    //               style={{
    //                 backgroundColor: accountColorList[index],
    //                 verticalAlign: "middle",
    //                 fontSize: "20px",
    //               }}
    //               size="middle"
    //             >
    //               {item.email.slice(0, 1)}
    //             </Avatar>
    //           ),
    //         },
    //     )
    //   : []),
    ...(isMobile
      ? [
          {
            key: "language",
            icon: <LanguagesIcon size={14} />,
            onClick: (e) => {
              setIsExpandLangSwitcher(!isExpandLangSwitcher);
              e.PreventDefault();
            },
            label: (
              <div className="d-flex align-items-center justify-content-between">
                <span>
                  {t("Language")}: {LANGUAGE_MAP[i18n.language].name}{" "}
                </span>
                <ChevronRightIcon
                  size={14}
                  className={classNames(
                    "ml-2",
                    isExpandLangSwitcher
                      ? "rotate-90-animated"
                      : "rotate-0-animated",
                  )}
                />
              </div>
            ),
          },
          ...(isExpandLangSwitcher
            ? Object.values(LANGUAGE_MAP).map((item) => ({
                key: item.code,
                className: "py-1",
                label: (
                  <div
                    className="d-flex align-items-center pl-4"
                    onClick={() => handleLanguageChange(item.code)}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="language-img mr-2"
                      width="30"
                      height="18"
                    />
                    <p className="language-title mb-0">{item.name}</p>
                  </div>
                ),
              }))
            : []),
        ]
      : []),
    // {
    //   key: "addAccount",
    //   label: (
    //     <a
    //       className="cursor-pointer"
    //       target="_blank"
    //       href={`${import.meta.env.VITE_APP_VINACAD_APP_URL}/${lang}/login?addMore=true`}
    //     >
    //       {t("Add another account")}
    //     </a>
    //   ),
    //   icon: <PlusOutlined />,
    // },
    {
      key: "logout",
      label: (
        <a onClick={handleLogout} className="btn-logout cursor-pointer">
          {/* {` ${t("Logout")} ${authUser.length > 1 ? t("All accounts") : ""} `} */}
          {t("Logout")}
        </a>
      ),
      icon: <LogoutOutlined />,
    },
  ];

  const openVinaCAD = async () => {
    const res = await axiosInstance.post("/oauth/auth-code", {
      code: rf,
    });

    const { accessToken, refreshToken } = res.data;
    createEventToTrackingSession({
      event: "open_desktop_app",
      meta: createTeraTrackingPageMeta("layout_header", {
        action: "open_vinacad_app",
        app: "vinacad",
      }),
    });
    window.open(
      `vinacad://app=vinacad&ac=${accessToken}&rf=${refreshToken}&ot=${odaToken}&u=${userId}`,
      "_self",
    );
  };

  const openVinaBIM = async () => {
    await axiosInstance.post("/app-logger", {
      action: "open",
      version: "VINABIMWeb",
      email: user?.email,
    });
    createEventToTrackingSession({
      event: "open_desktop_app",
      meta: createTeraTrackingPageMeta("layout_header", {
        action: "open_vinas",
        app: "vinas",
      }),
    });
    window.open(`${import.meta.env.VITE_APP_VINABIM}?code=${rf}`, "_blank");
  };

  const isFullView = sessionStorage.getItem("isFullView") === "true";
  const portalHeaderRoutes = [
    {
      path: "/feedbacks/:feedbackId",
      title: t("Feedback Detail"),
      isBack: true,
    },
    { path: "/feedbacks", title: t("Feedbacks"), isBack: false },
    { path: "/tasks/:taskId", title: t("Task Detail"), isBack: true },
    { path: "/tasks", title: t("Tasks"), isBack: false },
    { path: "/licenses/:licenseId", title: t("License details"), isBack: true },
    { path: "/licenses", title: t("My license"), isBack: false },
    { path: "/profile", title: t("My Profile"), isBack: false },
    { path: "/storage-cloud", title: t("Storage Cloud"), isBack: false },
    {
      path: "/files/trash/:provider/:connectionId/:folderId",
      title: t("Recycle bin"),
      isBack: true,
    },
    {
      path: "/files/trash/:provider/:connectionId",
      title: t("Recycle bin"),
      isBack: true,
    },
    {
      path: "/files/:provider/:connectionId/:folderId",
      title: t("Storage Cloud"),
      isBack: false,
    },
    {
      path: "/files/:provider/:connectionId",
      title: t("Storage Cloud"),
      isBack: false,
    },
    {
      path: "/shared-with-me/:fileId",
      title: t("Shared With Me"),
      isBack: true,
    },
    { path: "/shared-with-me", title: t("Shared With Me"), isBack: false },
    {
      path: "/public-families/:fileId",
      title: t("Public Families"),
      isBack: true,
    },
    { path: "/public-families", title: t("Public Families"), isBack: false },
    { path: "/my-families/:fileId", title: t("My Families"), isBack: false },
    { path: "/my-families", title: t("My Families"), isBack: false },
    { path: "/my-files/:fileId", title: t("My Files"), isBack: false },
    { path: "/my-files", title: t("My Files"), isBack: false },
  ];
  const currentPortalHeader = portalHeaderRoutes.find(({ path }) =>
    matchPath({ path, end: true }, location.pathname),
  );

  return (
    <div
      className="layout-header"
      style={{ display: isFullView ? "none" : "flex" }}
    >
      <div className="left-wrap ml-3">
        {isMobile && (
          <Button
            type="text"
            style={{ color: "#000", marginRight: "8px" }}
            className={`mobile-menu-btn ${isMobile ? "show" : ""}`}
            icon={<MenuIcon className="cursor-pointer" />}
            aria-label="Open menu"
            onClick={onMenuClick}
          />
        )}
        {currentPortalHeader && !isMobile && (
          <PortalHeader
            title={currentPortalHeader.title}
            isBack={currentPortalHeader.isBack}
            style={{ margin: "0 15px" }}
          />
        )}
      </div>

      {isMobile && (
        <div className="logo-wrap">
          <img
            src={logo}
            alt="Logo"
            className="logo"
            onClick={() => navigate("/")}
          />
          <span className="logo-text">VinaCAD</span>
        </div>
      )}

      <div className="d-flex justify-content-center">
        <div
          className="left-wrap mr-3 pr-3"
          style={{ borderRight: "1px solid #d9d9d9" }}
        >
          {!isMobile && (
            <div className="d-flex align-items-center gap-3">
              {!isTablet && (
                <Button
                  className="btn-redirect app-btn vinacad-btn"
                  onClick={openVinaCAD}
                >
                  <div className="d-flex align-items-center">
                    <img
                      style={{ width: 16, height: 16 }}
                      src={logo}
                      alt="Logo"
                    />
                    <p className="mb-0 ml-1">VinaCAD App</p>
                  </div>
                </Button>
              )}

              <Button
                className="btn-bim btn-redirect app-btn vinas-btn"
                onClick={openVinaBIM}
              >
                <div className="d-flex align-items-center">
                  <img
                    style={{ width: 16, height: 16 }}
                    src={logoVinas}
                    alt="Logo"
                  />
                  <p className="mb-0 ml-1">VinaS</p>
                </div>
              </Button>
            </div>
          )}
        </div>
        {!isMobile && <LanguageSwitcher />}
        <Dropdown
          open={openDropdown}
          menu={{ items }}
          trigger={["click"]}
          placement="bottomRight"
          overlayClassName="user-dropdown"
          onOpenChange={() => setOpenDropdown(!openDropdown)}
        >
          <div
            className={classNames("info-user", isMobile && "info-user-mobile")}
          >
            {!isMobile && (
              <p className="user-name">
                {[user.lastName, user.firstName].filter(Boolean).join(" ") ||
                  user.email}
              </p>
            )}
            <Avatar
              className={classNames("cursor-pointer", isMobile && "mr-3")}
              style={{ backgroundColor: accountColorList[0] }}
              size={isMobile ? 26 : 30}
            >
              <div
                style={{
                  fontSize: isMobile ? 14 : 16,
                  textTransform: "uppercase",
                }}
              >
                {user.fullName?.slice(0, 1)}
              </div>
            </Avatar>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default LayoutHeader;
