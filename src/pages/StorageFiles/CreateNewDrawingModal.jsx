import metricTemplateUrl from "/drawing-templates/VinaCAD_metter.dwt?url";
import inchesTemplateUrl from "/drawing-templates/VinaCAD_inches.dwt?url";
import { uploadFiles } from "@/redux/features/storageCloud/storageUpload.slice";
import { Form, Input, Modal, Select, notification } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const DRAWING_TEMPLATES = [
  {
    value: "meter",
    label: "VinaCAD_metter.dwt",
    url: metricTemplateUrl,
  },
  {
    value: "inches",
    label: "VinaCAD_inches.dwt",
    url: inchesTemplateUrl,
  },
];

const normalizeDrawingName = (name) => {
  const trimmedName = name.trim();

  if (trimmedName.toLowerCase().endsWith(".dwg")) {
    return trimmedName;
  }

  return `${trimmedName.replace(/\.(dwt|dxf)$/i, "")}.dwg`;
};

function CreateNewDrawingModal({
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
    const template = DRAWING_TEMPLATES.find(
      (item) => item.value === values.template,
    );

    if (!template) return;

    setLoading(true);
    try {
      const response = await fetch(template.url);
      if (!response.ok) {
        throw new Error("TEMPLATE_NOT_FOUND");
      }

      const blob = await response.blob();
      const fileName = normalizeDrawingName(values.name);
      const file = Object.assign(
        new File([blob], fileName, {
          type: blob.type || "application/octet-stream",
        }),
        { uid: `new-drawing-${Date.now()}` },
      );

      await dispatch(
        uploadFiles({
          provider,
          connectionId,
          folderId: parentId != null ? parentId.toString() : undefined,
          context,
          files: [file],
        }),
      ).unwrap();

      createEventToTrackingSession({
        event: "create_drawing",
        meta: createTeraTrackingPageMeta("storage_files", {
          action: "create_drawing",
          provider,
          connectionId,
          folderId: parentId,
          context,
          template: template.value,
        }),
      });

      onClose();
    } catch (error) {
      notification.error({
        message: t("Error"),
        description: t("Cannot create new drawing"),
      });
      console.error("[Error] create new drawing failed ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={t("Create new drawing")}
      okText={t("Create")}
      cancelText={t("Cancel")}
      onOk={() => form.submit()}
      confirmLoading={loading}
      onCancel={loading ? undefined : onClose}
      afterClose={() => form.resetFields()}
      centered
    >
      <Form
        form={form}
        name="create-new-drawing"
        layout="vertical"
        onFinish={onCreate}
        initialValues={{
          template: DRAWING_TEMPLATES[0].value,
          name: "",
        }}
      >
        <Form.Item
          name="template"
          label={t("Template")}
          rules={[{ required: true, message: t("Template is required") }]}
        >
          <Select
            options={DRAWING_TEMPLATES.map(({ value, label }) => ({
              value,
              label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label={t("Name")}
          rules={[{ required: true, message: t("Name is required") }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateNewDrawingModal;
