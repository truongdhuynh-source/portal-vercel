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

import { Dropdown, Button, Space } from "antd";
import { CodepenOutlined, DownOutlined } from "@ant-design/icons";
import i18next from "i18next";
const t = i18next.t;

function modelLabel(model) {
  const label = model.name || (model.default ? "Model" : "Sheet");
  return label.replace(/^(3D Views\\|Sheets\\)/gi, "");
}

export function ModelsDropdown({ models, activeModel, onModel, disabled }) {
  if (!models) models = [];
  if (!activeModel) activeModel = { default: true };

  const modelsMenu = {
    items: [
      {
        key: "model",
        type: "group",
        label: t("Model"),
        children: models
          .filter((model) => model.default)
          .concat([{ key: "no-models", name: t("No Models") }])
          .map((model) => ({
            key: model.database,
            label: modelLabel(model),
            disabled: !model.database,
          }))
          .filter((x, index) => x.key || index === 0),
      },
      {
        key: "sheets",
        type: "group",
        label: t("Sheets"),
        children: models
          .filter((model) => !model.default)
          .concat([{ key: "no-sheets", name: t("No Sheets") }])
          .map((model) => ({
            key: model.database,
            label: modelLabel(model),
            disabled: !model.database,
          }))
          .filter((x, index) => x.key || index === 0),
      },
    ],
    onClick: (item) => {
      const model = models.find((x) => x.database === item.key);
      if (model.database !== activeModel.database) onModel(model);
    },
    selectable: true,
    defaultSelectedKeys: [activeModel.database],
    selectedKeys: [activeModel.database],
  };

  return (
    <Dropdown
      key="models"
      menu={modelsMenu}
      trigger={["click"]}
      placement="topRight"
      disabled={disabled || models.length === 0}
    >
      <Button>
        <Space>
          <CodepenOutlined />
          <span className="d-none d-lg-inline">{modelLabel(activeModel)}</span>
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
}
