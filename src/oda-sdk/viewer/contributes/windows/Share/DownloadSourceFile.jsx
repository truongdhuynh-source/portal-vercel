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

import { notification } from "antd";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import { t } from "i18next";

import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const downloadSourceFile = (file) => {
  file
    .download()
    .then((arrayBuffer) => {
      const blob = new Blob([arrayBuffer]);
      FileSaver.saveAs(blob, sanitize(file.name));
      notification.success({ message: "Success", description: t("File downloaded") });
    })
    .catch((e) => {
      console.error("Cannot download file.", e);
      notification.error({ message: "Error", description: t("Cannot download file") });
    });
};

export function DownloadSourceFile({ buttonType, file }) {
  return (
    <Button key="downloadSourceFile" type={buttonType ?? "default"} onClick={() => downloadSourceFile(file)}>
      <DownloadOutlined className="menu-icon" />
      {buttonType ? t("Download source file") : null}
    </Button>
  );
}
