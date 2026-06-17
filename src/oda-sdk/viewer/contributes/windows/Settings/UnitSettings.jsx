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
import { Flex, Form, Select, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export function UnitSettings({ data, onChange }) {
  const [form] = Form.useForm();
  const [initialValues] = useState(data);
  const { t } = useTranslation();

  const units = [
    { value: "Default", label: t("File units") },
    { value: "Millimeters", label: t("Millimeters") },
    { value: "Centimeters", label: t("Centimeters") },
    { value: "Meters", label: t("Meters") },
    { value: "Feet", label: t("Feet") },
    { value: "Inches", label: t("Inches") },
    { value: "Yards", label: t("Yards") },
    { value: "Kilometers", label: t("Kilometers") },
    { value: "Miles", label: t("Miles") },
    { value: "Micrometers", label: t("Micrometers") },
    { value: "MicroInches", label: t("MicroInches") },
  ];

  useEffect(() => {
    form.setFieldsValue(data);
  }, [form, data]);

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={initialValues}
      onValuesChange={(_, allValues) => onChange(allValues)}
    >
      <Form.Item>
        <Flex justify="space-between" align="center">
          <Text>{t("Display units")}</Text>
          <Form.Item name="rulerUnit" noStyle>
            <Select style={{ width: "auto" }} popupMatchSelectWidth={false} options={units}></Select>
          </Form.Item>
        </Flex>
      </Form.Item>
    </Form>
  );
}
