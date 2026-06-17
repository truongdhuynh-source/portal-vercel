import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "antd";

import "./LanguageSwitcher.css";
import { ChevronDown } from "lucide-react";
import useScreen from "@/hooks/useScreen";
import classNames from "classnames";
import { LANGUAGE_MAP } from "@/constants";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { isMobile } = useScreen();
  const handleLanguageChange = useCallback(
    (code) => {
      i18n.changeLanguage(code);
      createEventToTrackingSession({
        event: "change_language",
        meta: createTeraTrackingPageMeta("language_switcher", {
          action: "change_language",
          language: code,
        }),
      });
    },
    [i18n],
  );

  const currentLanguage = LANGUAGE_MAP[i18n.language] || LANGUAGE_MAP.en;

  const menuItems = useMemo(
    () =>
      Object.entries(LANGUAGE_MAP).map(([code, { name, image }]) => ({
        key: code,
        onClick: () => handleLanguageChange(code),
        label: (
          <div className="d-flex align-items-center">
            <img
              src={image}
              alt={name}
              className="language-img mr-2"
              width="36"
              height="24"
            />
            <p className="language-title mb-0">{name}</p>
          </div>
        ),
      })),
    [handleLanguageChange],
  );

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["click"]}
      placement="bottomRight"
      className={classNames("language-switcher-dropdown", { mobile: isMobile })}
    >
      <div className="language-dropdown cursor-pointer">
        <div className="icon-body">
          <img
            src={currentLanguage.image}
            alt="language"
            width="40"
            height="28"
          />
        </div>
        <span className="language-name mr-1">{currentLanguage.name}</span>
        <ChevronDown size={20} />
      </div>
    </Dropdown>
  );
};

export default React.memo(LanguageSwitcher);
