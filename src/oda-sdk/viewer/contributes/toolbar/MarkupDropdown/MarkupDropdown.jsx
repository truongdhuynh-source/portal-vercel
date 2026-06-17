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
import classNames from "classnames";
import { theme } from "antd";

import { ToolbarGroup } from "../../../components";
import { ColorSelector, RED_COLOR } from "./ColorSelector";

export function MarkupDropdown({ item, ...props }) {
  const [markupColor, setMarkupColor] = useState(RED_COLOR);
  const { viewer } = props;
  const { hashId } = theme.useToken();

  useEffect(() => {
    viewer?.addEventListener("changemarkupcolor", onChangeMarkupColor);
    return () => viewer?.removeEventListener("changemarkupcolor", onChangeMarkupColor);
  }, [viewer]);

  function onChangeMarkupColor({ data }) {
    setMarkupColor(data);
  }

  function colorSelected(color) {
    viewer.markup.setMarkupColor(color.r, color.g, color.b);
    viewer.markup.colorizeSelectedMarkups(color.r, color.g, color.b);
  }

  return (
    <div className={classNames("ant-segmented", hashId, "p-0 oda-toolbar-group d-flex flex-column")}>
      <div style={{ margin: "2px" }} className="ant-segmented-item">
        <ColorSelector selectedColor={markupColor} onColorSelected={colorSelected} />
      </div>
      <ToolbarGroup items={item.items} {...props} />
    </div>
  );
}
