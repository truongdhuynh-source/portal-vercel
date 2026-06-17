import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Modal,
  notification,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import axiosInstance from "@/plugins/axios";
import { formatFullDate, formatUtcFullDate } from "@/utils/functions";
import { useTranslation } from "react-i18next";
import withEnhancers from "@/oda-sdk/hoc/withEnhancers";
import { compose } from "@/utils/compose";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const MyDevices = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [inactivating, setInactivating] = useState(false);
  const [deviceNameFilter, setDeviceNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [appFilter, setAppFilter] = useState(undefined);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/licenses/me/devices");
      setDevices(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      notification.error({
        message: t("Error"),
        description: t(
          e?.data?.message || e?.message || "Failed to load devices",
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const appOptions = useMemo(() => {
    const apps = [...new Set(devices.map((d) => d.appType).filter(Boolean))];
    return apps.sort().map((app) => ({ value: app, label: t(app) }));
  }, [devices, i18n.language]);

  const filteredDevices = useMemo(() => {
    const keyword = deviceNameFilter.trim().toLowerCase();
    return devices.filter((device) => {
      if (keyword) {
        const deviceId = device.deviceId?.toLowerCase() || "";
        const deviceName = device.deviceName?.toLowerCase() || "";
        if (!deviceId.includes(keyword) && !deviceName.includes(keyword)) {
          return false;
        }
      }
      if (statusFilter === "active" && !device.isActive) {
        return false;
      }
      if (statusFilter === "inactive" && device.isActive) {
        return false;
      }
      if (appFilter && device.appType !== appFilter) {
        return false;
      }
      return true;
    });
  }, [devices, deviceNameFilter, statusFilter, appFilter]);

  const onInactive = (record) => {
    Modal.confirm({
      title: t("Deactivate device"),
      content: (
        <div>
          <p>{t("Are you sure you want to deactivate this device?")}</p>
          <div>
            <b>{t("Device name")}:</b> {record.deviceName}
          </div>
          <div>
            <b>{t("Device")}:</b> {record.deviceId}
          </div>
          {record.appType ? (
            <div>
              <b>{t("App")}:</b> {t(record.appType)}
            </div>
          ) : null}
        </div>
      ),
      okText: t("Deactivate"),
      cancelText: t("Cancel"),
      okButtonProps: { danger: true, loading: inactivating },
      onOk: async () => {
        setInactivating(true);
        try {
          await axiosInstance.put(
            `/licenses/me/devices/${record.deviceId}/inactive`,
            { appType: record.appType },
          );
          notification.success({
            message: t("Success"),
            description: t("Device was inactivated"),
          });
          createEventToTrackingSession({
            event: "deactivate_device",
            meta: createTeraTrackingPageMeta("devices", {
              action: "deactivate_device",
              appType: record.appType,
              licenseType: record.type,
            }),
          });
          await fetchDevices();
        } catch (e) {
          notification.error({
            message: t("Error"),
            description: t(
              e?.data?.message || e?.message || "Failed to inactive device",
            ),
          });
        } finally {
          setInactivating(false);
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        title: t("#"),
        dataIndex: "index",
        render: (_, record, index) => index + 1,
        width: "50px",
        ellipsis: true,
        align: "center",
      },
      {
        title: t("Device"),
        dataIndex: "deviceId",
        key: "deviceId",
        ellipsis: true,
        width: 200,
      },
      {
        title: t("Device name"),
        dataIndex: "deviceName",
        key: "deviceName",
        width: 260,
        ellipsis: true,
      },
      {
        title: t("App"),
        dataIndex: "appType",
        key: "appType",
        width: 90,
        render: (v) => t(v) || "--/--",
      },
      {
        title: t("License type"),
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (v) => t(v) || "--/--",
      },
      {
        title: t("Last check"),
        dataIndex: "lastLoginAt",
        key: "lastLoginAt",
        width: 160,
        align: "right",
        render: (v) => (v ? formatUtcFullDate(v) : "--/--"),
      },
      {
        title: t("Status"),
        dataIndex: "isActive",
        key: "isActive",
        align: "center",
        width: 120,
        render: (v) =>
          v ? (
            <Tag color="green">{t("Active")}</Tag>
          ) : (
            <Tag>{t("Inactive")}</Tag>
          ),
      },
      {
        title: t("Action"),
        key: "actions",
        width: 120,
        align: "center",
        render: (_v, record) => {
          if (record.type === "trial") {
            return (
              <Tooltip
                title={t("Trial license device deactivation not supported")}
              >
                <span className="text-muted" style={{ cursor: "help" }}>
                  {t("Not applicable")}
                </span>
              </Tooltip>
            );
          }
          return (
            <Button
              danger
              disabled={!record.isActive}
              loading={inactivating}
              onClick={() => onInactive(record)}
            >
              {t("Deactivate")}
            </Button>
          );
        },
      },
    ],
    [inactivating, i18n.language],
  );

  return (
    <div style={{ padding: 16 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 style={{ margin: 0 }}>{t("My Devices")}</h3>
      </div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Input.Search
          allowClear
          className="input-search"
          placeholder={t("Search device ID or name")}
          style={{ width: 270 }}
          value={deviceNameFilter}
          onChange={(e) => setDeviceNameFilter(e.target.value)}
          onSearch={setDeviceNameFilter}
        />
        <Select
          allowClear
          placeholder={t("Status")}
          style={{ width: 180 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "active", label: t("Active") },
            { value: "inactive", label: t("Inactive") },
          ]}
        />
        <Select
          allowClear
          placeholder={t("App")}
          style={{ width: 180 }}
          value={appFilter}
          onChange={setAppFilter}
          options={appOptions}
        />
      </div>

      <ConfigProvider
        renderEmpty={() => <Empty description={t("No devices found")} />}
      >
        <Table
          size="middle"
          rowKey={(r) => `${r.deviceId}::${r.appType || ""}::${r.type || ""}`}
          columns={columns}
          dataSource={filteredDevices}
          loading={loading}
          pagination={{ pageSize: 100 }}
          bordered={true}
          rowClassName={(_record, index) =>
            index % 2 === 1 ? "ant-table-striped" : undefined
          }
        />
      </ConfigProvider>
    </div>
  );
};

export default compose(withEnhancers)(MyDevices);
