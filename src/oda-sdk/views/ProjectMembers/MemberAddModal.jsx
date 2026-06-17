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

import { useState, useEffect } from "react";
import { Form, Modal, notification, Select, Typography } from "antd";

const { Text } = Typography;

function MemberAddModal({ project, visible, onCreate, onClose }) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      project
        .getRoles()
        .then((roles) => setRoles(roles))
        .catch((e) => {
          console.error("Cannot get roles.", e);
          notification.error({ message: "Error", description: "Cannot get roles" });
        })
        .finally(() => setLoading(false));
    }
  }, [visible, project]);

  // useEffect(() => {
  //   if (roles.length === 1) {
  //     form.setFieldsValue({ role: (roles[0] || {}).name });
  //   }
  // }, [roles, form]);

  return (
    <Modal
      open={visible}
      title="Add Members"
      okText="Add Members"
      onOk={() => form.submit()}
      confirmLoading={creating}
      onCancel={creating ? undefined : onClose}
      afterClose={() => form.resetFields()}
      centered
    >
      <Form
        form={form}
        name="addmembers"
        layout="vertical"
        initialValues={{
          users: undefined,
          role: undefined,
        }}
        onFinish={(values) => {
          const { users, role } = values;
          setCreating(true);
          Promise.allSettled(users.map((user) => project.addMember(user, role)))
            .then((results) => {
              let fulfilled = 0;
              results.forEach((result, index) => {
                if (result.status === "rejected") {
                  const user = users[index];
                  console.error(`Cannot make user ${user} a member.`, result.reason);
                  notification.error({ message: "Error", description: `Cannot make user ${user} a member` });
                } else {
                  fulfilled += 1;
                }
              });
              if (fulfilled) {
                notification.success({
                  message: "Success",
                  description: `Added ${fulfilled} of ${results.length} users`,
                });
                onCreate();
              }
            })
            .catch((e) => {
              console.error("Cannot add members.", e);
              notification.error({ message: "Error", description: "Cannot add members" });
            })
            .finally(() => setCreating(false));
        }}
      >
        <Form.Item>
          <Text>
            You add members to the <Text strong>{project.name}</Text>
          </Text>
        </Form.Item>

        <Form.Item
          name="users"
          label="User ID"
          rules={[{ required: true, message: "Input one or more user ID" }]}
          extra="To add a user, you need their User ID. The user can get their ID on the User Info page. You can specify multiple user IDs at once."
        >
          <Select mode="tags"></Select>
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[{ required: true, message: "Select a role" }]}>
          <Select loading={loading} options={roles.map((role) => ({ label: role.name, value: role.name }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default MemberAddModal;
