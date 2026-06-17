// StorageCloud/index.jsx
import React from "react";
import Masonry from "react-masonry-css";

import "./StorageCloud.css";

import StorageProviderCard from "./StorageProviderCard";
import { useTranslation } from "react-i18next";

import {
  Form,
  Input,
  message,
  Modal,
  Tabs,
  Divider,
  Typography,
  Alert,
  Checkbox,
  Popover,
  Tag,
} from "antd";
import {
  DatabaseOutlined,
  CloudOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  connectOcisStorageProvider,
  connectWebDavStorageProvider,
  connectStorageProvider,
  fetchStorageConnections,
  revokeConnection,
} from "@/redux/features/storageCloud/storageCloud.slice";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import AppLoading from "@/components/Loading/AppLoading";
import { STORAGE_PROVIDER_META } from "@/constants";
import {
  clearOcisOAuthCallbackUrl,
  exchangeOcisAuthorizationCode,
  getDefaultOcisConfig,
  isOcisOAuthCallback,
  normalizeOcisServerUrl,
  OCIS_PROVIDER_KEY,
  readOcisOAuthCallback,
  startOcisOAuth,
} from "./ocisOAuth";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const breakpointColumnsObj = {
  default: 3,
  1400: 3,
  1100: 2,
  700: 1,
};

const STORAGE_AUTH_COMPLETE_EVENT = "STORAGE_AUTH_COMPLETE";
const STORAGE_CONNECTIONS_CHANGED_EVENT = "STORAGE_CONNECTIONS_CHANGED";
const WEB_DAV_PROVIDER_KEY = "web_dav";
const STORAGE_CONNECT_FALLBACK_MESSAGE =
  "Something went wrong while connecting to the storage. Please try again later.";

const getStorageErrorMessage = (err) => {
  const errMessage = err?.data?.message || err?.message;
  if (Array.isArray(errMessage)) return errMessage[0];
  return errMessage || STORAGE_CONNECT_FALLBACK_MESSAGE;
};

const getParentOrigin = () => {
  try {
    return document.referrer ? new URL(document.referrer).origin : "*";
  } catch {
    return "*";
  }
};

