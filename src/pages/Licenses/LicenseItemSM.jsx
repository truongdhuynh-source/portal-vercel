import React from "react";
import { useTranslation } from "react-i18next";
import { licenseType } from "@/models/license";
import LicenseItemSMRenderer from "@/pages/Licenses/LicenseItemSMRenderer";

export const LicenseItemSM = ({ data, currentPage, perPage, index }) => {
  const { t } = useTranslation();
  const number = (currentPage - 1) * perPage + index + 1;

  const items = [
    { label: "#", value: number },
    { label: t("Product"), value: data?.productName },
    {
      label: t("License status"),
      type: "status",
      value: data?.status ? "ACTIVE" : "EXPIRED",
      options: { statusList: licenseType },
    },
    {
      label: t("Start date"),
      type: "date",
      value: data?.validFrom,
    },
    {
      label: t("End date"),
      type: "date",
      value: data?.validTo,
    },
  ];
  const title = `#${number} • ${data?.displayName ?? data?.productName}`;

  return <LicenseItemSMRenderer title={title} items={items} data={data} />;
};
