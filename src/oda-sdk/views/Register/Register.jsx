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
import { useNavigate, Link } from "react-router-dom";
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Form,
  Input,
  notification,
  Row,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import { Buffer } from "buffer";

import { AppContext } from "@/AppContext";
import { DocLink } from "@/components";
import ClientFactory from "@/oda-sdk/ClientFactory";

import logoImage from "@/assets/images/logo.svg";
import "./Register.css";

const { Title, Text } = Typography;

function Register() {
  const { app } = useContext(AppContext);
  const client = ClientFactory.get();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  function registerUser(email, password, username) {
    setLoading(true);
    app
      .loadConfig()
      .then(() => client.registerUser(email, password, username))
      .then((data) => {
        if (data.emailVerify) {
          navigate("/");
        } else {
          const searchParams = new URLSearchParams();
          searchParams.set(
            "user",
            Buffer.from(email + ":" + password, "utf8").toString("base64")
          );
          searchParams.set("from", "register");
          navigate("/confirm?" + searchParams.toString());
        }
      })
      .catch((e) => {
        console.error("Cannot register user.", e);
        if (e.status === 409) {
          setError("Account already exists");
        } else {
          notification.error({
            message: t("Error"),
            description: t("Server unavailable, please try again later"),
          });
        }
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="register-fullscreen">
      <div className="register-fullscreen--center">
        <Flex className="register-content" gap="large" vertical>
          <Row justify="center">
            <img src={logoImage} className="register-logo" />
          </Row>

          <Row justify="center">
            <Title level={4}>{t("Create account")}</Title>
          </Row>

          <Form
            name="register"
            layout="vertical"
            requiredMark={false}
            initialValues={{
              username: "",
              email: "",
              password: "",
            }}
            onFinish={(values) => {
              const { email, password, username } = values;
              registerUser(email, password, username);
            }}>
            {error && (
              <Form.Item>
                <Alert
                  message={t(error)}
                  type="error"
                  onClick={() => setError()}
                  closable
                />
              </Form.Item>
            )}

            <Form.Item
              name="username"
              label={t("Username")}
              rules={[
                { required: true, message: t("Please enter account name") },
                {
                  pattern: "[^\\s-]",
                  message: t("Name cannot contain spaces only"),
                },
              ]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label={t("Email")}
              rules={[
                {
                  required: true,
                  message: t("Please enter a valid email address"),
                },
                { type: "email", message: t("Please enter a valid email") },
              ]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label={t("Password")}
              rules={[
                { required: true, message: t("Please enter password") },
                {
                  pattern: /^[a-zA-Z0-9_~!@#$%^&*()\-+={}[\]:;"'`<>,.?/|\\]+$/,
                  message: t(
                    "Password can only contain latin letters, numbers, and special characters"
                  ),
                },
              ]}>
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(),
                  message: t("Please read the privacy policy statement"),
                },
              ]}>
              <Checkbox>
                <Text>
                  {t("I have read and agree to the ")}
                  <DocLink
                    to="https://www.opendesign.com/privacy"
                    text={t("ODA Privacy Policy")}
                  />
                </Text>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" block htmlType="submit" loading={loading}>
                {t("Create account")}
              </Button>
            </Form.Item>

            <Form.Item>
              <Row justify="center">
                <Text>
                  {t("Already have an account?")}
                  <Link to="/login">{t("Sign in")}</Link>
                </Text>
              </Row>
            </Form.Item>
          </Form>

          {/* <Row justify="center">
            <Text style={{ fontSize: "85%" }} type="secondary">
              {t("Powered by ODA Open Cloud. ")}
              <DocLink text={t("Learn More")} />
            </Text>
          </Row> */}
        </Flex>
      </div>
    </div>
  );
}

export default Register;
