import { Form, Modal, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { uploadFiles } from "@/redux/features/storageCloud/storageUpload.slice";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import bytes from "bytes";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

function StorageFileUploadModal({
  visible,
  onClose,
  provider,
  connectionId,
  folderId,
  context,
  maxUploadSize,
  showByExtension,
}) {
  const allowedExtensions =
    showByExtension === "all"
      ? []
      : showByExtension.split(",").map((ext) => `.${ext.toLowerCase()}`);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { progress: progressMap, uploading } = useSelector(
    (state) => state.storage.storageUpload,
  );

  const filesWatch = Form.useWatch("files", form);

  useEffect(() => {
    if (!filesWatch?.length) return;

    const next = filesWatch.map((file) => {
      const percent = progressMap?.[file.uid];
      if (percent == null) return file;

      return {
        ...file,
        percent,
        status: uploading ? "uploading" : "done",
      };
    });

    form.setFieldsValue({ files: next });
  }, [progressMap, uploading]);

  const hasInvalid = (filesWatch ?? []).some((f) => f?.status === "error");

  const handleUpload = async ({ files }) => {
    setLoading(true);
    try {
      await dispatch(
        uploadFiles({
          provider,
          connectionId,
          folderId,
          context,
          files: files.map((f) => f.originFileObj),
        }),
      ).unwrap();

      const uploadedFiles = files.map((f) => f.originFileObj).filter(Boolean);
      createEventToTrackingSession({
        event: "upload_file",
        value: uploadedFiles.length,
        meta: createTeraTrackingPageMeta("storage_files", {
          action: "upload",
          provider,
          connectionId,
          folderId,
          context,
        }),
      });

      onClose();
    } catch (error) {
      console.error("[Error] upload files failed ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={t("Upload File")}
      confirmLoading={loading}
      onCancel={loading ? undefined : onClose}
      afterClose={() => form.resetFields()}
      onOk={() => {
        if (hasInvalid) return;
        form.submit();
      }}
      okButtonProps={{
        disabled: !filesWatch?.length || hasInvalid,
      }}
      centered
      rootClassName="storage-upload-files-modal"
    >
      <Form form={form} onFinish={handleUpload}>
        <Form.Item
          name="files"
          valuePropName="fileList"
          rules={[
            {
              required: true,
              type: "array",
              min: 1,
              message: t("Please choose at least one file"),
            },
          ]}
          getValueFromEvent={(e) =>
            Array.isArray(e) ? e : (e?.fileList ?? [])
          }
        >
          <Upload.Dragger
            accept={allowedExtensions.join(",")}
            multiple
            disabled={uploading}
            listType="picture"
            maxCount={10}
            showUploadList={{ showRemoveIcon: !uploading }}
            progress={{ size: [-1, 2], showInfo: true }}
            beforeUpload={() => false}
            customRequest={({ onSuccess }) => onSuccess?.("ok")}
            onChange={({ fileList }) => {
              const validated = fileList.map((f) => {
                if (!f.size || f.size === 0) {
                  return {
                    ...f,
                    status: "error",
                    error: new Error(t("File must not be empty")),
                  };
                }

                if (
                  allowedExtensions.length > 0 &&
                  !allowedExtensions.some((ext) =>
                    f.name?.toLowerCase().endsWith(ext),
                  )
                ) {
                  return {
                    ...f,
                    status: "error",
                    error: new Error(
                      t("File type must be one of {{types}}.", {
                        types: allowedExtensions.join(", "),
                      }),
                    ),
                  };
                }

                if (
                  maxUploadSize != null &&
                  maxUploadSize >= 0 &&
                  f.size &&
                  f.size > maxUploadSize
                ) {
                  return {
                    ...f,
                    status: "error",
                    error: new Error(
                      t("File size must be less than or equal to {{size}}", {
                        size: bytes(maxUploadSize),
                      }),
                    ),
                  };
                }

                return {
                  ...f,
                  status: "done",
                  error: undefined,
                  percent: f.percent ?? 0,
                };
              });

              form.setFieldsValue({ files: validated });

              const hasInvalid = validated.some((f) => f.status === "error");
              const invalidFile = validated.find((f) => f.status === "error");
              const invalidErrorMessage = invalidFile?.error?.message;

              form.setFields([
                {
                  name: "files",
                  errors: hasInvalid ? [invalidErrorMessage] : [],
                },
              ]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {t("Click or drop your file here")}
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StorageFileUploadModal;
