///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2021, Open Design Alliance (the "Alliance").
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
//   Open Design Alliance Copyright (C) 2002-2021 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from "react";
import { notification, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";
import DefaultIcon from "../../../assets/icons/viewpoint-default.svg";

export function ViewpointCard({
  activeModel,
  viewpoint,
  onClick,
  onDelete,
  sharedLink,
}) {
  const [snapshot, setSnapshot] = useState(DefaultIcon);

  useEffect(() => {
    activeModel
      ?.getSnapshot(viewpoint.guid)
      .then((snapshot) => setSnapshot(snapshot))
      .catch((e) =>
        console.error(
          `Cannot load snapshot for viewpoint ${viewpoint.description}.`,
          e
        )
      );
  }, [activeModel, viewpoint]);

  return (
    <div className="card mb-1" style={{ borderRadius: "0" }}>
      <img
        className="card-img-top"
        style={{
          width: "100%",
          height: "192px",
          objectFit: "contain",
          cursor: "pointer",
        }}
        src={snapshot}
        alt="Snapshot"
        onClick={onClick}
      />
      <div className="card-body px-2 py-0">
        <h5 className="card-title">
          {viewpoint.description}
          {sharedLink ? null : (
            <DeleteOutlined
              className="large-icon"
              style={{ cursor: "pointer", float: "right" }}
              onClick={onDelete}
            />
          )}
        </h5>
      </div>
    </div>
  );
}

export function ViewpointsWindow({
  viewer,
  activeModel,
  visible,
  onClose,
  ...props
}) {
  const [loading, setLoading] = useState(false);
  const [viewpoints, setViewpoints] = useState([]);
  const [error, setError] = useState();
  const { t } = useTranslation();
  const { onMode, onDragger, sharedLink } = props;

  useEffect(() => {
    if (activeModel) {
      setLoading(true);
      activeModel
        .getViewpoints()
        .then((viewpoints) => {
          setViewpoints(viewpoints);
          setError();
        })
        .catch((e) => {
          console.error("Cannot load model viewpoints.", e);
          setViewpoints([]);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    } else {
      setViewpoints([]);
      setError();
    }
  }, [activeModel]);

  useEffect(() => {
    function onSaveViewpoint({ data }) {
      setViewpoints(viewpoints.concat([data]));
    }

    if (!viewer) return;

    viewer.addEventListener("saveviewpoint", onSaveViewpoint);
    return () => viewer.removeEventListener("saveviewpoint", onSaveViewpoint);
  }, [viewer, viewpoints]);

  function handleDelete(viewpoint) {
    activeModel
      .deleteViewpoint(viewpoint.guid)
      .then(() => {
        setViewpoints(viewpoints.filter((x) => x.guid !== viewpoint.guid));
        notification.success({
          message: t("Success"),
          description: t("Viewpoint deleted"),
        });
      })
      .catch((e) => {
        console.error("Cannot delete viewpoint.", e);
        notification.error({
          message: t("Error"),
          description: t("Cannot delete viewpoint"),
        });
      });
  }

  function handleSelect(viewpoint) {
    viewer.drawViewpoint(viewpoint);
    onDragger(sharedLink ? "Pan" : "Line");
    onMode("markup");
    notification.success({
      message: t("Success"),
      description: t("Viewpoint loaded"),
    });
  }

  return (
    <Window title={t("Viewpoints")} visible={visible} onClose={onClose}>
      {loading ? (
        <Spin spinning={loading}>
          {loading && <div style={{ minHeight: 53 }} />}
        </Spin>
      ) : viewpoints.length > 0 ? (
        viewpoints.map((x, index) => (
          <ViewpointCard
            key={index}
            activeModel={activeModel}
            viewpoint={x}
            onClick={() => handleSelect(x)}
            onDelete={() => handleDelete(x)}
            sharedLink={sharedLink}
          />
        ))
      ) : error ? (
        <div className="d-flex justify-content-center text-danger p-2">
          {error}
        </div>
      ) : (
        <div
          className="d-flex justify-content-center text-muted p-2"
          data-testid="no-viewpoints"
        >
          {t("No viewpoints saved for current model")}
        </div>
      )}
    </Window>
  );
}
