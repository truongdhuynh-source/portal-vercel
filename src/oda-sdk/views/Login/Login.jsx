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

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Button, Checkbox, Divider, Flex, Form, Input, notification, Row, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Buffer } from "buffer";

import { AppContext } from "@/AppContext";
import { DocLink } from "../../components";
import ClientFactory from "../../ClientFactory";

import logoImage from "../../assets/images/logo.svg";
import "./Login.css";

const { Title, Text } = Typography;

function Login() {
  const { app } = useContext(AppContext);
  const client = ClientFactory.get();
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    app
      .loadConfig()
      .then(() => client.getIdentityProviders())
      .then((providers) => setProviders(providers))
      .catch((e) => console.error("Cannot get identity providers.", e));
  }, [app, client]);

  function signIn(email, password, rememberMe) {
    setLoading(true);
    app
      .login(email, password, rememberMe)
      .catch((e) => {
        console.error("Cannot login.", e);
        if (e.status === 401) {
          setError("Incorrect username or password");
        } else if (e.status === 403) {
          const searchParams = new URLSearchParams();
          searchParams.set("user", Buffer.from(email + ":" + password, "utf8").toString("base64"));
          searchParams.set("from", "login");
          navigate("/confirm?" + searchParams.toString());
        } else if (e.status === 409) {
          setError("There is more than one user with this username on the server, please use email instead.");
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
    <div className="login-fullscreen">
      <div className="login-fullscreen--center">
        <Flex className="login-content" gap="large" vertical>
          <Row justify="center">
            <img src={logoImage} className="login-logo" />
          </Row>

          <Row justify="center">
            <Title level={4}>{t("Sign in")}</Title>
          </Row>

          <Form
            name="login"
            layout="vertical"
            requiredMark={false}
            initialValues={{
              email: "",
              password: "",
              rememberMe: false,
            }}
            onFinish={(values) => {
              const { email, password, rememberMe } = values;
              signIn(email, password, rememberMe);
            }}
          >
            {error && (
              <Form.Item>
                <Alert message={t(error)} type="error" onClick={() => setError()} closable />
              </Form.Item>
            )}

            <Form.Item
              label={t("Username or Email")}
              name="email"
              rules={[{ required: true, message: t("Please enter a username or email") }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t("Password")}
              name="password"
              rules={[{ required: true, message: t("Please enter password") }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item name="rememberMe" valuePropName="checked">
              <Checkbox>{t("Remember me")}</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" block htmlType="submit" loading={loading === true}>
                {t("Sign in")}
              </Button>
            </Form.Item>

            {providers.length > 0 && (
              <React.Fragment>
                <Divider plain>{t("Or continue with")}</Divider>
                <Form.Item>
                  <Flex gap="middle" vertical>
                    {providers.map((provider) => (
                      <Button
                        key={provider.name}
                        block
                        loading={loading === provider.name}
                        onClick={() => {
                          setLoading(provider.name);
                          window.open(provider.url, "_self");
                        }}
                      >
                        {provider.name}
                      </Button>
                    ))}
                  </Flex>
                </Form.Item>
              </React.Fragment>
            )}

            <Form.Item>
              <Row justify="center">
                <Text>
                  {t("New to Cloud Viewer?")}
                  <Link to="/register">{t("Create an account")}</Link>
                </Text>
              </Row>
            </Form.Item>
          </Form>

          <Row justify="center">
            <Text style={{ fontSize: "85%" }} type="secondary">
              {t("Powered by ODA Open Cloud.")}
              <DocLink text={t("Learn More")} />
            </Text>
          </Row>
        </Flex>
      </div>
    </div>
  );
}

export default Login;
