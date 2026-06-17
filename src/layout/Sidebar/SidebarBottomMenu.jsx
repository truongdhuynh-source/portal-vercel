///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2021, Open Design Alliance (the "Alliance").
// All rights reserved.
//
// This software and its documentation and related materials are owned by
// the Alliance. The software may only be incorporated into application
// programs owned by members of the Alliance, subject to a signed
// Membership Agreement and Supplemental Software License Agreement with the
// Alliance. The structure and organization of this software are the valuable
// trade secrets of the Alliance and its suppliers. The software is also
// protected by copyright law and international treaty provisions. Application
// programs incorporating this software must include the following statement
// with their copyright notices:
//
//   This application incorporates Open Design Alliance software pursuant to a
//   license agreement with Open Design Alliance.
//   Open Design Alliance Copyright (C) 2002-2021 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useLocation, useNavigate } from "react-router";
import { Menu, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { CURRENT_PAGE, CURRENT_TAB, STORAGE_PROVIDER_META } from "@/constants";
import "./SidebarBottomMenu.css";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const findParentKeys = (items, targetKey, parents = []) => {
  for (const item of items) {
    if (item.key === targetKey) return parents;
    if (item.children) {
      const result = findParentKeys(item.children, targetKey, [
        ...parents,
        item.key,
      ]);
      if (result) return result;
    }
  }
  return null;
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

function SidebarBottomMenu({ className }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openKeys, setOpenKeys] = useState();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const { providers, loading } = useSelector(
    (state) => state.storage.storageCloud,
  );

  const items = useMemo(() => {
    if (loading) return [];

    const map = {};
    (providers || []).forEach((provider) => {
      const keyLower = String(provider.key || "").toLowerCase();
      const canonicalKey = keyLower === "ocis" ? "web_dav" : provider.key;

      if (!map[canonicalKey]) {
        map[canonicalKey] = {
          key: canonicalKey,
          title: STORAGE_PROVIDER_META[canonicalKey]?.title || provider.title,
          accounts: Array.isArray(provider.accounts)
            ? [...provider.accounts]
            : [],
        };
      } else {
        map[canonicalKey].accounts = map[canonicalKey].accounts.concat(
          provider.accounts || [],
        );
      }
    });

    return Object.values(map)
      .filter((p) => p.accounts && p.accounts.length)
      .map((provider) => {
        const meta = STORAGE_PROVIDER_META[provider.key];
        return {
          key: `storage-${provider.key}`,
          label: t(provider.title),
          icon: meta.icon,
          className: meta.isTranslateY ? "box-icon-translate-y" : undefined,
          children: provider.accounts.map((account) => ({
            key: `/files/${provider.key}/${account.id}`,
            label: (
              <Tooltip title={t(account.email)} placement="right">
                <p className="menu-ellipsis mb-0">{t(account.email)}</p>
              </Tooltip>
            ),
          })),
        };
      });
  }, [t, providers, loading]);

  useEffect(() => {
    let path = location.pathname;
    if (path.includes("/files/trash/")) {
      path = path.replace("/trash/", "/");
    }
    const matchedKey = getSelectedMenuKey(path, items);
    if (matchedKey) {
      setSelectedKeys([matchedKey]);

      const parents = findParentKeys(items, matchedKey);
      setOpenKeys((prev) => {
        if (prev === undefined || (Array.isArray(prev) && prev.length === 0)) {
          return parents ?? [];
        }
        return prev;
      });
    } else {
      setSelectedKeys([]);
      setOpenKeys((prev) => (prev === undefined ? [] : prev));
    }
  }, [location.pathname, items]);

  const menuItems = items.map((item) => ({
    ...item,
    icon: (
      <span
        style={{ width: 30, height: 30 }}
        className="d-flex align-items-center justify-content-center"
      >
        {item.icon}
      </span>
    ),
  }));

  const handleClickMenu = () => {
    sessionStorage.removeItem(CURRENT_PAGE);
    sessionStorage.removeItem(CURRENT_TAB);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const onClick = (item) => {
    createEventToTrackingSession({
      event: "navigate_storage_connection",
      meta: createTeraTrackingPageMeta("sidebar", {
        action: "navigate_storage_connection",
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
      selectedKeys={selectedKeys}
      mode="inline"
      onClick={onClick}
      items={menuItems}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      rootClassName="sidebar-bottom-menu"
    />
  );
}

export default SidebarBottomMenu;
