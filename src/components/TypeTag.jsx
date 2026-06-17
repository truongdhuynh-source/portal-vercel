import React from "react";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

const TypeTag = ({ type, requestLicenseType = [] }) => {
  const licenseType = requestLicenseType.find((item) => item.value === type);
  const { t } = useTranslation();

  return (
    <Tag color={licenseType?.color || "default"}>
      {t(licenseType?.label) || "--/--"}
    </Tag>
  );
};

export default TypeTag;
