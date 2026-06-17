import dayjs from "dayjs";
import { Card, Col, Image, Row, Statistic, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text, Paragraph } = Typography;

function ProjectCard({ project, ...rest }) {
  console.log(project)
  const { t, i18n } = useTranslation();
  const fallbackImg = `data:image/svg+xml;utf8,<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
  return (
    <Card {...rest} rootClassName="project-item">
      <Image
        className="img-thumbnail"
        src={project.previewUrl || ""}
        fallback={fallbackImg}
        placeholder={true}
        preview={false}
        loading="lazy"
      />
      <div className="item-body">
        <Card.Meta
          className="item-meta"
          title={project.name}
          description={
            <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12 }}>
              {project.description}
            </Paragraph>
          }
        />
        <Row gutter={16} className="item-info">
          <Col span={7}>
            <Statistic title={t("Models")} value={project.modelCount} />
          </Col>
          <Col span={10}>
            <Statistic title={t("Members")} value={project.memberCount} />
          </Col>
          <Col span={7}>
            <Statistic title={t("Issues")} value={project.topicCount} />
          </Col>
        </Row>
        <Row wrap={false} className="mt-2">
          <Col flex="auto">
            <Tooltip title={dayjs(project.updatedAt).format("L LT")}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("Last update")}:{" "}
                {dayjs(project.updatedAt).locale(i18n.language).fromNow()}
              </Text>
            </Tooltip>
          </Col>
        </Row>
      </div>
    </Card>
  );
}

export default ProjectCard;
