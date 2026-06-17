import React from "react";
import { Badge } from "antd";
import { useTranslation } from "react-i18next";
import "./StatusBadge.css";
import useScreen from "@/hooks/useScreen";

const StatusBadge = ({ condition, statusList = [], useTitle = false }) => {
  const { t } = useTranslation();

  const status = statusList.find((item) => item.value === condition);
  const { isMobile } = useScreen();

  const badgeText = isMobile
    ? `${t(status?.title)}: ${t(status?.label)}`
    : t(status?.label);
  const finishBadgeText = useTitle ? badgeText : t(status?.label);

  return (
    <Badge
      className="status-column"
      key={condition}
      color={status?.color || "gray"}
      text={status?.label ? finishBadgeText : "--/--"}
    />
  );
};

export default StatusBadge;
