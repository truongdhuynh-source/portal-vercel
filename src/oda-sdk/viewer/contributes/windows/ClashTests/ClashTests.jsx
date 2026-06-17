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
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import { Button, Divider, Dropdown, Empty, Modal, notification, Select, Space, Spin } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";
import { ClashReportTable } from "./ClashReportTable";
import { ClashReportSaver } from "./ClashReportSaver";
import { ClashTestCreateModal } from "./ClashTestCreateModal";

export function ClashTestsWindow({ file: assembly, viewer, visible, onClose }) {
  const [testCreateModal, setTestCreateModal] = useState(false);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState();
  const [report, setReport] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!viewer) return;
    if (!visible) return;

    setLoading(true);
    assembly
      ?.getClashTests()
      .then((tests) => {
        setTests(tests.result);
        setSelected(tests.result[0]);
        setError(false);
      })
      .catch((e) => {
        console.error("Cannot get clash tests.", e);
        notification.error({ message: t("Error"), description: t("Cannot get clash tests") });
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [assembly, viewer, visible, reload, t]);

  function downloadReport(format) {
    try {
      const text = new ClashReportSaver(assembly, selected, report).saveAs(format);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const fileName = selected.name.replace(".", "_") + "_clash_report." + format;
      FileSaver.saveAs(blob, sanitize(fileName));
    } catch (e) {
      console.error("Cannot download report.", e);
      notification.error({ message: t("Error"), description: t("Cannot download report") });
    }
  }

  function deleteTest(test) {
    const index = tests.indexOf(selected);
    test
      .delete()
      .then(() => {
        const newTests = tests.filter((x) => x !== test);
        const newSelected = Math.min(index, newTests.length - 1);
        setTests(newTests);
        setSelected(newTests[newSelected]);
        notification.success({ message: t("Success"), description: t("Clash test deleted") });
      })
      .catch((e) => {
        console.error("Cannot delete clash test.", e);
        notification.error({ message: t("Error"), description: t("Cannot delete clash test") });
      });
  }

  const emptyText = error
    ? t("Error loading clash tests")
    : loading
      ? " "
      : t("No clash tests. To add a new test, click New Test button.");

  return (
    <Window
      title={t("Clash Tests")}
      style={{
        left: "calc(50% - 250px)",
        width: "500px",
        minWidth: "500px",
      }}
      visible={visible}
      onClose={onClose}
    >
      <div className="h-100 d-flex flex-column">
        <Space className="mt-1">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTestCreateModal(true)}>
            {t("New Test")}
          </Button>
          <span>{t("Test")}:</span>
          <Select
            style={{ minWidth: "12rem" }}
            showSearch
            disabled={loading || tests.length === 0}
            value={selected?.id}
            options={tests.map((test) => ({ value: test.id, label: test.name }))}
            onChange={(value) => setSelected(tests.find((x) => x.id === value))}
          />
          <Dropdown
            trigger={["click"]}
            disabled={loading || !selected}
            menu={{
              items: [
                {
                  key: "formats",
                  type: "group",
                  label: t("Download report"),
                  children: [
                    { key: "html", label: "HTML" },
                    { key: "txt", label: "Text" },
                    { key: "csv", label: "CSV" },
                    { key: "json", label: "JSON" },
                  ],
                },
              ],
              onClick: (item) => downloadReport(item.key),
            }}
          >
            <Button>
              <Space>
                <DownloadOutlined />
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            disabled={loading || !selected}
            onClick={() => {
              Modal.confirm({
                title: t("Delete the clash test?"),
                icon: <ExclamationCircleOutlined />,
                okText: t("Yes"),
                okType: "danger",
                cancelText: t("No"),
                cancelButtonProps: { type: "primary" },
                onOk: () => deleteTest(selected),
              });
            }}
          ></Button>
        </Space>

        <Divider className="my-2" />

        <div className="flex-grow-1 overflow-auto">
          {loading ? (
            <Spin spinning={loading}>{loading && <div style={{ minHeight: 53 }} />}</Spin>
          ) : tests.length > 0 ? (
            <ClashReportTable file={assembly} viewer={viewer} test={selected} onReportReady={setReport} />
          ) : (
            <Empty className="ant-list-empty-text" description={emptyText}>
              {error && (
                <Button type="primary" onClick={() => setReload(reload + 1)} loading={loading}>
                  {t("Reload")}
                </Button>
              )}
            </Empty>
          )}
        </div>
      </div>

      <ClashTestCreateModal
        viewer={viewer}
        file={assembly}
        visible={testCreateModal}
        onCreate={(test) => {
          setTestCreateModal(false);
          setTests(tests.concat([test]));
          setSelected(test);
        }}
        onClose={() => setTestCreateModal(false)}
      />
    </Window>
  );
}
