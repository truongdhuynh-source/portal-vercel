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

import { useState, useEffect } from "react";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";
import { PropertiesTable } from "./PropertiesTable";

export function PropertiesWindow({ viewer, file, visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [handle, setHandle] = useState();
  const [properties, setProperties] = useState();
  const { t } = useTranslation();

  useEffect(() => {
    function onSelect({ handles = [] }) {
      setHandle(handles[0]);
    }

    function onClear() {
      setHandle();
    }

    if (!viewer) return;

    viewer.addEventListener("select", onSelect);
    viewer.addEventListener("clear", onClear);

    return () => {
      viewer.removeEventListener("select", onSelect);
      viewer.removeEventListener("clear", onClear);
    };
  }, [viewer]);

  useEffect(() => {
    if (handle && file) {
      setLoading(true);
      file
        .getProperties(handle, true)
        .then((properties) => {
          setProperties(Array.isArray(properties) ? properties : [properties]);
          setError();
        })
        .catch((e) => {
          console.error("Cannot load properties.", e);
          setProperties();
          setError(e.message);
        })
        .finally(() => setLoading(false));
    } else {
      setProperties();
      setError();
    }
  }, [file, handle]);

  const canvasId = document.getElementById("canvas");
  const positionLeft = canvasId.width - 600;

  return (
    <Window
      title={t("Properties")}
      style={{
        left: positionLeft,
        width: "500px",
      }}
      visible={visible}
      onClose={onClose}
    >
      {loading ? (
        <Spin spinning={loading}>{loading && <div style={{ minHeight: 53 }} />}</Spin>
      ) : properties && properties.length > 0 ? (
        <PropertiesTable properties={properties[0]} />
      ) : (
        <div className="d-flex justify-content-center text-muted p-2">
          {error
            ? t("Cannot load properties")
            : properties
              ? t("Selected object has no properties")
              : t("No object selected")}
        </div>
      )}
    </Window>
  );
}
