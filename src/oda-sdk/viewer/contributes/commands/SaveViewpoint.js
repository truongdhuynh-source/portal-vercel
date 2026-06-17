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

import { notification } from "antd";
import i18next from "i18next";
const t = i18next.t;

export function saveViewpoint({ viewer, activeModel }) {
  const rawViewpoint = viewer.createViewpoint();
  const captureSnapshot = () => {
    const baseCanvas = document.querySelector("#canvas");
    const overlayCanvas = document.querySelector("#markup-container canvas");
    const layerDiv = document.getElementById("oda-viewer-markup-layer");

    if (!baseCanvas) return null;

    const w = baseCanvas.width;
    const h = baseCanvas.height;
    const dpr = window.devicePixelRatio || 1;

    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = Math.round(w * dpr);
    mergedCanvas.height = Math.round(h * dpr);
    mergedCanvas.style.width = `${w}px`;
    mergedCanvas.style.height = `${h}px`;

    const ctx = mergedCanvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // vẽ base
    ctx.drawImage(baseCanvas, 0, 0, w, h);
    // vẽ overlay
    if (overlayCanvas) ctx.drawImage(overlayCanvas, 0, 0, w, h);
    // vẽ markup
    if (layerDiv) drawMarkupLayer(ctx, baseCanvas, layerDiv);

    return mergedCanvas.toDataURL("image/jpeg", 0.92);
  };

  const viewpoint = {
    ...rawViewpoint,
    snapshot: {
      data: captureSnapshot(),
    },
  };

  activeModel
    .saveViewpoint(viewpoint)
    .then((data) => {
      viewer.emitEvent({ type: "saveviewpoint", data });
      notification.success({
        message: t("Success"),
        description: t("Viewpoint saved"),
      });
    })
    .catch((e) => {
      console.error("Cannot save viewpoint.", e);
      notification.error({
        message: t("Error"),
        description: t("Cannot save viewpoint"),
      });
    });
}
