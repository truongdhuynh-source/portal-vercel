import { createFolder } from "@/redux/features/storageCloud/storageCreateFile.slice";
import { Form, Input, Modal, notification } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDispatch } from "react-redux";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

function CreateNewFileModal({
  visible,
  onClose,
  provider,
  connectionId,
  parentId,
  context,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onCreate = async (values) => {
    setLoading(true);
    try {
      await dispatch(
        createFolder({
          provider,
          connectionId,
          name: values.name.trim(),
          parentId: parentId.toString(),
          context,
        }),
      ).unwrap();

      createEventToTrackingSession({
        event: "create_folder",
        meta: createTeraTrackingPageMeta("storage_files", {
          action: "create_folder",
          provider,
          connectionId,
          folderId: parentId,
          context,
        }),
      });

      onClose();
    } catch (error) {
      if (error.message === "BOX_ITEM_CONFLICT") {
        notification.error({ message: t("Folder name already exists") });
      }
      console.error("[Error] create failed ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={t("Create New Folder")}
      okText={t("Create")}
      onOk={() => form.submit()}
      confirmLoading={loading}
      onCancel={loading ? undefined : onClose}
      afterClose={() => form.resetFields()}
      centered
    >
      <Form
        form={form}
        name="upload"
        layout="vertical"
        onFinish={onCreate}
        initialValues={{
          name: "",
        }}
      >
        <Form.Item
          name="name"
          label={t("Folder name")}
          rules={[{ required: true, message: t("Folder name is required") }]}
        >
          <Input placeholder={t("Folder name")} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateNewFileModal;
