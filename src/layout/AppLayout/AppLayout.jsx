import React, { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import "./AppLayout.css";
import LayoutHeader from "@/layout/Header/LayoutHeader";
import DrawerSidebar from "@/layout/Sidebar/DrawerSidebar";
import Sidebar from "@/layout/Sidebar/Sidebar";
import useScreen from "@/hooks/useScreen";
import { useDispatch, useSelector } from "react-redux";
import { fetchStorageConnections } from "@/redux/features/storageCloud/storageCloud.slice";

const { Content } = Layout;

function AppLayout() {
  const { isMobile } = useScreen();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  const onMenuClick = useCallback(() => setOpen(true), []);
  const isFullView = sessionStorage.getItem("isFullView") === "true";
  const isAdminMode = useSelector((state) => state.app.isAdminMode);

  useEffect(() => {
    dispatch(fetchStorageConnections())
      .unwrap()
      .catch((e) => message.error(t("Failed to load storage connections.")));
  }, [dispatch]);

  return (
    <div className="section-main">
      <Layout style={{ minHeight: "calc(100dvh - 47px)" }} className="bg-white">
        {!isAdminMode &&
          (isMobile ? (
            <DrawerSidebar open={open} onClose={onClose} />
          ) : (
            <Sidebar theme="light" active="Files" />
          ))}
        <Content>
          {!isAdminMode && <LayoutHeader onMenuClick={onMenuClick} />}
          <section
            className={`layout-body ${isAdminMode ? "admin-height" : ""} ${isMobile ? "mobile" : ""} ${isFullView ? "full-view" : ""}`}
          >
            <div className={isAdminMode ? "no-padding" : "layout-container"}>
              <div className={`layout-content ${isAdminMode ? "admin-height" : ""}`}>
                <Outlet />
              </div>
            </div>
          </section>
        </Content>
      </Layout>
    </div>
  );
}

export default AppLayout;
