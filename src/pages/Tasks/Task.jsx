import React, { useState, useEffect } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import {
  Button,
  notification,
  Table,
  Select,
  Badge,
  Dropdown,
  ConfigProvider,
  Empty,
  Avatar,
  Typography,
} from "antd";
import {
  DesktopOutlined,
  DownloadOutlined,
  MoreOutlined,
  StarFilled,
  UserOutlined,
} from "@ant-design/icons";
import i18next from "i18next";
import axiosInstance from "@/plugins/axios";
import { feedbackStatus, priorityStatus } from "@/models/feedback";
import "./Tasks.css";
import PortalHeader from "@/components/PortalHeader";
import { handleDownloadFile } from "@/utils/functions";
import { withTranslation } from "react-i18next";
import { CURRENT_PAGE } from "@/constants";
import { TaskItemSM } from "./TaskItemSM";
import StatusBadge from "@/components/StatusBadge";
import useScreen from "@/hooks/useScreen";
import classNames from "classnames";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const t = i18next.t;
const { Text } = Typography;

const Tasks = () => {
  const [viewStyle, setViewStyle] = useState("table");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    sessionStorage.getItem(CURRENT_PAGE) || 1,
  );
  const [perPage, setPerPage] = useState(10);
  const [status, setStatus] = useState("");
  const [isDownload, setIsDownload] = useState(null);
  const [scrollY, setScrollY] = useState("calc(100svh - 310px)");
  const { isMobile } = useScreen();

  const getAllFeedbacks = async (
    page = currentPage,
    pageSize = perPage,
    currentStatus = status,
  ) => {
    setLoading(true);
    setError("");
    setStatus(currentStatus);

    try {
      const response = await axiosInstance.get(
        `/portal/feedbacks-by-assignee?status=${currentStatus}`,
      );

      if (response) {
        setData(response.data.result);
        setTotal(response.data.total);
        setCurrentPage(page);
        setPerPage(pageSize);
      }
    } catch (e) {
      setError(e.data.message);
      notification.error({
        message: t("Error"),
        description: t(e.data.message),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllFeedbacks();
  }, []);

  const handleTableChange = async (pagination) => {
    sessionStorage.setItem(CURRENT_PAGE, pagination.current);
    await getAllFeedbacks(pagination.current, pagination.pageSize);
  };

  const handleDownFile = async (item, index) => {
    setIsDownload(index);
    try {
      const response = await axiosInstance.get(
        `/feedback/download/${item.id}`,
        {
          responseType: "blob",
        },
      );

      if (response) {
        handleDownloadFile(response.data, item.attachUrl.split("/").pop());
        createEventToTrackingSession({
          event: "download_task_attachment",
          meta: createTeraTrackingPageMeta("tasks", {
            action: "download_attachment",
            productName: item.productName,
            status: item.status,
            priority: item.priority,
          }),
        });
        notification.success({
          message: t("Success"),
          description: t("File download complete"),
        });
      }
    } catch (e) {
      notification.error({
        message: t("Error"),
        description: t(e.data.message),
      });
    } finally {
      setIsDownload(null);
    }
  };

  const onSearch = async (newStatus = "") => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    await getAllFeedbacks(1, perPage, newStatus);
  };

  const columns = [
    ...(!isMobile
      ? [
          {
            title: t("#"),
            dataIndex: "index",
            render: (_, record, index) =>
              (currentPage - 1) * perPage + index + 1,
            width: "50px",
            fixed: "left",
            align: "center",

            ellipsis: true,
          },
          {
            title: t("Product"),
            dataIndex: "productName",
            render: (productName, record) =>
              window.innerWidth < 480 ? (
                <Link to={`/tasks/${record.id}`}>
                  <span>
                    <span style={{ display: "inline" }}>{productName}</span>
                    {record.isReadManage === 1 ? (
                      ""
                    ) : (
                      <Badge className="new-badge" count="Mới" />
                    )}
                  </span>
                </Link>
              ) : (
                <span>
                  <span style={{ display: "inline" }}>{productName}</span>
                  {record.isReadManage === 1 ? (
                    ""
                  ) : (
                    <Badge className="new-badge" count="Mới" />
                  )}
                </span>
              ),
            width: "150px",
            fixed: "left",
            ellipsis: true,
            align: "left",
          },
          {
            title: t("Content"),
            dataIndex: "content",
            render: (content, record) => (
              <div className="w-100 text-left">
                {content ? (
                  <Link to={`/tasks/${record.id}`}>{content}</Link>
                ) : (
                  "--/--"
                )}
              </div>
            ),
            width: "200px",
            ellipsis: true,
          },
          {
            title: t("Author"),
            dataIndex: "email",
            width: "200px",
            ellipsis: true,
            align: "left",
            render: (author) => (
              <div className="d-flex align-items-center">
                <Avatar
                  size={22}
                  icon={<UserOutlined />}
                  className="mr-2"
                  style={{ backgroundColor: "#1890ff" }}
                />
                <Text ellipsis>{author}</Text>
              </div>
            ),
          },
          {
            title: t("Version"),
            dataIndex: "versionNumber",
            render: (versionNumber) =>
              versionNumber ? versionNumber : "--/--",
            width: "100px",
            ellipsis: true,
          },
          {
            title: t("Priority"),
            dataIndex: "priority",
            render: (priority) =>
              priority ? (
                <Badge
                  className="status-column"
                  key={status}
                  color={
                    priorityStatus.filter((item) => item?.value === priority)[0]
                      ?.color
                  }
                  text={t(
                    priorityStatus.filter((item) => item?.value === priority)[0]
                      ?.label,
                  )}
                />
              ) : (
                "--/--"
              ),
            width: "90px",
            ellipsis: true,
          },
          {
            title: t("Status"),
            dataIndex: "status",
            render: (status) => (
              <StatusBadge condition={status} statusList={feedbackStatus} />
            ),
            width: "150px",
            ellipsis: true,
          },
          {
            title: t("Rate"),
            dataIndex: "rate",
            render: (rate) => (
              <span className="rating-cell">
                {rate === 5 ? rate : rate + 1}
                <StarFilled className="rating-icon" />
              </span>
            ),
            width: "80px",
            align: "center",
            ellipsis: true,
          },
          {
            title: t("Attachment"),
            dataIndex: "attachUrl",
            render: (attachUrl, record, index) =>
              attachUrl ? (
                <Button
                  shape="round"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownFile(record, index)}
                  loading={isDownload === index}
                >
                  File
                </Button>
              ) : (
                ""
              ),
            width: "150px",
            ellipsis: true,
          },
          {
            title: t("Date sent"),
            dataIndex: "createAt",
            render: (createAt) => moment(createAt).format(t("DD/MM/YYYY")),
            width: "80px",
            ellipsis: true,
          },
        ]
      : [
          {
            title: t("Tasks"),
            dataIndex: "smElement",
            key: "smElement",
            render: (_value, record, index) => {
              return (
                <TaskItemSM
                  data={record}
                  currentPage={currentPage}
                  perPage={perPage}
                  index={index}
                />
              );
            },
          },
        ]),
    {
      title: "",
      key: "actions",
      render: (_, record, index) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "open",
                  label: (
                    <Link to={`/tasks/${record.id}`}>
                      <span>{t("View detail")}</span>
                    </Link>
                  ),
                  icon: <DesktopOutlined className="menu-icon" />,
                },
                ...(!isMobile
                  ? []
                  : [
                      {
                        key: "download",
                        label: (
                          <span onClick={() => handleDownFile(record, index)}>
                            {t("Download File Attachment")}
                          </span>
                        ),
                        icon: <DownloadOutlined className="menu-icon" />,
                      },
                    ]),
              ],
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

  const filtered = status.length > 0;
  const emptyText = error
    ? t("Error loading data")
    : loading
      ? " "
      : filtered
        ? t("No matching data")
        : t("No data");

  const feedbackStatusWithLabels = feedbackStatus.map((item) => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <div className="my-tasks-page task-table-wrapper">
      {/* <PortalHeader title={t("Tasks")} /> */}
      <div className="action-container d-flex justify-content-end pb-3 ">
        <div className="action-filter">
          <Select
            placeholder={t("Filter by status")}
            style={{ width: 250 }}
            allowClear
            options={feedbackStatusWithLabels}
            onChange={onSearch}
          />
        </div>
      </div>
      <div className="main-table align-self-stretch table-content-wrapper">
        <div className={classNames("table-container")}>
          <ConfigProvider renderEmpty={() => <Empty description={emptyText} />}>
            <Table
              size="middle"
              columns={columns}
              rowKey="id"
              dataSource={data}
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: perPage,
                total,
                showSizeChanger: true,
                responsive: true,
                size: "small",
              }}
              bordered={isMobile ? false : true}
              rowClassName={(_record, index) =>
                index % 2 === 1 ? "ant-table-striped" : undefined
              }
              onChange={handleTableChange}
              locale={emptyText}
              scroll={{
                x: "max-content",
                y: !isMobile ? scrollY : "calc(100svh - 320px)",
              }}
            />
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};

export default withTranslation()(Tasks);
