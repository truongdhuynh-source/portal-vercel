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

import { useContext, useEffect, useState } from "react";
import picomatch from "picomatch-browser";
import { Form, Modal, notification, Radio, Select, Upload } from "antd";
import { useTranslation } from "react-i18next";

import { InboxOutlined } from "@ant-design/icons";
import { AppContext } from "@/AppContext";
import ClientFactory from "@/oda-sdk/ClientFactory";
import axiosInstance from "@/plugins/axios";
import getUserIdLogin from "@/utils/getUserIdLogin";
// import arial from "@/assets/fonts/arial.ttf";
// import calibri from "@/assets/fonts/calibri.ttf";
// import simplex from "@/assets/fonts/simplex.ttf";
// import tahoma from "@/assets/fonts/tahoma.ttf";
// import verdana from "@/assets/fonts/verdana.ttf";
import { FILE_UPLOAD_LIMIT } from "@/constants";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

function FileUploadModal({
  visible,
  onUpload,
  onClose,
  isFamily,
  userFileInfo,
  storageLimit,
  fontFiles,
  trackingEvent = "upload_file",
  trackingPage = "my-files",
  trackingMeta = {},
}) {
  const { app } = useContext(AppContext);
  const lang = localStorage.getItem("i18nextLng");
  const userId = getUserIdLogin();

  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const { t } = useTranslation();
  const [isRevitFile, setIsRevitFile] = useState(isFamily ?? false);
  const [isPublic, setIsPublic] = useState(false);
  const [categories, setCategories] = useState([]);
  const [localFontFile, setLocalFontFile] = useState([]);

  const supportFormats = (app.config.supportFormats || []).map((format) =>
    format.toLocaleLowerCase(),
  );
  const nativeFormats = (app.config.nativeFormats || []).map((format) =>
    format.toLocaleLowerCase(),
  );

  const revitFormat = (app.config.revitFormat || []).map((format) =>
    format.toLocaleLowerCase(),
  );

  // useEffect(() => {
  //   const fonts = [arial, calibri, simplex, tahoma, verdana];
  //   fonts.forEach(async (fontPath) => {
  //     const response = await fetch(fontPath);
  //     const blob = await response.blob();
  //     const file = new File([blob], fontPath.split("/").pop(), {
  //       type: blob.type,
  //     });
  //     setLocalFontFile((prev) => [...prev, file]);
  //   });
  // }, []);

  useEffect(() => {
    Promise.all([fetchCategories()]);
  }, [visible]);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories/get-all-categories");
      if (res) {
        setCategories(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveFilePublic = async (
    fileId,
    category,
    fileName,
    fileSize,
    fullName,
  ) => {
    await axiosInstance.post("/file-public/file", {
      fileId,
      category,
      isPublic,
      userId,
      fileName,
      fileSize,
      fullName,
    });
  };

  const shareFile = async (fileId) => {
    await axiosInstance.post("/file-public/share", {
      fileId,
    });
  };

  const drawingFormats = supportFormats.concat(nativeFormats);

  const uploadFiles = async (values) => {
    const client = ClientFactory.get();

    const setFileStatus = (fileName, percent, status) => {
      form.setFieldsValue({
        files: form.getFieldValue("files").map((entry) => {
          if (entry.name === fileName) {
            return { ...entry, percent: (percent * 100) | 0, status };
          }
          return entry;
        }),
      });
      form.setFieldsValue({
        refFiles: form.getFieldValue("refFiles").map((entry) => {
          if (entry.name === fileName) {
            return { ...entry, percent: (percent * 100) | 0, status };
          }
          return entry;
        }),
      });
    };

    const progress = (percent, file) => {
      setFileStatus(file?.name, percent, "uploading");
    };

    const uploadFile = (file) => {
      if (userFileInfo.fileList?.includes(file.name)) {
        notification.warning({
          message: t("Warning"),
          description: t("Cannot upload file due to duplicate name"),
        });
        return;
      }
      if (file > FILE_UPLOAD_LIMIT) {
        notification.warning({
          message: t("Warning"),
          description: t("File must be smaller than 200MB"),
        });
        return;
      }
      if (
        Number(userFileInfo.totalSize) + Number(file.size) >=
        Number(storageLimit)
      ) {
        notification.warning({
          message: t("Warning"),
          description: t("Storage capacity is full"),
        });
        return;
      }
      return client
        .uploadFile(file, { onProgress: progress })
        .then((file) => {
          setFileStatus(file.name, 1, "done");
          if (isRevitFile) {
            const { name, size, owner } = file.data;
            const fileId = file.data.id;
            saveFilePublic(
              fileId,
              form.getFieldValue("category"),
              name,
              size,
              owner.fullName,
            );
            shareFile(fileId);
          }
          // setIsRevitFile(false);
          return file;
        })
        .catch((e) => {
          console.error(`Cannot upload drawing file ${file.name}.`, e);
          setFileStatus(file.name, 0, "error");
          throw new Error(t("Cannot upload drawing file"));
        });
    };

    const uploadReferences = (refFiles) => {
      return Promise.allSettled(
        refFiles.map((file) =>
          client.uploadFile(file, { onProgress: progress }),
        ),
      )
        .then((results) =>
          results
            .filter((result, index) => {
              if (result.status === "fulfilled") {
                setFileStatus(refFiles[index].name, 1, "done");
                return true;
              } else {
                setFileStatus(refFiles[index].name, 0, "error");
                console.error(
                  `${t("Cannot upload reference file")} ${refFiles[index].name}.`,
                  result.reason,
                );
                return false;
              }
            })
            .map((result) => result.value),
        )
        .then((files) => {
          // const rejectedCount = refFiles.length - files.length;
          // if (rejectedCount) {
          //   notification.warning({
          //     message: t("warning"),
          //     description: `${t("Cannot upload")} ${rejectedCount} ${t("of")} ${
          //       refFiles.length
          //     } ${t("reference files, the file may not render correctly")}`,
          //   });
          // }
          let fileRefs = files.map((file) => ({
            id: file.id,
            name: file.name,
          }));
          if (fontFiles.length) {
            const font = fontFiles.map((x) => {
              return { id: x._data.id, name: x._data.name };
            });
            fileRefs = [...fileRefs, ...font];
          }
          return fileRefs;
        });
    };

    function getJobParameters(fileName, job) {
      const { jobParameters } = app.config;
      const { [job]: parameters, overrides } = jobParameters || {};
      if (parameters && overrides) {
        const overrideList = Array.isArray(overrides) ? overrides : [overrides];
        for (const override of overrideList) {
          if (
            picomatch.isMatch(fileName, override.files, {
              ignore: override.excludeFiles,
              basename: true,
              dot: true,
            })
          ) {
            const overrideParameters = override[job];
            if (typeof overrideParameters === "string")
              return overrideParameters;
            Object.assign(parameters, overrideParameters);
          }
        }
        Object.entries(parameters)
          .filter(([key, value]) => value === null)
          .forEach(([key, value]) => delete parameters[key]);
      }
      return parameters;
    }

    setUploading(true);
    try {
      const { files, refFiles } = values;

      const file = await uploadFile(files[0].originFileObj);
      if (file) {
        // if (
        //   !file.name?.toLowerCase()?.includes(".dwg") &&
        //   !file.name?.toLowerCase()?.includes(".dxf")
        // ) {
        // }
        await file.createJob(
          "geometry",
          getJobParameters(file.name, "geometry"),
        );
        await file.createJob(
          "properties",
          getJobParameters(file.name, "properties"),
        );
        let fileRefs = [...refFiles.map((file) => file.originFileObj)];
        if (!fontFiles.length) {
          fileRefs = [...fileRefs, ...localFontFile];
        }
        const references = await uploadReferences(fileRefs);

        await file.setReferences({ references }).catch((e) => {
          console.error("Cannot set drawing file references.", e);
          notification.warning({
            message: t("Warning"),
            description: t(
              "Cannot set drawing file references, the file may not render correctly",
            ),
          });
        });

        notification.success({
          message: t("Success"),
          description: t("File uploaded"),
        });
        createEventToTrackingSession({
          event: trackingEvent,
          meta: createTeraTrackingPageMeta(trackingPage, {
            action: "upload",
            isFamily,
            isPublic,
            fileCount: values.files?.length || 0,
            fileName: values.files?.[0]?.name,
            fileSize: values.files?.[0]?.size,
            extension: values.files?.[0]?.name?.split(".").pop(),
            ...trackingMeta,
          }),
        });
        onUpload();
      }
    } catch (e) {
      notification.error({ message: t("Error"), description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setIsPublic(false);
    onClose();
  };

  const files = Form.useWatch("files", form);

  return (
    <Modal
      open={visible}
      title={t("Upload File")}
      okText={t("Upload")}
      onOk={() => form.submit()}
      confirmLoading={uploading}
      onCancel={uploading ? undefined : closeModal}
      afterClose={() => form.resetFields()}
      okButtonProps={{
        disabled: !(files && files.length > 0),
      }}
      centered
    >
      <Form
        form={form}
        name="upload"
        layout="vertical"
        onFinish={uploadFiles}
        initialValues={{
          files: [],
          refFiles: [],
        }}
      >
        <Form.Item
          name="files"
          valuePropName="fileList"
          label={t("Drawing File")}
          rules={[
            { required: true, message: t("Please choose drawing file") },
            () => ({
              validator(_, value) {
                if (value.length > 0) {
                  const isLt200MB = value[0].size / 1024 / 1024 < 200;
                  if (!isLt200MB) {
                    return Promise.reject(
                      new Error(t("File must be smaller than 200MB")),
                    );
                  } else {
                    return Promise.resolve();
                  }
                } else {
                  return Promise.resolve();
                }
              },
            }),
          ]}
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
          <Upload.Dragger
            accept={
              !isFamily
                ? drawingFormats.map((format) => `.${format}`).join(",")
                : revitFormat.map((format) => `.${format}`).join(",")
            }
            listType="picture"
            maxCount={1}
            disabled={uploading}
            showUploadList={{ showRemoveIcon: !uploading }}
            progress={{ size: [-1, 2], showInfo: true }}
            beforeUpload={(file) => {
              const fileType = file.name.split(".").pop().toLocaleLowerCase();
              const acceptedTypes = isFamily ? revitFormat : drawingFormats;
              const isAccepted = acceptedTypes.includes(fileType);

              if (!isAccepted) {
                notification.warning({
                  message: t("Warning"),
                  description: `${t("Only supported files")}: ${acceptedTypes
                    .map((ext) => `.${ext}`)
                    .join(", ")
                    .toUpperCase()}`,
                });
              }
              // setIsRevitFile(fileType === "rfa");
              return isAccepted ? false : Upload.LIST_IGNORE;
            }}
            customRequest={(file) => file.onSuccess()}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {t("Click or drop drawing file here")}
              <span className="text-danger">{t("Maximum 200 MB")}</span>
            </p>
            <p className="ant-upload-hint">
              {!isFamily
                ? drawingFormats.join(", ").toLocaleUpperCase()
                : revitFormat.join(", ").toLocaleUpperCase() + ",.."}
            </p>
          </Upload.Dragger>
        </Form.Item>

        {isFamily && (
          <div>
            <Form.Item
              label={t("Family Categories")}
              rules={[{ required: true, message: t("Please select category") }]}
              name="category"
            >
              <Select
                showSearch
                allowClear
                placeholder={t("Select a category")}
                optionFilterProp="label"
                options={categories.map((category) => ({
                  label:
                    lang === "vi"
                      ? category.nameVI
                      : lang === "en"
                        ? category.nameEN
                        : category.nameJA,
                  value: category.id,
                }))}
              />
            </Form.Item>

            <Form.Item label={t("Access Control")}>
              <Radio.Group
                value={isPublic}
                onChange={(e) => setIsPublic(e.target.value)}
                options={[
                  { label: t("Private"), value: false },
                  { label: t("Public"), value: true },
                ]}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          name="refFiles"
          valuePropName="fileList"
          label={t("Reference Files")}
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
        >
          <Upload.Dragger
            multiple={true}
            disabled={uploading}
            showUploadList={{ showRemoveIcon: !uploading }}
            progress={{ size: [-1, 2], showInfo: true }}
            beforeUpload={(file) => {
              const isDublicate = form
                .getFieldValue("refFiles")
                .some((x) => x.name === file.name);
              return isDublicate ? Upload.LIST_IGNORE : false;
            }}
            customRequest={(file) => file.onSuccess()}
          >
            <p className="ant-upload-text">
              {t("Click or drop reference files here")}
            </p>
            <p className="ant-upload-hint">
              {t(
                "Images, fonts, or any other files to correct rendering of the drawing file",
              )}
            </p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default FileUploadModal;
