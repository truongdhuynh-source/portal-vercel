import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, List, notification } from "antd";
import { useTranslation } from "react-i18next";

import ProjectCard from "./ProjectCard";
import { ProjectsService } from "@/services";
import { AppContext } from "@/AppContext";

function ProjectList({ refreshId }) {
  const { app } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pageSize: 24 });
  const [projects, setProjects] = useState({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    ProjectsService.getProjects(pagination.page, pagination.pageSize)
      .then((projects) => {
        console.log(projects);
        setProjects(projects);
      })
      .catch((e) => {
        console.error("Cannot get projects.", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot get projects"),
        });
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [pagination, refreshId, app, t]);

  const emptyText = error
    ? t("Error loading projects")
    : loading
      ? t("Loading projects. Please  wait...")
      : t("No projects. To add a new project, click New Project button.");

  return (
    <List
      rowKey="id"
      loading={loading}
      grid={{ gutter: 16, xxl: 6, xl: 4, lg: 3, md: 2, sm: 1, xs: 1 }}
      pagination={
        projects.allSize > 0 &&
        projects.allSize >= projects.limit && {
          ...pagination,
          total: projects.allSize,
          showSizeChanger: true,
          showLessItems: true,
          responsive: true,
          disabled: loading,
          size: "small",
          onChange: (page, pageSize) => setPagination({ page, pageSize }),
        }
      }
      dataSource={projects.result}
      renderItem={(project) => (
        <List.Item key={project.id}>
          <ProjectCard
            project={project}
            onClick={() => {
              app.setProject(project);
              navigate(`/project/${project.id}`);
            }}
          />
        </List.Item>
      )}
      locale={{ emptyText: <Empty description={emptyText} /> }}
    />
  );
}

export default ProjectList;
