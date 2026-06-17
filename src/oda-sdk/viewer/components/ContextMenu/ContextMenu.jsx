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

import { useState, useEffect } from "react";
import { Dropdown } from "antd";
import { useTranslation } from "react-i18next";

export function ContextMenu({ items, disabled, onDragger, onCommand, onWindow, onMode, children, ...props }) {
  const { viewer, databaseLoaded } = props;
  const [selectedCount, setSelectedCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    function onSelect({ handles = [] }) {
      setSelectedCount(handles.length);
    }

    function onClear() {
      setSelectedCount(0);
    }

    if (!viewer) return;

    viewer.addEventListener("select", onSelect);
    viewer.addEventListener("clear", onClear);

    return () => {
      viewer.removeEventListener("select", onSelect);
      viewer.removeEventListener("clear", onClear);
    };
  }, [viewer]);

  const context = { ...props, selectedCount };
  const when = (f, _default = true) => (typeof f === "function" ? f(context) : _default);
  const menuItems = items
    .filter((x) => when(x.visible))
    .map((x) => {
      const xDisabled = disabled || !databaseLoaded || !when(x.enabled);
      return {
        key: x.command,
        label: <div className="px-2">{t(x.label)}</div>,
        disabled: xDisabled,
      };
    });

  const handleClick = ({ key }) => {
    const item = items.find((x) => x.command === key);
    const { command, args = [], dragger, window, mode } = item;
    if (command) onCommand(command, ...args);
    if (dragger) onDragger(dragger);
    if (window) onWindow(window);
    if (mode) onMode(mode);
  };

  return (
    <Dropdown menu={{ items: menuItems, onClick: handleClick }} trigger={["contextMenu"]} openClassName="">
      {children}
    </Dropdown>
  );
}
