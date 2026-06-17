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
import { Slider, theme } from "antd";

import { ToolbarGroup } from "../../../components";

export function ExplodeDropdown({ item, ...props }) {
  const [explodeIndex, setExplodeIndex] = useState(0);
  const { viewer, disabled, onCommand } = props;
  const { hashId } = theme.useToken();

  useEffect(() => {
    viewer?.addEventListener("explode", onExplode);
    return () => viewer?.removeEventListener("explode", onExplode);
  }, [viewer]);

  function onExplode({ data }) {
    setExplodeIndex(data);
  }

  function explode(value) {
    const index = value < 0 ? 0 : value > 100 ? 100 : value;
    if (index !== explodeIndex) {
      setExplodeIndex(index);
      onCommand("explode", index);
    }
  }

  return (
    <div className={classNames("ant-segmented", hashId, "p-0 oda-toolbar-group d-flex")}>
      <div
        style={{ margin: "2px" }}
        className="ant-segmented-item px-3 d-flex align-items-center"
        onWheel={(event) => {
          const factor = event.shiftKey ? 10 : 1;
          explode(explodeIndex + factor * Math.sign(event.deltaY));
        }}
      >
        <Slider
          style={{ width: "200px" }}
          min={0}
          max={100}
          value={explodeIndex}
          disabled={disabled}
          onChange={(value) => explode(value)}
        />
      </div>
      <ToolbarGroup items={item.items} {...props} />
    </div>
  );
}