const StorageCloud = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [webDavForm] = Form.useForm();
  const [ocisForm] = Form.useForm();
  const isAdminMode = useSelector((state) => state.app.isAdminMode);
  const [providerModalOpen, setProviderModalOpen] = React.useState(false);
  const [providerModalTab, setProviderModalTab] = React.useState("webdav");
  const lastTabChangeRef = React.useRef(0);
  const ocisDefaults = React.useMemo(() => getDefaultOcisConfig(), []);
  const createStorageCloudTrackingMeta = React.useCallback(
    (meta = {}) => createTeraTrackingPageMeta("storage_cloud", meta),
    [],
  );

  const { providers, loading } = useSelector(
    (state) => state.storage.storageCloud,
  );

  const mergedProviders = React.useMemo(() => {
    if (!Array.isArray(providers)) return [];
    const map = {};

    providers.forEach((p) => {
      const title = String(p.title || "").toLowerCase();
      const keyLower = String(p.key || "").toLowerCase();
      const isOcis = keyLower === "ocis" || title.includes("ocis");
      const isWebdav =
        isOcis ||
        title.includes("webdav") ||
        keyLower.includes("webdav") ||
        keyLower.includes("web_dav");

      const canonicalKey = isWebdav ? "web_dav" : p.key;

      if (!map[canonicalKey]) {
        const meta =
          STORAGE_PROVIDER_META[canonicalKey] ||
          STORAGE_PROVIDER_META[p.key] ||
          {};
        map[canonicalKey] = {
          key: canonicalKey,
          title: meta.title || p.title,
          accounts: Array.isArray(p.accounts) ? [...p.accounts] : [],
          icon: meta.icon,
          isTranslateY: meta.isTranslateY,
        };
      } else {
        map[canonicalKey].accounts = map[canonicalKey].accounts.concat(
          p.accounts || [],
        );
      }
    });

    return Object.values(map);
  }, [providers]);

  const notifyStorageConnectionsChanged = React.useCallback(() => {
    if (!isAdminMode || window.parent === window) return;

    window.parent.postMessage(
      { type: STORAGE_CONNECTIONS_CHANGED_EVENT },
      getParentOrigin(),
    );
  }, [isAdminMode]);

  const refreshConnectionsAndNotifyParent = React.useCallback(() => {
    dispatch(fetchStorageConnections())
      .unwrap()
      .catch(() => undefined)
      .finally(() => notifyStorageConnectionsChanged());
  }, [dispatch, notifyStorageConnectionsChanged]);

  const notifyStorageAuthComplete = React.useCallback(() => {
    if (!window.opener) return;

    window.opener.postMessage(
      {
        type: STORAGE_AUTH_COMPLETE_EVENT,
      },
      window.location.origin,
    );
  }, []);

  const completeStorageAuthPopup = React.useCallback(() => {
    sessionStorage.setItem("storage_auth_completed", "true");
    notifyStorageAuthComplete();

    setTimeout(() => {
      window.close();
    }, 10);
  }, [notifyStorageAuthComplete]);

  React.useEffect(() => {
    const isPopupCallback =
      window.opener &&
      window.location.pathname === "/storage-cloud" &&
      !isOcisOAuthCallback() &&
      !sessionStorage.getItem("storage_auth_completed");

    if (!isPopupCallback) {
      return;
    }

    completeStorageAuthPopup();
  }, [completeStorageAuthPopup]);

  React.useEffect(() => {
    const callback = readOcisOAuthCallback();
    if (!callback) return;

    let cancelled = false;

    const handleOcisOAuthCallback = async () => {
      try {
        if (callback.error) {
          throw new Error(callback.errorDescription || callback.error);
        }

        if (!callback.code) {
          throw new Error("OCIS OAuth callback is missing authorization code.");
        }

        const tokenPayload = await exchangeOcisAuthorizationCode(callback);
        await dispatch(connectOcisStorageProvider(tokenPayload)).unwrap();
        createEventToTrackingSession({
          event: "connect_storage",
          meta: createStorageCloudTrackingMeta({
            action: "connect_ocis",
            provider: OCIS_PROVIDER_KEY,
          }),
        });
        clearOcisOAuthCallbackUrl();

        if (cancelled) return;

        if (window.opener) {
          completeStorageAuthPopup();
          return;
        }

        refreshConnectionsAndNotifyParent();
        message.success(t("Storage account connected."));
      } catch (err) {
        clearOcisOAuthCallbackUrl();
        if (cancelled) return;

        message.error(t(getStorageErrorMessage(err)));

        if (window.opener) {
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      }
    };

    handleOcisOAuthCallback();

    return () => {
      cancelled = true;
    };
  }, [
    completeStorageAuthPopup,
    dispatch,
    refreshConnectionsAndNotifyParent,
    t,
    createStorageCloudTrackingMeta,
  ]);

  const openStorageAuthUrl = React.useCallback(
    (authUrl) => {
      if (!authUrl) {
        message.error(t("Unable to prepare the connection. Please try again."));
        return;
      }

      if (isAdminMode) {
        const width = 600;
        const height = 700;
        const left =
          (window.screenX || window.screenLeft) +
          (window.outerWidth - width) / 2;
        const top =
          (window.screenY || window.screenTop) +
          (window.outerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          "storage-auth",
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        if (!popup) {
          message.error(t("Unable to open the sign-in window."));
          return;
        }

        const handleMessage = (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === STORAGE_AUTH_COMPLETE_EVENT) {
            window.removeEventListener("message", handleMessage);
            refreshConnectionsAndNotifyParent();
          }
        };
        window.addEventListener("message", handleMessage);
        return;
      }

      window.location.href = authUrl;
    },
    [isAdminMode, refreshConnectionsAndNotifyParent, t],
  );

  const closeProviderModal = React.useCallback(() => {
    setProviderModalOpen(false);
    webDavForm.resetFields();
    ocisForm.resetFields();
  }, [webDavForm, ocisForm]);

  React.useEffect(() => {
    if (!providerModalOpen) return;

    const handler = (e) => {
      if (e.key !== "Enter") return;

      if (Date.now() - (lastTabChangeRef.current || 0) < 200) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      try {
        e.preventDefault();
        e.stopPropagation();
        if (providerModalTab === "webdav") webDavForm.submit();
        else if (providerModalTab === "ocis") ocisForm.submit();
      } catch (err) {}
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [providerModalOpen, providerModalTab, webDavForm, ocisForm]);

  const lastInteractionWasKeyboardRef = React.useRef(false);

  const handleModalMouseDown = React.useCallback((e) => {
    lastInteractionWasKeyboardRef.current = false;
  }, []);

  const handleWebDavConnect = async (values) => {
    try {
      await dispatch(connectWebDavStorageProvider(values)).unwrap();
      createEventToTrackingSession({
        event: "connect_storage",
        meta: createStorageCloudTrackingMeta({
          action: "connect_webdav",
          provider: WEB_DAV_PROVIDER_KEY,
        }),
      });
      closeProviderModal();
      refreshConnectionsAndNotifyParent();
      message.success(t("Storage account connected."));
    } catch (err) {
      message.error(t(getStorageErrorMessage(err)));
    }
  };

  const handleOcisConnect = async (values) => {
    try {
      const scopeValue = Array.isArray(values.scope)
        ? values.scope.join(" ")
        : values.scope;

      const authUrl = await startOcisOAuth({
        ...ocisDefaults,
        ...values,
        scope: scopeValue,
      });
      closeProviderModal();
      createEventToTrackingSession({
        event: "start_connect_storage",
        meta: createStorageCloudTrackingMeta({
          action: "start_ocis_oauth",
          provider: OCIS_PROVIDER_KEY,
        }),
      });
      openStorageAuthUrl(authUrl);
    } catch (err) {
      message.error(t(getStorageErrorMessage(err)));
    }
  };

  const handleAddAccount = async (providerKey) => {
    if (providerKey === WEB_DAV_PROVIDER_KEY) {
      setProviderModalTab("webdav");
      setProviderModalOpen(true);
      return;
    }

    if (providerKey === OCIS_PROVIDER_KEY) {
      if (ocisDefaults.serverUrl && ocisDefaults.clientId) {
        await handleOcisConnect(ocisDefaults);
        return;
      }

      ocisForm.setFieldsValue(ocisDefaults);
      setProviderModalTab("ocis");
      setProviderModalOpen(true);
      return;
    }

    try {
      const data = await dispatch(
        connectStorageProvider({
          providerKey,
          redirect: window.location.origin + "/storage-cloud",
        }),
      ).unwrap();

      if (data?.url) {
        createEventToTrackingSession({
          event: "start_connect_storage",
          meta: createStorageCloudTrackingMeta({
            action: "start_oauth",
            provider: providerKey,
          }),
        });
        openStorageAuthUrl(data.url);
      } else {
        message.error(t("Unable to prepare the connection. Please try again."));
      }
    } catch (err) {
      message.error(t(getStorageErrorMessage(err)));
    }
  };

  const handleRemoveAccount = (account) => {
    Modal.confirm({
      title: t("Remove storage account"),
      icon: <ExclamationCircleOutlined />,
      content: t("Are you sure you want to remove this account?"),
      okText: t("Yes"),
      okType: "danger",
      cancelText: t("No"),
      centered: true,
      cancelButtonProps: { type: "primary" },
      async onOk() {
        try {
          await dispatch(
            revokeConnection({ connectionId: account.id }),
          ).unwrap();
          createEventToTrackingSession({
            event: "remove_storage_connection",
            meta: createStorageCloudTrackingMeta({
              action: "remove_connection",
              provider: account.providerKey || account.provider || account.type,
            }),
          });
          notifyStorageConnectionsChanged();
        } catch (err) {
          message.error(t(getStorageErrorMessage(err)));
        }
      },
    });
  };

  return (
    <div
      className={`h-100 d-flex flex-column gap-3 ${isAdminMode ? "admin-storage-cloud-mode" : ""}`}
    >
      {/* <PortalHeader title={t("Storage Cloud")} /> */}
      <AppLoading loading={loading} size="small" className="w-100 h-100">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="storage-masonry flex-grow-1"
          columnClassName="storage-masonry-column"
        >
          {mergedProviders.map((provider) => {
            return (
              <StorageProviderCard
                key={provider.key}
                provider={{
                  ...provider,
                  icon: provider.icon,
                  isTranslateY: provider.isTranslateY,
                }}
                onAddAccount={() =>
                  handleAddAccount(provider.key.toLowerCase())
                }
                onRemoveAccount={(acc) => handleRemoveAccount(acc)}
              />
            );
          })}
        </Masonry>
      </AppLoading>

      <Modal
        title={t("Connect Storage")}
        open={providerModalOpen}
        onMouseDown={handleModalMouseDown}
        okText={t("Connect")}
        cancelText={t("Cancel")}
        confirmLoading={loading}
        centered
        destroyOnClose
        onOk={() => {
          try {
            const active = document.activeElement;
            const tag = active?.tagName?.toLowerCase();
            const isInputLike =
              tag === "input" || tag === "textarea" || tag === "select";
            const inForm = active && active.closest && active.closest("form");

            if (
              !lastInteractionWasKeyboardRef.current ||
              (isInputLike && inForm)
            ) {
              if (providerModalTab === "webdav") webDavForm.submit();
              else if (providerModalTab === "ocis") ocisForm.submit();
            } else {
            }
          } catch (err) {
            if (providerModalTab === "webdav") webDavForm.submit();
            else if (providerModalTab === "ocis") ocisForm.submit();
          }
        }}
        onCancel={closeProviderModal}
        width={640}
      >
        <Tabs
          className="storage-tabs-pill"
          activeKey={providerModalTab}
          onChange={(k) => {
            setProviderModalTab(k);
            lastTabChangeRef.current = Date.now();
          }}
          tabBarGutter={0}
          tabBarStyle={{ padding: 0, display: "flex" }}
          items={[
            {
              key: "webdav",
              label: (
                <span className="storage-tab-label">
                  <DatabaseOutlined />
                  <span style={{ marginLeft: 8 }}>{t("WebDAV")}</span>
                </span>
              ),
              children: (
                <>
                  <Alert
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined style={{ color: "#2f80ed" }} />}
                    style={{
                      borderRadius: 8,
                      background: "#f5fbff",
                      border: "1px solid #d7edff",
                      marginBottom: 16,
                      padding: "8px 12px",
                    }}
                    message={
                      <span>
                        {t(
                          "Use this to connect to any WebDAV server. Enter server URL, username and password.",
                        )}
                      </span>
                    }
                  />
                  <Form
                    form={webDavForm}
                    layout="vertical"
                    requiredMark={false}
                    className="form-webdav"
                    onFinish={handleWebDavConnect}
                  >
                    <Form.Item
                      name="baseUrl"
                      label={t("Server URL")}
                      rules={[
                        {
                          required: true,
                          message: t("Server URL is required"),
                        },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            try {
                              new URL(value);
                              return Promise.resolve();
                            } catch {
                              return Promise.reject(
                                new Error(t("Please enter a valid URL")),
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input
                        autoComplete="url"
                        placeholder="https://example.com/remote.php/dav/"
                      />
                    </Form.Item>

                    <Form.Item
                      name="username"
                      label={t("Username")}
                      rules={[
                        { required: true, message: t("Username is required") },
                      ]}
                    >
                      <Input autoComplete="username" />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={t("Password")}
                      rules={[
                        { required: true, message: t("Password is required") },
                      ]}
                    >
                      <Input.Password autoComplete="current-password" />
                    </Form.Item>
                  </Form>
                </>
              ),
            },
            {
              key: "ocis",
              label: (
                <span className="storage-tab-label">
                  <CloudOutlined />
                  <span style={{ marginLeft: 8 }}>{t("OCIS")}</span>
                </span>
              ),
              children: (
                <>
                  <Alert
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined style={{ color: "#2f80ed" }} />}
                    style={{
                      borderRadius: 8,
                      background: "#eaf6ff",
                      border: "1px solid #c6e6ff",
                      marginBottom: 16,
                      padding: "8px 12px",
                    }}
                    message={
                      <span>
                        {t(
                          "OCIS uses OAuth2. If your OCIS server is pre-configured with client and redirect, you can connect directly. Otherwise fill server URL and optionally Client ID/Scopes.",
                        )}
                      </span>
                    }
                  />
                  <Form
                    form={ocisForm}
                    initialValues={ocisDefaults}
                    layout="vertical"
                    requiredMark={false}
                    className="form-webdav"
                    onFinish={handleOcisConnect}
                  >
                    <Form.Item
                      name="serverUrl"
                      label={t("Server URL")}
                      rules={[
                        {
                          required: true,
                          message: t("Server URL is required"),
                        },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            try {
                              normalizeOcisServerUrl(value);
                              return Promise.resolve();
                            } catch {
                              return Promise.reject(
                                new Error(t("Please enter a valid URL")),
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input
                        autoComplete="url"
                        placeholder="https://ocis.example.com"
                      />
                    </Form.Item>

                    <Form.Item name="clientId" label={t("Client ID")}>
                      <Input autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                      name="scope"
                      label={t("Scopes")}
                      rules={[
                        { required: true, message: t("Scopes are required") },
                      ]}
                    >
                      <Checkbox.Group>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Checkbox value="openid">openid</Checkbox>
                          <Checkbox value="email">email</Checkbox>
                          <Checkbox value="profile">profile</Checkbox>
                        </div>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>

                  <Divider />
                  <Popover
                    placement="bottomLeft"
                    overlayStyle={{
                      maxWidth: 540,
                    }}
                    overlayInnerStyle={{
                      borderRadius: 14,
                      padding: 18,
                      boxShadow:
                        "0 12px 32px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.08)",
                    }}
                    content={
                      <div style={{ width: 480 }}>
                        <div
                          style={{
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <Typography.Text
                            strong
                            style={{
                              fontSize: 15,
                              color: "#111827",
                            }}
                          >
                            {t("OAuth / OpenID Connect (OIDC)")}
                          </Typography.Text>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {t(
                              "Connect OCIS using OAuth2 Authorization Code Flow with PKCE.",
                            )}
                          </div>
                        </div>

                        <Alert
                          type="info"
                          showIcon
                          style={{
                            marginBottom: 14,
                            borderRadius: 10,
                            background: "#f8fbff",
                            border: "1px solid #dbeafe",
                          }}
                          message={t(
                            "Supported providers: Keycloak, Authentik, Azure AD, Okta, OCIS IdP.",
                          )}
                        />

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            marginBottom: 14,
                          }}
                        >
                          <div
                            style={{
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 10,
                              background: "#fff",
                            }}
                          >
                            <Typography.Text strong>
                              {t("OAuth Client")}
                            </Typography.Text>

                            <div style={{ marginTop: 8 }}>
                              <Tag
                                style={{
                                  borderRadius: 6,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {t("Auth Code")}
                              </Tag>

                              <Tag
                                style={{
                                  borderRadius: 6,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {t("PKCE")}
                              </Tag>
                            </div>

                            <Typography.Text
                              type="secondary"
                              style={{
                                fontSize: 12,
                                display: "block",
                                marginTop: 8,
                              }}
                            >
                              {t("Public or PKCE-enabled client")}
                            </Typography.Text>
                          </div>

                          <div
                            style={{
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 10,
                              background: "#fff",
                            }}
                          >
                            <Typography.Text strong>
                              {t("Required Scopes")}
                            </Typography.Text>

                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                              }}
                            >
                              <Tag
                                style={{
                                  borderRadius: 6,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                openid
                              </Tag>

                              <Tag
                                style={{
                                  borderRadius: 6,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                profile
                              </Tag>

                              <Tag
                                style={{
                                  borderRadius: 6,
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                email
                              </Tag>
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            marginBottom: 14,
                          }}
                        >
                          <Typography.Text strong>
                            {t("Redirect URI")}
                          </Typography.Text>

                          <div
                            style={{
                              marginTop: 8,
                              padding: "10px 12px",
                              background: "#0f172a",
                              borderRadius: 8,
                              color: "#e2e8f0",
                              fontSize: 12,
                              fontFamily:
                                "SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace",
                              wordBreak: "break-all",
                            }}
                          >
                            {window.location.origin}
                            /storage-cloud?storage_provider=ocis
                          </div>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            marginBottom: 14,
                          }}
                        >
                          <Typography.Text strong>
                            {t("Required Information")}
                          </Typography.Text>

                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            <Tag>{t("Server URL")}</Tag>
                            <Tag>{t("Client ID")}</Tag>
                            <Tag>{t("Scopes")}</Tag>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #fde68a",
                            background: "#fffbeb",
                            color: "#92400e",
                            fontSize: 12,
                          }}
                        >
                          {t(
                            "Redirect URI must exactly match the value configured on the Identity Provider.",
                          )}
                        </div>
                      </div>
                    }
                  >
                    <a
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {t("Quick OAuth Guide")}
                    </a>
                  </Popover>
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginTop: 8, fontSize: 12 }}
                  >
                    {t(
                      "Note: This is a general guide. For other Identity Providers, create a similar client and use the same Redirect URI and scopes.",
                    )}
                  </Typography.Text>
                </>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default StorageCloud;
