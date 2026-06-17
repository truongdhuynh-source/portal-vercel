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

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Rnd } from "react-rnd";

import "./Window.css";

export const Window = ({ title, children, visible, onClose, className, style, onClick, resizable = true }) => {
  const truncatedTitle = useMemo(() => title.replace(/\s/g, ""), [title]);
  const GRID_SIZE = 5;

  const [zIndex, setZIndex] = useState(10);
  let styleLeft = 0;
  const sessionStyleLeft = sessionStorage.getItem(`${truncatedTitle}_x`);
  if (!sessionStyleLeft) styleLeft = style?.left || 0;
  else styleLeft = Number(sessionStyleLeft);
  delete style?.left;

  let styleTop = 0;
  const sessionStyleTop = sessionStorage.getItem(`${truncatedTitle}_y`);
  if (!sessionStyleTop) styleTop = style?.top || 0;
  else styleTop = Number(sessionStyleTop);
  delete style?.top;

  const [initialX, setInitialX] = useState(styleLeft - (styleLeft % GRID_SIZE));
  const [initialY, setInitialY] = useState(styleTop);
  const [initialWidth, setInitialWidth] = useState(
    sessionStorage.getItem(`${truncatedTitle}_width`) || style?.width || "300px"
  );
  const [initialHeight, setInitialHeight] = useState(
    sessionStorage.getItem(`${truncatedTitle}_height`) || style?.height || "400px"
  );

  const bringToFront = () => {
    const topZIndex = parseInt(sessionStorage.getItem("topWindowZIndex")) || 10;
    const newZIndex = topZIndex + 1;
    sessionStorage.setItem("topWindowZIndex", newZIndex);
    setZIndex(newZIndex);
  };

  useEffect(() => {
    if (visible) {
      bringToFront();
    }
  }, [visible]);

  const handleDragStop = (e, d) => {
    sessionStorage.setItem(`${truncatedTitle}_x`, d.x);
    sessionStorage.setItem(`${truncatedTitle}_y`, d.y);
    setInitialX(d.x);
    setInitialY(d.y);
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    sessionStorage.setItem(`${truncatedTitle}_width`, ref.style.width);
    sessionStorage.setItem(`${truncatedTitle}_height`, ref.style.height);
    setInitialWidth(ref.style.width);
    setInitialHeight(ref.style.height);

    sessionStorage.setItem(`${truncatedTitle}_x`, position.x);
    sessionStorage.setItem(`${truncatedTitle}_y`, position.y);
    setInitialX(position.x);
    setInitialY(position.y);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  const dragHandleClass = `window-drag-handle-${truncatedTitle}`;
  const resizeHandleStyles = {
    bottom: { cursor: "s-resize" },
    left: { cursor: "w-resize" },
    right: { cursor: "e-resize" },
    top: { cursor: "n-resize" },
  };

  return (
    <Rnd
      style={{ ...style, zIndex, display: "flex" }}
      size={{ width: initialWidth, height: initialHeight }}
      maxHeight={"90%"}
      maxWidth={"80%"}
      position={{ x: initialX, y: initialY }}
      onDragStart={bringToFront}
      onDragStop={handleDragStop}
      onResizeStart={bringToFront}
      onResizeStop={handleResizeStop}
      minWidth={style?.minWidth ?? 300}
      minHeight={style?.minHeight ?? 230}
      bounds=".oda-viewer-container"
      className={classNames("oda-window", className)}
      cancel=".btn-close, .oda-window-body"
      dragHandleClassName={dragHandleClass}
      enableResizing={resizable}
      onClick={onClick}
      dragGrid={[GRID_SIZE, GRID_SIZE]}
      resizeHandleStyles={resizeHandleStyles}
    >
      <div className={classNames("oda-window-head", dragHandleClass)}>
        {title}
        <button type="button" className="close btn-close" aria-hidden="true" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="oda-window-body card-body overflow-auto" onClick={bringToFront}>
        {children}
      </div>
    </Rnd>
  );
};

Window.propTypes = {
  title: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  resizable: PropTypes.bool,
};
