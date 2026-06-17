import StatusBadge from "@/components/StatusBadge";
import { feedbackStatus, priorityStatus } from "@/models/feedback";
import { formatDate } from "@/utils/functions";
import {
  CalendarIcon,
  MailIcon,
  MilestoneIcon,
  StarIcon,
  TextInitialIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const TaskItemSMRenderer = ({ title, data }) => {
  const { t } = useTranslation();

  return (
    <div className="task-item-sm-renderer py-2">
      <h6 className="title">{title}</h6>
      <p className="content">
        <TextInitialIcon size={16} />
        <span
          style={{
            maxWidth: "250px",
          }}
          className="text-truncate"
        >
          {t("Content")}: {data?.content}
        </span>
      </p>
      <div className="author">
        <MailIcon size={16} />
        <span>
          {t("Author")}: {data?.email}
        </span>
      </div>
      <div className="version">
        <MilestoneIcon size={16} />
        <span>
          {t("Version")}: {data?.version || "--/--"}
        </span>
      </div>
      <div className="rate">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={18}
            color={star <= data?.rate ? "gold" : "gray"}
          />
        ))}
      </div>
      <div className="status">
        <StatusBadge
          condition={data?.status}
          statusList={feedbackStatus}
          useTitle={true}
        />
        <StatusBadge
          condition={data?.priority}
          statusList={priorityStatus}
          useTitle={true}
        />
      </div>
      <div className="date-sent">
        <CalendarIcon size={16} />
        <span>
          {t("Date sent")}:{" "}
          {data?.createAt ? formatDate(data?.createAt) : "--/--"}
        </span>
      </div>
    </div>
  );
};

export default TaskItemSMRenderer;
