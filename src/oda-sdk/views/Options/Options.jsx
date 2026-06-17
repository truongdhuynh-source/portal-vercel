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

import React, { useContext, useState } from "react";
import { Button, Divider, InputNumber, notification, Row, Select, Switch, Typography } from "antd";
import { PageHeader } from "@ant-design/pro-layout";
import { useTranslation } from "react-i18next";

import { AppContext } from "@/AppContext";

const { Title, Text } = Typography;

const viewerOptionSet = {
  title: "Viewer Options",
  customKey: "oda.viewer",
  options: [
    { key: "showWCS", type: "boolean", label: "Show WCS" },
    { key: "cameraAnimation", type: "boolean", label: "Enable camera animation" },
    { key: "antialiasing", type: "boolean", label: "Enable antialiasing use FXAA" },
    { key: "shadows", type: "boolean", label: "Enable shadows" },
    { key: "groundShadow", type: "boolean", label: "Enable ground shadow" },
    { key: "ambientOcclusion", type: "boolean", label: "Ambient occlusion" },
  ],
};

const experimentalOptionSet = {
  title: "Experimental",
  customKey: "oda.experimental",
  options: [
    {
      key: "enableStreamingMode",
      type: "boolean",
      label: "Enable streaming of drawings from the server. If disabled, then drawing will be loaded in one go",
    },
    {
      key: "enablePartialMode",
      type: "boolean",
      label:
        "Enable partial load mode to be able open large drawings. Only used if streaming is enabled. Always used for RCS files. If enabled, then scene graph will be disabled",
      stateKey: "enableStreamingMode",
    },
    {
      key: "memoryLimit",
      type: "number",
      label: "The size of the memory buffer that the Viewer can use for graphics data",
      min: 256,
      max: 4000,
      factor: 1024 * 1024,
      units: "MB",
      stateKey: "enablePartialMode",
    },
    {
      key: "sceneGraph",
      type: "boolean",
      label: "Enable scene graph. If enabled, then partial load mode will be disabled",
    },
    {
      key: "edgeModel",
      type: "boolean",
      label:
        "Edge display models. No edges is usefull for less memory consumption. Disabled - No edges are displayed, enabled - Display isolines",
    },
    { key: "reverseZoomWheel", type: "boolean", label: "Reverse the mouse wheel direction for zooming" },
  ],
};

function Option({ className, options, option, onChange }) {
  return option.type === "select" ? (
    <Select
      className={className}
      options={option.select}
      defaultValue={options.data[option.key]}
      onChange={(value) => onChange(option.key, value)}
    ></Select>
  ) : option.type === "number" ? (
    <InputNumber
      className={className}
      style={{ width: "10rem", minWidth: "7rem" }}
      min={option.min}
      max={option.max}
      value={(options.data[option.key] / (option.factor || 1)) | 0}
      addonAfter={option.units}
      disabled={option.stateKey && !options.data[option.stateKey]}
      onChange={(value) => onChange(option.key, value * (option.factor || 1))}
    />
  ) : option.type === "boolean" ? (
    <Switch
      className={className}
      checked={!!options.data[option.key]}
      disabled={option.stateKey && !options.data[option.stateKey]}
      onChange={(checked) => onChange(option.key, checked)}
    />
  ) : null;
}

function OptionGroup({ optionSet, options, onChange }) {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <Title level={5}>{t(optionSet.title)}</Title>
      {optionSet.options.map((x) => (
        <Row className="mb-2" key={x.key} wrap={false}>
          <Option className="mr-4" options={options} option={x} onChange={onChange} />
          <Text>{t(x.label)}</Text>
        </Row>
      ))}
      <Divider />
    </React.Fragment>
  );
}

function Options() {
  const { app } = useContext(AppContext);
  const [modified, setModified] = useState(0);
  const options = app.options;
  const { t } = useTranslation();

  function saveUserSettings() {
    app.saveUserSettings(options.data).catch((e) => {
      console.error("Unable to save user settings.", e);
      notification.warning({
        message: t("Warning"),
        description: "Unable to save user settings, changes may be lost after the next login",
      });
    });
  }

  function handleChange(key, value) {
    options[key] = value; // <- to save known options using setter
    options.data[key] = value; // <- to save additional options
    setModified(modified + 1);
    saveUserSettings();
  }

  function handleResetToDefaults() {
    const viewerFields = viewerOptionSet.options.map((option) => option.key);
    const experimentalFields = experimentalOptionSet.options.map((option) => option.key);
    options.resetToDefaults([...viewerFields, ...experimentalFields]);
    setModified(0);
    notification.success({ message: t("Success"), description: t("Settings reset to defaults") });
    saveUserSettings();
  }

  return (
    <div className="h-100 d-flex flex-column">
      <PageHeader backIcon={false} title={t("Settings")} />
      <div className="flex-grow-1 overflow-auto">
        <div className="px-3 pb-3">
          <OptionGroup optionSet={viewerOptionSet} options={options} onChange={handleChange} />
          <OptionGroup optionSet={experimentalOptionSet} options={options} onChange={handleChange} />
          <Button type="primary" onClick={handleResetToDefaults}>
            {t("Reset to defaults")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Options;
