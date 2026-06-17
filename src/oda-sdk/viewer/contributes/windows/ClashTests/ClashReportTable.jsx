///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2023, Open Design Alliance (the "Alliance").
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

import { useState, useEffect } from "react";
import { Button, Empty, notification, Table, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { NameFilter } from "@/components";

const { Text } = Typography;

export function ClashReportTable({ file: assembly, viewer, test, onReportReady }) {
  const [models, setModels] = useState([]);
  const [names, setNames] = useState(new Map());
  const [filters, setFilters] = useState({});
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [reportStatus, setReportStatus] = useState("none");
  const [groupedReport, setGroupedReport] = useState([]);
  const [filteredReport, setFilteredReport] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState(0);
  const [fileteredClashes, setFilteredClashes] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const files = assembly.files.map((fileId) => {
      return assembly.associatedFiles.find((x) => x.fileId === fileId) ?? {};
    });
    const models = (viewer.executeCommand("getModels") ?? []).map((handle, index) => {
      return {
        index,
        handle,
        name: files[index].name ?? index + "",
      };
    });
    setModels(models);
  }, [assembly, viewer]);

  useEffect(() => {
    if (!test) return;

    const controller = new AbortController();
    setLoading(true);
    test
      .waitForDone({ signal: controller.signal })
      .then((test) => {
        setReportStatus(test.status);
        if (test.status === "done") {
          return test.getReport().then((report) => setReport(report));
        }
        return [];
      })
      .then(() => setLoading(false))
      .catch((e) => {
        if (e.name !== "AbortError") {
          setLoading(false);
          setReportStatus("error");
          console.error("Cannot load clash report.", e);
          notification.error({ message: t("Error"), description: t("Cannot load clash report") });
        }
      });
    return function cleanup() {
      controller.abort();
    };
  }, [test, reload, t]);

  useEffect(() => {
    const handles = report
      .map((clash) => [clash.first, clash.second])
      .flat()
      .filter((handle) => names.get(handle) === undefined)
      .slice(0, 100); // <- split requests due to URL length limit
    if (handles.length === 0) return;

    assembly
      .getProperties([...new Set(handles)])
      .then((properties) => (Array.isArray(properties) ? properties : [properties]))
      .then((properties) => {
        properties.forEach((x) => names.set(x.handle, x["Family and Type"] ?? x["Name"] ?? "noname"));
        setNames(new Map(names));
      })
      .catch((e) => {
        console.error("Cannot load properties", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot load properties, clash report may not display correctly"),
        });
      });
  }, [assembly, report, names, t]);

  useEffect(() => {
    const groupMap = new Map();
    report.forEach((clash, index) => {
      let group = groupMap.get(clash.first); // <- group report by object
      if (!group) {
        const firstModelIndex = clash.first.split("_").at(0) || 0;
        group = {
          id: `G_${index}`,
          first: clash.first,
          firstModelIndex,
          firstModel: models[firstModelIndex] ?? {},
          firstName: names.get(clash.first),
          children: [],
        };
        groupMap.set(clash.first, group);
      }
      const secondModelIndex = clash.second.split("_").at(0) || 0;
      group.children.push({
        id: index,
        ...clash, // <- first, second, distance
        secondModelIndex,
        secondModel: models[secondModelIndex] ?? {},
        secondName: names.get(clash.second),
      });
    });

    const groupedReport = Array.from(groupMap.values());
    setGroupedReport(groupedReport);

    onReportReady(groupedReport);
  }, [report, models, names, onReportReady]);

  useEffect(() => {
    const filterClash = (handle, name, model) =>
      !filters.first ||
      handle.includes(filters.first[0]) ||
      name?.includes(filters.first[0]) ||
      model.name?.includes(filters.first[0]);

    const filteredReport = groupedReport
      .map((group) => {
        const children = filterClash(group.first, group.firstName, group.firstModel)
          ? group.children
          : group.children.filter((clash) => filterClash(clash.second, clash.secondName, clash.secondModel));
        if (children.length === 0) return undefined;

        const modelCount = new Set(children.map((clash) => clash.secondModelIndex)).size;
        return {
          ...group,
          children,
          modelCount,
          description: `${group.children.length} ${t("clashes with")} ${modelCount} ${t("models")}`,
        };
      })
      .filter((x) => x);

    const groupCount = filteredReport.length;
    const clashCount = filteredReport.reduce((count, group) => count + group.children.length, 0);

    setFilteredReport(filteredReport);
    setFilteredGroups(groupCount);
    setFilteredClashes(clashCount);
  }, [groupedReport, models, filters, t]);

  const columns = [
    {
      title: `${fileteredClashes} ${t("clashes")}`,
      dataIndex: "first",
      key: "first",
      render: (_, row) => {
        const colors = ["green", "gold", "cyan", "orange", "blue", "magenta"];
        return row.children ? (
          <div
            className="ml-4 user-select-none"
            style={{ cursor: "pointer" }}
            onClick={() => {
              const handles = row.children.map((x) => x.second).concat(row.first);
              viewer.executeCommand("setSelected", handles);
            }}
            onDoubleClick={() => viewer.executeCommand("zoomToSelected")}
          >
            <Text className="mr-2" strong>
              {`${row.firstName} (#${row.first})`}
            </Text>
            <Tag color={colors[row.firstModelIndex % colors.length]}>{row.firstModel.name}</Tag>
            <div className="small">{row.description}</div>
          </div>
        ) : (
          <div
            className="ml-5 user-select-none"
            style={{ cursor: "pointer" }}
            onClick={() => {
              const handles = [row.second];
              viewer.executeCommand("setSelected", handles);
            }}
            onDoubleClick={() => viewer.executeCommand("zoomToSelected")}
          >
            <Text className="mr-2" strong>
              {`${row.secondName} (#${row.second})`}
            </Text>
            <Tag color={colors[row.secondModelIndex % colors.length]}>{row.secondModel.name}</Tag>
          </div>
        );
      },
      ...NameFilter(t("Filter by Name or Hanlde")),
    },
  ];

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total: filteredGroups,
  };

  const statusText = {
    none: t("The clash test has not yet been made"),
    waiting: t("Starting clash test. Please wait..."),
    inprogress: t("Clash test in progress. Please wait..."),
    failed: t("Clash test failed. No clash report generated"),
  };

  const emptyText = loading
    ? "Loading clash report. Please wait..."
    : reportStatus === "error"
      ? t("Error loading clash report")
      : reportStatus !== "done"
        ? statusText[reportStatus]
        : filters.first
          ? t("No clashes matching the filter")
          : t("No clashes found during the test");

  const empty = (
    <Empty description={emptyText}>
      {reportStatus === "error" && (
        <Button type="primary" onClick={() => setReload(reload + 1)}>
          {t("Reload")}
        </Button>
      )}
    </Empty>
  );

  return (
    <Table
      columns={columns}
      rowKey={(row) => row.id}
      dataSource={filteredReport}
      pagination={pagination}
      loading={loading}
      bordered={false}
      showHeader={reportStatus === "done"}
      locale={{ emptyText: empty }}
      onChange={(pagination, filters, sorter) => setFilters(filters)}
    />
  );
}
