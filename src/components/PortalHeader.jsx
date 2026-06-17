import React from "react";
import { PageHeader } from "@ant-design/pro-layout";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import "./PortalHeader.css";

const PortalHeader = ({ title, isBack, extra, className, style }) => {
  const navigate = useNavigate();
  const isFullView = sessionStorage.getItem("isFullView") === "true";
  const onBack = () => {
    navigate(-1);
  };

  return (
    <div
      className={className}
      style={{ display: isFullView ? "none" : "block", ...style }}
    >
      <PageHeader
        className={classNames("page-header", className)}
        title={title}
        onBack={isBack ? onBack : undefined}
        extra={extra}
      />
    </div>
  );
};

export default PortalHeader;
