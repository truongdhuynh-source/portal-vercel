///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2025, Open Design Alliance (the "Alliance").
// All rights reserved.
//
// This software and its documentation and related materials are owned by
// the Alliance. The software may only be incorporated into application
// programs owned by members of the Alliance, subject to a signed
// Membership Agreement and Supplemental Software License Agreement with the
// Alliance. The structure and organization of this software are the valuable
// trade secrets of the Alliance and its suppliers. The software is also
// protected by copyright law and international treaty provisions. Application
// programs incorporating this software must include the following statement
// with their copyright notices:
//
//   This application incorporates Open Design Alliance software pursuant to a
//   license agreement with Open Design Alliance.
//   Open Design Alliance Copyright (C) 2002-2025 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Divider, Empty, notification, Space, Spin } from "antd";
import { PageHeader } from "@ant-design/pro-layout";
import { useTranslation } from "react-i18next";

import { ProjectsService } from "@/services";
import GeneralSettings from "./GeneralSettings";
import ProjectPreview from "./ProjectPreview";
import ProjectDelete from "./ProjectDelete";
import { AppContext } from "@/AppContext";

function ProjectSettings() {
  const { app } = useContext(AppContext);
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    ProjectsService.getProject(projectId)
      .then((project) => {
        setProject(project);
        app.setProject(project);
      })
      .catch((e) => {
        console.error("Cannot get project info.", e);
        setProject();
        app.setProject();
        setError(e.message);
        notification.error({ message: t("Error"), description: t("Project not found or access denied") });
      })
      .finally(() => setLoading(false));
  }, [projectId, app, t]);

  const emptyText = error ? t("Project not found or access denied") : " ";

  return (
    <div className="h-100 d-flex flex-column">
      <PageHeader backIcon={false} title={t("Project Settings")} />
      <div className="align-self-stretch overflow-auto bg-gray p-3">
        <div style={{ margin: "auto", maxWidth: 1000 }}>
          <Spin spinning={loading}>
            {loading ? (
              <div style={{ minHeight: 53 }} />
            ) : project ? (
              <Space style={{ width: "100%" }} direction="vertical" split={<Divider />}>
                <GeneralSettings project={project} />
                <ProjectPreview project={project} />
                <ProjectDelete project={project} />
              </Space>
            ) : (
              <Empty description={emptyText}>
                <Button type="primary" onClick={() => navigate("/projects")}>
                  {t("Back to Projects")}
                </Button>
              </Empty>
            )}
          </Spin>
        </div>
      </div>
    </div>
  );
}

export default ProjectSettings;
