///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2025, Open Design Alliance (the "Alliance").
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
//   Open Design Alliance Copyright (C) 2002-2025 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useState } from "react";
import { Button, Input, notification, Row, Select, Table, Tooltip } from "antd";
import { DeleteTwoTone, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";

export function SearchWindow({ viewer, file, visible, onClose }) {
  const [conditions, setConditions] = useState([]);
  const [nextKey, setNextKey] = useState(0);
  const [searching, setSearching] = useState(false);
  const { t } = useTranslation();

  const handleAddSearchItem = () => {
    setNextKey(nextKey + 1);
    setConditions([
      ...conditions,
      { key: nextKey, name: "", value: "", condition: "=" },
    ]);
  };

  const handleRemoveSearchItem = (item) => {
    setConditions(conditions.filter((entry) => entry.key !== item.key));
  };

  const handleChangeCondition = (data, value) => {
    setConditions(
      conditions.map((item) => {
        if (data.key === item.key) {
          return { ...item, condition: value };
        }
        return item;
      })
    );
  };

  const handleChangeProperty = (data, value) => {
    setConditions(
      conditions.map((item) => {
        if (data.key === item.key) {
          return { ...item, name: value };
        }
        return item;
      })
    );
  };

  const handleChangeValue = (data, value) => {
    setConditions(
      conditions.map((item) => {
        if (data.key === item.key) {
          return { ...item, value };
        }
        return item;
      })
    );
  };

  const handleSearch = async () => {
    const array = conditions.filter((entry) => entry.name);
    if (array.length) {
      let searchPattern = array.map((item) => {
        if (item.condition === "!=")
          return { key: item.name, value: { $not: { $eq: item.value } } };
        if (item.condition === "~")
          return { key: item.name, value: { $regex: `${item.value}` } };
        return { key: item.name, value: item.value };
      });
      if (searchPattern.length === 1) searchPattern = searchPattern[0];
      else searchPattern = { $and: searchPattern };

      setSearching(true);
      try {
        const properties = await file.searchProperties(searchPattern);
        const handles = properties.map((x) => x.handle);
        viewer.setSelected(handles);
        // viewer.executeCommand("setSelected", handles);
        notification.success({
          message: t("Success"),
          description: handles.length
            ? `${t("Found")} ${handles.length} ${t("objects")}`
            : t("No objects found"),
        });
      } catch (e) {
        console.error("Cannot find objects.", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot find objects"),
        });
      } finally {
        setSearching(false);
      }
    }
  };

  const columns = [
    {
      title: t("Property"),
      dataIndex: "name",
      key: "name",
      render: (text, data) => (
        <Input
          placeholder={t("Property")}
          bordered={false}
          value={text}
          onChange={(event) => handleChangeProperty(data, event.target.value)}
        />
      ),
    },
    {
      title: t("Condition"),
      key: "condition",
      dataIndex: "condition",
      render: (text, data) => {
        return (
          <Select
            className="w-100"
            value={text}
            bordered={false}
            suffixIcon={false}
            showSearch
            options={["=", "!=", "~"].map((x) => ({ label: x, value: x }))}
            onChange={(value) => handleChangeCondition(data, value)}
          />
        );
      },
    },
    {
      title: t("Value"),
      key: "value",
      dataIndex: "value",
      render: (text, data) => (
        <Input
          placeholder={t("Value")}
          bordered={false}
          value={text}
          onChange={(event) => handleChangeValue(data, event.target.value)}
        />
      ),
    },
    {
      title: t("Actions"),
      key: "actions",
      render: (_, data) => {
        return (
          <div>
            <Tooltip title={t("Delete condition")}>
              <DeleteTwoTone
                className="large-icon"
                twoToneColor="#ff4d4f"
                onClick={() => handleRemoveSearchItem(data)}
              />
            </Tooltip>
          </div>
        );
      },
      ellipsis: { showTitle: false },
      width: 75,
      align: "end",
    },
  ];

  const canvasId = document.getElementById("canvas");
  const positionLeft = canvasId.width / 2 - 240;

  return (
    <Window
      title={t("Search")}
      style={{
        left: positionLeft,
        width: "480px",
        height: "auto",
        minWidth: "430px",
      }}
      visible={visible}
      onClose={onClose}
    >
      <Table
        columns={columns}
        dataSource={conditions}
        pagination={false}
        bordered
        size="small"
        locale={{
          emptyText: t(
            "No search conditions. To add a new condition, click + button."
          ),
        }}
      />
      <Row style={{ paddingTop: "0.5rem" }} justify="end">
        <Button type="primary" onClick={handleAddSearchItem}>
          +
        </Button>
      </Row>
      <Row style={{ paddingTop: "0.5rem" }}>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={searching}
          disabled={!(viewer && conditions.length)}
        >
          {t("Search")}
        </Button>
      </Row>
    </Window>
  );
}
