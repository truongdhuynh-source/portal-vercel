import { useState } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import ProjectList from "./ProjectList";
import ProjectCreateModal from "./ProjectCreateModal";
import PortalHeader from "@/components/PortalHeader";

import "./Projects.css";

function Projects() {
  const [refreshId, setRefreshId] = useState();
  const [projectCreateModal, setProjectCreateModal] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="projects-page h-100 d-flex flex-column">
      <PortalHeader
        title={t("Projects")}
        extra={[
          <Button
            key="create"
            type="primary"
            onClick={() => setProjectCreateModal(true)}
          >
            <PlusOutlined />
            <span className="d-none d-lg-inline">{t("Create Project")}</span>
          </Button>,
        ]}
      />
      <div className="projects-container p-3 align-self-stretch overflow-auto mt-2">
        <ProjectList refreshId={refreshId} />
      </div>
      <ProjectCreateModal
        visible={projectCreateModal}
        onCreate={() => {
          setProjectCreateModal(false);
          setRefreshId(new Date());
        }}
        onClose={() => setProjectCreateModal(false)}
      />
    </div>
  );
}

export default Projects;
