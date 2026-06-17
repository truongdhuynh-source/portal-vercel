import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import moment from "moment";
import bytes from "bytes";
import "./MyFamilies.css";
import {
  Tooltip,
  Button,
  ConfigProvider,
  Dropdown,
  Empty,
  Modal,
  notification,
  Select,
  Table,
  Typography,
  Input,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  DesktopOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  UploadOutlined,
  FileSyncOutlined,
} from "@ant-design/icons";
import i18next from "i18next";
import { StatusTag, PreviewIcon } from "@/components";
import ClientFactory from "@/oda-sdk/ClientFactory";
import CreateAssemblyModal from "../../oda-sdk/views/Assemblies/CreateAssemblyModal";
import {
  VINA_CAD_ACCEPT_FILE_DEFAULT,
  USER_ODA,
  CURRENT_PAGE,
  VINA_BIM_ACCEPT_FILE_DEFAULT,
  VINA_BIM_APP,
  VINA_CAD_APP,
} from "@/constants";
import logoBim from "@/assets/images/logo-vinabim.png";
import DefaultPreview from "@/assets/images/default-preview.png";
import logo from "@/assets/images/logo-vinacad.png";
import axiosInstance from "@/plugins/axios";
import getUserIdLogin from "@/utils/getUserIdLogin";
import { withTranslation } from "react-i18next";
import FileUploadModal from "../../oda-sdk/views/Files/FileUploadModal";
import axios from "axios";
import PreviewModal from "../../components/PreviewModal";
import StorageUsage from "@/components/StorageUsage/StorageUsage";
import { compose } from "@/utils/compose";
import withEnhancers from "@/oda-sdk/hoc/withEnhancers";
import PortalHeader from "@/components/PortalHeader";
import rfaIcon from "@/assets/file-icons/rfa.svg";
import rftIcon from "@/assets/file-icons/rfa.svg";
import { store } from "@/redux/store";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const { Text } = Typography;
const t = i18next.t;
const { Search } = Input;

