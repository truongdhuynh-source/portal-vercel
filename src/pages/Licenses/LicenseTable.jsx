import React, { useState, useEffect } from "react";
import {
  ConfigProvider,
  Empty,
  notification,
  Table,
  Select,
  Input,
  Dropdown,
  Button,
} from "antd";
import { CURRENT_PAGE, DEFAULT_PAGE_LIMIT, USER_VINA } from "@/constants";
import i18next from "i18next";
import axiosInstance from "@/plugins/axios";
import { licenseType } from "@/models/license";
import "./LicenseTable.css";
import LicenseDetail from "./LicenseDetail";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/utils/functions";
import { withTranslation } from "react-i18next";
import { LicenseItemSM } from "./LicenseItemSM";
import { DesktopOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import PortalHeader from "@/components/PortalHeader";
import getUserIdLogin from "@/utils/getUserIdLogin";
import useScreen from "@/hooks/useScreen";
import classNames from "classnames";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const t = i18next.t;
const { Search } = Input;

const LicenseTable = () => {
  const [viewStyle, setViewStyle] = useState("table");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    sessionStorage.getItem(CURRENT_PAGE) || 1,
  );
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_LIMIT);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [detailModal, setDetailModal] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [scrollY, setScrollY] = useState("calc(100svh - 310px)");
  const { isMobile } = useScreen();

  const user_vina_id = getUserIdLogin();
  const userObj = localStorage.getItem(`${USER_VINA}_${user_vina_id}`) || "{}";
  const user = JSON.parse(userObj);

  const getAllLicenses = async (
    page = currentPage,
    size = perPage,
    searchFilter = filter,
    searchStatus = status,
  ) => {
    setLoading(true);
    setError("");
    setFilter(searchFilter);
    setStatus(searchStatus);

    try {
      const response = await axiosInstance.get(
        `/portal/get-all-licenses?currentPage=${page}&perPage=${size}&filter=${searchFilter}&status=${searchStatus}`,
      );

      if (response) {
        setData(response.data.result);
        setTotal(response.data.total);
        setCurrentPage(page);
        setPerPage(size);
      }
    } catch (e) {
      setError(e.message);
      notification.error({
        message: t("Error"),
        description: t(e.message),
      });
    }
    setLoading(false);
  };

  const handleTableChange = async (pagination) => {
    sessionStorage.setItem(CURRENT_PAGE, pagination.current);
    const tableWrapper = document.querySelector(".table-content-wrapper");
    if (tableWrapper) {
      tableWrapper.scrollTop = 0;
    }
    await getAllLicenses(pagination.current, pagination.pageSize);
  };

  const onSearch = async (searchFilter = "", searchStatus = "") => {
    setCurrentPage(1);
    setFilter(searchFilter);
    setStatus(searchStatus);
    await getAllLicenses(1, perPage, searchFilter, searchStatus);
  };

  useEffect(() => {
    getAllLicenses();
  }, []);

  // const openPricingLicense = (type) => {
  //   window.open(
  //     `${import.meta.env.VITE_LICENSE_URL}/${type}?email=${user?.email ? user?.email.toLowerCase() : ""}&name=${user?.fullName ? user?.fullName : ""}&phoneNumber=${user?.phoneNumber ? user.phoneNumber : ""}&address=${user?.address ? user?.address : ""}`,
  //     "_blank",
  //   );
  // };

  const vinacadPricingLinks = {
    vi: `${import.meta.env.VITE_LICENSE_URL}/vinacad`,
    en: `https://tera-lms.tgl-cloud.com/en/pricing/VINACAD?timeType=days&configType=free&targetMarket=en`,
    ja: `https://tera-lms.tgl-cloud.com/ja/pricing/VINACA?timeType=month&configType=free&targetMarket=ja`,
  };

  const openPricingLicense = (type) => {
    const params = `email=${user?.email ? user?.email.toLowerCase() : ""}&name=${user?.fullName ? user?.fullName : ""}&phoneNumber=${user?.phoneNumber ? user.phoneNumber : ""}&address=${user?.address ? user?.address : ""}`;
    createEventToTrackingSession({
      event: "open_license_pricing",
      meta: createTeraTrackingPageMeta("licenses", {
        action: "open_pricing",
        product: type,
      }),
    });

    if (type === "vinacad") {
      const lang = i18next.language || "vi";
      const url = vinacadPricingLinks[lang] || vinacadPricingLinks.vi;
      if (lang === "vi") {
        window.open(`${url}?${params}`, "_blank");
      } else {
        window.open(url, "_blank");
      }
    } else {
      window.open(
        `${import.meta.env.VITE_LICENSE_URL}/${type}?${params}`,
        "_blank",
      );
    }
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
            ellipsis: true,
            align: "center",
            responsive: ["md"],
          },
          {
            title: t("Product"),
            dataIndex: "productName",
            render: (productName, record) =>
              productName ? productName : "--/--",
            width: "130px",
            ellipsis: true,
          },
          {
            title: t("License"),
            dataIndex: "displayName",
            render: (displayName, record) => (
              <div
                onClick={() => {
                  setDetailModal(true);
                  setDataDetail(record);
                }}
                className="w-100 text-left"
                style={{ color: "#1890ff", cursor: "pointer" }}
              >
                {displayName ? displayName : "--/--"}
              </div>
            ),
            width: "130px",
            ellipsis: true,
            align: "center",
          },
          {
            title: t("License status"),
            dataIndex: "status",
            render: (status) => (
              <StatusBadge
                condition={status ? "ACTIVE" : "EXPIRED"}
                statusList={licenseType}
              />
            ),

            width: "110px",
            ellipsis: true,
          },
          {
            title: t("Start date"),
            dataIndex: "validFrom",
            render: (validFrom) => formatDate(validFrom),
            width: "125px",
            ellipsis: true,
            responsive: ["lg"],
          },
          {
            title: t("End date"),
            dataIndex: "validTo",
            render: (validTo) => formatDate(validTo),
            width: "125px",
            fixed: "right",
            ellipsis: true,
            responsive: ["lg"],
          },
        ]
      : [
          {
            title: t("License"),
            dataIndex: "smElement",
            key: "smElement",
            render: (_value, record, index) => {
              return (
                <LicenseItemSM
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
                    <span
                      onClick={() => {
                        setDetailModal(true);
                        setDataDetail(record);
                      }}
                    >
                      {t("View detail")}
                    </span>
                  ),
                  icon: (
                    <DesktopOutlined
                      className="menu-icon"
                      onClick={() => {
                        setDetailModal(true);
                        setDataDetail(record);
                      }}
                    />
                  ),
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

  const filtered = filter.length > 0 || status.length > 0;
  const emptyText = error
    ? t("Error loading data")
    : loading
      ? " "
      : filtered
        ? t("No matching data")
        : t("No data");

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total,
    current: currentPage,
    pageSize: perPage,
    size: "small",
  };

  const licenseTypeWithLabels = licenseType.map((item) => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <div className="license-table-wrapper">
      {/* <PortalHeader title={t("My license")} /> */}
      <div className="action-container d-flex justify-content-between  pb-3">
        <div>
          <Button
            key="license"
            type="primary"
            icon={<PlusOutlined />}
            disabled={loading || error}
            onClick={() => openPricingLicense("vinacad")}
          >
            {t("Buy VinaCAD")}
          </Button>
          <Button
            key="license"
            type="primary"
            className="ml-2"
            icon={<PlusOutlined />}
            disabled={loading || error}
            onClick={() => openPricingLicense("takacad")}
          >
            {t("Buy TakaCAD")}
          </Button>
        </div>
        <div className="action-filter">
          <Select
            placeholder={t("Filter by status")}
            style={{ width: 250 }}
            allowClear
            options={licenseTypeWithLabels}
            onChange={(value) => onSearch(filter, value)}
          />
          <Search
            placeholder={t("Filter by product")}
            allowClear
            onSearch={(value) => onSearch(value, status)}
            style={{ width: 250, marginLeft: "10px" }}
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
            scroll={{
              x: "max-content",
              y: !isMobile ? scrollY : "calc(100svh - 385px)",
            }}
            dataSource={data}
            pagination={pagination}
            loading={loading}
            showSorterTooltip={false}
            onChange={handleTableChange}
            onRow={(record) => ({
              onDoubleClick: () => {
                setDetailModal(true);
                setDataDetail(record);
              },
            })}
            locale={emptyText}
            bordered={isMobile ? false : true}
            rowClassName={(_record, index) =>
              index % 2 === 1 ? "ant-table-striped" : undefined
            }
          />
        </div>
      </div>
      <LicenseDetail
        visible={detailModal}
        dataDetail={dataDetail}
        onClose={() => setDetailModal(false)}
      />
    </div>
  );
};

export default withTranslation()(LicenseTable);
