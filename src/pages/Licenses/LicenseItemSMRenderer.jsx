import StatusBadge from "@/components/StatusBadge";
import { licenseType } from "@/models/license";
import { formatDate } from "@/utils/functions";
import { CalendarIcon, PackageIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const LicenseItemSMRenderer = ({ title, data }) => {
  const { t } = useTranslation();
  return (
    <div className="license-item-sm-renderer py-2">
      <h6 className="title">{title}</h6>
      <p className="product mb-0">
        <PackageIcon size={16} />
        <span>
          {t("Product")}: {data?.productName}
        </span>
      </p>

      <div className="status">
        <StatusBadge
          condition={data?.status ? "ACTIVE" : "EXPIRED"}
          statusList={licenseType}
          useTitle={true}
        />
      </div>
      <div className="start-date">
        <CalendarIcon size={16} />
        <span>
          {t("Start date")}:{" "}
          {data?.validFrom ? formatDate(data?.validFrom) : "--/--"}
        </span>
      </div>
      <div className="end-date">
        <CalendarIcon size={16} />
        <span>
          {t("End date")}: {data?.validTo ? formatDate(data?.validTo) : "--/--"}
        </span>
      </div>
    </div>
  );
};

export default LicenseItemSMRenderer;
