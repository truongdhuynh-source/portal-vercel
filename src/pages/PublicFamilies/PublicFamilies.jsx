import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import moment from "moment";
import bytes from "bytes";
import "./PublicFamilies.css";
import {
  Avatar,
  ConfigProvider,
  Dropdown,
  Empty,
  notification,
  Select,
  Table,
  Typography,
  Input,
  Tooltip,
  Row,
  Col,
  Space,
  Button,
} from "antd";
import {
  DownloadOutlined,
  DesktopOutlined,
  MoreOutlined,
  UserOutlined,
  FileSyncOutlined,
} from "@ant-design/icons";
import i18next from "i18next";
import { StatusTag, PreviewIcon } from "@/components";
import ClientFactory from "@/oda-sdk/ClientFactory";
import CreateAssemblyModal from "../../oda-sdk/views/Assemblies/CreateAssemblyModal";
import { USER_ODA, CURRENT_PAGE } from "@/constants";
import axios from "axios";

import DefaultPreview from "@/assets/images/default-preview.png";
import axiosInstance from "@/plugins/axios";
import getUserIdLogin from "@/utils/getUserIdLogin";
import { withTranslation } from "react-i18next";
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
      to={`/public-families/${file.id}?n=${file.name}`}
      onClick={() =>
        createEventToTrackingSession({
          event: "open_public_family_file",
          meta: createTeraTrackingPageMeta("public_families", {
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

class PublicFamilies extends React.Component {
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
          this.updateStatusFilePublic();
          await this.getMyFamilies();
        }
      }, 5000);
    });

    await this.fetchCategories();
    await this.fetchAllSizeFiles(10000);
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

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = null;
  }

  updateStatusFilePublic = async () => {
    try {
      await axiosInstance.put("/file-public/file");
    } catch (error) {
      console.log(error);
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

  getMyFamilies = async (page, pageSize, categoryId, filter) => {
    try {
      this.setState({ loading: true, error: "" });
      if (page === undefined) page = this.state.page;
      if (pageSize === undefined) pageSize = this.state.pageSize;
      if (categoryId === undefined) categoryId = this.state.filters.categoryId;
      if (filter === undefined) filter = this.state.filters.filter;
      const res = await axiosInstance.get(
        `/file-public/public?currentPage=${page}&perPage=${pageSize}&categoryId=${categoryId}&filter=${filter}`,
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
    }
  };

  deleteFile = (file) => {
    file
      .delete()
      .then((data) => {
        const { files, total } = this.state;
        this.setState({
          files: files.filter((x) => x.id !== data.id),
          total: total - 1,
        });

        notification.success({
          message: t("Success"),
          description: t("File deleted"),
        });
        createEventToTrackingSession({
          event: "delete_public_family_file",
          meta: createTeraTrackingPageMeta("public_families", {
            action: "delete",
            fileType: data.type,
            fileId: file.id,
            fileName: file.name,
          }),
        });
      })
      .catch((e) => {
        console.error("Cannot delete file.", e);
        notification.error({
          message: "Error",
          description: t("Cannot delete file"),
        });
      });
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

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.setState({ loading: false });

      notification.success({
        message: "Success",
        description: t("File downloaded"),
      });
      createEventToTrackingSession({
        event: "download_public_family_file",
        meta: createTeraTrackingPageMeta("public_families", {
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
      createAssemblyModal,
      scrollY,
      categories,
      searchValue,
      storageLimit,
      userFileInfo,
    } = this.state;
    const { isMobile, isTablet } = this.props.hooks.screen;
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
    const getMobileColumns = () => [
      {
        title: t("#"),
        dataIndex: "index",
        render: (_, record, index) => (page - 1) * pageSize + index + 1,
        width: "50px",
        ellipsis: true,
        align: "center",
      },
      {
        title: t("Name"),
        dataIndex: "name",
        render: (name, file) => {
          return (
            <div className="file-info-mobile">
              <ViewerLink
                className="d-flex align-items-center flex-nowrap mb-1"
                file={file}
                canOpen={file.canOpen}
              >
                {getFileIcon(file.name)}

                <Text
                  className="text-reset text-truncate"
                  ellipsis={{ tooltip: true }}
                  style={{ maxWidth: "200px" }}
                >
                  {name}
                </Text>
              </ViewerLink>
              {/* <div className="mobile-meta-info">
                <span>
                  {bytes.format(file.size, {
                    decimalPlaces: 1,
                    unitSeparator: " ",
                  })}
                </span>
                <span>
                  {lang === "en"
                    ? file.categoryNameEN
                    : lang === "vi"
                      ? file.categoryNameVI
                      : file.categoryNameJA}
                </span>
              </div> */}
              {/* <div className="mobile-meta-info">
                <span>{file.fullName}</span>
              </div> */}
            </div>
          );
        },
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
        // responsive: ["lg"],
      },
      {
        title: t("Updated By"),
        dataIndex: "fullName",
        render: (fullName) => {
          return (
            <div className="d-flex align-items-center flex-nowrap">
              <Avatar
                style={{ minWidth: 24 }}
                size={24}
                icon={<UserOutlined />}
              ></Avatar>
              <Text className="text-reset ml-2" ellipsis={true}>
                {fullName}
              </Text>
            </div>
          );
        },
        width: "15%",
        ellipsis: true,
        // responsive: ["md"],
      },
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
                      <ViewerLink
                        className="text-reset"
                        file={file}
                        canOpen={file.canOpen}
                      >
                        {t("View detail")}
                      </ViewerLink>
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
                  if (key === "download") this.downloadSource(file);
                  if (key === "versions")
                    this.setState({
                      selectedFile: file,
                      fileVersionsModal: true,
                    });
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

    const columns = isMobile
      ? getMobileColumns()
      : [
          {
            title: t("#"),
            dataIndex: "index",
            render: (_, record, index) => (page - 1) * pageSize + index + 1,
            width: "50px",
            ellipsis: true,
            align: "center",
          },
          {
            title: t("Name"),
            dataIndex: "name",
            render: (name, file) => {
              const opacity = 1.0;
              return (
                <div style={{ display: "flex" }}>
                  {/* <Tooltip title={t("Preview")}>
                    <div
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        this.setState({
                          visibleModal: true,
                          previewId: file.id,
                        });
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
                    className="d-flex align-items-center flex-nowrap mb-2"
                    file={file}
                    canOpen={file.canOpen}
                  >
                    <Text
                      className="text-reset mr-2 text-truncate"
                      ellipsis={{ tooltip: true }}
                      style={{ maxWidth: "400px" }}
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
            render: (category, file) =>
              lang === "en"
                ? file.categoryNameEN
                : lang === "vi"
                  ? file.categoryNameVI
                  : file.categoryNameJA,
            width: "12%",
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
            align: "left",
            responsive: ["lg"],
          },
          // {
          //   title: t("Last Updated"),
          //   dataIndex: "updatedAt",
          //   render: (updatedAt) =>
          //     moment(updatedAt).format(t("DD-MM-YYYY HH:mm:ss")),
          //   width: "15%",
          //   ellipsis: true,
          //   responsive: ["md"],
          // },
          {
            title: t("Updated By"),
            dataIndex: "fullName",
            render: (fullName) => {
              return (
                <div className="d-flex align-items-center flex-nowrap">
                  <Avatar
                    size={22}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#1890ff" }}
                  />

                  <Text className="text-reset ml-2" ellipsis={true}>
                    {fullName}
                  </Text>
                </div>
              );
            },
            width: "15%",
            ellipsis: true,
            responsive: ["md"],
          },
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
                          <ViewerLink
                            className="text-reset"
                            file={file}
                            canOpen={file.canOpen}
                          >
                            {t("View detail")}
                          </ViewerLink>
                        ),
                        icon: <DesktopOutlined className="menu-icon" />,
                      },
                      {
                        key: "download",
                        label: t("Download source file"),
                        icon: <DownloadOutlined className="menu-icon" />,
                      },
                      // {
                      //   key: 'versions',
                      //   label: t('Manage versions'),
                      //   icon: <HistoryOutlined className="menu-icon" />,
                      // },
                      // {
                      //   type: 'divider',
                      // },
                      // {
                      //   key: "delete",
                      //   label: t("Delete file"),
                      //   icon: <DeleteOutlined className="menu-icon" />,
                      //   danger: true,
                      // },
                    ],
                    onClick: ({ key }) => {
                      if (key === "download") this.downloadSource(file);
                      if (key === "versions")
                        this.setState({
                          selectedFile: file,
                          fileVersionsModal: true,
                        });
                      // if (key === "delete") {
                      //   Modal.confirm({
                      //     title: t("Delete the file?"),
                      //     icon: <ExclamationCircleOutlined />,
                      //     okText: t("Yes"),
                      //     okType: "danger",
                      //     cancelText: t("No"),
                      //     cancelButtonProps: { type: "primary" },
                      //     onOk: () => this.deleteFile(file),
                      //   });
                      // }
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
      showSizeChanger: !isMobile,
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

    return (
      <div
        className={`public-families-page ${store.getState().app.isAdminMode ? "admin-pub-families-mode" : ""}`}
      >
        <div className="public-files h-100 d-flex flex-column">
          {/* <PortalHeader title={t("Public Families")} /> */}
          <div className="action-container d-flex justify-content-end">
            <div className="d-flex align-items-center gap-2">
              <Select
                placeholder={t("Filter by category")}
                style={{ width: this.state.isMobile ? "100%" : 150 }}
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
                  width: this.state.isMobile ? "100%" : 250,
                }}
              />
            </div>
            {/* <div> {operations}</div> */}
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
                  columns={columns}
                  rowKey={(row) => row.id}
                  dataSource={files}
                  pagination={pagination}
                  loading={loading}
                  scroll={{
                    x: "max-content",
                    y: !isMobile ? scrollY : "calc(100svh - 320px)",
                  }} // rowSelection={rowSelection}
                  // showSorterTooltip={false}
                  onChange={this.handleTableChange}
                  rowClassName={(_record, index) =>
                    index % 2 === 1 ? "ant-table-striped" : undefined
                  }
                />
              </ConfigProvider>
            </div>
          </div>
          {/* <FileUploadModal
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
                /> */}
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

export default compose(withTranslation(), withEnhancers)(PublicFamilies);
