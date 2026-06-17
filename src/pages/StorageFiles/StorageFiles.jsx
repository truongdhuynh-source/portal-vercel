import React, { useContext, useEffect, useRef } from "react";
import {
  Table,
  Breadcrumb,
  Button,
  Space,
  Dropdown,
  Modal,
  Divider,
  Select,
  Checkbox,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FolderFilled,
  FileOutlined,
  DesktopOutlined,
  DownloadOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

import "./StorageFiles.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { connectStorageProvider } from "@/redux/features/storageCloud/storageCloud.slice";
import {
  clearSelections,
  deleteStorageFile,
  downloadStorageItemsAsFile,
  downloadStorageItemsAsZip,
  fetchStorageFiles,
  resetStorageFileState,
  toggleSelection,
  selectAllItems,
  updateFilterByExtension,
} from "@/redux/features/storageCloud/storageFiles.slice";
import bytes from "bytes";
import moment from "moment";
import useScreen from "@/hooks/useScreen";
import StorageFileUploadModal from "@/pages/StorageFiles/StorageFileUploadModal";
import { FilePlusIcon, FolderPlusIcon } from "lucide-react";
import CreateNewFileModal from "@/pages/StorageFiles/CreateNewFileModal";
import CreateNewDrawingModal from "@/pages/StorageFiles/CreateNewDrawingModal";
import classNames from "classnames";
import RenameFileModal from "@/pages/StorageFiles/RenameFileModal";
import {
  ACCESS_TOKEN_KEY,
  DOWNLOAD_STATUS_META,
  DRAWING_EXTENSIONS,
  FILE_TYPE_CHECK,
  FILE_TYPE_ICON_MAP,
  RECYCLE_BIN_PROVIDERS_NOT_SUPPORTED,
  STORAGE_PROVIDER_META,
} from "@/constants";
import Cookies from "js-cookie";
import getUserIdLogin from "@/utils/getUserIdLogin";
import { HomeIcon } from "@/assets/icons";
import { getFileExtension } from "@/utils/getFileExtension";
import { AppContext } from "@/AppContext";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const MAX_BREADCRUMB = 4;
const buildStorageFilesUrl = (provider, connectionId, folderId) => {
  const baseUrl = `/files/${provider}/${connectionId}`;
  if (folderId === undefined || folderId === null) return baseUrl;
  return `${baseUrl}/${encodeURIComponent(String(folderId))}`;
};
const FILTER_DROP_DOWN_OPTIONS = (t) => [
  {
    value: "all",
    label: t("Show all files"),
  },
  {
    value: DRAWING_EXTENSIONS,
    label: t("Show drawings & PDFs", {
      ext: "(DWG, DXF, DWT, DGN, IFC, RVT, RFA, RTE, NWD, NWC, PDF)",
    }),
  },
  {
    value: "dwg,dxf,dwt",
    label: t("Show drawings only {{ext}}", { ext: "(DWG, DXF, DWT)" }),
  },
  {
    value: "ifc,rvt",
    label: t("Show bim files only {{ext}}", { ext: "(IFC, RVT)" }),
  },
];
const StorageFiles = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const tableWrapperRef = useRef(null);
  const { isMobile, isTablet, isDesktop } = useScreen();
  const {
    provider,
    connectionId,
    folderId = STORAGE_PROVIDER_META[provider].rootId,
  } = useParams();
  const location = useLocation();
  const {
    items,
    path,
    paging,
    filter,
    loading,
    storageDisconnected,
    downloads,
    selections,
    renamingItems,
  } = useSelector((state) => state.storage.storageFiles);
  const isAdminMode = useSelector((state) => state.app.isAdminMode);
  const [uploadModalVisible, setUploadModalVisible] = React.useState(false);
  const [createNewFileVisible, setCreateNewFileVisible] = React.useState(false);
  const [createNewDrawingVisible, setCreateNewDrawingVisible] =
    React.useState(false);
  const [renameSelectedItem, setRenameSelectedItem] = React.useState(null);
  const [isTrashSupported, setIsTrashSupported] = React.useState(true);
  const { providers } = useSelector((state) => state.storage.storageCloud);
  const { app } = useContext(AppContext);
  const [isGGDriveShared, setIsGGDriveShared] = React.useState(true);
  const isGGDriveRootPath = provider === "gg_drive" && folderId === "0";
  const isGGDriveSharedPath = provider === "gg_drive" && folderId === "shared";

  const searchParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const type = searchParams.get("type") || "root";
  const isSharePointDisabled =
    provider === "share_point" && ["root", "site"].includes(type);
  const isDropBoxDisabled =
    provider === "dropbox" && folderId.startsWith("shared");
  const isDisabled =
    isSharePointDisabled ||
    isDropBoxDisabled ||
    folderId === "shared" ||
    (folderId === "0" && !["web_dav", "ocis"].includes(provider));
  const sharePointContext =
    provider?.toUpperCase() === "SHARE_POINT"
      ? [
        { key: "type", value: type },
        { key: "siteId", value: searchParams.get("siteId") },
        { key: "driveId", value: searchParams.get("driveId") },
        { key: "itemId", value: searchParams.get("itemId") },
      ].reduce((acc, item) => {
        if (item.value != null && item.value !== "undefined") {
          acc[item.key] = item.value;
        }
        return acc;
      }, {})
      : undefined;
  const currentFolderId =
    provider?.toUpperCase() === "SHARE_POINT" &&
      sharePointContext?.type === "folder"
      ? sharePointContext.itemId
      : folderId;

  const webDavContext = ["WEB_DAV", "OCIS"].includes(provider?.toUpperCase())
    ? {
      folderId: folderId,
    }
    : undefined;

  const operationContext = sharePointContext || webDavContext;
  const createStorageTrackingMeta = (meta = {}) =>
    createTeraTrackingPageMeta("storage_files", {
      provider,
      connectionId,
      folderId: currentFolderId,
      context: operationContext,
      ...meta,
    });

  useEffect(() => {
    if (!path.length) return;
    if (isGGDriveRootPath) {
      setIsGGDriveShared(true);
      return;
    }

    const isShared =
      provider === "gg_drive" &&
      path &&
      path.find((p) => p.id === "shared")?.id;
    setIsGGDriveShared(isShared || isGGDriveSharedPath ? true : false);
  }, [provider, path, isGGDriveRootPath, isGGDriveSharedPath]);

  const handleConnectAccount = async (providerKey) => {
    try {
      const data = await dispatch(
        connectStorageProvider({
          providerKey,
          redirect: window.location.origin + "/storage-cloud",
        }),
      ).unwrap();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        message.error(t("Unable to prepare the connection. Please try again."));
      }
    } catch (err) {
      const errMsg =
        err?.message ||
        "Something went wrong while connecting to the storage. Please try again later.";
      message.error(t(errMsg));
    }
  };

  useEffect(() => {
    if (!connectionId && provider !== "web_dav") {
      return;
    }

    (async () => {
      try {
        const supported = await app.checkTrashWebDav({
          provider,
          connectionId,
        });

        setIsTrashSupported(supported);
      } catch (e) {
        setIsTrashSupported(false);
      }
    })();
  }, [provider, connectionId]);

  useEffect(() => {
    dispatch(resetStorageFileState({ connectionId }));
    dispatch(clearSelections());
  }, [connectionId]);

  useEffect(() => {
    const isSharePoint = provider?.toUpperCase() === "SHARE_POINT";

    let payload = {
      provider,
      connectionId,
      limit: paging.limit,
      filter,
    };

    if (isSharePoint) {
      const type = searchParams.get("type") || "root";
      const siteId = searchParams.get("siteId");
      const driveId = searchParams.get("driveId");
      const itemId = searchParams.get("itemId");

      payload.context =
        type === "root"
          ? { type: "root" }
          : {
            type,
            ...(siteId && siteId !== "undefined" && { siteId }),
            ...(driveId && driveId !== "undefined" && { driveId }),
            ...(itemId && itemId !== "undefined" && { itemId }),
          };
    } else {
      payload.folderId = folderId;
    }
    if (sharePointContext) payload.context = sharePointContext;

    dispatch(fetchStorageFiles(payload)).unwrap();
  }, [provider, connectionId, paging.limit, folderId, filter, location.search]);

  useEffect(() => {
    if (!storageDisconnected) return;

    Modal.confirm({
      title: t("Storage Disconnected"),
      content: t(
        "Your storage connection has expired or was disconnected. Please reconnect to continue accessing your files.",
      ),
      okText: t("Reconnect"),
      cancelText: t("Cancel"),
      centered: true,
      onOk() {
        handleConnectAccount(provider);
      },
    });
  }, [storageDisconnected]);

  useEffect(() => {
    dispatch(clearSelections());
  }, [filter.showByExtension]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (!loading && paging?.nextPage) {
        dispatch(
          fetchStorageFiles({
            provider,
            connectionId,
            limit: paging.limit,
            folderId,
            filter,
            nextPage: paging.nextPage,
          }),
        );
      }
    }
  };

  useEffect(() => {
    if (loading || !paging?.nextPage) return;

    const tableBody = tableWrapperRef.current?.querySelector(".ant-table-body");
    if (!tableBody) return;

    const hasVerticalOverflow = tableBody.scrollHeight > tableBody.clientHeight;

    if (!hasVerticalOverflow) {
      dispatch(
        fetchStorageFiles({
          provider,
          connectionId,
          limit: paging.limit,
          folderId,
          filter,
          nextPage: paging.nextPage,
        }),
      );
    }
  }, [
    dispatch,
    items.length,
    loading,
    paging?.nextPage,
    provider,
    connectionId,
    paging.limit,
    folderId,
    filter,
  ]);

  const getMeData = () => {
    const meData = providers
      .find((p) => p.key === provider)
      .accounts.find((a) => a.id === connectionId);
    return {
      spaceAmount: meData?.me?.spaceAmount,
      spaceUsed: meData?.me?.spaceUsed,
      maxUploadSize: meData?.me?.maxUploadSize,
    };
  };
  const { spaceAmount, spaceUsed, maxUploadSize } = getMeData();

  const handleNavigate = async (data) => {
    try {
      const isSharePoint = provider?.toUpperCase() === "SHARE_POINT";

      if (isSharePoint) {
        let params = new URLSearchParams();

        switch (data.type) {
          case "root":
            break;
          case "site":
            params.set("type", "site");
            params.set("siteId", data.context?.siteId || data.id);
            break;

          case "drive":
            params.set("type", "drive");
            params.set("driveId", data.context?.driveId || data.id);
            break;

          case "folder":
            params.set("type", "folder");
            params.set("driveId", data.context?.driveId);
            params.set("itemId", data.id);
            break;
          default:
            break;
        }

        const isDWG =
          data.name?.toLowerCase().endsWith(".dwg") ||
          data.name?.toLowerCase().endsWith(".dxf") ||
          data.name?.toLowerCase().endsWith(".dwt");

        if (data.type === "file") {
          if (isDWG) {
            const user_vina_id = getUserIdLogin();
            const accessToken = Cookies.get(
              `${ACCESS_TOKEN_KEY}_${user_vina_id}`,
            );
            const paramsVinaCad = new URLSearchParams({
              from: "vinacad",
              provider,
              fileId: data.id,
              fileName: data.name,
              token: accessToken,
              parentId: folderId,
              connectionId,
            });
            if (sharePointContext) {
              Object.entries(sharePointContext).forEach(([key, value]) => {
                if (value != null) {
                  paramsVinaCad.set(key, value);
                }
              });
            }

            paramsVinaCad.set("type", "file");

            window.open(
              `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${i18n.language}?${paramsVinaCad.toString()}`,
              "_blank",
            );
            createEventToTrackingSession({
              event: "open_file",
              meta: createStorageTrackingMeta({
                action: "open_in_cad_viewer",
                itemType: data.type,
                extension: data.name?.split(".").pop()?.toLowerCase(),
                fileId: data.id,
                fileName: data.name,
              }),
            });

            return;
          }

          return;
        }

        createEventToTrackingSession({
          event: "open_storage_item",
          meta: createStorageTrackingMeta({
            action: "navigate",
            itemType: data.type,
          }),
        });

        navigate(`/files/${provider}/${connectionId}?${params.toString()}`);
        return;
      }

      if (data.type === "folder") {
        navigate(buildStorageFilesUrl(provider, connectionId, data.id));
        createEventToTrackingSession({
          event: "open_folder",
          meta: createStorageTrackingMeta({
            action: "navigate",
            itemType: data.type,
            folderId: data.id,
            folderName: data.name,
          }),
        });
      }

      if (data.type === "path") {
        const targetFolderId = data.id === 0 ? 0 : data.id;
        navigate(buildStorageFilesUrl(provider, connectionId, targetFolderId));
        createEventToTrackingSession({
          event: "open_folder",
          meta: createStorageTrackingMeta({
            action: "breadcrumb_navigate",
            itemType: data.type,
            pathId: data.id,
            pathName: data.name,
          }),
        });
      }

      const isDWG =
        data.name?.toLowerCase().endsWith(".dwg") ||
        data.name?.toLowerCase().endsWith(".dxf") ||
        data.name?.toLowerCase().endsWith(".dwt");

      if (data.type === "file" && isDWG) {
        const user_vina_id = getUserIdLogin();
        const accessToken = Cookies.get(`${ACCESS_TOKEN_KEY}_${user_vina_id}`);
        const params = new URLSearchParams({
          from: "vinacad",
          provider,
          fileId: data.id,
          fileName: data.name,
          token: accessToken,
          parentId: folderId,
          connectionId,
        });

        window.open(
          `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${i18n.language}?${params.toString()}`,
          "_blank",
        );
        createEventToTrackingSession({
          event: "open_file",
          meta: createStorageTrackingMeta({
            action: "open_in_cad_viewer",
            itemType: data.type,
            extension: data.name?.split(".").pop()?.toLowerCase(),
            fileId: data.id,
            fileName: data.name,
          }),
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleOpenItem = (record) => {
    if (provider?.toUpperCase() === "SHARE_POINT") {
      const params = new URLSearchParams();

      if (record.type === "site") {
        params.set("type", "site");
        params.set("siteId", record.context?.siteId || record.id);
      } else if (record.type === "drive") {
        params.set("type", "drive");
        params.set("driveId", record.context?.driveId || record.id);
      } else if (record.type === "path") {
        params.set("type", "folder");
        params.set("driveId", record.context?.driveId);
        params.set("itemId", record.id);
      } else if (sharePointContext) {
        Object.entries(sharePointContext).forEach(([key, value]) => {
          if (value != null) params.set(key, value);
        });
      }

      const queryString = params.toString();
      const url = `/files/${provider}/${connectionId}${queryString ? `?${queryString}` : ""}`;
      window.open(url, "_blank");
      createEventToTrackingSession({
        event: "open_storage_item",
        meta: createStorageTrackingMeta({
          action: "open_new_tab",
          itemType: record.type,
        }),
      });
      return;
    }

    const url = buildStorageFilesUrl(provider, connectionId, record.id);
    window.open(url, "_blank");
    createEventToTrackingSession({
      event: record.type === "folder" ? "open_folder" : "open_storage_item",
      meta: createStorageTrackingMeta({
        action: "open_new_tab",
        itemType: record.type,
      }),
    });
  };

  const handleDeleteItem = (data) => {
    const isMultipleDelete = typeof data === "object" && data.length > 0;
    const title = isMultipleDelete ? "Delete items" : "Delete item";
    const desc = isMultipleDelete
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";

    const handleOk = async () => {
      if (isMultipleDelete) {
        await Promise.all(
          data.map((item) =>
            dispatch(
              deleteStorageFile({
                provider,
                connectionId,
                itemId: item.id,
                type: item.type,
                context: operationContext,
              }),
            ).unwrap(),
          ),
        );
      } else {
        await dispatch(
          deleteStorageFile({
            provider,
            connectionId,
            itemId: data.id,
            type: data.type,
            context: operationContext,
          }),
        ).unwrap();
      }
      createEventToTrackingSession({
        event: "delete_storage_item",
        value: isMultipleDelete ? data.length : 1,
        meta: createStorageTrackingMeta({
          action: "delete",
          itemType: isMultipleDelete ? "mixed" : data.type,
        }),
      });
    };
    Modal.confirm({
      title: t(title),
      content: t(desc),
      icon: <ExclamationCircleOutlined />,
      okText: t("Yes"),
      okType: "danger",
      centered: true,
      cancelText: t("No"),
      cancelButtonProps: { type: "primary" },
      onOk: () => handleOk(),
      onCancel() { },
    });
  };

  const handleDownloadItem = async (record) => {
    try {
      await dispatch(
        record.type === "file"
          ? downloadStorageItemsAsFile({
            provider,
            connectionId,
            fileId: record.id,
            context: { ...operationContext, type: record.type },
          })
          : downloadStorageItemsAsZip({
            provider,
            connectionId,
            items: [
              {
                id: record.id,
                type: record.type,
              },
            ],
            name: "my-files.zip",
            context: { ...operationContext, type: record.type },
          }),
      ).unwrap();

      createEventToTrackingSession({
        event: "download_storage_item",
        meta: createStorageTrackingMeta({
          action: "download",
          itemType: record.type,
          extension: record.name?.split(".").pop()?.toLowerCase(),
        }),
      });
    } catch (error) {
      console.error("Download storage item error:", error);
    }
  };

  const handleRenameItem = (record) => {
    setRenameSelectedItem({
      provider: provider,
      connectionId: connectionId,
      data: record,
      context: operationContext,
    });
  };

  const moreActionButton = (record) => {
    return (
      <Dropdown
        menu={{
          items: [
            ...(record.type == "folder"
              ? [
                {
                  key: "open",
                  label: <span>{t("Open in new tab")}</span>,
                  icon: <DesktopOutlined className="menu-icon" />,
                },
              ]
              : []),
            ...(!(isGGDriveShared || isGGDriveRootPath)
              ? [
                {
                  key: "rename",
                  label: <span>{t("Rename")}</span>,
                  icon: <EditOutlined className="menu-icon" />,
                  disabled: isDisabled,
                },
              ]
              : []),
            ...(!isGGDriveRootPath
              ? [
                {
                  key: "download",
                  label: <span>{t("Download")}</span>,
                  icon: <DownloadOutlined className="menu-icon" />,
                  disabled: isDisabled,
                },
              ]
              : []),
            ...(!(isGGDriveShared || isGGDriveRootPath)
              ? [
                {
                  key: "divider",
                  type: "divider",
                  label: <Divider className="m-0" />,
                },
                {
                  key: "delete",
                  label: <span>{t("Delete")}</span>,
                  danger: true,
                  icon: <DeleteOutlined className="menu-icon" />,
                  disabled: isDisabled,
                },
              ]
              : []),
          ],
          onClick: async ({ key }) => {
            if (key === "open") {
              handleOpenItem(record);
            }
            if (key === "rename") {
              handleRenameItem(record);
            }
            if (key === "download") {
              handleDownloadItem(record);
            }
            if (key === "delete") {
              handleDeleteItem(record);
            }
          },
        }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <Button
          shape="circle"
          icon={<MoreOutlined />}
          className="border-0 bg-transparent shadow-none"
        />
      </Dropdown>
    );
  };

  const currentPageSelectedCount = items.filter((item) =>
    selections.some((selection) => selection.id === item.id),
  ).length;
  const allItemsSelected =
    items.length > 0 && currentPageSelectedCount === items.length;
  const someItemsSelected =
    currentPageSelectedCount > 0 && currentPageSelectedCount < items.length;

  const columns = [
    ...(!isGGDriveShared && !isGGDriveRootPath && !isMobile && !isDisabled
      ? [
        {
          title: (
            <Checkbox
              indeterminate={someItemsSelected}
              checked={allItemsSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  dispatch(selectAllItems(items));
                } else {
                  dispatch(clearSelections());
                }
              }}
            />
          ),
          key: "select",
          width: 50,
          render: (_, record) => {
            if (
              isGGDriveShared ||
              isGGDriveRootPath ||
              isMobile ||
              isDisabled
            )
              return null;

            return (
              <Checkbox
                checked={selections.some((i) => i.id === record.id)}
                onChange={(e) => dispatch(toggleSelection(record))}
                className={classNames(
                  selections.some((i) => i.id === record.id) && "selected",
                )}
              />
            );
          },
        },
      ]
      : []),
    {
      title: "#",
      key: "index",
      width: 50,
      render: (text, record, index) => {
        return index + 1;
      },
    },
    {
      title: t("Name"),
      dataIndex: "name",
      key: "name",
      width: isMobile ? 200 : "auto",
      render: (text, record) => {
        const type = FILE_TYPE_CHECK.includes(record.type) ? "zip" : "file";
        const download = downloads[`${type}:${record.id}`];
        const extension = getFileExtension(text);
        const iconSrc = FILE_TYPE_ICON_MAP[extension];
        return (
          <div className="py-1">
            <div className="w-100 d-flex gap-2 align-items-center">
              <div
                className="d-flex  cursor-pointer align-items-center"
                onClick={() => handleNavigate(record)}
              >
                {FILE_TYPE_CHECK.includes(record.type) ? (
                  <FolderFilled style={{ fontSize: 18 }} />
                ) : iconSrc ? (
                  <img
                    className="storage-files-icon"
                    src={iconSrc}
                    alt={`${text + iconSrc} file icon`}
                  />
                ) : (
                  <FileOutlined style={{ fontSize: 18 }} />
                )}
                <div
                  style={{ maxWidth: isMobile ? "180px" : "" }}
                  className={`mx-2 cursor-pointer text-truncate ${!FILE_TYPE_CHECK.includes(record.type) ? "text-primary" : ""}`}
                >
                  {t(text)}
                </div>
              </div>
              {renamingItems?.includes(record.id) ? (
                <span className="d-flex align-items-center gap-1 ml-2 renaming-text">
                  <span>{t("Renaming")}</span>
                  <span className="renaming-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </span>
              ) : null}
              {download && (
                <span
                  style={{
                    color: DOWNLOAD_STATUS_META[download.status].color,
                  }}
                >
                  {DOWNLOAD_STATUS_META[download.status].status === "failed"
                    ? t("Download failed")
                    : `${download.progress} %`}
                  <DownloadOutlined className="ml-2" />
                </span>
              )}
            </div>
            {isMobile && (
              <div
                className="d-flex align-items-center mt-1"
                style={{ fontSize: 12 }}
              >
                {record.size ? `${bytes(record.size)} • ` : null}
                {record.modifiedAt
                  ? moment(record.modifiedAt).format(t("DD/MM/YYYY HH:mm:ss"))
                  : null}
              </div>
            )}
          </div>
        );
      },
    },
    ...(!isMobile
      ? [
        {
          title: t("Size"),
          dataIndex: "size",
          key: "size",
          width: isMobile ? 80 : isTablet ? 100 : 100,
          render: (text) => (text ? bytes(text) : "--/--"),
          align: "left",
        },
        {
          title: t("Modified"),
          dataIndex: "modifiedAt",
          key: "modified",
          width: isMobile ? 80 : isTablet ? 100 : 150,
          render: (modified) =>
            modified
              ? moment(modified).format(t("DD/MM/YYYY HH:mm:ss"))
              : "--/--",
          align: "left",
        },
      ]
      : []),
    {
      title: "",
      key: "actions",
      render: (_, record, index) => {
        return moreActionButton(record);
      },
      className: "max-w-3em",
      align: "center",
      width: "3em",
    },
  ];

  const buildBreadcrumb = (path) => {
    const newPath = path.map((item) => {
      return {
        ...item,
        name:
          item.name?.length > 30 ? item.name.slice(0, 30) + "..." : item.name,
      };
    });
    if (!newPath || newPath.length <= MAX_BREADCRUMB) return newPath;

    return [
      newPath[0], // root
      { id: "ellipsis", name: "...", type: "ellipsis" },
      ...newPath.slice(-2),
    ];
  };

  const handleDeleteButtonClick = () => {
    if (selections.length > 0) {
      handleDeleteItem(selections);
    }
  };

  const handleTrashButtonNavigate = () => {
    navigate(`/files/trash/${provider}/${connectionId}`);
  };

  const handleClearSelection = (e) => {
    const currentTarget = [
      "table-container",
      "storage-header",
      "storage-toolbar",
    ];

    const target = ["ant-table-container", "space-used", "storage-toolbar"];
    if (
      currentTarget.includes(e.currentTarget.className) &&
      target.includes(e.target.className)
    ) {
      dispatch(clearSelections());
    }
  };

  return (
    <div
      className={`storage-files ${isAdminMode ? "admin-storage-files" : ""}`}
    >
      <div className="storage-toolbar" onClick={handleClearSelection}>
        <Space>
          <>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
              disabled={isDisabled}
              type="primary"
            >
              {isDesktop && t("Upload")}
            </Button>

            <Button
              icon={<FolderPlusIcon size={14} />}
              onClick={() => setCreateNewFileVisible(true)}
              disabled={isDisabled}
              type="primary"
            >
              {isDesktop && t("New Folder")}
            </Button>
            <Button
              icon={<FilePlusIcon size={14} />}
              onClick={() => setCreateNewDrawingVisible(true)}
              disabled={isDisabled}
              type="primary"
            >
              {isDesktop && t("Create new drawing")}
            </Button>
          </>
        </Space>

        <Space className="right-group">
          <Select
            value={filter.showByExtension}
            className="select-filter-options"
            onChange={(value) => dispatch(updateFilterByExtension(value))}
            style={{ width: 250 }}
            options={FILTER_DROP_DOWN_OPTIONS(t)}
          />
          {
            <Button
              icon={<DeleteOutlined />}
              type="primary"
              ghost
              danger
              disabled={isDisabled || selections.length === 0}
              onClick={() => handleDeleteButtonClick()}
            >
              {isDesktop && t("Delete")}
            </Button>
          }
          {!RECYCLE_BIN_PROVIDERS_NOT_SUPPORTED[provider] &&
            isTrashSupported && (
              <Button
                icon={<DeleteOutlined />}
                type="primary"
                ghost
                onClick={() => handleTrashButtonNavigate()}
              >
                {isDesktop && t("Recycle bin")}
              </Button>
            )}

          {/* <Select
            value={filter.showByExtension}
            className="select-filter-options"
            onChange={(value) => dispatch(updateFilterByExtension(value))}
            style={{ width: 250 }}
            options={FILTER_DROP_DOWN_OPTIONS(t)}
          /> */}
        </Space>
      </div>

      <div className="storage-header" onClick={handleClearSelection}>
        <Breadcrumb
          className="storage-breadcrumb"
          items={buildBreadcrumb(path).map((item) => ({
            key: item.id,
            title:
              item.type === "ellipsis" ? (
                <span style={{ cursor: "default" }}>...</span>
              ) : item.id === "0" ? (
                <a className="d-flex align-items-center justify-content-center">
                  <HomeIcon
                    onClick={() => handleNavigate(item)}
                    className="cursor-pointer"
                  />
                </a>
              ) : (
                <a onClick={() => handleNavigate(item)}>{t(item.name)}</a>
              ),
          }))}
        />

        {spaceUsed > 0 && spaceAmount > 0 && (
          <div className="space-used">
            <span>
              {t("{{used}} of {{limit}} used", {
                used: bytes(spaceUsed),
                limit: bytes(spaceAmount),
              })}
            </span>
          </div>
        )}
      </div>
      <div className="main-table">
        <div
          ref={tableWrapperRef}
          className={classNames("table-container", {
            "is-table-empty": items.length === 0,
          })}
          onClick={handleClearSelection}
        >
          <Table
            onScroll={handleScroll}
            size="middle"
            columns={columns}
            rowKey={(row) => row.id}
            scroll={{
              x: "max-content",
              y: !isMobile ? "calc(100svh - 310px)" : "calc(100svh - 385px)",
            }}
            rowClassName={(_record, index) =>
              index % 2 === 1 ? "ant-table-striped storage-row" : "storage-row"
            }
            // rowClassName={"storage-row"}
            loading={loading}
            dataSource={items}
            pagination={false}
            rowSelection={false}
          />
        </div>
      </div>
      <StorageFileUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        provider={provider}
        connectionId={connectionId}
        folderId={currentFolderId}
        context={operationContext}
        maxUploadSize={maxUploadSize}
        showByExtension={filter.showByExtension}
      />
      <CreateNewFileModal
        visible={createNewFileVisible}
        onClose={() => setCreateNewFileVisible(false)}
        provider={provider}
        connectionId={connectionId}
        parentId={currentFolderId}
        context={operationContext}
      />
      <CreateNewDrawingModal
        visible={createNewDrawingVisible}
        onClose={() => setCreateNewDrawingVisible(false)}
        provider={provider}
        connectionId={connectionId}
        parentId={currentFolderId}
        context={operationContext}
      />
      <RenameFileModal
        visible={renameSelectedItem !== null}
        onClose={() => setRenameSelectedItem(null)}
        data={renameSelectedItem}
        folderId={currentFolderId}
        context={operationContext}
        filter={filter}
        limit={paging.limit}
      />
    </div>
  );
};

export default StorageFiles;
