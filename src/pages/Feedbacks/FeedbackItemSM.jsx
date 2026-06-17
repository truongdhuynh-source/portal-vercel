import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "antd";
import { StarFilled } from "@ant-design/icons";
import { feedbackStatus } from "@/models/feedback";
import FeedbackItemSMRenderer from "@/pages/Feedbacks/FeedbackItemSMRenderer";

export const FeedbackItemSM = ({ data, currentPage, perPage, index }) => {
  const { t } = useTranslation();
  const number = (currentPage - 1) * perPage + index + 1

  const items = [
    {
      label: "#",
      type: "custom",
      value: number,
      options: {
        render: (value) => (
          <span>
            {value}
            {data?.isReadUser !== 1 && (
              <Badge className="new-badge" count="Mới" />
            )}
          </span>
        ),
      },
    },
    { label: t("Product"), value: data?.productName },
    { label: t("Content"), value: data?.content },
    { label: t("Version"), value: data?.versionNumber },
    {
      label: t("Status"),
      type: "status",
      value: data?.status,
      options: { statusList: feedbackStatus },
    },
    {
      label: t("Rate"),
      type: "custom",
      value: data?.rate,
      options: {
        render: (value) =>
          value != null ? (
            <span>
              {value === 5 ? value : value + 1}
              <StarFilled />
            </span>
          ) : (
            "--/--"
          ),
      },
    },
    {
      label: t("Date sent"),
      type: "date",
      value: data?.createAt,
    },
  ];

  const title = data?.displayName || `#${number} • ${data?.productName}`;
  return <FeedbackItemSMRenderer title={title} items={items} data={data} />;
};
