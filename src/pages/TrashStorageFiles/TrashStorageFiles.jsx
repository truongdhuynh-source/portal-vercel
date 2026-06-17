import React, { useEffect } from "react";
import { Table, Button, Dropdown, Modal, Checkbox } from "antd";
import {
  DeleteOutlined,
  FolderFilled,
  FileOutlined,
  MoreOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import "./TrashStorageFiles.css";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import bytes from "bytes";
import moment from "moment";
import useScreen from "@/hooks/useScreen";
import { UndoIcon } from "lucide-react";
import classNames from "classnames";
import PortalHeader from "@/components/PortalHeader";
import { connectStorageProvider } from "@/redux/features/storageCloud/storageCloud.slice";
import {
  clearTrashSelections,
  deleteStorageTrashFile,
  fetchStorageTrashFiles,
  resetStorageTrashFileState,
  restoreStorageTrashFile,
  toggleTrashSelection,
} from "@/redux/features/storageCloud/storageTrashFiles.slice";
import { STORAGE_PROVIDER_META } from "@/constants";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const TrashStorageFiles = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isMobile, isTablet, isDesktop } = useScreen();
  const {
    provider,
    connectionId,
    folderId = STORAGE_PROVIDER_META[provider].rootId,
  } = useParams();
  const { currentFolderId } = useSelector(
    (state) => state.storage.storageFiles,
  );

  const isDisabled = provider === "dropbox";

  const { items, paging, loading, filter, storageDisconnected, selections } =
    useSelector((state) => state.storage.storageTrashFiles);
  const createTrashTrackingMeta = (meta = {}) =>
    createTeraTrackingPageMeta("trash_storage_files", {
      provider,
      connectionId,
      folderId,
      ...meta,
    });

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
    dispatch(resetStorageTrashFileState({ connectionId }));
    dispatch(clearTrashSelections());
  }, [connectionId]);

  useEffect(() => {
    dispatch(
      fetchStorageTrashFiles({
        provider,
        connectionId,
        limit: paging.limit,
        filter,
        nextPage: paging.nextPage,
      }),
    ).unwrap();
  }, [provider, connectionId, paging.page, paging.limit, filter]);

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

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (!loading && paging?.nextPage) {
        dispatch(
          fetchStorageTrashFiles({
            provider,
            connectionId,
            limit: paging.limit,
            filter,
            nextPage: paging.nextPage,
          }),
        );
      }
    }
  };

  const handleRestoreItem = (data) => {
    const isMultipleRestore = Array.isArray(data);
    const restoredItems = isMultipleRestore ? data : [data];
    const title = isMultipleRestore ? `Restore items` : "Restore item";
    const desc = isMultipleRestore
      ? "Are you sure you want to restore these items?"
      : "Are you sure you want to restore this item?";
    const handleOk = async () => {
      if (isMultipleRestore) {
        await Promise.all(
          restoredItems.map((item) =>
            dispatch(
              restoreStorageTrashFile({
                provider,
                connectionId,
                itemId: item.id,
                type: item.type,
              }),
            ).unwrap(),
          ),
        );
      } else {
        await dispatch(
          restoreStorageTrashFile({
            provider,
            connectionId,
            itemId: data.id,
            type: data.type,
            folderId: data.parentId,
          }),
        ).unwrap();
      }
      createEventToTrackingSession({
        event: "restore_storage_item",
        value: restoredItems.length,
        meta: createTrashTrackingMeta({
          action: "restore",
          itemType: isMultipleRestore ? "mixed" : data.type,
        }),
      });
    };

    Modal.confirm({
      title: t(title),
      content: t(desc),
      icon: <ExclamationCircleOutlined />,
      okText: t("Yes"),
      centered: true,
      cancelText: t("No"),
      onOk: () => handleOk(),
    });
  };
  const handleDeleteItem = async (data) => {
    const isMultipleDelete = Array.isArray(data);
    const deletedItems = isMultipleDelete ? data : [data];
    const title = isMultipleDelete ? `Delete items` : "Delete item";
    const desc = isMultipleDelete
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    const handleOk = async () => {
      if (isMultipleDelete) {
        await Promise.all(
          deletedItems.map((item) =>
            dispatch(
              deleteStorageTrashFile({
                provider,
                connectionId,
                itemId: item.id,
                type: item.type,
              }),
            ).unwrap(),
          ),
        );
      } else {
        await dispatch(
          deleteStorageTrashFile({
            provider,
            connectionId,
            itemId: data.id,
            type: data.type,
            folderId: data.parentId,
          }),
        ).unwrap();
      }
      createEventToTrackingSession({
        event: "delete_trash_item",
        value: deletedItems.length,
        meta: createTrashTrackingMeta({
          action: "delete_permanently",
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
    });
  };

  const handleDeleteButtonClick = (type) =>
    handleDeleteItem(type == "selected" ? selections : items);

  const handleRestoreButtonClick = () => handleRestoreItem(selections);

  const moreActionButton = (record) => {
    return (
      <Dropdown
        menu={{
          items: [
            {
              key: "restore",
              label: <span>{t("Restore")}</span>,
              icon: <UndoIcon className="menu-icon" size={14} />,
            },

            {
              key: "delete",
              label: <span>{t("Delete")}</span>,
              disabled: isDisabled,
              danger: true,
              icon: <DeleteOutlined className="menu-icon" />,
            },
          ],
          onClick: async ({ key }) => {
            if (key === "restore") {
              handleRestoreItem(record);
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

  const columns = [
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
      render: (text, record) => {
        return (
          <div className="py-1">
            <div className="w-100 d-flex gap-2 align-items-center">
              <div
                className=" d-flex flex-grow-1"
                onClick={() => handleNavigate(record)}
              >
                {record.type === "folder" ? (
                  <FolderFilled style={{ fontSize: 18 }} />
                ) : (
                  <FileOutlined style={{ fontSize: 18 }} />
                )}
                <div className="flex-grow-1 text-start mx-2">{text}</div>
              </div>

              <Checkbox
                checked={selections.some((i) => i.id === record.id)}
                onChange={(e) => dispatch(toggleTrashSelection(record))}
                className={classNames(
                  "row-checkbox",
                  selections.some((i) => i.id === record.id) && "selected",
                )}
              />
            </div>
            {isMobile && (
              <div
                className="d-flex align-items-center mt-1"
                style={{ fontSize: 12 }}
              >
                {record.size ? `${bytes(record.size)} • ` : null}
                {moment(record.modifiedAt).format(t("DD/MM/YYYY HH:mm:ss"))}
              </div>
            )}
          </div>
        );
      },
    },
    ...(!isMobile
      ? [
          {
            title: t("Modified"),
            dataIndex: "modifiedAt",
            key: "modified",
            width: isMobile ? 80 : isTablet ? 100 : 150,
            render: (modified) =>
              modified
                ? moment(modified).format(t("DD/MM/YYYY HH:mm:ss"))
                : "--/--",
          },
          {
            title: t("Size"),
            dataIndex: "size",
            key: "size",
            width: isMobile ? 80 : isTablet ? 100 : 150,
            render: (text) => (text ? bytes(text) : "--/--"),
          },
        ]
      : []),
    {
      key: "actions",
      render: (_, record, index) => {
        return moreActionButton(record);
      },
      className: "max-w-3em",
      align: "center",
      width: "3em",
    },
  ];

  const handleClearSelection = (e) => {
    const currentTarget = ["table-container", "trash-storage-header mb-3"];
    const target = [
      "ant-table-container",
      "flex-grow-1 d-flex align-items-center gap-2",
    ];
    if (
      currentTarget.includes(e.currentTarget.className) &&
      target.includes(e.target.className)
    ) {
      dispatch(clearTrashSelections());
    }
  };

  return (
    <div className="trash-storage-files">
      <div className="trash-storage-header mb-3" onClick={handleClearSelection}>
        <div className="d-flex">
          {/* <div className="flex-grow-1 d-flex align-items-center gap-2">
            <Button
              shape="circle"
              icon={<ArrowLeftOutlined />}
              className="border-0 bg-transparent shadow-none"
              onClick={() =>
                navigate(
                  `/files/${provider}/${connectionId}/${currentFolderId ?? STORAGE_PROVIDER_META[provider].rootId}`,
                )
              }
            />
            <PortalHeader title={t("Recycle bin")} />
          </div> */}
          <div className="right-group d-flex align-items-center gap-2">
            {selections.length > 0 && (
              <Button
                icon={<UndoIcon size={18} />}
                type="primary"
                ghost
                onClick={() => handleRestoreButtonClick()}
              >
                {isDesktop && t("Restore selected")}
              </Button>
            )}
            {items.length > 0 && (
              <Button
                icon={<DeleteOutlined />}
                type="primary"
                disabled={isDisabled}
                ghost
                danger
                onClick={() =>
                  handleDeleteButtonClick(
                    selections.length > 0 ? "selected" : "all",
                  )
                }
              >
                {isDesktop &&
                  t(selections.length > 0 ? "Delete selected" : "Delete all")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="main-table">
        <div
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
            rowClassName={"storage-row"}
            loading={loading}
            dataSource={items}
            pagination={false}
            rowSelection={false}
          />
        </div>
      </div>
    </div>
  );
};

export default TrashStorageFiles;
