import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Modal,
  Button,
  notification,
  Table,
  Pagination,
  Input,
  Tooltip,
} from "antd";
import "./LicenseDetail.css";
import { useTranslation } from "react-i18next";
import { licenseType } from "@/models/license";
import { formatDate } from "@/utils/functions";
import StatusBadge from "@/components/StatusBadge";
import axiosInstance from "@/plugins/axios";
import AddLicense from "./AddLicense";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

const { confirm } = Modal;

const LicenseDetail = ({ visible, dataDetail, onClose }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState({ pageSize: 5, page: 1, keyWord: "" });
  const [addingUser, setAddingUser] = useState(false);
  const [idAdding, setIdAdding] = useState("");
  const [registeredSlots, setRegisteredSlots] = useState(0);
  const maxSeat = dataDetail?.maxSeat ?? users.length ?? 0;
  const blankLicense = users.filter((x) => !x.issuer);

  useEffect(() => {
    if (dataDetail?.id && visible) {
      getLicenseIssuer();
    }
  }, [visible]);

  const getLicenseIssuer = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/portal/get-license-issuer?licenseId=${dataDetail?.id}&currentPage=${query.page}&perPage=${query.pageSize}&filter=${query.keyWord}`,
      );

      if (response) {
        setUsers(response?.data?.result || []);
        setTotal(response?.data?.total || 0);
        setRegisteredSlots(response?.data?.registeredSlots || 0);
      }
    } catch (e) {
      notification.error({
        message: t("Error"),
        description: t(e.message),
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getLicenseIssuer();
  }, [query]);

  const handlePaginationChange = (page, pageSize) => {
    setQuery((prev) => ({ ...prev, page, pageSize }));
  };

  const handleSearch = (value) => {
    setQuery((prev) => ({ ...prev, keyWord: value, page: 1 }));
  };

  const handleRemoveUser = (id) => {
    confirm({
      title: t("Are you sure you want to remove this user from the license?"),
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          const response = await axiosInstance.delete(
            `/portal/access/${id}/remove-user`,
          );
          console.log(response);

          if (response) {
            notification.success({
              message: t("Success"),
              description: t("Remove user access license successfully"),
            });
          }
          getLicenseIssuer();
        } catch (error) {
          console.error("Error removing user:", error);
          notification.error({
            message: t("Error"),
            description: t("Remove user access license failed"),
          });
        }
      },
      rootClassName: "confirm-modal",
      okText: t("Ok"),
      cancelText: t("Cancel"),
      centered: true,
      destroyOnClose: true,
      okButtonProps: {
        className: "btn-delete",
      },
    });
  };

  const resetState = () => {
    setUsers([]);
    setTotal(0);
    setLoading(false);
    setQuery({ pageSize: 5, page: 1, keyWord: "" });
    setAddingUser(false);
    setIdAdding("");
    setRegisteredSlots(0);
  };

  const handleCloseModal = () => {
    resetState();
    onClose();
  };

  const columns = [
    {
      title: t("#"),
      dataIndex: "index",
      key: "index",
      width: 50,
      align: "center",
      render: (_, record, index) =>
        (query.page - 1) * query.pageSize + index + 1,
    },
    {
      title: t("Email"),
      dataIndex: "issuer",
      key: "email",
      align: "left",
    },
    {
      key: "action",
      align: "center",
      width: 50,
      render: (_, record) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Tooltip title={t("Delete")}>
            <Button
              onClick={() => handleRemoveUser(record.id)}
              danger
              disabled={!record?.userId}
              icon={<DeleteOutlined />}
              size="small"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      title={t("License details")}
      footer={null}
      maskClosable={false}
      onCancel={handleCloseModal}
      width={1000}
      centered
      className="license-modal"
      destroyOnClose
    >
      <div className="license-details-page">
        <div className="license-details-container position-relative">
          <div className="license-main">
            <p className="mb-2">
              <span className="label">{t("License name")}:</span>{" "}
              {dataDetail?.displayName || "--/--"}
            </p>
            <p className="mb-2">
              <span className="label">{t("Product")}: </span>
              {dataDetail?.productName || "--/--"}
            </p>

            <Row gutter={[16, 8]}>
              <Col xs={24} sm={24} md={8}>
                <div className="info-item">
                  <p className="mb-0">
                    <span className="label">{t("Status")}: </span>
                    <StatusBadge
                      condition={dataDetail?.status ? "ACTIVE" : "EXPIRED"}
                      statusList={licenseType}
                    />
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="info-item">
                  <p className="mb-0">
                    <span className="label">{t("Start Date")}: </span>
                    {formatDate(dataDetail?.validFrom)}
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div className="info-item">
                  <p className="mb-0">
                    <span className="label">{t("End Date")}: </span>
                    {formatDate(dataDetail?.validTo)}
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="mt-2 mb-2 d-flex justify-content-between mt-4">
          <div className="license-seat">
            <span className="label">{t("Seats")}</span>
            <span className="value">
              {registeredSlots} / {maxSeat}
            </span>
          </div>

          <div className="license-actions d-flex gap-2">
            <Input.Search
              allowClear
              className="input-search"
              placeholder={t("Search")}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />
            {blankLicense.length > 0 && (
              <Button
                onClick={() => {
                  setAddingUser(true);
                  setIdAdding(blankLicense[0].id);
                }}
                icon={<UserAddOutlined />}
                type="primary"
              >
                {t("Add user to license")}
              </Button>
            )}
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={users.filter((x) => x.issuer)}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="small"
        />

        {total > query.pageSize && total > 0 && (
          <div className="ml-auto mb-3 mt-3">
            <Pagination
              current={query.page}
              total={total}
              pageSize={query.pageSize}
              onChange={handlePaginationChange}
              size="small"
            />
          </div>
        )}

        <AddLicense
          visible={addingUser}
          id={idAdding}
          licenseId={dataDetail?.id}
          close={setAddingUser}
          refresh={getLicenseIssuer}
        />
      </div>
    </Modal>
  );
};

export default LicenseDetail;
