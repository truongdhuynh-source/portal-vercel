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

import { useContext, useState } from "react";
import { ColorPicker, Button, Form, Switch } from "antd";
import { useTranslation } from "react-i18next";

import { AppContext } from "@/AppContext";

import "./HighlightSettings.css";

function getData(fields, object) {
  return fields.reduce((acc, field) => {
    acc[field] = object[field];
    return acc;
  }, {});
}

const settingsFields = [
  "edgesColor",
  "facesColor",
  "edgesVisibility",
  "edgesOverlap",
  "facesOverlap",
  "facesTransparancy",
  "enableCustomHighlight",
];

function formValuesToHighligtingParams(values) {
  return {
    ...values,
    edgesColor: { r: values.edgesColor.r, g: values.edgesColor.g, b: values.edgesColor.b },
    facesColor: { r: values.facesColor.r, g: values.facesColor.g, b: values.facesColor.b },
    facesTransparancy: (1 - values.facesColor.a) * 255,
  };
}

function highligtingParamsToFormValues(params) {
  const result = {
    ...params,
    edgesColor: { ...params.edgesColor, a: 1 },
    facesColor: { ...params.facesColor, a: 1 - params.facesTransparancy / 255 },
  };
  return result;
}

export function HighlightSettings({ viewer, saveUserSettings }) {
  const { app } = useContext(AppContext);
  const [modified, setModified] = useState(0);

  const options = viewer.options;
  const optionsData = getData(settingsFields, options);

  const initialValues = highligtingParamsToFormValues(optionsData);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const applySettings = (highligtingParams) => {
    options.data = highligtingParams;
    saveUserSettings(options.data, app);
  };

  const handleValuesChange = (_, values) => {
    const params = {
      ...formValuesToHighligtingParams(values),
      enableCustomHighlight: initialValues.enableCustomHighlight,
    };
    applySettings(params);
  };

  const handleEnableSwitch = (enabled) => {
    applySettings({ enableCustomHighlight: enabled });
    setModified(modified + 1);
  };

  const resetToDefaults = () => {
    options.resetToDefaults(settingsFields);
    const optionsData = getData(settingsFields, options);
    saveUserSettings(optionsData, app);
    form.setFieldsValue(highligtingParamsToFormValues(optionsData));
  };

  return (
    <div className="highlight-settings">
      <div className="highlight-settings__enable-switcher">
        <Switch checked={initialValues.enableCustomHighlight} onChange={handleEnableSwitch} />
        <strong>{t("Enable custom highlight")}</strong>
      </div>
      <Form
        layout="horizontal"
        labelAlign="left"
        labelCol={{ span: 16 }}
        form={form}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        disabled={!initialValues.enableCustomHighlight}
      >
        <Form.Item
          className="mb-0"
          label={t("Edges color")}
          name="edgesColor"
          getValueFromEvent={(color) => color.toRgb()}
        >
          <ColorPicker size="small" defaultFormat="rgb" />
        </Form.Item>
        <Form.Item
          className="mb-0"
          label={t("Faces color")}
          name="facesColor"
          getValueFromEvent={(color) => color.toRgb()}
        >
          <ColorPicker size="small" defaultFormat="rgb" />
        </Form.Item>
        <Form.Item className="mb-0" label={t("Edges visibility")} name="edgesVisibility" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item className="mb-0" label={t("Edges overlap")} name="edgesOverlap" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label={t("Faces overlap")} name="facesOverlap" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button onClick={resetToDefaults} type="primary">
            {t("Reset to defaults")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
