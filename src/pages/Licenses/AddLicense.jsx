import React, { useState } from "react";
import { Modal, Input, Form, notification } from "antd";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/plugins/axios";
import "./LicenseDetail.css";

const AddLicense = ({ visible, id, refresh, close, licenseId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAddUser = async (values) => {
    try {
      setLoading(true);
      const { email } = values;
      const res = await axiosInstance.post("/portal/add-license-issuer", {
        email,
        licenseIssuerId: id,
        licenseId,
      });
      console.log(res);

      if (res) {
        notification.success({
          message: t("Success"),
          description: t("User added to license successfully"),
        });
        form.resetFields();
        refresh();
        close(false);
      }
    } catch (error) {
      console.error("Error adding users:", error);
      notification.error({
        message: t("Error"),
        description: t("Unable to add users to license"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={() => {
        close(false);
      }}
      destroyOnClose
      centered
      onOk={() => form.submit()}
      okText={t("Add")}
      cancelText={t("Cancel")}
      maskClosable={false}
      confirmLoading={loading}
      className="add-license-modal"
      title={t("Add license for user")}>
      <div className="flex gap-2 items-center align-middle m-2 my-3">
        <Form
          layout="vertical"
          name="addForm"
          autoComplete="off"
          onFinish={handleAddUser}
          form={form}
          initialValues={{
            email: undefined,
          }}>
          <Form.Item
            label={t("Email")}
            name="email"
            type="email"
            rules={[
              { required: true, message: t("Email is required") },
              {
                type: "email",
                message: t("Invalid email"),
              },
            ]}>
            <Input />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default AddLicense;
