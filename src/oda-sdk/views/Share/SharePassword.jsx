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

import { useTranslation } from "react-i18next";

import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Input, Button, notification } from "antd";
import { AppContext } from "@/AppContext";
import { withSuspense, Loading } from "@/components";
import ClientFactory from "@/oda-sdk/ClientFactory";

const ViewerPage = withSuspense(
  React.lazy(() => import("../../viewer/ViewerPage"))
);

const SharePassword = () => {
  const { app } = useContext(AppContext);
  const client = ClientFactory.get();
  const navigate = useNavigate();
  const { sharedToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [sharedFile, setSharedFile] = useState();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadContext() {
      setLoading(true);
      if (!sharedToken) navigate("/Error404");
      try {
        const file = await client.getSharedFile(sharedToken);
        setSharedFile(file);
      } catch (e) {
        if (e && e.status === 403) {
          setPasswordRequired(true);
        } else {
          console.error("Cannot get Shared File info.", e);
          notification.error({
            message: t("Error"),
            description: t(
              "Shared File not found, or access denied, or network error"
            ),
          });
        }
      } finally {
        setLoading(false);
      }
    }

    (app.user ? Promise.resolve() : app.loadConfig())
      .then(() => loadContext())
      .catch((e) => {
        console.error("Cannot load Config.", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot load Config."),
        });
      });
  }, [app, client]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await client.getSharedFile(sharedToken, values.password);
      if (response) {
        setSharedFile(response);
        setPasswordRequired(false);
      } else {
        notification.error({
          message: t("Get Shared File Failed"),
          description: t("Get Shared File Failed. Please try again."),
        });
      }
    } catch (e) {
      notification.error({
        message: t("Login Failed"),
        description: t("Incorrect password. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return loading || passwordRequired ? (
    <Loading loading={loading}>
      <div
        style={{
          maxWidth: 400,
          margin: "auto",
          padding: 20,
          textAlign: "center",
        }}
      >
        <Form
          name="password_form"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label={t("Password to open shared file")}
            name="password"
            rules={[
              { required: true, message: t("Please enter the password") },
            ]}
          >
            <Input.Password placeholder={t("Please enter the password")} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t("Submit")}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Loading>
  ) : (
    <div style={{ height: "100dvh" }}>
      <ViewerPage sharedFile={sharedFile} />
    </div>
  );
};

export default SharePassword;
