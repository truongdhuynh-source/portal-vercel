///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2021, Open Design Alliance (the "Alliance").
// All rights reserved.
//
// This software and its documentation and related materials are owned by
// the Alliance. The software may only be incorporated into application
// programs owned by members of the Alliance, subject to a signed
// Membership Agreement and Supplemental Software License Agreement with the
// Alliance. The structure and organization of this software are the valuable
// trade secrets of the Alliance and its suppliers. The software is also
// protected by copyright law and international treaty provisions. Application
// programs incorporating this software must include the following statement
// with their copyright notices:
//
//   This application incorporates Open Design Alliance software pursuant to a
//   license agreement with Open Design Alliance.
//   Open Design Alliance Copyright (C) 2002-2021 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useState, useEffect, useContext } from "react";
import { Buffer } from "buffer";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import { Button, Divider, Dropdown, Empty, notification, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  CloseCircleTwoTone,
  DownloadOutlined,
  DownOutlined,
  QuestionCircleTwoTone,
  StopTwoTone,
  WarningTwoTone,
} from "@ant-design/icons";

import { NameFilter } from "@/components";
import { AppContext } from "@/AppContext";
import { ValidationReportSaver } from "./ValidationReportSaver";
import { t } from "i18next";
import { Window } from "@/oda-sdk/viewer/components";

const { Text } = Typography;

const LogicalResults = {
  Error: { Icon: CloseCircleTwoTone, color: "#ff4d4f" },
  UnSet: { Icon: WarningTwoTone, color: "#faad14" },
  Unknown: { Icon: QuestionCircleTwoTone, color: "#faad14" },
  "Unknown logical": { Icon: StopTwoTone, color: "silver" },
};

function ErrorIcon({ logical, ...rest }) {
  const { Icon, color } = LogicalResults[logical] || {};
  return Icon ? <Icon twoToneColor={color} {...rest} /> : null;
}

function FilterButton({ logical, filter, counters, onClick, ...rest }) {
  return (
    <Tooltip title={t(logical)}>
      <Button
        type={filter.includes(logical) ? "primary" : undefined}
        icon={<ErrorIcon logical={logical} />}
        onClick={() => onClick(logical)}
        {...rest}
      >
        {(counters[logical] || 0) + ""}
      </Button>
    </Tooltip>
  );
}

