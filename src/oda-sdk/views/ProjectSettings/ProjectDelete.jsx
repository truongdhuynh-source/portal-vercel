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

import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Form, Modal, notification, Row, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { AppContext } from "@/AppContext";

const { Title, Text } = Typography;

function ProjectDelete({ project }) {
  const { app } = useContext(AppContext);
  const [form] = Form.useForm();
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Form
      form={form}
      name="deleteproject"
      onFinish={(values) => {
        setDeleting(true);
        project
          .delete()
          .then(() => {
            app.setProject(null);
            notification.success({ message: t("Success"), description: t("Project deleted") });
            navigate("/projects");
          })
          .catch((e) => {
            console.error("Cannot delete project.", e);
            notification.error({ message: t("Error"), description: t("Cannot delete project") });
          })
          .finally(() => {
            setDeleting(false);
          });
      }}
    >
      <Row gutter={16}>
        <Col className="mb-4" lg={8} xs={24}>
          <Title level={5} type="danger">
            {t("Delete project")}
          </Title>
        </Col>
        <Col lg={16} xs={24}>
          <Form.Item>
            <Text>{t("Deleting a project cannot be undone.")}</Text>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              danger
              loading={deleting}
              onClick={() =>
                Modal.confirm({
                  title: t("Delete the project?"),
                  icon: <ExclamationCircleOutlined />,
                  okText: t("Yes"),
                  okType: "danger",
                  cancelText: t("No"),
                  cancelButtonProps: { type: "primary" },
                  onOk: () => form.submit(),
                })
              }
            >
              {t("Delete project")}
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default ProjectDelete;
