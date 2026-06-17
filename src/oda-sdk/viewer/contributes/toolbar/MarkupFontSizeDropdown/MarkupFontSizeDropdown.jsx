///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2024, Open Design Alliance (the "Alliance").
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
//   Open Design Alliance Copyright (C) 2002-2024 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useState } from "react";
import classNames from "classnames";
import { Slider, theme } from "antd";

export function MarkupFontSizeDropdown({ item, ...props }) {
  const MIN_VALUE = 0;
  const MAX_VALUE = 4;

  const { viewer, disabled } = props;

  let selectedTextSize = null;
  if (!disabled) {
    const selectedMarkups = viewer.markup.getSelectedObjects();
    if (selectedMarkups && selectedMarkups.length > 0 && selectedMarkups.every((el) => el.getFontSize)) {
      selectedTextSize = Math.round((selectedMarkups[0].getFontSize() - 22) / 6);
      selectedTextSize = Math.min(MAX_VALUE, Math.max(MIN_VALUE, selectedTextSize));
    }
  }

  const [sizeIndex, setSizeIndex] = useState(2);
  const { hashId } = theme.useToken();

  function setFontSize(value) {
    const index = value < MIN_VALUE ? MIN_VALUE : value > MAX_VALUE ? MAX_VALUE : value;
    if (index !== sizeIndex) {
      setSizeIndex(index);
      const fontSize = 22 + index * 6;
      viewer.markup.fontSize = fontSize;
      const selectedMarkups = viewer.markup.getSelectedObjects();
      selectedMarkups.forEach((el) => {
        if (el.setFontSize) el.setFontSize(fontSize);
      });
    }
  }

  return (
    <div className={classNames("ant-segmented", hashId, "p-0 oda-toolbar-group d-flex")}>
      <div
        style={{ margin: "2px" }}
        className="ant-segmented-item px-3 d-flex align-items-center"
        onWheel={(event) => {
          setFontSize(sizeIndex + Math.sign(event.deltaY));
        }}
      >
        <Slider
          style={{ width: "200px" }}
          marks={{ 0: "XS", 2: "M", 4: "XL" }}
          tooltip={{ open: false }}
          min={MIN_VALUE}
          max={MAX_VALUE}
          value={selectedTextSize ?? sizeIndex}
          disabled={disabled}
          onChange={(value) => setFontSize(value)}
        />
      </div>
    </div>
  );
}
