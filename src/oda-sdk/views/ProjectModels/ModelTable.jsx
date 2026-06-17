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

import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import dayjs from "dayjs";
import bytes from "bytes";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import {
  Avatar,
  Dropdown,
  Empty,
  Modal,
  notification,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  DesktopOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { PreviewIcon } from "@/components";
import { AppContext } from "@/AppContext";
import ClientFactory from "@/oda-sdk/ClientFactory";
import { modelActions } from "./ModelAddModal";
import FileVersionsModal from "../Files/FileVersionsModal";
import DefaultPreview from "@/assets/images/default-preview.png";

const { Text } = Typography;

const isTocViewerModel = (model) => {
  const type = model?.data?.["Type"]?.toLowerCase();
  const fileName = model?.file?.file_name?.toLowerCase();

  return type === ".ifc" || type === "ifc" || fileName?.endsWith(".ifc");
};

const getTocViewerPath = (project, model) =>
  `/projects/${project.id}/models/${model.file.reference}?viewer=toc`;

function ViewerLink({ style, className, project, model, canOpen, children }) {
  return canOpen ? (
    <Link
      style={style}
      className={classNames("ant-typography", className)}
      to={`/projects/${project.id}/models/${model.file.reference}`}
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function ModelTable({ project, refreshId }) {
  const client = ClientFactory.get();
  const { app } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [models, setModels] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setRefreshId] = useState();
  const [selectedModel, setSelectedModel] = useState({ file: {}, data: {} });
  const [fileVersionsModal, setFileVersionsModal] = useState(false);
  const canUpdateProject =
    project.authorization.project_actions.includes("update");
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    project
      .getFilesInformation()
      .then((models) => {
        models.forEach((model) => {
          model.data = {};
          model.display_information.forEach(
            (x) => (model.data[x.field_display_name] = x.field_value),
          );
          model.permissions = (model.data["Permissions"] || "")
            .split(",")
            .filter((x) => x);
        });
        return models;
      })
      .then((models) => setModels(models))
      .catch((e) => {
        console.error("Cannot get models.", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot get models"),
        });
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [project, refreshId, t]);

  useEffect(() => {
    // TODO: get isAdmin from the current user when it's supported
    client
      .getUsers()
      .then(() => setIsAdmin(true))
      .catch(() => {});
  }, [client]);

  async function downloadSource(model) {
    model.downloading = true;
    setRefreshId(new Date());
    try {
      const file = await client.getFile(model.file.reference);
      const arrayBuffer = await file.download();
      const blob = new Blob([arrayBuffer]);
      FileSaver.saveAs(blob, sanitize(file.name));
      notification.success({
        message: "Success",
        description: "File downloaded",
      });
    } catch (e) {
      console.error("Cannot download file.", e);
      notification.error({
        message: "Error",
        description: "Cannot download file",
      });
    } finally {
      model.downloading = false;
      setRefreshId(new Date());
    }
  }

  async function removeModel(model) {
    try {
      const file = await client.getFile(model.file.reference);
      const permissions = await file.getPermissions();
      await Promise.allSettled(
        permissions
          .filter((permission) =>
            permission.grantedTo.some((x) => x.project?.id === project.id),
          )
          .map((permission) => permission.delete()),
      );
      const newModels = models.filter(
        (x) => x.file.reference !== model.file.reference,
      );
      setModels(newModels);
      notification.success({
        message: "Success",
        description: "Model removed",
      });
    } catch (e) {
      console.error("Cannot remove model.", e);
      notification.error({
        message: "Error",
        description: "Cannot remove model",
      });
    }
  }

  async function updatePermissions(model, value) {
    model.updating = true;
    setRefreshId(new Date());
    try {
      const file = await client.getFile(model.file.reference);
      const permissions = await file.getPermissions();
      await Promise.allSettled(
        permissions
          .filter((permission) =>
            permission.grantedTo.some((x) => x.project?.id === project.id),
          )
          .map((permission) => permission.update({ actions: value })),
      );
      model.permissions = value;
      setRefreshId(new Date());
      notification.success({
        message: "Success",
        description: "Permissions has been changed",
      });
    } catch (e) {
      console.error("Cannot change permissions.", e);
      notification.error({
        message: "Error",
        description: "Cannot change permissions",
      });
    } finally {
      model.updating = false;
      setRefreshId(new Date());
    }
  }

  const nativeFormats = (app.config.nativeFormats || []).map((format) =>
    format.toLocaleLowerCase(),
  );
  const isNativeFormat = (model) =>
    nativeFormats.find((format) => model.data["Type"] === "." + format);

  const columns = [
    {
      title: t("File Name"),
      dataIndex: "data",
      render: (data, model) => {
        const permissions = model.permissions;
        const isOwner = model.data["Owner"] === app.user.id;
        const isAdminOrOwner = isAdmin || isOwner;
        const canRead =
          isAdminOrOwner ||
          permissions.find((x) => ["read", "write"].includes(x));
        const canOpen =
          canRead &&
          (model.data["Geometry Type"] !== "" || isNativeFormat(model));
        return (
          <ViewerLink
            className="d-flex align-items-center flex-nowrap"
            project={project}
            model={model}
            canOpen={canOpen}
          >
            <PreviewIcon
              className="mr-2 d-none d-sm-block"
              preview={data["Preview URL"]}
              defaultPreview={DefaultPreview}
            />
            <Text className="text-reset mr-2" ellipsis={true}>
              {data["Display Name"]}
            </Text>
          </ViewerLink>
        );
      },
      ellipsis: true,
    },
    {
      title: t("Version"),
      dataIndex: "data",
      render: (data, model) => (
        <Tag
          style={{ cursor: "pointer" }}
          color="blue"
          onClick={() => {
            setSelectedModel(model);
            setFileVersionsModal(true);
          }}
        >
          V{(data["Active Version"] | 0) + 1}
        </Tag>
      ),
      width: "10%",
      ellipsis: true,
      responsive: ["sm"],
    },
    {
      title: t("Size"),
      dataIndex: "data",
      render: (data) =>
        bytes.format(Number(data["Size"]), {
          decimalPlaces: 1,
          unitSeparator: " ",
        }),
      width: "8%",
      ellipsis: true,
      responsive: ["lg"],
    },
    {
      title: t("Last Updated"),
      dataIndex: "data",
      render: (data) => {
        return dayjs(data["Updated At"]).format("L LT");
      },
      width: "15%",
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: t("Updated By"),
      dataIndex: "data",
      render: (data) => {
        return (
          <div className="d-flex align-items-center flex-nowrap">
            <Avatar
              style={{ minWidth: 24 }}
              size={24}
              src={data["Updated By Avatar URL"]}
            >
              {data["Updated By Initials"]}
            </Avatar>
            <Text className="text-reset ml-2" ellipsis={true}>
              {data["Updated By Full Name"]}
            </Text>
          </div>
        );
      },
      width: "15%",
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: t("Permissions"),
      dataIndex: "data",
      render: (data, model) => {
        const permissions = model.permissions;
        const isOwner = data["Owner"] === app.user.id;
        const isAdminOrOwner = isAdmin || isOwner;
        const canChange = isAdminOrOwner;
        return (
          <Select
            style={{ width: "100%" }}
            loading={model.updating}
            value={permissions || [t("No permissions granted")]}
            disabled={!canChange}
            mode="multiple"
            bordered={false}
            optionFilterProp="label"
            options={Object.keys(modelActions).map((key) => ({
              label: modelActions[key],
              value: key,
              disabled: model.updating,
            }))}
            placeholder={t("No permissions granted")}
            maxTagCount="responsive"
            onChange={(value) => updatePermissions(model, value)}
          />
        );
      },
      width: "20%",
      responsive: ["sm"],
    },
    {
      title: "",
      key: "actions",
      render: (_, model) => {
        const permissions = model.permissions;
        const isOwner = model.data["Owner"] === app.user.id;
        const isAdminOrOwner = isAdmin || isOwner;
        const canWrite = isAdminOrOwner || permissions.includes("write");
        const canRead = canWrite || permissions.includes("read");
        const canOpen =
          canRead &&
          (model.data["Geometry Type"] !== "" || isNativeFormat(model));
        const canDownload =
          isAdminOrOwner || permissions.includes("readSourceFile");
        const canDelete = isAdminOrOwner;
        const DownloadIcon = model.downloading
          ? LoadingOutlined
          : DownloadOutlined;
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "open",
                  label: (
                    <ViewerLink
                      style={{ textDecoration: "none" }}
                      project={project}
                      model={model}
                      canOpen={canOpen}
                    >
                      {t("Open in viewer")}
                    </ViewerLink>
                  ),
                  icon: <DesktopOutlined className="menu-icon" />,
                  disabled: !canOpen,
                },
                isTocViewerModel(model) && {
                  key: "open-toc",
                  label: (
                    <Link
                      style={{ textDecoration: "none" }}
                      className="text-reset"
                      to={getTocViewerPath(project, model)}
                    >
                      {t("Open with TOC")}
                    </Link>
                  ),
                  icon: <DesktopOutlined className="menu-icon" />,
                  disabled: !canRead,
                },
                {
                  key: "download",
                  label: t("Download source file"),
                  icon: <DownloadIcon className="menu-icon" />,
                  disabled: !canDownload || model.downloading,
                },
                {
                  key: "versions",
                  label: t("Manage versions"),
                  icon: <HistoryOutlined className="menu-icon" />,
                },
                {
                  type: "divider",
                  disabled: !canDelete,
                },
                {
                  key: "delete",
                  label: t("Remove model"),
                  icon: <DeleteOutlined className="menu-icon" />,
                  danger: true,
                  disabled: !canDelete,
                },
              ],
              onClick: ({ key }) => {
                if (key === "download") downloadSource(model);
                if (key === "versions") {
                  setSelectedModel(model);
                  setFileVersionsModal(true);
                }
                if (key === "delete") {
                  Modal.confirm({
                    title: t("Remove the model?"),
                    icon: <ExclamationCircleOutlined />,
                    okText: t("Yes"),
                    okType: "danger",
                    cancelText: t("No"),
                    cancelButtonProps: { type: "primary" },
                    onOk: () => removeModel(model),
                  });
                }
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <MoreOutlined className="table-icon" />
          </Dropdown>
        );
      },
      width: "3em",
    },
  ];

  const emptyText = error
    ? t("Error loading models")
    : loading
      ? t("Loading models. Please  wait...")
      : `${t("No models in the project.")} ${canUpdateProject ? t(" To add models, click Add Models button.") : ""}`;

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total: models.length,
    size: "large",
  };

  return (
    <React.Fragment>
      <Table
        size="small"
        columns={columns}
        showSorterTooltip={false}
        rowKey={(row) => row.file.reference}
        dataSource={models}
        pagination={pagination}
        loading={loading}
        bordered={false}
        locale={{ emptyText: <Empty description={emptyText} /> }}
      />
      <FileVersionsModal
        visible={fileVersionsModal}
        fileId={selectedModel.file.reference}
        onChangeVersion={(file) => {
          selectedModel.data["Size"] = file.size;
          selectedModel.data["Geometry Status"] = file.status.geometry.state;
          selectedModel.data["GeometryGltf Status"] =
            file.status.geometryGltf.state;
          selectedModel.data["Geometry Type"] = file.geometryType;
          selectedModel.data["Properties Status"] =
            file.status.properties.state;
          selectedModel.data["Active Version"] = file.activeVersion;
          selectedModel.data["Updated At"] = file.updatedAt;
          selectedModel.data["Updated By"] = file.updatedBy.userId;
          selectedModel.data["Updated By Full Name"] = file.updatedBy.fullName;
          setRefreshId(new Date());
        }}
        onClose={() => setFileVersionsModal(false)}
      />
    </React.Fragment>
  );
}

export default ModelTable;
