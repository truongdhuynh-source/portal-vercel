import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Badge, Tooltip } from "antd";
import PropTypes from "prop-types";
import {
  FileOutlined,
  IssuesCloseOutlined,
  KeyOutlined,
  UserOutlined,
  ContainerOutlined,
  ShoppingCartOutlined,
  ProjectOutlined,
  ExperimentOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../plugins/axios";
import "./SidebarTopMenu.css";
import {
  CURRENT_PAGE,
  USER_VINA,
  CURRENT_TAB,
  REFRESH_TOKEN_KEY,
} from "../../constants";
import getUserIdLogin from "../../utils/getUserIdLogin";
import Cookies from "js-cookie";
import { CloudIcon, FolderIcon } from "lucide-react";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const SUB_MENU_MAP = {
  "/my-files": "resources",
  "/my-families": "resources",
  "/public-families": "resources",
  "/shared-with-me": "resources",
};

const getSelectedMenuKey = (pathname, menuItems) => {
  const keys = [];

  const loop = (items) => {
    items.forEach((item) => {
      if (item.key && typeof item.key === "string") {
        keys.push(item.key);
      }
      if (item.children) {
        loop(item.children);
      }
    });
  };

  loop(menuItems);

  return keys
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));
};

function SidebarTopMenu({ className, onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const [showTask, setShowTask] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = getUserIdLogin();
  const [totalNewFeedback, setTotalNewFeedback] = useState(0);
  const [totalNewFeedbackByAssignee, setTotalNewFeedbackByAssignee] =
    useState(0);
  const [openKeys, setOpenKeys] = useState();
  const [selectedKeys, setSelectedKeys] = useState([]);

  const handleClickMenu = () => {
    sessionStorage.removeItem(CURRENT_PAGE);
    sessionStorage.removeItem(CURRENT_TAB);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/portal/count-item-unread");
      if (res) {
        setTotalNewFeedback(res.data.totalNewFeedback);
        setTotalNewFeedbackByAssignee(res.data.totalNewFeedbackByAssignee);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem(`${USER_VINA}_${userId}`) || "{}",
    );
    if (user?.rolesOther === "system_manage") {
      setShowTask(true);
    }
    if (user?.roles?.includes("system_admin")) {
      setIsAdmin(true);
    }

    setTimeout(() => fetchData(), 1000);
  }, [location.pathname]);

  const items = useMemo(
    () => [
      {
        label: t("Library"),
        icon: <FolderIcon size={16} />,
        key: "resources",
        children: [
          {
            key: `/my-files`,
            label: t("My Files"),
            icon: <FolderIcon size={16} />,
          },
          {
            key: `/shared-with-me`,
            label: t("Files Shared With Me"),
            icon: <FolderIcon size={16} />,
          },
          {
            key: `/my-families`,
            label: t("My Families"),
            icon: <FolderIcon size={16} />,
          },
          {
            key: `/public-families`,
            label: t("Public Families"),
            icon: <FolderIcon size={16} />,
          },
        ],
      },

      ...(showTask
        ? [
            {
              key: "/tasks",
              label: t("My Tasks"),
              icon: <ContainerOutlined />,
              badge:
                totalNewFeedbackByAssignee === 0
                  ? ""
                  : totalNewFeedbackByAssignee > 0 &&
                      totalNewFeedbackByAssignee < 99
                    ? totalNewFeedbackByAssignee
                    : "99+",
            },
          ]
        : []),
      ...(isAdmin
        ? []
        : [
            {
              key: "/feedbacks",
              label: t("My Feedbacks"),
              icon: <IssuesCloseOutlined />,
              badge:
                totalNewFeedback === 0
                  ? ""
                  : totalNewFeedback > 0 && totalNewFeedback < 99
                    ? totalNewFeedback
                    : "99+",
            },
            {
              key: "/licenses",
              label: t("My Licenses"),
              icon: <KeyOutlined />,
            }, //
            {
              key: "/profile",
              label: t("My Profile"),
              icon: <UserOutlined />,
            },
            {
              key: "/devices",
              label: t("My Devices"),
              icon: <LaptopOutlined />,
            },
          ]),
      {
        key: "/storage-cloud",
        label: t("Storage Cloud"),
        icon: <CloudIcon size={16} />,
      },
      // {
      //   key: "affiliate",
      //   label: t("Affiliate"),
      //   icon: <ShoppingCartOutlined />,
      // },
      // { key: "/projects", label: t("Projects"), icon: <ProjectOutlined /> },
    ],
    [showTask, isAdmin, totalNewFeedback, totalNewFeedbackByAssignee, language],
  );

  useEffect(() => {
    const path = location.pathname;
    const matchedKey = getSelectedMenuKey(path, items);
    if (matchedKey) {
      setSelectedKeys([matchedKey]);

      const parentKey = SUB_MENU_MAP[matchedKey];
      setOpenKeys(parentKey ? [parentKey] : []);
    } else {
      setSelectedKeys([]);
      setOpenKeys([]);
    }
  }, [location.pathname, items]);

  const menuItems = items.map((item) => ({
    ...item,
    key: item.key,
    icon: item.icon,
    label: (
      <div className="w-100 d-flex justify-content-between align-items-center">
        <span className="flex-1">{item.label}</span>
        {item.badge && <div className="ant-badge-total">{item.badge}</div>}
      </div>
    ),
  }));

  const onClick = (item) => {
    if (item.key === "affiliate" || item.key === "/licenses") {
      createEventToTrackingSession({
        event: "open_external_page",
        meta: createTeraTrackingPageMeta("sidebar", {
          action: "open_external_page",
          target: item.key,
        }),
      });
      window.open(`${import.meta.env.VITE_APP_LICENSES}`, "_blank");
      return;
    }
    if (item.key === "/profile") {
      createEventToTrackingSession({
        event: "open_external_page",
        meta: createTeraTrackingPageMeta("sidebar", {
          action: "open_external_page",
          target: item.key,
        }),
      });
      window.open(
        `${import.meta.env.VITE_APP_PROFILE}/${localStorage.getItem("i18nextLng")}/profile`,
        "_blank",
      );
      return;
    }
    createEventToTrackingSession({
      event: "navigate_menu",
      meta: createTeraTrackingPageMeta("sidebar", {
        action: "navigate",
        target: item.key,
      }),
    });
    navigate(item.key);
    handleClickMenu();
  };

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Menu
      className={className}
      selectedKeys={selectedKeys}
      mode="inline"
      onClick={onClick}
      items={menuItems}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
    />
  );
}

SidebarTopMenu.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func,
};

export default SidebarTopMenu;
