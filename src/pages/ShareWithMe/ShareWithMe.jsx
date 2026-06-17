import React, { useEffect, useMemo, useState, useContext } from "react";
import bytes from "bytes";
import {
  Avatar,
  ConfigProvider,
  Empty,
  Select,
  Table,
  Typography,
  Input,
  Tooltip,
  Tag,
  Dropdown,
  Button,
  notification,
} from "antd";
import {
  UserOutlined,
  FileSyncOutlined,
  DesktopOutlined,
  DownloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import PortalHeader from "@/components/PortalHeader";
import ClientFactory from "@/oda-sdk/ClientFactory";
import { AppContext } from "@/AppContext";
import "./ShareWithMe.css";
import getUserIdLogin from "@/utils/getUserIdLogin";
import axios from "axios";
import { USER_ODA, USER_VINA } from "@/constants";
import dwgIcon from "../../assets/file-icons/dwg.png";
import dxfIcon from "../../assets/file-icons/dxf.png";
import { useSelector } from "react-redux";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const { Text } = Typography;
const { Search } = Input;

const getPermissionConfig = (perm, t) => {
  switch (perm) {
    case "read":
      return { color: "blue", label: t("Read") };
    case "readSourceFile":
      return { color: "cyan", label: t("Edit") };
    case "readViewpoint":
      return { color: "purple", label: t("View Point") };
    default:
      return { color: "default", label: perm };
  }
};

const ShareWithMe = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    keyword: "",
    permission: undefined,
  });

  const [searchValue, setSearchValue] = useState("");
  const isAdminMode = useSelector((state) => state.app.isAdminMode);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, keyword: searchValue }));
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const client = ClientFactory.get();
  const { app } = useContext(AppContext);
  const { t } = useTranslation();

  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop().toLowerCase();
    if (ext === "dwg" || ext === "dxf") {
      return (
        <div
          className="d-flex align-items-center justify-content-center mr-2"
          style={{ width: "22px", height: "26px" }}
        >
          <img
            className="w-100 h-100 d-block object-fit-contain"
            src={ext === "dwg" ? dwgIcon : dxfIcon}
            alt={ext}
          />
        </div>
      );
    }
    return <FileSyncOutlined style={{ marginRight: "10px" }} />;
  };

  const openFileDetailForInWebViewer = (fileData) => {
    const file = fileData._data;

    const user_vina_id = getUserIdLogin();
    const lang = localStorage.getItem("i18nextLng");

    const userObj = JSON.parse(
      localStorage.getItem(`${USER_VINA}_${user_vina_id}`) || "{}",
    );

    const url = `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${lang}?from=vinacad&fileId=${file.id}&token=${file.sharedLinkToken}&email=${userObj?.email}&firstName=${userObj?.firstName}&lastName=${userObj?.lastName}&fileName=${file.name}&share=true`;

    window.open(url, "_blank");
    createEventToTrackingSession({
      event: "open_shared_file",
      meta: createTeraTrackingPageMeta("shared_with_me", {
        action: "open_in_cad_viewer",
        fileType: file.name?.split(".").pop()?.toLowerCase(),
        fileId: file.id,
        fileName: file.name,
      }),
    });
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await app.getShareFileForUser({
        keyword: filters.keyword,
        permission: filters.permission,
        currentPage: page,
        perPage: pageSize,
      });

      const sharedFiles = res?.items || [];

      const combinedResults = await Promise.all(
        sharedFiles.map(async (shareItem) => {
          try {
            const fileDetail = await client.getSharedFile(
              shareItem.shared_link_token,
            );
            const userName = await app.getUserById(shareItem.owner_id);

            return {
              ...fileDetail,
              uniqueId: shareItem.shared_link_token,
              owner: userName,
              permission: shareItem.permission,
            };
          } catch (e) {
            return null;
          }
        }),
      );

      const cadFiles = combinedResults.filter((file) => {
        if (!file) return false;
        const name = file._data.name?.toLowerCase() || "";
        return name.endsWith(".dwg") || name.endsWith(".dxf");
      });

      setFiles(cadFiles);
    } catch (err) {
      console.error("ShareWithMe: fetchFiles", err);
      setError(t("Error loading files"));
    } finally {
      setLoading(false);
    }
  };

  const downloadSource = async (fileData) => {
    try {
      const odaAPI = import.meta.env.VITE_APP_ODA_API;
      // const user_vina_id = getUserIdLogin();
      const file = fileData._data;

      const response = await axios.get(
        `${odaAPI}/shares/${file.sharedLinkToken}/downloads`,
        {
          // headers: {
          //   Accept: "application/octet-stream",
          //   Authorization: JSON.parse(
          //     localStorage.getItem(`${USER_ODA}_${user_vina_id}`),
          //   ).tokenInfo.token,
          // },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;

      const filename = file.name;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notification.success({
        message: "Success",
        description: t("File downloaded"),
      });
      createEventToTrackingSession({
        event: "download_shared_file",
        meta: createTeraTrackingPageMeta("shared_with_me", {
          action: "download_source",
          fileType: file.name?.split(".").pop()?.toLowerCase(),
          fileId: file.id,
          fileName: file.name,
        }),
      });
    } catch (error) {
      console.error("Cannot download file.", error);
      notification.error({
        message: "Error",
        description: t("Cannot download file"),
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [filters, page, pageSize]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const name = file._data.name?.toLowerCase() || "";

      const matchSearch = filters.keyword
        ? name.includes(filters.keyword.toLowerCase())
        : true;

      const matchPermission = filters.permission
        ? file.permission?.includes(filters.permission)
        : true;

      return matchSearch && matchPermission;
    });
  }, [files, filters]);

  const columns = useMemo(
    () => [
      {
        title: t("#"),
        width: 50,
        align: "center",
        render: (_, __, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: t("Name"),
        dataIndex: "name",
        render: (_, file) => (
          <div
            className="d-flex align-items-center"
            onClick={() => openFileDetailForInWebViewer(file)}
          >
            {getFileIcon(file._data.name)}
            <Tooltip title={file._data.name} placement="topRight">
              <Text
                className="share-file-name"
                ellipsis={{ tooltip: false }}
                style={{ maxWidth: 300, color: "#1677ff", cursor: "pointer" }}
              >
                {file._data.name}
              </Text>
            </Tooltip>
          </div>
        ),
      },
      {
        title: t("Size"),
        dataIndex: "fileSize",
        render: (_, file) =>
          bytes.format(file._data.size || 0, {
            decimalPlaces: 1,
            unitSeparator: " ",
          }),
        width: 140,
      },
      {
        title: t("Owner"),
        render: (_, file) => (
          <div className="d-flex align-items-center">
            <Avatar
              size={22}
              icon={<UserOutlined />}
              className="mr-2"
              style={{ backgroundColor: "#1890ff" }}
            />
            <Text ellipsis>{file.owner}</Text>
          </div>
        ),
        width: 150,
      },
      // {
      //   title: t("Permissions"),
      //   dataIndex: "permission",
      //   width: "max-content",
      //   render: (perms) => {
      //     if (!Array.isArray(perms)) return null;
      //     return (
      //       <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      //         {perms.map((p) => {
      //           const config = getPermissionConfig(p, t);
      //           return (
      //             <Tag
      //               color={config.color}
      //               key={p}
      //               style={{
      //                 textTransform: "capitalize",
      //                 borderRadius: "4px",
      //                 margin: 0,
      //               }}
      //             >
      //               {config.label}
      //             </Tag>
      //           );
      //         })}
      //       </div>
      //     );
      //   },
      // },
      {
        title: "",
        key: "actions",
        render: (_, file) => {
          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "open",
                    label: (
                      <div
                        className="text-reset"
                        file={file}
                        canOpen={file.canOpen}
                        onClick={() => openFileDetailForInWebViewer(file)}
                      >
                        {t("View detail")}
                      </div>
                    ),
                    icon: <DesktopOutlined className="menu-icon" />,
                  },
                  {
                    key: "download",
                    label: t("Download source file"),
                    icon: <DownloadOutlined className="menu-icon" />,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "download") downloadSource(file);
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
        },
        align: "center",
        width: "3em",
      },
    ],
    [page, pageSize, t],
  );

  return (
    <div className="share-with-me-page">
      <div className="share-files h-100 d-flex flex-column">
        {/* <PortalHeader title={t("Shared With Me")} /> */}

        <div
          className={`action-container d-flex justify-content-end ${isAdminMode ? "admin-mode" : ""}`}
          style={{ gap: 12 }}
        >
          <div className="d-flex align-items-center gap-2 justify-content-end">
            <Search
              placeholder={t("Search file name...")}
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: 250 }}
            />
          </div>
          {/* <Text type="secondary" className="d-flex align-items-center">
            {t("Total Files Shared With Me")}:{" "}
            <b className="pl-1">{filteredFiles.length}</b>
          </Text> */}
        </div>

        <div
          className={`main-table align-self-stretch overflow-auto bg-gray ${isAdminMode ? "admin-mode" : ""}`}
        >
          <ConfigProvider
            renderEmpty={() => (
              <Empty description={error || t("No CAD files shared with you")} />
            )}
          >
            <Table
              columns={columns}
              rowKey="uniqueId"
              dataSource={filteredFiles}
              loading={loading}
              pagination={{
                current: page,
                pageSize: pageSize,
                onChange: (p, s) => {
                  setPage(p);
                  setPageSize(s);
                },
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
              }}
              rowClassName={(_record, index) =>
                index % 2 === 1 ? "ant-table-striped" : undefined
              }
              size={"middle"}
              scroll={{ x: "max-content", y: "calc(100svh - 235px)" }}
              className="custom-table"
              bordered={true}
            />
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};

export default ShareWithMe;
