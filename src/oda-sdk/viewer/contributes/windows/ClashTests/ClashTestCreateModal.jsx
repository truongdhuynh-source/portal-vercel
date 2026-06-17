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

import { useState, useEffect } from "react";
import { Col, Form, Input, InputNumber, Modal, notification, Radio, Row, Select } from "antd";
import { useTranslation } from "react-i18next";

export function ClashTestCreateModal({ viewer, file: assembly, visible, onCreate, onClose }) {
  const [models, setModels] = useState([]);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (visible && assembly) {
      const files = assembly.files.map((fileId) => {
        return assembly.associatedFiles.find((x) => x.fileId === fileId) ?? {};
      });
      const models = (viewer.executeCommand("getModels") ?? []).map((handle, index) => {
        return {
          handle,
          name: files?.[index].name ?? index + "",
        };
      });
      setModels(models);
    }
  }, [viewer, assembly, visible]);

  return (
    <Modal
      open={visible}
      title={t("New Clash Test")}
      okText={t("Create Test")}
      onOk={() => form.submit()}
      confirmLoading={creating}
      onCancel={creating ? undefined : onClose}
      afterClose={() => form.resetFields()}
    >
      <Form
        form={form}
        name="newclashtest"
        layout="vertical"
        initialValues={{
          name: "Clash Test",
          selectionTypeA: "models",
          selectionTypeB: "models",
          selectionSetA: [0],
          selectionSetB: [1],
          clearance: "0",
          tolerance: "0.1",
        }}
        onFieldsChange={() => {
          form.setFields([{ name: "selectionSetA", touched: false }]);
        }}
        onFinish={async (values) => {
          setCreating(true);
          try {
            const { name, selectionTypeA, selectionTypeB, selectionSetA, selectionSetB, clearance, tolerance } = values;
            const test = await assembly.createClashTest(
              name,
              selectionTypeA,
              selectionTypeB,
              selectionSetA,
              selectionSetB,
              {
                clearance: clearance !== "0",
                tolerance,
                waitForDone: false,
              }
            );
            notification.success({
              message: t("Success"),
              description: t("Clash test created. Please wait until test complete"),
            });
            onCreate(test);
          } catch (e) {
            console.error("Cannot create clash test.", e);
            notification.error({ message: t("Error"), description: t("Cannot create clash test") });
          } finally {
            setCreating(false);
          }
        }}
      >
        <Form.Item
          name="name"
          label={t("Test Name")}
          rules={[{ required: true, whitespace: true, message: t("Input test name") }]}
        >
          <Input />
        </Form.Item>

        <Form.Item className="mb-0" name="selectionTypeA" label={t("First Selection Set")}>
          <Radio.Group className="w-100">
            <Radio value="all">{t("All")}</Radio>
            <Row align="middle" wrap={false}>
              <Col>
                <Radio className="mb-4" value="models">
                  {t("Models")}
                </Radio>
              </Col>
              <Col flex="auto">
                <Form.Item
                  name="selectionSetA"
                  dependencies={["selectionTypeA"]}
                  rules={[
                    {
                      validator: (_, value) =>
                        value.length > 0 || form.getFieldValue("selectionTypeA") !== "models"
                          ? Promise.resolve()
                          : Promise.reject(),
                      message: t("Select one or more models"),
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    optionFilterProp="label"
                    options={models.map((x, index) => ({ label: x.name, value: index }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Radio.Group>
        </Form.Item>

        <Form.Item className="mb-0" name="selectionTypeB" label="Second Selection Set">
          <Radio.Group className="w-100">
            <Radio value="all">{t("All")}</Radio>
            <Row align="middle" wrap={false}>
              <Col>
                <Radio className="mb-4" value="models">
                  {t("Models")}
                </Radio>
              </Col>
              <Col flex="auto">
                <Form.Item
                  name="selectionSetB"
                  dependencies={["selectionTypeB"]}
                  rules={[
                    {
                      validator: (_, value) =>
                        value.length > 0 || form.getFieldValue("selectionTypeB") !== "models"
                          ? Promise.resolve()
                          : Promise.reject(),
                      message: t("Select one or more models"),
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    optionFilterProp="label"
                    options={models.map((x, index) => ({ label: x.name, value: index }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="clearance"
          label={t("Test Type")}
          rules={[{ required: true, message: t("Select a type of the clashes that the test detects") }]}
        >
          <Radio.Group>
            <Radio value="1">{t("Сlearance clash")}</Radio>
            <Radio value="0">{t("Hard clash")}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="tolerance"
          label={t("Tolerance")}
          rules={[{ required: true, message: t("Input a distance of separation between entities") }]}
        >
          <InputNumber className="w-100" decimalSeparator="." step={0.1} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
