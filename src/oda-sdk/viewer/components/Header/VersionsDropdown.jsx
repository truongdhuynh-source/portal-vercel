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

import dayjs from "dayjs";
import { Avatar, Dropdown, Space, Tag, Tooltip, Typography } from "antd";
import { DownOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function VersionItem({ file, version }) {
  const { t } = useTranslation();
  const isErrorVsfx = version.status.geometry.state === "failed";
  const isErrorGltf = version.status.geometryGltf.state === "failed";
  const isActiveVersion = version.version === file.activeVersion;
  return (
    <div className="d-flex">
      <div className="mr-3">
        <Avatar
          style={{ color: "#096dd9", background: "#e6f7ff", border: "1px solid #91d5ff" }}
          shape="square"
          size={48}
        >
          V{version.version + 1}
        </Avatar>
      </div>
      <div className="flex-grow-1">
        <Space className="h6 mb-1">
          <Text>{version.name}</Text>
          {(isErrorVsfx || isErrorGltf) && (
            <Tooltip title="Geometry processing error. This version cannot be opened in the viewer.">
              <ExclamationCircleOutlined style={{ color: "Var(--danger)" }} />
            </Tooltip>
          )}
          {isActiveVersion && <Tag color="success">{t("Active version")}</Tag>}
        </Space>
        <div>
          <Text>
            {dayjs(version.created).format("L LT")} by <Text strong>{version.owner.fullName}</Text>
          </Text>
        </div>
      </div>
    </div>
  );
}

export function VersionsDropdown({ file, versions, activeVersion, disabled, onVersion }) {
  const versionsMenu = {
    items: versions
      .map((version) => ({
        key: version.version + "",
        label: VersionItem({ file, version }),
        disabled,
      }))
      .reverse(),
    onClick: (item) => {
      const version = versions.find((x) => x.version + "" === item.key);
      if (version.version !== activeVersion) onVersion(version);
    },
    selectable: true,
    defaultSelectedKeys: [activeVersion + ""],
    selectedKeys: [activeVersion + ""],
  };

  return (
    <Dropdown key="versions" menu={versionsMenu} trigger={["click"]} disabled={disabled}>
      <Typography.Link className="d-flex align-items-center" style={{ fontSize: "inherit" }}>
        <span className="text-truncate">{`${file.name} (V${activeVersion + 1})`}</span>
        <DownOutlined className="ml-2" />
      </Typography.Link>
    </Dropdown>
  );
}
