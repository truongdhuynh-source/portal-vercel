///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2025, Open Design Alliance (the "Alliance").
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
//   Open Design Alliance Copyright (C) 2002-2025 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, notification } from "antd";

import { Window } from "../../../components";

import { HighlightSettings } from "./HighlightSettings";
import { UnitSettings } from "./UnitSettings";
import { ViewSettings } from "./ViewSettings";

import { AppContext } from "@/AppContext";

function debounce(func, wait) {
  let timeout = null;
  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
}

const saveUserSettings = debounce(
  (data, app, t) =>
    app.saveUserSettings({ ...data }).catch((e) => {
      console.error("Cannot save user settings.", e);
      notification.warning({
        message: t("Warning"),
        description: t("Cannot save user settings, changes may be lost after the next login"),
      });
    }),
  1000
);

function Divider2({ children }) {
  return (
    <Divider orientation="left" orientationMargin="0">
      {children}
    </Divider>
  );
}

export function SettingsWindow({ visible, onClose, ...rest }) {
  const { viewer, sharedLink, databaseLoaded } = rest;
  const [data, setData] = useState({ ...viewer.options.data });
  const { app } = useContext(AppContext);
  const { t } = useTranslation();

  useEffect(() => {
    setData({ ...viewer.options.data });
  }, [viewer, databaseLoaded]);

  const handleChange = useCallback(
    (data) => {
      viewer.options.data = data;
      if (!sharedLink) saveUserSettings(data, app, t);
    },
    [sharedLink, viewer, app, t]
  );

  return (
    <Window
      title={t("Settings")}
      style={{
        width: "400px",
        height: "650px",
      }}
      resizable={false}
      visible={visible}
      onClose={onClose}
    >
      <div className="mx-3 mb-3 text-center">
        <Divider2>{t("View")}</Divider2>
        <ViewSettings {...rest} data={data} onChange={handleChange} />

        <Divider2>{t("Selection")}</Divider2>
        <HighlightSettings {...rest} data={data} onChange={handleChange} />

        <Divider2>{t("Ruler")}</Divider2>
        <UnitSettings {...rest} data={data} onChange={handleChange} />

        <Divider />
        <Button
          style1={{ width: "100%" }}
          onClick={() => {
            viewer.options.resetToDefaults();
            setData({ ...viewer.options.data });
            saveUserSettings(viewer.options.data, app, t);
          }}
          type="primary"
        >
          {t("Reset settings to defaults")}
        </Button>
      </div>
    </Window>
  );
}
