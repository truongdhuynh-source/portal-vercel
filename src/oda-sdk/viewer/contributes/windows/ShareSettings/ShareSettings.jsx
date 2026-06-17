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

import { useState, useEffect, useContext, useRef } from "react";
import {
  Checkbox,
  Button,
  Col,
  Row,
  Form,
  notification,
  Modal,
  Switch,
  Input,
  ConfigProvider,
  Tooltip,
  Spin,
  DatePicker,
  Flex,
  Space,
  Select,
} from "antd";
import { t } from "i18next";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import {
  CopyOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
const dateFormat = "YYYY-MM-DD";

import ClientFactory from "@/oda-sdk/ClientFactory";
import { AppContext } from "@/AppContext";
import { userListConvertForShareFile } from "@/utils/userConvertForShareFile";
import { InviteMembers } from "./InviteMembers";
import "./ShareSetting.css";
import { useTranslation } from "react-i18next";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

export function ShareSettings({ file, onShareUnshare, onClose }) {
  const client = ClientFactory.get();
  const { app } = useContext(AppContext);
  // const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isInWeb, setIsInWeb] = useState(false);
  const [sharedLinkUsers, setSharedLinkUsers] = useState([]);
  const [isCopyLinkViewer, setIsCopyLinkViewer] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;

  const getRandomPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const onFinish = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    if (shared) {
      values.expiresAt = dayjs(form.getFieldValue("expiresAt"))
        .hour(12)
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss[Z]");
      await update(values);
      return;
    }

    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    values.expiresAt = dayjs(form.getFieldValue("expiresAt"))
      .hour(12)
      .utc()
      .format("YYYY-MM-DDTHH:mm:ss[Z]");

    const owner = await app.getCurrentUser();

    try {
      const response = await client.createSharedLink(
        file.versions[file.activeVersion]?.fileId || file.id,
        values,
      );

      notification.success({
        message: t("Success"),
        description: t("Shared link has been successfully created"),
      });
      setShared(true);
      setSharedLink(response);

      if (isInWeb) {
        await app.createShareFileForMembers({
          sharedLinkToken: response.token,
          members: values.members ? values.members.map((u) => u.id) : [],
          ownerId: owner.id,
          permission: isInWeb ? ["read", "readSourceFile"] : values.actions,
          fileId: file.versions[file.activeVersion]?.fileId || file.id,
          fileName: file.name,
          locale: currentLocale,
        });
      }

      await fetchSharedLinkUsers(response.token);
      onShareUnshare && onShareUnshare(true);
      form.setFieldsValue({
        url: getClientHrefFromSharedLinkUrl(response.url),
      });

      createEventToTrackingSession({
        event: "share_file",
        meta: createTeraTrackingPageMeta("my-files", {
          action: "share",
          fileId: file.id,
          fileName: file.name,
        }),
      });
    } catch (e) {
      console.error(`Cannot create Shared Link for ${file.name}`, e.message);
      // notification.error({
      //   message: t("Error"),
      //   description: t("Failed to create shared link"),
      // });
    } finally {
      setSubmitting(false);
    }
  };

  const onUnshareClick = async () => {
    const deleteSharedLink = async () => {
      try {
        await client.deleteSharedLink(sharedLink.token);
        await app.deleteShareFile(sharedLink.token);
        notification.success({
          message: t("Success"),
          description: t("Shared link has been successfully deleted"),
        });

        createEventToTrackingSession({
          event: "unshare_file",
          meta: createTeraTrackingPageMeta("my-files", {
            action: "unshare",
            fileId: file.id,
            fileName: file.name,
          }),
        });

        setSharedLink({ permissions: { actions: ["read"] } });
        setShared(false);
        setPasswordProtected(false);
        onShareUnshare && onShareUnshare(false);
        onClose && onClose();
      } catch (e) {
        console.error(`Cannot delete Shared Link for ${file.name}`, e.message);
        notification.error({
          message: t("Error"),
          description: t("Failed to delete shared link"),
        });
      }
    };

    Modal.confirm({
      title: t("Confirm unshare"),
      content: t("Unshare with pending members warning"),
      okText: t("Unshare"),
      cancelText: t("Cancel"),
      centered: true,
      onOk: deleteSharedLink,
    });
    return;
    // if (hasPendingInviteData) {
    // }

    // await deleteSharedLink();
    //     message: t("Success"),
    //     description: t("Shared link has been successfully deleted"),
    //   });
    //   setSharedLink({ permissions: { actions: ["read"] } });
    //   setShared(false);
    //   setPasswordProtected(false);
    //   onShareUnshare && onShareUnshare(false);
    //   onClose && onClose();
    // } catch (e) {
    //   console.error(`Cannot delete Shared Link for ${file.name}`, e.message);
    //   notification.error({
    //     message: t("Error"),
    //     description: t("Failed to delete shared link"),
    //   });
    // }
  };

  const update = async (values) => {
    const dto = {
      permissions: {
        actions: values.actions,
        expiresAt: values.expiresAt,
      },
    };
    if (values.passwordProtected) dto.permissions.password = values.password;
    else {
      dto.permissions.password = "";
      setPasswordProtected(false);
    }

    try {
      const response = await sharedLink.update(dto);

      if (isInWeb) {
        await app.updateShareFileDetail({
          members: values.members ? values.members.map((u) => u.id) : [],
          permission: isInWeb ? ["read", "readSourceFile"] : values.actions,
          sharedLinkToken: response.token,
          fileName: file.name,
          locale: currentLocale,
        });
      }

      createEventToTrackingSession({
        event: "update_share_file",
        meta: createTeraTrackingPageMeta("my-files", {
          action: "update",
          fileId: file.id,
          fileName: file.name,
        }),
      });

      notification.success({
        message: t("Success"),
        description: t("Shared link has been successfully updated"),
      });
    } catch (e) {
      console.error(`Cannot update Shared Link for ${file.name}`, e.message);
      notification.error({
        message: t("Error"),
        description: t("Failed to update shared link"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shared, setShared] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [geometryStatus, setGeometryStatus] = useState("none");
  const defaultSharedLink = {
    permissions: { actions: ["read"] },
    token: file.sharedLinkToken,
  };
  const [sharedLink, setSharedLink] = useState(defaultSharedLink);
  const inviteAddRef = useRef(null);

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      const result = await inviteAddRef.current?.();

      if (result?.ok === false) {
        setSubmitting(false);

        if (result.type === "duplicated") {
          notification.warning({
            message: t("Duplicate member"),
            description: t(
              'member_already_exists',
              { email: result.email }
            ),
            placement: "topRight",
          });
        }

        return;
      }
    } catch (err) {
      setSubmitting(false);
      return;
    }

    form.submit();
  };

  const datePickerDefaultDate = dayjs().add(1, "year");
  const datePickerMinDate = dayjs();

  useEffect(() => {
    setLoading(true);

    if (!sharedLink.token) {
      setLoading(false);
      return;
    }

    const loadSharedLink = async () => {
      try {
        const response = await client.getSharedLink(sharedLink.token);
        setSharedLink(response);
        setShared(true);
      } catch (e) {
        console.error("Cannot get shared link info.", e);
        notification.error({
          message: "Error",
          description: "Cannot get shared link info",
        });
      } finally {
        setLoading(false);
      }
    };
    loadSharedLink();
  }, [client, sharedLink.token]);

  useEffect(() => {
    if (passwordProtected)
      form.setFieldsValue({ password: getRandomPassword() });
  }, [passwordProtected]);

  const getClientHrefFromSharedLinkUrl = (shareLinkUrl) => {
    const url = new URL(shareLinkUrl ?? sharedLink.url);
    url.protocol = location.protocol;
    url.hostname = location.hostname;
    url.port = location.port;
    return url.href;
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.warn("Clipboard API failed:", e);
      }
    }

    if (typeof document === "undefined" || !document.body) {
      throw new Error("Clipboard is not available in this environment");
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    const activeElement = document.activeElement;

    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const selected =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0)
        : null;

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }

    document.body.removeChild(textarea);

    if (selected && selection) {
      selection.removeAllRanges();
      selection.addRange(selected);
    }

    if (activeElement?.focus) {
      activeElement.focus();
    }

    if (!success) {
      throw new Error(
        window.isSecureContext
          ? "Browser blocked the fallback clipboard command"
          : "Clipboard requires HTTPS or localhost",
      );
    }

    return true;
  };

  const onCopyToClipboardClick = async () => {
    try {
      const url = getClientHrefFromSharedLinkUrl();
      await copyToClipboard(url);
      setIsCopyLinkViewer(true);

      notification.success({
        message: t("Success"),
        description: t("Preview link copied successfully"),
        showProgress: true,
        pauseOnHover: true,
        duration: 1,
      });

      setTimeout(() => {
        setIsCopyLinkViewer(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // const getUsers = async () => {
  //   try {
  //     const res = await app.getAllUsers();
  //     const data = res?.result || [];

  //     return userConvertForShareFile(data);
  //   } catch (error) {
  //     console.error(error);
  //     return [];
  //   }
  // };

  const fetchSharedLinkUsers = async (sharedLinkToken) => {
    if (!sharedLinkToken) return;
    const users = await app.getSharedFileUsers(sharedLinkToken);
    const sharedUsers = userListConvertForShareFile(users);
    setSharedLinkUsers(sharedUsers);

    form.setFieldsValue({
      members: sharedUsers.map((u) => u.user_id || u.id),
    });
  };

  useEffect(() => {
    // const fetchUsers = async () => {
    //   setUsersLoading(true);
    //   const users = await getUsers();
    //   setUsers(users);
    //   setUsersLoading(false);
    // };

    // fetchUsers();
    fetchSharedLinkUsers(sharedLink.token);
  }, [sharedLink, shared]);

  useEffect(() => {
    if (!usersLoading && sharedLinkUsers?.length) {
      form.setFieldsValue({
        members: sharedLinkUsers,
      });
    }
  }, [usersLoading, sharedLinkUsers, form]);

  useEffect(() => {
    if (file) {
      const isInWeb =
        file.name.toLowerCase().endsWith(".dwg") ||
        file.name.toLowerCase().endsWith(".dxf");
      setIsInWeb(isInWeb);
    }
  }, [file]);

  // useEffect(() => {
  //   const handleHiddenStatus = ({ detail }) => {
  //     if (detail.fileId === file.id) {
  //       setIsSharedLinkPreview(true);
  //     }
  //   };

  //   window.addEventListener("load-geometry-done", handleHiddenStatus);

  //   return () => {
  //     window.removeEventListener(
  //       "load-geometry-done",
  //       handleHiddenStatus,
  //     );
  //   };
  // }, []);

  useEffect(() => {
    let interval;

    const checkGeometryJob = async () => {
      try {
        const client = ClientFactory.get();
        const geometryJobId = file?.status?.geometry?.jobId;

        if (!geometryJobId) return;

        const response = await client.httpClient.get(
          `/jobs/${geometryJobId}?_=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        const job = await response.json();

        if (job.status === "done") {
          setGeometryStatus("done");
          clearInterval(interval);
        }

        if (job.status === "failed") {
          setGeometryStatus("failed");
          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkGeometryJob();

    interval = setInterval(checkGeometryJob, 5000);

    return () => clearInterval(interval);
  }, [file]);

  return loading ? (
    <Spin />
  ) : (
    <ConfigProvider
      theme={{
        components: {
          Form: {
            itemMarginBottom: 8,
          },
        },
      }}
    >
      <Form
        form={form}
        onFinish={onFinish}
        onFinishFailed={() => setSubmitting(false)}
        initialValues={{
          actions: sharedLink.permissions.actions,
          password: sharedLink.permissions.password || getRandomPassword(),
          passwordProtected: sharedLink.permissions.passwordProtected || false,
          url: shared ? getClientHrefFromSharedLinkUrl() : "",
          expiresAt: shared
            ? dayjs(sharedLink.permissions.expiresAt, dateFormat)
            : datePickerDefaultDate,
          members: [],
        }}
      >
        {!isInWeb && (
          <div className="inweb-share-panel inweb-link-panel">
            <div className="inweb-members-header">
              <span className="inweb-members-icon">
                <SafetyCertificateOutlined />
              </span>
              <div className="inweb-members-copy">
                <div className="inweb-members-title-row d-block">
                  <div className="inweb-members-title">{t("Permissions")}</div>
                  <div className="inweb-url-note">
                    <span>
                      {t("Set access permissions for this shared link.")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="inweb-members-body">
              <Form.Item name="actions" className="inweb-permissions-field">
                <Checkbox.Group className="inweb-permissions-group">
                  <Row gutter={[0, 8]}>
                    <Col span={24}>
                      <Tooltip
                        title={t(
                          "Allows viewing the shared file's geometry and metadata",
                        )}
                      >
                        <Checkbox disabled value="read">
                          {t("Read")}
                        </Checkbox>
                      </Tooltip>
                    </Col>
                    <Col span={24}>
                      <Tooltip
                        title={t("Allows downloading the original source file")}
                      >
                        <Checkbox value="readSourceFile">
                          {t("Read Source File")}
                        </Checkbox>
                      </Tooltip>
                    </Col>
                    <Col span={24}>
                      <Tooltip
                        title={t(
                          "Allows access to specific viewpoints within the file",
                        )}
                      >
                        <Checkbox value="readViewpoint">
                          {t("Read Viewpoints")}
                        </Checkbox>
                      </Tooltip>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          </div>
        )}
        {/* <Form.Item
          name="passwordProtected"
          valuePropName="checked"
          label={t("Password required")}
        >
          <Switch onChange={setPasswordProtected} />
        </Form.Item>
        {passwordProtected && (
          <Form.Item name="password" label={t("Password")}>
            <Input />
          </Form.Item>
        )} */}

        {isInWeb && (
          <div className="inweb-share-panel inweb-link-panel">
            <div className="inweb-members-header">
              <span className="inweb-members-icon">
                <InfoCircleOutlined />
              </span>
              <div className="inweb-members-copy">
                <div className="inweb-members-title-row d-block">
                  <div className="inweb-members-title">{t("Viewer link")}</div>
                  <div className="inweb-url-note">
                    <span>
                      {t("View-only drawing link. Editing are disabled.")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {!shared ? (
              <div className="inweb-members-body inweb-link-pending">
                <div className="inweb-link-pending-content">
                  <span>{t("Share this file to generate a viewer link.")}</span>
                </div>
              </div>
            ) : geometryStatus === "failed" ? (
              <div className="inweb-members-body inweb-link-pending">
                <div className="inweb-link-pending-content inweb-link-failed-content">
                  <CloseCircleOutlined className="inweb-link-failed-icon" />
                  <span>
                    {t("Viewer link generation failed. Please try again.")}
                  </span>
                </div>
              </div>
            ) : geometryStatus === 'done' ? (
              <div className="inweb-members-body">
                <Form.Item className="inweb-url-field">
                  <Flex className="ml-auto" gap={2}>
                    <Input readOnly value={getClientHrefFromSharedLinkUrl()} />
                    {isCopyLinkViewer ? (
                      <CheckOutlined
                        className="viewer-link-icon"
                        onClick={onCopyToClipboardClick}
                      />
                    ) : (
                      <CopyOutlined
                        className="viewer-link-icon"
                        onClick={onCopyToClipboardClick}
                      />
                    )}
                  </Flex>
                </Form.Item>
              </div>
            ) : (
              <div className="inweb-members-body inweb-link-pending">
                <div className="inweb-link-pending-content">
                  <Spin size="small" />
                  <span>
                    {t("Viewer link is being generated. Please wait.")}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {!isInWeb && (
          <div className="inweb-share-panel inweb-link-panel">
            <div className="inweb-members-header">
              <span className="inweb-members-icon">
                <InfoCircleOutlined />
              </span>
              <div className="inweb-members-copy">
                <div className="inweb-members-title-row d-block">
                  <div className="inweb-members-title">{t("Shared link")}</div>
                  <div className="inweb-url-note">
                    <span>
                      {t("Shareable file link with the selected permissions.")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {!shared ? (
              <div className="inweb-members-body inweb-link-pending">
                <div className="inweb-link-pending-content">
                  <span>{t("Share this file to generate a shared link.")}</span>
                </div>
              </div>
            ) : (
              <div className="inweb-members-body">
                <Form.Item className="inweb-url-field">
                  <Flex className="ml-auto" gap={2}>
                    <Input readOnly value={getClientHrefFromSharedLinkUrl()} />
                    {isCopyLinkViewer ? (
                      <CheckOutlined
                        className="viewer-link-icon"
                        onClick={onCopyToClipboardClick}
                      />
                    ) : (
                      <CopyOutlined
                        className="viewer-link-icon"
                        onClick={onCopyToClipboardClick}
                      />
                    )}
                  </Flex>
                </Form.Item>
              </div>
            )}
          </div>
        )}
        {isInWeb && (
          <div className="inweb-share-panel">
            <div className="inweb-members-header">
              <span className="inweb-members-icon">
                <TeamOutlined />
              </span>
              <div className="inweb-members-copy">
                <div className="inweb-members-title-row">
                  <div className="inweb-members-title">
                    {t("CAD InWeb Collaboration")}
                  </div>
                  <Tooltip
                    title={t(
                      "Members added here can open and use this file in VinaCAD Web Collaboration",
                    )}
                    placement="top"
                  >
                    <InfoCircleOutlined className="inweb-members-tooltip-icon" />
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="inweb-members-body">
              <Form.Item
                name="members"
                label={t("Members")}
                className="inweb-members-field"
              // rules={[{ required: true, message: t("Required field") }]}
              >
                <InviteMembers addInvokerRef={inviteAddRef} inWeb />
              </Form.Item>
            </div>
          </div>
        )}
        <Form.Item
          className="d-flex justify-content-end mb-0"
          style={{ marginTop: 16 }}
        >
          <Space>
            <Button
              type="primary"
              htmlType="button"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {shared ? t("Update") : t("Share")}
            </Button>
            {shared && <Button onClick={onUnshareClick}>{t("Unshare")}</Button>}
          </Space>
        </Form.Item>
      </Form>
    </ConfigProvider>
  );
}
