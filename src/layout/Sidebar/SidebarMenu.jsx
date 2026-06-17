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

import classNames from "classnames";
import { Button, Avatar, Dropdown } from "antd";
import axiosInstance from "@/plugins/axios";
import SidebarTopMenu from "./SidebarTopMenu";
import logoVinas from "@/assets/images/logo-vinas.png";
import SidebarTrigger from "@/layout/Sidebar/SidebarTrigger";
import useScreen from "@/hooks/useScreen";
import SidebarBottomMenu from "@/layout/Sidebar/SidebarBottomMenu";
import Cookies from "js-cookie";
import getUserIdLogin from "@/utils/getUserIdLogin";
import { REFRESH_TOKEN_KEY } from "@/constants";
import logo from "@/assets/images/logo-vinacad.png";

function SidebarMenu({ className, onClose }) {
  const { isMobile, isTablet } = useScreen();
  const menuClasses = classNames(className, "d-flex flex-column");
  const user_vina_id = getUserIdLogin();
  const rf = Cookies.get(`${REFRESH_TOKEN_KEY}_${user_vina_id}`);

  const openVinaCAD = async () => {
    const res = await axiosInstance.post("/oauth/auth-code", {
      code: rf,
    });

    const { accessToken, refreshToken } = res.data;
    window.open(
      `vinacad://app=vinacad&ac=${accessToken}&rf=${refreshToken}&ot=${odaToken}&u=${userId}`,
      "_self",
    );
  };
  const openVinaBIM = async () => {
    await axiosInstance.post("/app-logger", {
      action: "open",
      version: "VINABIMWeb",
      email: user?.email,
    });
    window.open(`${import.meta.env.VITE_APP_VINABIM}?code=${rf}`, "_blank");
  };
  return (
    <div
      className={menuClasses}
      style={{ overflowX: "hidden", overflowY: "auto" }}
    >
      <SidebarTopMenu onClose={onClose} />
      {/* <SidebarProjectMenu /> */}
      {/* <div className="flex-grow-1 " /> */}
      <SidebarBottomMenu />
      {!isMobile && <SidebarTrigger className="mt-auto border-top" />}
      {/* <div
        className="left-wrap mr-3 pr-3"
        style={{
          borderRight: "1px solid #d9d9d9",
          position: "absolute",
          bottom: 0,
        }}
      >
        {!isMobile && (
          <div className="d-flex align-items-center">
            {!isTablet && (
              <Button
                className="btn-redirect app-btn vinacad-btn"
                onClick={openVinaCAD}
              >
                <div className="d-flex align-items-center">
                  <img
                    style={{ width: 16, height: 16 }}
                    src={logo}
                    alt="Logo"
                  />
                  <p className="mb-0 ml-1">VinaCAD App</p>
                </div>
              </Button>
            )}

            <Button
              className="btn-bim btn-redirect app-btn vinas-btn border-0"
              onClick={openVinaBIM}
            >
              <div className="d-flex align-items-center">
                <img
                  style={{ width: 16, height: 16 }}
                  src={logoVinas}
                  alt="Logo"
                />
                <p className="mb-0 ml-1">VinaS</p>
              </div>
            </Button>
          </div>
        )}
      </div> */}
    </div>
  );
}

export default SidebarMenu;
