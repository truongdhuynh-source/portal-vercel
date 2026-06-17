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

import { CDATreeContext } from "./CDATreeContext";
import { CDANodes } from "./CDANodes";

import "./CDATreeView.css";

export function CDATreeView({ cdaTree, viewer }) {
  const [selected, setSelected] = useState(new Set());
  const [selectedGroupNodes, setSelectedGroupNodes] = useState(new Set());

  useEffect(() => {
    function onSelect({ handles = [] }) {
      setSelected(new Set(handles));
      setSelectedGroupNodes(new Set());
    }

    function onClear() {
      setSelected(new Set());
      setSelectedGroupNodes(new Set());
    }

    if (!viewer) return;

    viewer.addEventListener("select", onSelect);
    viewer.addEventListener("clear", onClear);

    return () => {
      viewer.removeEventListener("select", onSelect);
      viewer.removeEventListener("clear", onClear);
    };
  }, [viewer, cdaTree]);

  return (
    <CDATreeContext.Provider value={{ viewer, selected, selectedGroupNodes, setSelectedGroupNodes }}>
      <div className="oda-cda-tree-view">
        <CDANodes nodes={cdaTree} />
      </div>
    </CDATreeContext.Provider>
  );
}
