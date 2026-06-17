import {
  renameStorageItem,
  fetchStorageFiles,
} from "@/redux/features/storageCloud/storageFiles.slice";
import { Form, Input, Modal, notification } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useDispatch } from "react-redux";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

function RenameFileModal({
  visible,
  onClose,
  data,
  folderId,
  context,
  filter,
  limit,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const onSubmit = async (values) => {
    if (!data?.data) {
      return;
    }
    onClose();
    try {
      await dispatch(
        renameStorageItem({
          provider: data.provider,
          connectionId: data.connectionId,
          itemId: data.data.id,
          type: data.data.type,
          name: values.name.trim(),
          context: data.context,
        }),
      ).unwrap();

      if (["web_dav", "ocis"].includes(data.provider)) {
        await dispatch(
          fetchStorageFiles({
            provider: data.provider,
            connectionId: data.connectionId,
            folderId,
            filter,
            limit,
            context,
            silent: true,
          }),
        ).unwrap();
      }

      notification.success({
        message: t("Renamed successfully"),
      });
      createEventToTrackingSession({
        event: "rename_storage_item",
        meta: createTeraTrackingPageMeta("storage_files", {
          action: "rename",
          provider: data.provider,
          connectionId: data.connectionId,
          folderId,
          context: data.context,
          itemType: data.data.type,
        }),
      });
    } catch (error) {
      notification.error({
        message: t("Rename failed"),
      });
      console.error("[Error] rename failed ", error);
    }
  };

  useEffect(() => {
    if (visible && data?.data?.name) {
      form.setFieldsValue({
        name: data.data.name,
      });
    }
  }, [visible, data]);

  if (!visible) return null;
  return (
    <Modal
      open={visible}
      title={t("Rename file")}
      okText={t("Save")}
      onOk={() => form.submit()}
      confirmLoading={false}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      centered
      destroyOnClose
    >
      <Form form={form} name="upload" layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="name"
          label={t("New name")}
          rules={[{ required: true, message: t("Field is required") }]}
        >
          <Input placeholder={t("Enter new name")} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default RenameFileModal;
