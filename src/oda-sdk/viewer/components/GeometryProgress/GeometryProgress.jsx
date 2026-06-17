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
import classNames from "classnames";

export function GeometryProgress({ viewer }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let timerId;

    function onProgress(event) {
      setProgress(event.data * 100);
    }

    function onStart() {
      clearTimeout(timerId);
      setError(false);
      setProgress(0);
      setLoading(true);

      // In partial mode, the "geometryprogress" and "geometryerror" events are
      // fired even after the "geometryend" event. To avoid unnecessary renders,
      // subscribe these events only while the loading is in progress.

      viewer.addEventListener("geometryprogress", onProgress);
      viewer.addEventListener("geometryerror", onEnd);
    }

    function onEnd(event) {
      setError(["geometryerror", "cancel"].includes(event.type));
      setProgress(100);
      timerId = setTimeout(() => setLoading(false), 1500);
      viewer.removeEventListener("geometryprogress", onProgress);
      viewer.removeEventListener("geometryerror", onEnd);
    }

    if (!viewer) return;

    viewer.addEventListener("geometrystart", onStart);
    viewer.addEventListener("geometryend", onEnd);
    viewer.addEventListener("cancel", onEnd);

    return () => {
      clearTimeout(timerId);
      setLoading(false);
      viewer.removeEventListener("geometrystart", onStart);
      viewer.removeEventListener("geometryend", onEnd);
      viewer.removeEventListener("cancel", onEnd);
      viewer.removeEventListener("geometryerror", onEnd);
      viewer.removeEventListener("geometryprogress", onProgress);
    };
  }, [viewer]);

  const opacity = loading ? 1 : 0;
  const widthTransition = progress > 1 ? "width 0.6s ease" : "none";

  return (
    <div
      style={{
        opacity,
        transition: "opacity 0.6s ease",
        display: loading ? "block" : "none",
      }}
      data-testid="geometry-progress"
    >
      <div
        className="progress"
        style={{ height: "2px" }}
        role="progressbar"
        aria-label="Geometry Progress"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={classNames("progress-bar", { "bg-danger": error })}
          style={{ width: `${progress}%`, transition: widthTransition }}
        ></div>
      </div>
    </div>
  );
}
