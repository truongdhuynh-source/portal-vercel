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

import React, { useState, useEffect, useRef } from "react";
import { Viewer } from "@inweb/viewer-visualize";

import { VisualizeProgress } from "../VisualizeProgress";

export function VisualizeViewer({ client, app, onInit, onInitError }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef();

  // Override visualizeJsUrl below (or in public/config.json) to use your
  // own VisualizeJS library URL, or leave it undefined or blank to use
  // the default URL defined by the Client.js you are using.
  //
  // Note: Your own VisualizeJS library version must match the version of
  // the Client.js you are using.

  const visualizeJsUrl = app.config.visualizejs_url;

  useEffect(() => {
    const viewer = new Viewer(client, { visualizeJsUrl });

    const onProgress = (event) => {
      const progress = event.total ? (100 * event.loaded) / event.total : 0;
      setProgress(progress);
    };

    setProgress(0);
    setLoading(true);
    viewer
      .initialize(canvasRef.current, onProgress)
      .then((viewer) => onInit(viewer))
      .catch((e) => onInitError(e))
      .finally(() => setLoading(false));

    return () => {
      viewer.dispose();
    };
  }, [client, visualizeJsUrl, onInit, onInitError]);

  return (
    <React.Fragment>
      <canvas id="canvas" ref={canvasRef} />
      <VisualizeProgress loading={loading} value={progress} />
    </React.Fragment>
  );
}
