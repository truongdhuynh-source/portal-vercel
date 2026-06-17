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

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Form,
  List,
  Modal,
  notification,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  MoreOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { File } from "@inweb/client";

import ClientFactory from "@/oda-sdk/ClientFactory";

const { Text } = Typography;

function FileVersionItem({ file, version, onClick }) {
  const setRefreshId = useState()[1];
  const isProcessingVsfx = ["waiting", "inprogress"].includes(
    version.status.geometry.state
  );
  const isErrorVsfx = version.status.geometry.state === "failed";
  const isProcessingGltf = ["waiting", "inprogress"].includes(
    version.status.geometryGltf.state
  );
  const isErrorGltf = version.status.geometryGltf.state === "failed";
  const isActiveVersion = version.version === file?.activeVersion;
  const isVersion0 = version.version === 0;
  const canActivate = !isActiveVersion;

  useEffect(() => {
    if (!isProcessingVsfx && !isProcessingGltf) return;

    const controller = new AbortController();
    version
      .waitForDone(["geometry", "geometryGltf", "properties"], true, {
        signal: controller.signal,
      })
      .then(() => setRefreshId(new Date()))
      .catch(() => {});

    return function cleanup() {
      controller.abort();
    };
  }, [version, isProcessingVsfx, isProcessingGltf, setRefreshId]);

  return (
    <List.Item
      extra={
        version.progress ? (
          <Progress
            type="circle"
            percent={version.progress}
            size={21}
            status={version.error ? "exception" : "active"}
            showInfo={!!version.error}
          />
        ) : (
          <Dropdown
            menu={{
              items: [
                {
                  key: "makeactive",
                  label: "Make active version",
                  icon: <FireOutlined className="menu-icon" />,
                  disabled: !canActivate,
                },
                {
                  key: "download",
                  label: "Download source file",
                  icon: <DownloadOutlined className="menu-icon" />,
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  label: "Delete Version",
                  icon: <DeleteOutlined className="menu-icon" />,
                  danger: true,
                  disabled: isActiveVersion || isVersion0,
                },
              ],
              onClick,
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <MoreOutlined className="table-icon" />
          </Dropdown>
        )
      }
    >
      <List.Item.Meta
        avatar={
          <Avatar
            style={{
              color: "#096dd9",
              background: "#e6f7ff",
              border: "1px solid #91d5ff",
            }}
            shape="square"
            size={48}
          >
            {version.error || version.version === undefined
              ? ""
              : `V${version.version + 1}`}
          </Avatar>
        }
        title={
          <Space>
            <Text>{version.name}</Text>
            {(isProcessingVsfx || isProcessingGltf) && (
              <Tooltip title="File processing...">
                <SyncOutlined style={{ color: "Var(--primary)" }} spin />
              </Tooltip>
            )}
            {(isErrorVsfx || isErrorGltf) && (
              <Tooltip title="Geometry processing error. This version cannot be opened in the viewer.">
                <ExclamationCircleOutlined style={{ color: "Var(--danger)" }} />
              </Tooltip>
            )}
            {isActiveVersion && <Tag color="success">Active version</Tag>}
          </Space>
        }
        description={
          <Text>
            {dayjs(version.created).format("L LT")} by{" "}
            <Text strong>{version.owner.fullName}</Text>
          </Text>
        }
      />
    </List.Item>
  );
}

function FileVersionsModal({ fileId, visible, onChangeVersion, onClose }) {
  const [file, setFile] = useState();
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState([]);
  const setRefreshId = useState()[1];
  const client = ClientFactory.get();

  useEffect(() => {
    if (!visible) return;
    if (!fileId) return;

    setLoading(true);
    client
      .getFile(fileId)
      .then((file) => {
        setFile(file);
        return file.getVersions();
      })
      .then((versions) => {
        setVersions(versions.sort((a, b) => b.version - a.version));
      })
      .catch((e) => {
        console.error("Cannot get versions.", e);
        notification.error({
          message: "Error",
          description: "Cannot get versions",
        });
        setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => setVersions([]);
  }, [visible, fileId, client, reload]);

  function makeVersionActive(version) {
    file
      .setActiveVersion(version.version)
      .then(() => {
        notification.success({
          message: "Success",
          description: "Active version changed",
        });
        setRefreshId(new Date());
        onChangeVersion(file);
      })
      .catch((e) => {
        console.error("Cannot change active version.", e);
        notification.error({
          message: "Error",
          description: "Cannot change active version",
        });
      });
  }

  function downloadVersion(version) {
    version
      .download()
      .then((arrayBuffer) => {
        const blob = new Blob([arrayBuffer]);
        FileSaver.saveAs(blob, sanitize(file.name));
        notification.success({
          message: "Success",
          description: "Version download completed",
        });
      })
      .catch((e) => {
        console.error("Cannot download version.", e);
        notification.error({
          message: "Error",
          description: "Cannot download versions",
        });
      });
  }

  function deleteVersion(version) {
    file
      .deleteVersion(version.version)
      .then(() => {
        setVersions(versions.filter((x) => x.version !== version.version));
        notification.success({
          message: "Success",
          description: "Version deleted",
        });
      })
      .catch((e) => {
        console.error("Cannot delete version.", e);
        notification.error({
          message: "Error",
          description: "Cannot delete version",
        });
      });
  }

  function uploadVersion(file2) {
    const data = {
      id: 0,
      name: file2.name,
      created: new Date(),
      owner: file.owner,
      status: {
        geometry: { state: "none" },
        geometryGltf: { state: "none" },
        properties: { state: "none" },
        validation: { state: "none" },
      },
    };
    const fakeVersion = new File(data, file.httpClient);
    fakeVersion.progress = 1;

    setVersions([fakeVersion, ...versions]);
    setUploading(true);
    return file
      .uploadVersion(file2, {
        onProgress: (progress) => {
          fakeVersion.progress = (progress * 100) | 1;
          setRefreshId(new Date());
        },
      })
      .then((version) => version.checkout())
      .then((version) => {
        setVersions([version, ...versions]);
        onChangeVersion(file);
      })
      .catch((e) => {
        fakeVersion.error = e;
        console.error("Cannot upload new version.", e);
        notification.error({
          message: "Error",
          description: "Cannot upload new version",
        });
      })
      .finally(() => {
        setUploading(false);
      });
  }

  const emptyText = loading
    ? "Loading versions. Please wait..."
    : error
      ? "Error loading versions"
      : "No file vesions found";

  const empty = (
    <Empty description={emptyText}>
      {error && (
        <Button type="primary" onClick={() => setReload(reload + 1)}>
          Reload
        </Button>
      )}
    </Empty>
  );

  return (
    <Modal
      open={visible}
      title="Manage Versions"
      footer={
        <div className="d-flex">
          <Upload
            accept={file?.type}
            showUploadList={false}
            maxCount={1}
            beforeUpload={(file2) => {
              const fileName = file2.name.toLocaleLowerCase();
              const isDrawing = new RegExp(file.type).test(fileName);
              return isDrawing ? true : Upload.LIST_IGNORE;
            }}
            customRequest={({ file, onSuccess, onError }) => {
              return uploadVersion(file)
                .then(() => onSuccess(file, {}))
                .catch((e) => onError(e, {}));
            }}
          >
            <Button disabled={error || uploading}>Upload New Version</Button>
          </Upload>
          <Button className="ml-auto" type="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
      okText="Close"
      onCancel={onClose}
      afterClose={() => setVersions([])}
      centered
    >
      <Form.Item>
        <Text>
          You manage versions of the <Text strong>{file?.name}</Text>
        </Text>
      </Form.Item>

      <List
        rowKey="id"
        loading={loading}
        dataSource={versions}
        locale={{ emptyText: empty }}
        renderItem={(version) => (
          <FileVersionItem
            file={file}
            version={version}
            onClick={({ key }) => {
              if (key === "makeactive") makeVersionActive(version);
              if (key === "download") downloadVersion(version);
              if (key === "delete") deleteVersion(version);
            }}
          ></FileVersionItem>
        )}
      />
    </Modal>
  );
}

export default FileVersionsModal;
