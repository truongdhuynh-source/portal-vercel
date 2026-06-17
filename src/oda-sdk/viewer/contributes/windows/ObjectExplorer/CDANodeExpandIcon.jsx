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

import keyboardRight from "../../../assets/icons/keyboard-right.svg";
import "./CDANodeExpandIcon.css";

export function CDANodeExpandIcon({ hasChildren, expanded, onClick }) {
  if (hasChildren) {
    const transform = expanded ? "rotate(90deg)" : undefined;
    return (
      <img
        src={keyboardRight}
        className="oda-cda-node-expand-icon"
        style={{
          transform,
          transition: "transform .1s ease-in-out",
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick(!expanded);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
        }}
      />
    );
  } else {
    return <span className="mr-2" style={{ width: "12px" }} />;
  }
}
