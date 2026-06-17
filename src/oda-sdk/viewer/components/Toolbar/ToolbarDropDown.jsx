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

import { useState } from "react";
import classNames from "classnames";
import { Dropdown } from "antd";
import { ToolbarGroup } from "./ToolbarGroup";
import { ToolbarButton } from "./ToolbarButton";
import keyboardRight from "../../assets/icons/keyboard-right.svg";

export function ToolbarOpenArrow({ className, disabled, open }) {
  return (
    <img
      src={keyboardRight}
      className={className}
      style={{
        width: "0.75em",
        height: "auto",
        transform: open ? "rotate(90deg)" : "rotate(-90deg)",
        transition: "transform 0.2s ease-in-out",
        filter: disabled ? "grayscale(1) opacity(25%)" : "grayscale(0) opacity(100%)",
      }}
    />
  );
}

export function ToolbarDropdown(props) {
  const [open, setOpen] = useState(false);
  const { item, disabled } = props;
  const render = item.dropdown ? item.dropdown(props) : <ToolbarGroup items={item.items} {...props} />;
  return (
    <Dropdown
      dropdownRender={() => render}
      overlayClassName="oda-toolbar-dropdown-overlay"
      placement="top"
      trigger={["click"]}
      open={open}
      onOpenChange={(flag) => setOpen(flag)}
    >
      <div className={classNames("d-flex", { "text-black-25": disabled })} onClick={(e) => e.preventDefault()}>
        <ToolbarButton item={item} className="pl-2 py-2" disabled={disabled} />
        <ToolbarOpenArrow className="align-self-start m-1" disabled={disabled} open={open} />
      </div>
    </Dropdown>
  );
}
