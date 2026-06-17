import React, { useEffect, useState } from "react";
import { Button, Drawer, Space } from "antd";
import SidebarMenu from "./SidebarMenu";
import "./DrawerSidebar.css";
import axiosInstance from "../../plugins/axios";
import getUserIdLogin from "../../utils/getUserIdLogin";
import Cookies from "js-cookie";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_ODA,
  USER_VINA,
} from "../../constants";
import logo from "../../assets/images/logo-vinacad.png";
import logoVinas from "../../assets/images/logo-vinas.png";
import { XIcon } from "lucide-react";

function DrawerSidebar({ open, onClose }) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const userId = urlParams.get("u");
  const user_vina_id = getUserIdLogin();
  const rf = Cookies.get(`${REFRESH_TOKEN_KEY}_${user_vina_id}`);
  const ac = Cookies.get(`${ACCESS_TOKEN_KEY}_${user_vina_id}`);
  const odaToken = JSON.parse(
    localStorage.getItem(`${USER_ODA}_${user_vina_id}`),
  )?.tokenInfo.token;
  const [user, setUser] = useState({});

  const userObj = localStorage.getItem(`${USER_VINA}_${user_vina_id}`) || "{}";
  useEffect(() => {
    const parsedUser = JSON.parse(userObj);
    setUser(parsedUser);
  }, [userObj]);

  const openVinaCAD = () => {
    window.open(
      `vinacad://ac=${ac}&rf=${rf}&ot=${odaToken}&u=${userId}`,
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
    <Drawer
      className="drawer-sidebar"
      placement="left"
      closable={false}
      onClose={onClose}
      title={
        <div className="logo-wrap w-100 pl-3 pt-1">
          <img
            src={logo}
            alt="Logo"
            className="logo"
            onClick={() => navigate("/")}
          />
          <span className="logo-text">VinaCAD</span>
        </div>
      }
      open={open}
      extra={
        <XIcon className="close-icon" onClick={onClose} size={20} />
        // <div className="d-flex">
        //   <Button className="btn-redirect" onClick={openVinaCAD}>
        //     <div className="d-flex align-items-center">
        //       <img style={{ width: 16, height: 16 }} src={logo} alt="Logo" />
        //       <p className="mb-0 ml-1">VinaCAD</p>
        //     </div>
        //   </Button>

        //   <Button className="btn-bim btn-redirect" onClick={openVinaBIM}>
        //     <div className="d-flex align-items-center">
        //       <img
        //         style={{ width: 16, height: 16 }}
        //         src={logoVinas}
        //         alt="Logo"
        //       />
        //       <p className="mb-0 ml-1">VinaS</p>
        //     </div>
        //   </Button>
        // </div>
      }
    >
      <SidebarMenu onClose={onClose} className="sidebar-menu h-100" />
    </Drawer>
  );
}

export default DrawerSidebar;
