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
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, notification, Result } from "antd";
import { MailTwoTone } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Buffer } from "buffer";

import ClientFactory from "../../ClientFactory";

function Confirm() {
  const client = ClientFactory.get();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const user = searchParams.get("user");
  const from = searchParams.get("from") || "login";
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(false);

  useEffect(() => {
    try {
      const [email, password] = Buffer.from(user, "base64").toString("utf8").split(":");
      setEmail(email);
      setPassword(password);
    } catch (e) {
      navigate("/");
    }
  }, [user, navigate]);

  function resendEmail() {
    setLoading(true);
    client
      .resendConfirmationEmail(email, password)
      .then(() => {
        setResend(true);
        setTimeout(() => setResend(false), 10000);
        notification.success({
          message: t("Success"),
          description: t("Confirmation email has been resent"),
        });
      })
      .catch((e) => {
        console.error("Cannot resend confirmation email.", e);
        if (e.status === 403) {
          notification.success({
            message: t("Success"),
            description: t("User email already confirmed"),
          });
          navigate("/");
        } else {
          notification.error({
            message: t("Error"),
            description: t("Cannot resend confirmation email"),
          });
        }
      })
      .finally(() => setLoading(false));
  }

  const messages = {
    register: {
      subTitle1: t("To complete registration, please confirm your email."),
      subTitle2: t("We have sent an email with a confirmation link to your email address."),
      extra: t("Continue"),
    },
    login: {
      subTitle1: t("We need to confirm your email."),
      subTitle2: t("Check your inbox and follow the link in the confirmation email."),
      extra: t("Back to Login"),
    },
  };

  return (
    <Result
      icon={<MailTwoTone />}
      title={t("Confirmation required")}
      subTitle={
        <div>
          <div>
            <span>{messages[from].subTitle1}</span>
            <span> </span>
            <span>{messages[from].subTitle2}</span>
          </div>
          <div className="my-4 d-flex justify-content-center align-items-center">
            <span>{resend ? t("Email has been re-sent") : t("Didn't get an email?")}</span>
            <Button
              className="px-1 py-0"
              style={{
                height: "auto",
                border: "none",
                display: resend ? "none" : undefined,
              }}
              type="link"
              loading={loading}
              onClick={resendEmail}
            >
              {t("Resend")}
            </Button>
          </div>
        </div>
      }
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          {messages[from].extra}
        </Button>
      }
    />
  );
}

export default Confirm;
