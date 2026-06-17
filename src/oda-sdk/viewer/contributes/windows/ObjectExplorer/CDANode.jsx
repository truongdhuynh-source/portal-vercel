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

import React, { useState, useContext } from "react";
import classNames from "classnames";

import { CDATreeContext } from "./CDATreeContext";
import { CDANodeExpandIcon } from "./CDANodeExpandIcon";
import { CDANodes } from "./CDANodes";

function isUIGroupNode(node) {
  return node.handle === "0";
}

function collectHighlightNodes(root, handles, uiGroupNodes) {
  const queue = [];
  queue.push(root);

  while (queue.length !== 0) {
    const node = queue.shift();

    isUIGroupNode(node) ? uiGroupNodes.add(node) : handles.push(node.handle);

    for (const childNode of node.children) {
      queue.push(childNode);
    }
  }
}

export function CDANode({ node }) {
  const [expanded, setExpanded] = useState(false);
  const { viewer, selected, selectedGroupNodes, setSelectedGroupNodes } = useContext(CDATreeContext);

  function toggle() {
    setExpanded(!expanded);
  }

  function select(node) {
    const handles = [];
    const groups = new Set();

    collectHighlightNodes(node, handles, groups);

    viewer.setSelected(handles);

    setSelectedGroupNodes(groups);
  }

  function zoomTo() {
    viewer.executeCommand("zoomToSelected");
  }

  return (
    <React.Fragment>
      <div
        className={classNames("d-flex", {
          active: isUIGroupNode(node) ? selectedGroupNodes.has(node) : selected.has(node.handle),
        })}
        style={{ cursor: "pointer" }}
        onClick={() => select(node)}
        onDoubleClick={() => zoomTo()}
      >
        <CDANodeExpandIcon hasChildren={node.children.length} expanded={expanded} onClick={toggle} />
        <span className="text-truncate">{node.name}</span>
      </div>
      {expanded && <CDANodes nodes={node.children} />}
    </React.Fragment>
  );
}