export function ValidateWindow({ file, activeVersion, visible, onClose }) {
  const { app } = useContext(AppContext);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [reportStatus, setReportStatus] = useState("");
  const [counters, setCounters] = useState({});
  const [logicalFilter, setLogicalFilter] = useState(Object.keys(LogicalResults));
  const [filters, setFilters] = useState({});
  const [filteredReport, setFilteredReport] = useState([]);

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();
    setLoading(true);
    file
      ?.waitForDone("validation", true, { signal: controller.signal })
      .then((file) => {
        setReportStatus(file.status.validation.state);
        if (file.status.validation.state === "done") {
          return file
            .downloadResource("validation_report.json")
            .then((arrayBuffer) => JSON.parse(Buffer.from(arrayBuffer).toString()))
            .then((report) => report.map((x, index) => ({ index, ...x })))
            .then((report) => setReport(report));
        }
        return [];
      })
      .then(() => setLoading(false))
      .catch((e) => {
        if (e.name !== "AbortError") {
          setLoading(false);
          setReportStatus("error");
          console.error("Cannot load validation report.", e);
          notification.error({ message: "Error", description: "Cannot load validation report" });
        }
      });
    return function cleanup() {
      controller.abort();
    };
  }, [file, activeVersion, visible, reload]);

  useEffect(() => {
    setCounters(
      report.reduce((counters, x) => {
        counters[x.logical] = (counters[x.logical] || 0) + 1;
        return counters;
      }, {})
    );
  }, [report]);

  useEffect(() => {
    const filteredReport = report
      .filter((x) => logicalFilter.includes(x.logical))
      .filter(
        (x) =>
          !filters.error ||
          x.handle?.includes(filters.error) ||
          x.type?.includes(filters.error) ||
          x.originalLabel?.includes(filters.error) ||
          x.originalName?.includes(filters.error) ||
          x.description?.includes(filters.error)
      );
    setFilteredReport(filteredReport);
  }, [report, logicalFilter, filters]);

  const handleValidate = () => {
    setReportStatus("waiting");
    file
      .validate()
      .then(() => setReload(reload + 1))
      .catch((e) => {
        setReportStatus("failed");
        console.error("Cannot validate file.", e);
        notification.error({ message: "Error", description: "Cannot validate file" });
      });
  };

  const handleFilter = (logical) => {
    if (logicalFilter.includes(logical)) setLogicalFilter(logicalFilter.filter((x) => x !== logical));
    else setLogicalFilter(logicalFilter.concat([logical]));
  };

  const handleDownload = (format) => {
    try {
      const text = new ValidationReportSaver(file, report).saveAs(format);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const fileName = file.name.replace(".", "_") + "_validation_report." + format;
      FileSaver.saveAs(blob, sanitize(fileName));
    } catch (e) {
      console.error("Cannot download report.", e);
      notification.error({ message: "Error", description: "Cannot download report" });
    }
  };

  const columns = [
    {
      title: `${filteredReport.length} errors`,
      dataIndex: "error",
      key: "error",
      render: (_, row) => {
        return (
          <div className="d-flex">
            <div className="mr-3">
              <ErrorIcon className="large-icon" logical={row.logical} />
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1">
                <Text className="mr-2">#{row.handle}</Text>
                <Tag color="blue">{row.type}</Tag>
                {row.originalName && <Tag color="green">{row.originalName}</Tag>}
                {row.originalLabel && <Tag color="gold">{row.originalLabel}</Tag>}
              </h6>
              <div>
                <Text>{row.description}</Text>
                <div className="small">{row.textMessage}</div>
              </div>
            </div>
          </div>
        );
      },
      ...NameFilter("Filter by Handle or Description"),
    },
  ];

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total: filteredReport.length,
  };

  const statusText = {
    none: t("The validation has not yet been made."),
    waiting: t("Starting validation. Please wait..."),
    inprogress: t("Validation in progress. Please wait..."),
    failed: t("Validation failed. No validation report generated."),
  };

  const emptyText = loading
    ? t("Loading validation report. Please wait...")
    : reportStatus === "error"
      ? t("Error loading validation report")
      : reportStatus !== "done"
        ? statusText[reportStatus]
        : logicalFilter.length !== LogicalResults.length
          ? t("No errors matching the filter")
          : t("No errors found during the validation");

  const empty = (
    <Empty description={emptyText}>
      {reportStatus === "error" && (
        <Button type="primary" onClick={() => setReload(reload + 1)}>
          Reload
        </Button>
      )}
      {["none", "waiting", "failed"].includes(reportStatus) && file.owner.userId === app.user.id && (
        <Button type="primary" onClick={handleValidate} loading={reportStatus === "waiting"}>
          {t("Validate")}
        </Button>
      )}
    </Empty>
  );

  return (
    <Window
      title={t("Validation")}
      style={{
        left: "calc(50% - 290px)",
        width: "580px",
        minWidth: "500px",
      }}
      visible={visible}
      onClose={onClose}
    >
      <div className="h-100 d-flex flex-column">
        <Space className="mt-1">
          <span>{t("Quick Filter:")}</span>
          <Space.Compact>
            {Object.keys(LogicalResults).map((x) => (
              <FilterButton key={x} logical={x} filter={logicalFilter} counters={counters} onClick={handleFilter} />
            ))}
          </Space.Compact>
          <Dropdown
            trigger={["click"]}
            disabled={reportStatus !== "done" || loading}
            menu={{
              items: [
                {
                  key: "formats",
                  type: "group",
                  label: "Download report",
                  children: [
                    { key: "html", label: "HTML" },
                    { key: "txt", label: "Text" },
                    { key: "csv", label: "CSV" },
                    { key: "json", label: "JSON" },
                  ],
                },
              ],
              onClick: (item) => handleDownload(item.key),
            }}
          >
            <Button>
              <Space>
                <DownloadOutlined />
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Space>

        <Divider className="my-2" />

        <div className="flex-grow-1 overflow-auto">
          <Table
            columns={columns}
            rowKey={(row) => row.index}
            dataSource={filteredReport}
            pagination={pagination}
            loading={loading}
            bordered={false}
            showHeader={reportStatus === "done"}
            locale={{ emptyText: empty }}
            onChange={(pagination, filters, sorter) => setFilters(filters)}
          />
        </div>
      </div>
    </Window>
  );
}
