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

import { useEffect, useState } from "react";
import { ColorPicker, Flex, Form, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function formValuesToHighligtingParams(values) {
  return {
    ...values,
    edgesColor: { r: values.edgesColor.r, g: values.edgesColor.g, b: values.edgesColor.b },
    facesColor: { r: values.facesColor.r, g: values.facesColor.g, b: values.facesColor.b },
    facesTransparancy: (1 - values.facesColor.a) * 255,
  };
}

function highligtingParamsToFormValues(data) {
  return {
    ...data,
    edgesColor: { ...data.edgesColor, a: 1 },
    facesColor: { ...data.facesColor, a: 1 - data.facesTransparancy / 255 },
  };
}

export function HighlightSettings({ data, onChange }) {
  const [form] = Form.useForm();
  const [initialValues] = useState(highligtingParamsToFormValues(data));
  const { t } = useTranslation();

  useEffect(() => {
    form.setFieldsValue(highligtingParamsToFormValues(data));
  }, [form, data]);

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onValuesChange={(_, allValues) => onChange(formValuesToHighligtingParams(allValues))}
    >
      <Flex vertical gap="middle">
        <Flex justify="space-between" align="center">
          <Text>{t("Enable custom highlighting")}</Text>
          <Form.Item name="enableCustomHighlight" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Edges color")}</Text>
          <Form.Item name="edgesColor" getValueFromEvent={(color) => color.toRgb()} noStyle>
            <ColorPicker size="small" defaultFormat="rgb" />
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Faces color")}</Text>
          <Form.Item name="facesColor" getValueFromEvent={(color) => color.toRgb()} noStyle>
            <ColorPicker size="small" defaultFormat="rgb" />
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Edges visibility")}</Text>
          <Form.Item name="edgesVisibility" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Edges overlap")}</Text>
          <Form.Item name="edgesOverlap" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Faces overlap")}</Text>
          <Form.Item name="facesOverlap" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
      </Flex>
    </Form>
  );
}
