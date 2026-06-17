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

import React, { useState, useEffect } from "react";

import { ExpandIcon } from "../../../components";

export function PropertiesTable({ properties }) {
  const [propList, setPropList] = useState([]);
  const [, setRefreshId] = useState();

  useEffect(() => {
    function enumProps(parent, props, level, list) {
      Object.keys(props)
        .sort()
        .forEach((name) => {
          const value = props[name];
          const isGroup = typeof value === "object";
          if (isGroup) {
            const index = list.push({
              name,
              value: null,
              parent,
              level,
              isGroup,
            });
            enumProps(list[index - 1], value, level + 1, list);
          } else {
            list.push({ name, value, parent, level });
          }
        });
    }

    const list = [];
    enumProps({}, properties, 0, list);

    let key = 1;
    list.forEach((item) => {
      item.isVisible = true;
      item.isExpanded = true;
      item.key = key++;
    });

    setPropList(list);
  }, [properties]);

  return (
    <table className="text-nowrap" style={{ width: "100%" }}>
      <tbody>
        {propList
          .filter((propItem) => propItem.isVisible)
          .map((propItem) => {
            return (
              <tr key={propItem.key}>
                {propItem.isGroup ? (
                  <th colSpan="2">
                    <ExpandIcon
                      level={propItem.level}
                      hasChildren={true}
                      expanded={propItem.isExpanded}
                      onClick={() => {
                        propItem.isExpanded = !propItem.isExpanded;
                        propList
                          .filter((item) => item.level > 0)
                          .forEach(
                            (item) =>
                              (item.isVisible =
                                item.parent.isVisible && item.parent.isExpanded)
                          );
                        setRefreshId(new Date());
                      }}
                    />
                    {propItem.name}
                  </th>
                ) : (
                  <React.Fragment>
                    <td style={{ width: "40%" }}>
                      <ExpandIcon level={propItem.level} />
                      {propItem.name}
                    </td>
                    <td className="pl-4">{propItem.value}</td>
                  </React.Fragment>
                )}
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
