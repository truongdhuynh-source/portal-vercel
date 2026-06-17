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

import { Tag } from "antd";
import { PageHeader } from "@ant-design/pro-layout";

import { HeaderButton } from "./HeaderButton";
import { VersionsDropdown } from "./VersionsDropdown";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

export function Header({ items, disabled, ...props }) {
  const {
    file,
    versions,
    activeVersion,
    viewer,
    databaseLoaded,
    onDragger,
    onCommand,
    onWindow,
    onMode,
    isBack,
  } = props;
  const location = useLocation(); // OK
  const navigate = useNavigate();

  const dropdown = versions ? <VersionsDropdown {...props} /> : null;
  const fileName = file?.name;
  const isActiveVersion = activeVersion === file?.activeVersion;

  const title = dropdown || fileName;
  const tags = !isActiveVersion && <Tag color="warning">Not active</Tag>;
  const isFullView = sessionStorage.getItem("isFullView") === "true";
  const context = { ...props };

  const onBack = () => {
    const name = location.pathname;
    if (typeof name === "string") {
      const path = `/${name.split("/")[1].trim()}`;
      navigate(path);
    }
  };
  const when = (f, _default = true) =>
    typeof f === "function" ? f(context) : _default;
  const extra =
    viewer &&
    items
      .filter((x) => when(x.visible))
      .map((x, index) => {
        const xDisabled = disabled || !databaseLoaded || !when(x.enabled);
        const button = (
          <HeaderButton
            key={index}
            item={x}
            disabled={xDisabled}
            onClick={() => handleClick(x)}
          />
        );
        return x.render
          ? x.render({ ...props, item: x, disabled: xDisabled })
          : button;
      });

  const handleClick = (item) => {
    const { command, args = [], dragger, window, mode } = item;
    if (command) onCommand(command, ...args);
    if (dragger) onDragger(dragger);
    if (window) onWindow(window);
    if (mode) onMode(mode);
  };

  return (
    <PageHeader
      backIcon={<ArrowLeftIcon />}
      title={!isFullView && title}
      tags={!isFullView && tags}
      extra={extra}
      onBack={isBack && onBack}
      className={!isBack ? "p-2" : "p-0"}
    />
  );
}
