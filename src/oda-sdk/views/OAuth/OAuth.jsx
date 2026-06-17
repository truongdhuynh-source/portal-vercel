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

import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { notification } from "antd";
import { useTranslation } from "react-i18next";

import { AppContext } from "@/AppContext";
import { Loading } from "../../components";

export function OAuth() {
  const { app } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const token = searchParams.get("token");
  const provider = searchParams.get("provider") || "identity provider";
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const description = `${t("Cannot sign in with")} ${provider}`;
    if (token) {
      app
        .loginWithToken(token)
        .catch((e) => {
          console.log(description, e.message);
          notification.error({ message: t("Error"), description });
        })
        .finally(() => navigate("/"));
    } else {
      if (error) {
        console.log(description, error);
        notification.error({ message: t("Error"), description });
      }
      navigate("/");
    }
  }, [app, navigate, t, error, token, provider]);

  return <Loading />;
}
