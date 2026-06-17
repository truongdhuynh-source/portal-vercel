import React from "react";
import { Modal } from "antd";
import { useTranslation } from "react-i18next";
import ViewerPage from "@/oda-sdk/viewer/ViewerPage";

function PreviewModal({ visible, fileId, set }) {
  const { t } = useTranslation();

  return (
    <Modal
      open={visible}
      title={null}
      maskClosable={true}
      width={800}
      height={600}
      className="custom-preview-modal"
      onCancel={() => set(false)}
      footer={null}
      centered
    >
      <div>
        <ViewerPage previewFileId={fileId} />
      </div>
    </Modal>
  );
}

export default PreviewModal;
