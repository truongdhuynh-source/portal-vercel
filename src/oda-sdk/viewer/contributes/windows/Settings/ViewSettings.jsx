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

import { Flex, Form, Select, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export function ViewSettings({ viewer, databaseLoaded, data, onChange }) {
  const [form] = Form.useForm();
  const [initialValues] = useState(data);
  const { t } = useTranslation();

  const modes = [
    { value: "perspective", label: t("Perspective") },
    { value: "orthographic", label: t("Orthographic") },
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
      <Flex vertical gap="middle">
        <Flex justify="space-between" align="center">
          <Text>{t("Camera mode")}</Text>
          <Form.Item name="cameraMode" noStyle>
            <Select
              style={{ width: "auto" }}
              popupMatchSelectWidth={false}
              options={modes}
              disabled={!databaseLoaded || !viewer.is3D()}
            ></Select>
          </Form.Item>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>{t("Reverse mouse zoom direction")}</Text>
          <Form.Item name="reverseZoomWheel" noStyle>
            <Switch />
          </Form.Item>
        </Flex>
      </Flex>
    </Form>
  );
}
