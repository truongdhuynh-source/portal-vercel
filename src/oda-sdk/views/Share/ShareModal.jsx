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

import { useState, useEffect } from "react";
import { Form, Modal, notification, Typography } from "antd";

const { Text } = Typography;
import { useTranslation } from "react-i18next";

import ClientFactory from "@/oda-sdk/ClientFactory";
import { ShareSettings } from "../../viewer/contributes/windows/ShareSettings/ShareSettings";

function ShareModal({ fileId, visible, onShareUnshare, onClose, fileActive }) {
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(true);
  const client = ClientFactory.get();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!visible) return;
    if (!fileId) return;

    setLoading(true);
    client
      .getFile(fileActive?.versions[fileActive.activeVersion].fileId)
      .then((file) => {
        setFile(file);
      })
      .catch((e) => {
        console.error("Cannot get file info.", e);
        notification.error({
          message: "Error",
          description: "Cannot get file info",
        });
      })
      .finally(() => setLoading(false));
  }, [visible, fileId, client]);

  return (
    <Modal
      open={visible}
      title={t("Share")}
      loading={loading}
      footer={null}
      okText="Close"
      width={400}
      onCancel={onClose}
      centered
    >
      <Form.Item className="mb-2">
        {i18n.language.startsWith("ja") ? (
          <Text>
            ファイル <Text strong>{file?.name}</Text>を共有しています。
          </Text>
        ) : (
          <Text>
            {t("You are sharing the file")} <Text strong>{file?.name}</Text>
          </Text>
        )}
      </Form.Item>
      {!visible || loading ? null : (
        <ShareSettings
          file={file}
          onShareUnshare={onShareUnshare}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

export default ShareModal;
