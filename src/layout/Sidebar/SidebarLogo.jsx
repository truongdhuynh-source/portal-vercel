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

import React from "react";
import "./SidebarLogo.css";
import { Link } from "react-router-dom";
import logo from "@/assets/images/logo-vinacad.png";
import { useSelector } from "react-redux";

function SidebarLogo() {
  const collapsed = useSelector((state) => state.sideBar.collapsed);
  const lang = localStorage.getItem("i18nextLng");
  const scope = localStorage.getItem("scope");

  return (
    <div className="sidebar-logo justify-content-center">
      <Link
        to={`${scope === "global" ? import.meta.env.VITE_APP_VINACAD_APP_URL_G : import.meta.env.VITE_APP_VINACAD_APP_URL}/${lang}`}
        className="d-flex"
      >
        <img style={{ width: "36px", height: "36px" }} src={logo} alt="Logo" />
        {!collapsed && (
          <span style={{ fontSize: "22px" }} className="mx-3">
            VinaCAD
          </span>
        )}
      </Link>
    </div>
  );
}

export default SidebarLogo;
