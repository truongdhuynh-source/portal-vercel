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

import { Segmented } from "./Segmented";
import { ToolbarDropdown } from "./ToolbarDropDown";
import { ToolbarButton } from "./ToolbarButton";

export function ToolbarGroup({ items, className, ...props }) {
  const { activeDragger, disabled, onDragger, onCommand, onWindow, onMode } = props;

  const context = { ...props };
  const when = (f, _default = true) => (typeof f === "function" ? f(context) : _default);

  let activeItem;
  items
    .filter((x) => x.items)
    .forEach((x) => {
      const item = x.items.find((y) => y.dragger === activeDragger);
      if (item) {
        activeItem = item;
        x.label = item.label;
        x.image = item.image;
      }
    });
  if (!activeItem) activeItem = items.find((x) => x.dragger === activeDragger);
  if (!activeItem) activeItem = items.find((x) => when(x.checked, false));
  if (!activeItem) activeItem = {};

  const value = activeItem.label || "";

  const options = items
    .filter((x) => when(x.visible))
    .map((x) => {
      const xDisabled = disabled || !when(x.enabled);
      const dropdown = <ToolbarDropdown item={x} {...props} disabled={xDisabled} />;
      const button = <ToolbarButton item={x} disabled={xDisabled} />;

      return {
        label: x.items || x.dropdown ? dropdown : button,
        value: x.label,
        disabled: xDisabled,
      };
    });

  const handleChange = (value) => {
    const item = items.find((x) => x.label === value) || {};
    const { command, args = [], dragger, window, mode } = item;
    if (command) onCommand(command, ...args);
    if (dragger) onDragger(dragger);
    if (window) onWindow(window);
    if (mode) onMode(mode);
  };

  return (
    <div className="oda-toolbar-group">
      <Segmented
        className={className}
        size="small"
        options={options}
        value={value}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
}
