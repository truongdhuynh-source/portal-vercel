import React from "react";
import bytes from "bytes";
import { useTranslation } from "react-i18next";
import "./StorageUsage.css";
import { InfoIcon } from "lucide-react";

const StorageUsage = ({ storageLimit = 0, userFileInfo = {} }) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const used = userFileInfo.totalSize || 0; // BYTE
  const percent = storageLimit ? Math.min((used / storageLimit) * 100, 100) : 0;

  const getColor = () => {
    if (percent > 90) return "#ff4d4f";
    if (percent > 75) return "#faad14";
    return "#1677ff";
  };
  return (
    <div className="storage-usage">
      <div className="usage-title" style={{ fontSize: "10px" }}>
        <span>{t("Has been use")}:</span>
        <span className="usage-value">
          {bytes(used)} / {bytes(storageLimit)}
        </span>
      </div>

      {/* <Progress
          rootClassName="usage-progress-bar"
          percent={percent}
          showInfo={false}
          strokeColor={getColor()}
        /> */}

      <p
        className="mb-0 text-primary"
        style={{ fontSize: language === "ja" ? "8px" : "10px" }}
      >
        {t("Free 2GB")}
        <a
          href={`${import.meta.env.VITE_APP_CONTACT}/${language}/lead/${import.meta.env.VITE_APP_CONTACT_ID}`}
          target="_blank"
          rel="noreferrer"
          className="font-weight-bold"
          style={{ fontSize: "11px" }}
        >
          {t("Contact")}
        </a>
        {t("Us")}
      </p>
    </div>
  );
};

export default StorageUsage;
