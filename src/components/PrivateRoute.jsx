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
import Cookies from "js-cookie";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_VINA,
  USER_ODA,
  AUTH_USERS,
  LOGOUT_SYNC_KEY,
} from "../constants";
import { useTranslation } from "react-i18next";
import redirectToPortalLogin from "../utils/syncAuthAcrossTabs";

function PrivateRoute({ user, fallback, element }) {
  const searchParams = new URLSearchParams(window.location.search);
  const sharedFiles = searchParams.get('sharedFiles');
  const { i18n } = useTranslation();

  if (!user) {
    const isReturnApp = sessionStorage.getItem("isReturnApp");
    const authUser = JSON.parse(localStorage.getItem(AUTH_USERS)) || [];
    if (authUser.length) {
      authUser.map((item) => {
        Cookies.remove(`${ACCESS_TOKEN_KEY}_${item.id}`);
        Cookies.remove(`${REFRESH_TOKEN_KEY}_${item.id}`);
        localStorage.removeItem(`${USER_VINA}_${item.id}`);
        localStorage.removeItem(`${USER_ODA}_${item.id}`);
      });
      localStorage.removeItem(AUTH_USERS);
    }
    localStorage.setItem(LOGOUT_SYNC_KEY, `${Date.now()}`);
    redirectToPortalLogin({
      isApp: isReturnApp === "true",
      sharedFiles: sharedFiles === "true",
      fallbackLang: i18n.resolvedLanguage || "en",
      deferIfHidden: true,
    });
  }

  return element;
}

export default PrivateRoute;
