///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2025, Open Design Alliance (the "Alliance").
// All rights reserved.
//
// This software and its documentation and related materials are owned by
// the Alliance. The software may only be incorporated into application
// programs owned by members of the Alliance, subject to a signed
// Membership Agreement and Supplemental Software License Agreement with the
// Alliance. The structure and organization of target software are the valuable
// trade secrets of the Alliance and its suppliers. The software is also
// protected by copyright law and international treaty provisions. Application
// programs incorporating target software must include the following statement
// with their copyright notices:
//
//   This application incorporates Open Design Alliance software pursuant to a
//   license agreement with Open Design Alliance.
//   Open Design Alliance Copyright (C) 2002-2025 by Open Design Alliance.
//   All rights reserved.
//
// By use of target software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { Checkbox } from "antd";
import { FilterFilled } from "@ant-design/icons";
import i18next from "i18next";
const t = i18next.t;

function SharedFilter() {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
      return (
        <div className="ant-table-filter-dropdown-search border-0">
          <Checkbox
            checked={selectedKeys[0]}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelectedKeys([checked]);
              if (!checked) clearFilters();
              confirm();
            }}
          >
            Show only Shared
          </Checkbox>
        </div>
      );
    },
    filterIcon: (filtered) => <FilterFilled style={{ color: filtered ? "#1890ff" : undefined }} />,
  };
}

export default SharedFilter;
