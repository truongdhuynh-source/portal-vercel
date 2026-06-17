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
import { Button, Col, Form, Input, Modal, notification, Row, Select } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import ClientFactory from "@/oda-sdk/ClientFactory";

function CreateAssemblyModal({ visible, selected, onCreate, onClose }) {
  const [form] = Form.useForm();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const client = ClientFactory.get();
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) return;

    form.setFieldsValue({
      name: "NewAssembly",
      selected: (selected ?? []).map((x) => x.id),
    });
  }, [visible, form, selected]);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    client
      .getFiles()
      .then((files) => setFiles(files.result))
      .catch((e) => {
        console.error("Cannot get files.", e);
        notification.error({ message: t("Error"), description: t("Cannot get files") });
      })
      .finally(() => setLoading(false));
  }, [client, visible, t]);

  return (
    <Modal
      open={visible}
      title="New Assembly"
      okText={t("Create Assembly")}
      onOk={() => form.submit()}
      confirmLoading={creating}
      onCancel={creating ? undefined : onClose}
      afterClose={() => form.resetFields()}
      centered
    >
      <Form
        form={form}
        name="assembly"
        layout="vertical"
        initialValues={{
          name: "NewAssembly",
          selected: [],
        }}
        onFinish={(values) => {
          const { selected, name } = values;
          setCreating(true);
          client
            .createAssembly(
              selected.filter((x) => x),
              name
            )
            .then((assembly) => {
              notification.success({ message: t("Success"), description: t("Assembly created") });
              onCreate(assembly);
            })
            .catch((e) => {
              console.error("Cannot create assembly.", e);
              notification.error({ message: t("Error"), description: t("Cannot create assembly") });
            })
            .finally(() => setCreating(false));
        }}
      >
        <Form.Item
          name="name"
          label={t("Assembly Name")}
          rules={[{ required: true, whitespace: true, message: t("Input assembly name") }]}
        >
          <Input />
        </Form.Item>

        <Form.List
          name="selected"
          rules={[
            {
              validator: (_, value) => (value.filter((x) => x).length > 1 ? Promise.resolve() : Promise.reject()),
              message: t("Select two or more files"),
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Form.Item label={t("Files")} required>
              {fields.map((field, index) => (
                <Form.Item key={field.key}>
                  <Row gutter={8} align="middle" wrap={false}>
                    <Col flex="auto">
                      <Form.Item
                        {...field}
                        validateTrigger={["onChange"]}
                        rules={[
                          // {
                          //   required: true,
                          //   message: "Select the file or delete this field",
                          // },
                          {
                            validator: (_, value) =>
                              !value || form.getFieldValue("selected").indexOf(value) === index
                                ? Promise.resolve()
                                : Promise.reject(),
                            message: t("This file already selected"),
                          },
                        ]}
                        noStyle
                      >
                        <Select
                          loading={loading}
                          showSearch
                          options={files.map((file) => ({ value: file.id, label: file.name }))}
                          onChange={() => form.validateFields()}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                </Form.Item>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} block onClick={() => add()}>
                {t("Add File")}
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}

export default CreateAssemblyModal;