function ViewerLink({ className, file, canOpen, children }) {
  return canOpen ? (
    <Link
      className={classNames("ant-typography", className)}
      to={`/my-families/${file.id}?n=${file.name}`}
      onClick={() =>
        createEventToTrackingSession({
          event: "open_family_file",
          meta: createTeraTrackingPageMeta("my_families", {
            action: "view_detail",
            fileType: file.type,
            fileId: file.id,
            fileName: file.name,
          }),
        })
      }
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

class MyFamilies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewStyle: "table",
      files: [],
      fontFiles: [],
      loading: true,
      error: "",
      total: 0,
      page: JSON.parse(sessionStorage.getItem(CURRENT_PAGE)) || 1,
      pageSize: 10,
      filters: {
        filter: "",
        categoryId: "",
      },
      searchValue: "",
      selectedFiles: [],
      selectedFile: {},
      fileUploadModal: false,
      createAssemblyModal: false,
      fileVersionsModal: false,
      storageLimit: 0,
      userFileInfo: {},
      scrollY: "calc(100svh - 310px)",
      categories: [],
      visibleModal: false,
      previewId: null,
    };

    const revitFormat = ClientFactory.getConfig().revitFormat;
    this.revitFormat = new Map();
    revitFormat.forEach((format) =>
      this.revitFormat.set(`.${format?.toLowerCase()}`, 0),
    );
    this.searchDebounceTimeout = null;
  }

  async componentDidMount() {
    const isNeedUpdate = () => {
      return this.state.files
        .filter((file) => this.revitFormat.has(file.type?.toLowerCase()))
        .some((file) => {
          return (
            ["waiting", "inprogress"].includes(file?.status?.geometry?.state) ||
            ["waiting", "inprogress"].includes(file?.status?.properties?.state)
          );
        });
    };

    await this.getMyFamilies().then(() => {
      this.intervalId = setInterval(async () => {
        if (isNeedUpdate()) {
          await this.getMyFamilies();
        }
      }, 5000);
    });
    await this.fetchAllSizeFiles(10000);
    await this.fetchCategories();
  }

  fetchAllSizeFiles = async (limit) => {
    try {
      const user_vina_id = getUserIdLogin();
      const user =
        JSON.parse(localStorage.getItem(`${USER_ODA}_${user_vina_id}`)) || {};
      const response = await axiosInstance.get(
        `/files/all-size?limit=${limit}`,
      );
      if (response) {
        this.setState({
          storageLimit: user.storageLimit,
          userFileInfo: response.data,
        });
      }
    } catch (e) {
      console.error("Error fetching all size files:", e);
    }
  };

  fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories/get-all-categories");
      if (res) {
        this.setState({
          categories: res.data,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  getMyFamilies = async (page, pageSize, categoryId, filter) => {
    try {
      this.setState({ loading: true, error: "" });

      if (page === undefined) page = this.state.page;
      if (pageSize === undefined) pageSize = this.state.pageSize;
      if (categoryId === undefined) categoryId = this.state.filters.categoryId;
      if (filter === undefined) filter = this.state.filters.filter;
      const res = await axiosInstance.get(
        `/file-public/files?isPublic=false&userId=${getUserIdLogin()}&currentPage=${page}&perPage=${pageSize}&categoryId=${categoryId}&filter=${filter}`,
      );

      if (res) {
        this.setState({
          files: res.data?.data,
          loading: false,
          total: res.data?.total,
          page,
          pageSize,
        });
      }
    } catch (error) {
      console.log(error);
      this.setState({ loading: false, error: e.message });
    }
  };

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = null;
  }

  getAuthCodeOpenApp = async (file) => {
    const { refresh, oda, userId } = this.props.data;
    const canOpenVinaCAD = VINA_CAD_ACCEPT_FILE_DEFAULT.includes(
      file?.type?.toUpperCase(),
    );
    const canOpenVinaBIM = VINA_BIM_ACCEPT_FILE_DEFAULT.includes(
      file?.type?.toUpperCase(),
    );
    try {
      const res = await axiosInstance.post("/oauth/auth-code", {
        code: refresh,
      });

      const { accessToken, refreshToken } = res.data;
      createEventToTrackingSession({
        event: "open_family_desktop_app",
        meta: createTeraTrackingPageMeta("my_families", {
          action: "open_desktop_app",
          app: canOpenVinaCAD ? VINA_CAD_APP : VINA_BIM_APP,
          fileType: file.type,
          fileId: file.id,
          fileName: file.name,
        }),
      });

      window.open(
        `vinabim://app=${canOpenVinaCAD ? VINA_CAD_APP : canOpenVinaBIM ? VINA_BIM_APP : null
        }&ac=${accessToken}&rf=${refreshToken}&ot=${oda.tokenInfo.token
        }&fileId=${file.id}&u=${userId}&fileName=${canOpenVinaCAD
          ? `vinacad.${file?._data?.name?.split(".").pop()}`
          : canOpenVinaBIM
            ? `vinabim.${file?.name?.split(".").pop()}`
            : null
        }`,
        "_self",
      );
    } catch (e) {
      console.error("Error fetching auth code", e);
    }
  };

  deleteFile = async (file) => {
    const res = await axiosInstance.delete(
      `/file-public?fileId=${file.fileId}`,
    );
    if (res) {
      notification.success({
        message: res?.data ? t("Success") : t("Error"),
        description: res?.data ? t("File deleted") : t("Cannot delete file"),
      });
      createEventToTrackingSession({
        event: "delete_family_file",
        meta: createTeraTrackingPageMeta("my_families", {
          action: "delete",
          fileType: file.type,
          fileId: file.id,
          fileName: file.name,
        }),
      });
      this.getMyFamilies();
    }
  };

  downloadSource = async (file) => {
    try {
      const odaAPI = import.meta.env.VITE_APP_ODA_API;
      const user_vina_id = getUserIdLogin();
      this.setState({ loading: true });
      const response = await axios.get(`${odaAPI}/files/${file.id}/downloads`, {
        headers: {
          Accept: "application/octet-stream",
          Authorization: JSON.parse(
            localStorage.getItem(`${USER_ODA}_${user_vina_id}`),
          ).tokenInfo.token,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;

      const filename = file.name;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Xóa
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.setState({ loading: false });

      notification.success({
        message: "Success",
        description: t("File downloaded"),
      });
      createEventToTrackingSession({
        event: "download_family_file",
        meta: createTeraTrackingPageMeta("my_families", {
          action: "download_source",
          fileType: file.type,
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

  handleTableChange = async (pagination, filters, sorter) => {
    sessionStorage.setItem(CURRENT_PAGE, pagination.current);
    await this.getMyFamilies(
      pagination.current,
      pagination.pageSize,
      filters.name || [],
      filters.type || [],
      sorter.order ? sorter.order === "descend" : undefined,
      sorter.order ? sorter.field : undefined,
    );
  };

  onSearch = async (categoryId = "", filter = "") => {
    if (this.state.page !== 1) {
      this.state.page = 1;
    }
    this.state.filters.categoryId = categoryId;
    this.state.filters.filter = filter;
    await this.getMyFamilies();
  };

  handleSearchChange = (value = "") => {
    this.setState({ searchValue: value });
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = setTimeout(() => {
      this.onSearch(this.state.filters.categoryId, value);
    }, 300);
  };

  render() {
    const {
      files,
      total,
      page,
      pageSize,
      filters,
      loading,
      error,
      selectedFiles,
      fileUploadModal,
      createAssemblyModal,
      scrollY,
      categories,
      searchValue,
      storageLimit,
      userFileInfo,
    } = this.state;
    const { access, refresh, oda, userId } = this.props.data;
    const { isMobile, isTablet } = this.props.hooks.screen;
    const columns = [
      {
        title: t("#"),
        dataIndex: "index",
        render: (_, record, index) => (page - 1) * pageSize + index + 1,
        width: "50px",
        ellipsis: true,
        align: "center",
      },
      {
        title: "",
        dataIndex: "openApp",
        responsive: ["lg"],
        render: (name, file) => {
          const canOpenVinaCAD = VINA_CAD_ACCEPT_FILE_DEFAULT.includes(
            file?.type?.toUpperCase(),
          );
          const canOpenVinaBIM = VINA_BIM_ACCEPT_FILE_DEFAULT.includes(
            file?.type?.toUpperCase(),
          );
          return (
            <Button
              title={t("Allow open file")}
              className="cursor-pointer open-app-btn"
              disabled={!canOpenVinaCAD && !canOpenVinaBIM}
              style={{ fontSize: "12px" }}
              onClick={() => this.getAuthCodeOpenApp(file)}
            >
              <p className="d-flex align-items-center mb-0">
                <img
                  style={{ width: "15px", height: "15px" }}
                  className="mr-2"
                  src={canOpenVinaBIM ? logoBim : logo}
                  alt="Logo"
                />
                {canOpenVinaBIM ? t("Open VinaBIM") : t("Open VinaCAD")}
              </p>
            </Button>
          );
        },
        align: "center",
        width: "170px",
      },
      {
        title: t("Name"),
        dataIndex: "name",
        render: (name, file) => {
          const canOpen = file?.status?.geometry?.state === "done";
          return (
            <div style={{ display: "flex" }}>
              {/* <Tooltip title={t("Preview")}>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    canOpen
                      ? this.setState({
                          visibleModal: true,
                          previewId: file.id,
                        })
                      : null;
                  }}
                >
                  <PreviewIcon
                    className="mr-2 d-none d-sm-block"
                    preview={file.previewUrl}
                    defaultPreview={DefaultPreview}
                  />
                </div>
              </Tooltip> */}
              {getFileIcon(file.name)}

              <ViewerLink
                className="d-flex align-items-center flex-nowrap "
                file={file}
                canOpen={canOpen}
              >
                <Text
                  className="text-reset mr-2 text-truncate"
                  ellipsis={{ tooltip: true }}
                  style={{ maxWidth: isMobile ? "200px" : "400px" }}
                >
                  {name}
                </Text>
                {file?.status &&
                  Object.entries(file?.status)
                    .filter(([name, status]) =>
                      ["geometry", "properties"].includes(name),
                    )
                    .filter(
                      ([name, status]) =>
                        !["none", "done"].includes(status.state),
                    )
                    .map(([name, status]) => (
                      <StatusTag
                        key={name}
                        className="d-none d-lg-inline-block font-size-sm"
                        status={status.state}
                        name={name}
                      />
                    ))}
              </ViewerLink>
            </div>
          );
        },
        // ...NameFilter(t('Lọc theo tên')),
        ellipsis: true,
      },
      {
        title: t("Category"),
        dataIndex: "category",
        render: (category, file) => (
          <p
            className="mb-0 text-truncate"
            style={{ maxWidth: isMobile ? "100px" : "120px" }}
          >
            {lang === "en"
              ? file.categoryNameEN
              : lang === "vi"
                ? file.categoryNameVI
                : file.categoryNameJA}
          </p>
        ),
        width: isMobile ? "100px" : "120px",
        ellipsis: true,
        align: "left",
        // responsive: ["lg"],
      },
      {
        title: t("Size"),
        dataIndex: "size",
        render: (size) =>
          bytes.format(size, { decimalPlaces: 1, unitSeparator: " " }),
        width: "8%",
        ellipsis: true,
        responsive: ["lg"],
        align: "left",
      },
      {
        title: t("Last Updated"),
        dataIndex: "updatedAt",
        render: (updatedAt) =>
          moment(updatedAt).format(t("DD-MM-YYYY HH:mm:ss")),
        width: "15%",
        ellipsis: true,
        responsive: ["md"],
        align: "left",
      },
      {
        title: "",
        key: "actions",
        render: (_, file) => {
          const canOpen = file?.status?.geometry?.state === "done";
          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "open",
                    label: (
                      <ViewerLink
                        className="text-reset"
                        file={file}
                        canOpen={canOpen}
                      >
                        {t("View detail")}
                      </ViewerLink>
                    ),
                    icon: <DesktopOutlined className="menu-icon" />,
                    disabled: !canOpen,
                  },
                  {
                    key: "download",
                    label: t("Download source file"),
                    icon: <DownloadOutlined className="menu-icon" />,
                  },

                  {
                    key: "delete",
                    label: t("Delete file"),
                    icon: <DeleteOutlined className="menu-icon" />,
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "download") this.downloadSource(file);
                  if (key === "versions")
                    this.setState({
                      selectedFile: file,
                      fileVersionsModal: true,
                    });
                  if (key === "delete") {
                    Modal.confirm({
                      title: t("Delete the file?"),
                      icon: <ExclamationCircleOutlined />,
                      okText: t("Yes"),
                      okType: "danger",
                      cancelText: t("No"),
                      cancelButtonProps: { type: "primary" },
                      onOk: () => this.deleteFile(file),
                    });
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
        },
        align: "center",
        width: "3em",
      },
    ];

    const filtered = filters.filter.length > 0;
    const emptyText = error
      ? t("Error loading files")
      : loading
        ? " "
        : filtered
          ? t("No files matching the filter")
          : t("No files. To add a new file, click Upload File button.");

    const lang = localStorage.getItem("i18nextLng");

    const pagination = {
      showSizeChanger: true,
      showLessItems: true,
      responsive: true,
      disabled: loading,
      total,
      current: page,
      pageSize,
      size: "small",
    };

    const operations = (
      <StorageUsage storageLimit={storageLimit} userFileInfo={userFileInfo} />
    );

    const getFileIcon = (fileName) => {
      const ext = fileName?.split(".").pop().toLowerCase();
      if (ext === "rfa" || ext === "rft") {
        return (
          <div
            className="d-flex align-items-center justify-content-center mr-2"
            style={{ width: "22px", height: "26px" }}
          >
            <img
              className="w-100 h-100 d-block object-fit-contain"
              src={ext === "rfa" ? rfaIcon : rftIcon}
              alt={ext}
            />
          </div>
        );
      }
      return <FileSyncOutlined style={{ marginRight: "10px" }} />;
    };

    return (
      <div
        className={`my-families-page ${store.getState().app.isAdminMode ? "admin-families-mode" : ""}`}
      >
        <div className="my-families h-100 d-flex flex-column">
          <div className="action-container d-flex justify-content-between">
            <div className="action-left d-flex align-items-center gap-2">
              <div className=" d-flex align-items-center gap-2 ">
                <Button
                  key="upload"
                  type="primary"
                  icon={<UploadOutlined />}
                  disabled={
                    // loading ||
                    error || userFileInfo.totalSize > storageLimit
                  }
                  onClick={() => this.setState({ fileUploadModal: true })}
                >
                  <span>{t("Upload")}</span>
                </Button>
                {!isMobile && operations}
              </div>
            </div>
            <div className="action-right d-flex align-items-center gap-2 ">
              <Select
                // rootClassName="flex-1"
                placeholder={t("Filter by category")}
                style={{
                  width: 150,
                }}
                allowClear
                options={categories.map((category) => ({
                  label:
                    lang === "vi"
                      ? category.nameVI
                      : lang === "en"
                        ? category.nameEN
                        : category.nameJA,
                  value: category.id,
                }))}
                onChange={(value) =>
                  this.onSearch(value || "", this.state.searchValue)
                }
              />
              <Search
                placeholder={t("Filter by file")}
                allowClear
                value={searchValue}
                onChange={(e) => this.handleSearchChange(e.target.value)}
                style={{
                  width: 250,
                }}
              />
            </div>
          </div>
          <div className="main-table align-self-stretch overflow-auto bg-gray">
            <div
              className={classNames("table-container", {
                "is-table-empty": files.length === 0,
              })}
            >
              <ConfigProvider
                renderEmpty={() => <Empty description={emptyText} />}
              >
                <Table
                  size={isMobile ? "small" : "middle"}
                  columns={columns}
                  rowKey={(row) => row.id}
                  dataSource={files}
                  pagination={pagination}
                  loading={loading}
                  scroll={{
                    x: "max-content",
                    y: !isMobile ? scrollY : "calc(100svh - 340px)",
                  }}
                  onChange={this.handleTableChange}
                  bordered={isMobile || isTablet ? false : true}
                  rowClassName={(_record, index) =>
                    index % 2 === 1 ? "ant-table-striped" : undefined
                  }
                />
              </ConfigProvider>
            </div>
          </div>
          <FileUploadModal
            visible={fileUploadModal}
            onUpload={() => {
              this.setState({ fileUploadModal: false });
              this.getMyFamilies();
            }}
            isFamily={true}
            onClose={() => this.setState({ fileUploadModal: false })}
            userFileInfo={userFileInfo}
            storageLimit={storageLimit}
            fontFiles={this.state.fontFiles}
            trackingEvent="upload_family_file"
            trackingPage="my_families"
          />
          <CreateAssemblyModal
            visible={createAssemblyModal}
            selected={selectedFiles}
            onCreate={() =>
              this.setState({
                selectedFiles: [],
                createAssemblyModal: false,
              })
            }
            onClose={() => this.setState({ createAssemblyModal: false })}
          />
          {this.state.visibleModal && (
            <PreviewModal
              visible={this.state.visibleModal}
              set={(visible) => this.setState({ visibleModal: visible })}
              fileId={this.state.previewId}
            />
          )}
        </div>
      </div>
    );
  }
}

export default compose(withTranslation(), withEnhancers)(MyFamilies);
