import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Button, notification, Table, Select, Dropdown } from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  StarFilled,
  DesktopOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import axiosInstance from "@/plugins/axios";
import FeedbackModal from "./FeedbackModal";
import { feedbackStatus } from "@/models/feedback";
import "./Feedbacks.css";
import PortalHeader from "@/components/PortalHeader";
import { formatDate, handleDownloadFile } from "@/utils/functions";
import StatusBadge from "@/components/StatusBadge";
import { CURRENT_PAGE, DEFAULT_PAGE_LIMIT } from "@/constants";
import { FeedbackItemSM } from "./FeedbackItemSM";
import useScreen from "@/hooks/useScreen";
import classNames from "classnames";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const Feedbacks = () => {
  const { t } = useTranslation();
  const { isMobile } = useScreen();

  // Split state into individual hooks
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    sessionStorage.getItem(CURRENT_PAGE) || 1,
  );
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_LIMIT);
  const [status, setStatus] = useState("");
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [isDownload, setIsDownload] = useState(null);
  const [scrollY, setScrollY] = useState("calc(100svh - 300px)");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const version = searchParams.get("version");

    if (version) {
      localStorage.setItem("appVersion", version);
      setFeedbackModal(true);
    }
  }, [searchParams]);

  const getAllFeedbacks = async (page, size, statusFilter) => {
    page = page || currentPage;
    size = size || perPage;
    statusFilter = statusFilter ?? status;

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(
        `/portal/get-all-feedbacks?currentPage=${page}&perPage=${size}&status=${statusFilter}`,
      );

      if (response) {
        setData(response.data.result);
        setTotal(response.data.total);
        setCurrentPage(page);
        setPerPage(size);
        setStatus(statusFilter);
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

  const handleTableChange = async (pagination) => {
    sessionStorage.setItem(CURRENT_PAGE, pagination.current);
    const tableWrapper = document.querySelector(".table-content-wrapper");
    if (tableWrapper) {
      tableWrapper.scrollTop = 0;
    }
    await getAllFeedbacks(pagination.current, pagination.pageSize);
  };

  const handleDownFile = async (item, index) => {
    setIsDownload(index);
    try {
      console.log(item);

      const response = await axiosInstance.get(
        `/feedback/download/${item.id}`,
        {
          responseType: "blob",
        },
      );

      if (response) {
        handleDownloadFile(response.data, item.attachUrl.split("/").pop());
        createEventToTrackingSession({
          event: "download_feedback_attachment",
          meta: createTeraTrackingPageMeta("feedbacks", {
            action: "download_attachment",
            productName: item.productName,
            status: item.status,
            fileId: item.id,
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

  const onSearch = async (statusFilter = "") => {
    setCurrentPage(1);
    await getAllFeedbacks(1, perPage, statusFilter);
  };

  useEffect(() => {
    getAllFeedbacks();
  }, []);

  const columns = [
    ...(!isMobile
      ? [
        {
          title: t("#"),
          dataIndex: "index",
          render: (_, record, index) =>
            (currentPage - 1) * perPage + index + 1,
          width: 60,
          align: "center",
          fixed: "left",
        },
        {
          title: t("Product"),
          dataIndex: "productName",
          render: (productName, record) => (
            <Link to={`/feedbacks/${record.id}`}>
              <span className="product-name-cell">
                {productName}
                {record.isReadUser !== 1 && <span className="unread-dot" />}
              </span>
            </Link>
          ),
          width: isMobile ? 150 : 200,
          fixed: "left",
          align: "left",
        },
        {
          title: t("Content"),
          dataIndex: "content",
          width: 250,
          render: (content) => (
            <div className=" w-100 text-left">{content}</div>
          ),
        },
        {
          title: t("Version"),
          dataIndex: "versionNumber",
          width: 120,
        },
        {
          title: t("Status"),
          dataIndex: "status",
          render: (status) => (
            <StatusBadge condition={status} statusList={feedbackStatus} />
          ),
          width: "150px",
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
          width: 80,
          align: "center",
        },
        {
          title: t("Attachment"),
          dataIndex: "attachUrl",
          render: (attachUrl, record, index) =>
            attachUrl ? (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownFile(record, index)}
                loading={isDownload === index}
              >
                File
              </Button>
            ) : null,
          width: "120px",
        },
        {
          title: t("Date sent"),
          dataIndex: "createAt",
          render: formatDate,
          width: isMobile ? 120 : 150,
          fixed: isMobile ? "right" : undefined,
        },
      ]
      : [
        {
          title: t("Feedback"),
          dataIndex: "smElement",
          key: "smElement",
          render: (_value, record, index) => {
            return (
              <FeedbackItemSM
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
      render: (_, record) => {
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: "open",
                  label: (
                    <Link to={`/feedbacks/${record.id}`}>
                      <span>{t("View detail")}</span>
                    </Link>
                  ),
                  icon: <DesktopOutlined className="menu-icon" />,
                },
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
    <div className="feedback-table-wrapper">
      {/* <PortalHeader title={t("Feedbacks")} /> */}
      <div className="action-container d-flex justify-content-between pb-3 ">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={loading || error}
          onClick={() => setFeedbackModal(true)}
        >
          {t("Create feedback")}
        </Button>
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
      <div className="main-table table-content-wrapper">
        <div
          className={classNames("table-container", {
            "is-table-empty": data.length === 0,
          })}
        >
          <Table
            size="middle"
            columns={columns}
            rowKey={(row) => row.id}
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
            onChange={handleTableChange}
            locale={emptyText}
            scroll={{
              x: "max-content",
              y: !isMobile ? scrollY : "calc(100svh - 330px)",
            }}
            bordered={isMobile ? false : true}
            rowClassName={(_record, index) =>
              index % 2 === 1 ? "ant-table-striped" : undefined
            }
          />
        </div>
      </div>
      <FeedbackModal
        visible={feedbackModal}
        onSubmit={() => {
          setFeedbackModal(false);
          getAllFeedbacks();
        }}
        onClose={() => setFeedbackModal(false)}
      />
    </div>
  );
};

export default Feedbacks;
