import React from "react";
import { Layout } from "antd";

import SidebarLogo from "./SidebarLogo";
import SidebarMenu from "./SidebarMenu";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "@/redux/features/sidebar/sidebarSlice";
import "./Sidebar.css";

function Sidebar() {
  const isFullView = sessionStorage.getItem("isFullView") === "true";
  const collapsed = useSelector((state) => state.sideBar.collapsed);
  const dispatch = useDispatch();

  return (
    <Layout.Sider
      style={{ display: isFullView ? "none" : "block" }}
      className="d-print-none"
      collapsible
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      onCollapse={() => dispatch(toggleSidebar())}
      width={220}
    >
      <div className="h-100 d-flex flex-column">
        <SidebarLogo />
        <SidebarMenu className="sidebar-menu flex-grow-1" />
      </div>
    </Layout.Sider>
  );
}

export default Sidebar;
