import { Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PoweroffOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const JOB_STATUS = {
  NONE: "none",
  WAITING: "waiting",
  IN_PROGRESS: "inprogress",
  DONE: "done",
  FAILED: "failed",
  STUCK: "stuck",
};

const statusMap = [
  {
    status: JOB_STATUS.NONE,
    text: JOB_STATUS.NONE,
    color: "default",
    icon: <PoweroffOutlined />,
  },
  {
    status: JOB_STATUS.WAITING,
    text: JOB_STATUS.WAITING,
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  {
    status: JOB_STATUS.IN_PROGRESS,
    text: JOB_STATUS.IN_PROGRESS,
    color: "processing",
    icon: <SyncOutlined spin />,
  },
  {
    status: JOB_STATUS.DONE,
    text: JOB_STATUS.DONE,
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  {
    status: JOB_STATUS.FAILED,
    text: JOB_STATUS.FAILED,
    color: "error",
    icon: <ExclamationCircleOutlined />,
  },
  {
    status: JOB_STATUS.STUCK,
    text: JOB_STATUS.STUCK,
    color: "warning",
    icon: <WarningOutlined />,
  },
];

const StatusTag = ({ className, status, name, tooltip }) => {
  const { t } = useTranslation();
  const item = statusMap.find((x) => x.status === status) || {
    status: "unknown",
    color: "default",
  };
  return (
    <div className={className}>
      <Tooltip title={tooltip}>
        <Tag color={item.color} icon={item.icon}>
          {name ?? t(item.text)}
        </Tag>
      </Tooltip>
    </div>
  );
};

export { JOB_STATUS, statusMap };

export default StatusTag;
