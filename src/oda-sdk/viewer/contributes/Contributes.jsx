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

import {
  ApartmentOutlined,
  BlockOutlined,
  BarsOutlined,
  BuildOutlined,
  CarryOutOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

import { ModelsDropdown } from "./header/ModelsDropdown";

import { ExplodeDropdown } from "./toolbar/ExplodeDropdown";
import { MarkupLineWidthDropdown } from "./toolbar/MarkupLineWidthDropdown";
import { MarkupFontSizeDropdown } from "./toolbar/MarkupFontSizeDropdown";

import { saveViewpoint } from "./commands/SaveViewpoint";
import { updatePreview } from "./commands/UpdatePreview";

import { AssemblyTransformWindow } from "./windows/AssemblyTransform";
import { ClashTestsWindow } from "./windows/ClashTests";
import { SettingsWindow } from "./windows/Settings";
import { ObjectExplorerWindow } from "./windows/ObjectExplorer";
import { PropertiesWindow } from "./windows/Properties";
import { SearchWindow } from "./windows/Search";
import { ValidateWindow } from "./windows/Validate";
import { ViewpointsWindow } from "./windows/Viewpoints";
import { WalkHelpModal } from "./windows/WalkHelp";

import panImage from "../assets/icons/pan.svg";
import orbitImage from "../assets/icons/orbit.svg";
import zoomImage from "../assets/icons/zoom.svg";
import rulerImage from "../assets/icons/ruler.svg";
import walkImage from "../assets/icons/walk.svg";
import cuttingImage from "../assets/icons/cutting.svg";
import clearImage from "../assets/icons/clear.svg";
import markupImage from "../assets/icons/markup.svg";
import saveImage from "../assets/icons/save-viewpoint.svg";

import cuttingXImage from "../assets/icons/cutting-x.svg";
import cuttingYImage from "../assets/icons/cutting-y.svg";
import cuttingZImage from "../assets/icons/cutting-z.svg";

import markupSelectImage from "../assets/icons/markup-select.svg";
import markupPenImage from "../assets/icons/markup-pen.svg";
import markupTextImage from "../assets/icons/markup-text.svg";
import markupArrowImage from "../assets/icons/markup-arrow.svg";
import markupRectangleImage from "../assets/icons/markup-rectangle.svg";
import markupEllipseImage from "../assets/icons/markup-ellipse.svg";
import markupCloudImage from "../assets/icons/markup-cloud.svg";
import markupImageImage from "../assets/icons/markup-image.svg";
import markupEraseImage from "../assets/icons/markup-erase.svg";
import markupCloseImage from "../assets/icons/close-square.svg";
import markupLineTypeImage from "../assets/icons/markup-line-type.svg";
import markupColorImage from "../assets/icons/markup-color.svg";
import markupFontSizeImage from "../assets/icons/markup-text-size.svg";
import markupWidthImage from "../assets/icons/markup-width.svg";

import viewImage from "../assets/icons/actions.svg";
import actionImage from "../assets/icons/view.svg";
import zoomHomeImage from "../assets/icons/zoom-home.svg";

import viewTopImage from "../assets/icons/view-top.svg";
import viewBottomImage from "../assets/icons/view-bottom.svg";
import viewLeftImage from "../assets/icons/view-left.svg";
import viewRightImage from "../assets/icons/view-right.svg";
import viewFrontImage from "../assets/icons/view-front.svg";
import viewBackImage from "../assets/icons/view-back.svg";
import viewSWImage from "../assets/icons/view-sw.svg";
import viewSEImage from "../assets/icons/view-se.svg";
import viewNEImage from "../assets/icons/view-ne.svg";
import viewNWImage from "../assets/icons/view-nw.svg";

import zoomSelectedImage from "../assets/icons/zoom-selected.svg";
import unselectedImage from "../assets/icons/unselected.svg";
import isolateImage from "../assets/icons/isolate.svg";
import hideImage from "../assets/icons/hide.svg";
import showImage from "../assets/icons/show.svg";
import explodeImage from "../assets/icons/explode.svg";
import collectImage from "../assets/icons/collect.svg";
import regenImage from "../assets/icons/regen.svg";
import resetImage from "../assets/icons/reset.svg";
import previewImage from "../assets/icons/preview.svg";
import { DownloadSourceFile } from "./windows/Share/DownloadSourceFile";

import { VisualizeViewer } from "../components/VisualizeViewer";
import { ThreeViewer } from "../components/ThreeViewer";
import { TocViewer } from "../components/TocViewer";
import { ShareWindow } from "./windows/Share";

import { t } from "i18next";

/**
 * Contributes are a set of JSON declarations to extend various functionalities within
 * Viewer Page. Here is a list of available Contributes:
 *
 * - commands
 * - draggers
 * - windows
 * - toolbars
 * - menus
 *
 * `contributes.commands`
 *
 * Contribute the UI for a Viewer command consisting of a label, icon, spinner, enabled
 * state, visible state, checked state and custom handler (optional).
 *
 * `contributes.draggers`
 *
 * Contribute the UI for a Viewer dragger consisting of a label, icon, enabled state,
 * visible state and checked state.
 *
 * `contributes.windows`
 *
 * Contribute a floating window or modal to the Viewer Page. The content of a window must be
 * populated with a React component.
 *
 * `contributes.toolbars`
 *
 * Contribute a toolbars and its items to the Viewer. The toolbar definition contains the
 * condition under which the toolbar should show. The toolbar item definition contains the command,
 * dragger or window that should be invoked when clicked and the conditions under which
 * the item should show and enable.
 *
 * `contributes.menus`
 *
 * Contribute a menu item to the viewer context menu or page header. The menu item definition
 * contains the command, dragger or window that should be invoked when selected and the conditions
 * under which the item should show and enable.
 *
 * Currently extension writers can contribute to:
 *
 * - The Viewer context menu - `viewer/context`
 * - The Viewer Page header - `viewer/header`
 */

export const contributes = {
  commands: [
    { command: "clearSlices", label: "Cancel", image: clearImage },
    { command: "clearMarkup", label: "Clear", image: markupEraseImage },
    { command: "k3DViewSW", label: "Isometric", image: viewSWImage },
    { command: "k3DViewTop", label: "Top", image: viewTopImage },
    { command: "k3DViewBottom", label: "Bottom", image: viewBottomImage },
    { command: "k3DViewLeft", label: "Left", image: viewLeftImage },
    { command: "k3DViewRight", label: "Right", image: viewRightImage },
    { command: "k3DViewFront", label: "Front", image: viewFrontImage },
    { command: "k3DViewBack", label: "Back", image: viewBackImage },
    { command: "k3DViewSW", label: "SW", image: viewSWImage },
    { command: "k3DViewSE", label: "SE", image: viewSEImage },
    { command: "k3DViewNE", label: "NE", image: viewNEImage },
    { command: "k3DViewNW", label: "NW", image: viewNWImage },
    {
      command: "explode",
      label: "Explode",
      image: explodeImage,
      spinner: true,
    },
    {
      command: "collect",
      label: "Collect",
      image: collectImage,
      spinner: true,
    },
    {
      command: "zoomToSelected",
      label: "Zoom To",
      image: zoomSelectedImage,
      enabled: ({ activeDragger, selectedCount }) =>
        activeDragger !== "Walk" && selectedCount > 0,
    },
    {
      command: "isolateSelected",
      label: "Isolate",
      image: isolateImage,
      enabled: ({ selectedCount }) => selectedCount > 0,
    },
    {
      command: "hideSelected",
      label: "Hide",
      image: hideImage,
      enabled: ({ selectedCount }) => selectedCount > 0,
    },
    { command: "showAll", label: "Show All", image: showImage, spinner: true },
    {
      command: "unselect",
      label: "Clear Selection",
      image: unselectedImage,
      enabled: ({ selectedCount }) => selectedCount > 0,
    },
    {
      command: "regenerateAll",
      label: "Regenerate",
      image: regenImage,
      spinner: true,
      visible: ({ file }) => file?.geometryType === "vsfx",
    },
    { command: "resetView", label: "Reset", image: resetImage, spinner: true },
    {
      command: "zoomToExtents",
      // args: [false, false],
      label: t("Fit To View"),
      image: zoomHomeImage,
      enabled: ({ activeDragger }) => activeDragger !== "Walk",
    },
    {
      command: "saveViewpoint",
      label: "Save View",
      image: saveImage,
      enabled: ({ activeModel }) => activeModel,
      handler: saveViewpoint,
    },
    {
      command: "updatePreview",
      label: "Update Preview",
      image: previewImage,
      visible: ({ file, sharedLink }) =>
        file?.type !== "assembly" && !sharedLink,
      handler: updatePreview,
    },
    {
      command: "red",
      label: "Red",
      image: <markupCircleImage color="#F00" />,
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getColor && el.getColor() === "#ff0000",
          );
        }
        const { r, g, b } = viewer.markup.getMarkupColor();
        return r === 255 && g === 0 && b === 0;
      },
      handler: ({ viewer }) => {
        viewer.markup.setMarkupColor(255, 0, 0);
        viewer.markup.colorizeSelectedMarkups(255, 0, 0);
      },
    },
    {
      command: "green",
      label: "Green",
      image: <markupCircleImage color="#0F0" />,
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getColor && el.getColor() === "#00ff00",
          );
        }
        const { r, g, b } = viewer.markup.getMarkupColor();
        return r === 0 && g === 255 && b === 0;
      },
      handler: ({ viewer }) => {
        viewer.markup.setMarkupColor(0, 255, 0);
        viewer.markup.colorizeSelectedMarkups(0, 255, 0);
      },
    },
    {
      command: "blue",
      label: "Blue",
      image: <markupCircleImage color="#00F" />,
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getColor && el.getColor() === "#0000ff",
          );
        }
        const { r, g, b } = viewer.markup.getMarkupColor();
        return r === 0 && g === 0 && b === 255;
      },
      handler: ({ viewer }) => {
        viewer.markup.setMarkupColor(0, 0, 255);
        viewer.markup.colorizeSelectedMarkups(0, 0, 255);
      },
    },
    {
      command: "magenta",
      label: "Magenta",
      image: <markupCircleImage color="#F0F" />,
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getColor && el.getColor() === "#ff00ff",
          );
        }
        const { r, g, b } = viewer.markup.getMarkupColor();
        return r === 255 && g === 0 && b === 255;
      },
      handler: ({ viewer }) => {
        viewer.markup.setMarkupColor(255, 0, 255);
        viewer.markup.colorizeSelectedMarkups(255, 0, 255);
      },
    },
    {
      command: "markupSetLineSolid",
      label: "Solid",
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getLineType && el.getLineType() === "solid",
          );
        }
        return viewer.markup.lineType === "solid";
      },
      handler: ({ viewer }) => {
        viewer.markup.lineType = "solid";
        const selectedMarkups = viewer.markup.getSelectedObjects();
        selectedMarkups.forEach((el) => {
          if (el.setLineType) el.setLineType("solid");
        });
      },
    },
    {
      command: "markupSetLineDot",
      label: "Dot",
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getLineType && el.getLineType() === "dot",
          );
        }
        return viewer.markup.lineType === "dot";
      },
      handler: ({ viewer }) => {
        viewer.markup.lineType = "dot";
        const selectedMarkups = viewer.markup.getSelectedObjects();
        selectedMarkups.forEach((el) => {
          if (el.setLineType) el.setLineType("dot");
        });
      },
    },
    {
      command: "markupSetLineDash",
      label: "Dash",
      checked: ({ viewer }) => {
        const selectedMarkups = viewer.markup.getSelectedObjects();
        if (selectedMarkups && selectedMarkups.length > 0) {
          return selectedMarkups.every(
            (el) => el.getLineType && el.getLineType() === "dash",
          );
        }
        return viewer.markup.lineType === "dash";
      },
      handler: ({ viewer }) => {
        viewer.markup.lineType = "dash";
        const selectedMarkups = viewer.markup.getSelectedObjects();
        selectedMarkups.forEach((el) => {
          if (el.setLineType) el.setLineType("dash");
        });
      },
    },
  ],
  draggers: [
    { dragger: "Pan", label: "Pan", image: panImage },
    {
      dragger: "Orbit",
      label: "Orbit",
      image: orbitImage,
      visible: ({ databaseLoaded, viewer }) => databaseLoaded && viewer.is3D(),
    },
    { dragger: "Zoom", label: "Zoom", image: zoomImage },
    {
      dragger: "Walk",
      label: "Walk",
      image: walkImage,
      visible: ({ geometryLoaded, viewer }) => geometryLoaded && viewer.is3D(),
    },
    { dragger: "MeasureLine", label: "Ruler", image: rulerImage },
    { dragger: "CuttingPlaneXAxis", label: "X Plane", image: cuttingXImage },
    { dragger: "CuttingPlaneYAxis", label: "Y Plane", image: cuttingYImage },
    { dragger: "CuttingPlaneZAxis", label: "Z Plane", image: cuttingZImage },
    { dragger: "SelectMarkup", label: "Select", image: markupSelectImage },
    { dragger: "Line", label: "Pen", image: markupPenImage },
    { dragger: "Text", label: "Text", image: markupTextImage },
    { dragger: "Arrow", label: "Arrow", image: markupArrowImage },
    { dragger: "Rectangle", label: "Rectangle", image: markupRectangleImage },
    { dragger: "Ellipse", label: "Ellipse", image: markupEllipseImage },
    { dragger: "Cloud", label: "Cloud", image: markupCloudImage },
    { dragger: "Image", label: "Image", image: markupImageImage },
  ],
  windows: [
    { window: "walkhelp", label: "Help", component: WalkHelpModal },
    {
      window: "share",
      label: "",
      image: ShareAltOutlined,
      component: ShareWindow,
      ignoreViewerReady: true,
      visible: ({ sharedLink, file, app }) =>
        !sharedLink && file?.owner?.userId === app?.user?.id,
    },
    {
      window: "settings",
      label: "",
      image: SettingOutlined,
      component: SettingsWindow,
    },
    {
      window: "properties",
      label: "Properties",
      image: BarsOutlined,
      component: PropertiesWindow,
      visible: ({ file, activeModel, sharedLink }) =>
        (file?.type === "assembly" ||
          file?.status.properties.state === "done") &&
        activeModel?.default &&
        !sharedLink,
    },
    {
      window: "objectExplorer",
      label: "Explorer",
      image: ApartmentOutlined,
      component: ObjectExplorerWindow,
      visible: ({ activeModel, sharedLink }) =>
        activeModel?.default && !sharedLink,
    },
    {
      window: "viewpoints",
      label: "Viewpoints",
      image: VideoCameraOutlined,
      component: ViewpointsWindow,
      visible: ({ sharedLink, file }) =>
        (!sharedLink ||
          sharedLink?.permissions.actions.indexOf("readViewpoint") > -1) &&
        !file?.name?.includes(".dwg") &&
        !file?.name?.includes(".dxf"),
    },
    {
      window: "assemblyTransform",
      label: "Transform",
      image: BuildOutlined,
      component: AssemblyTransformWindow,
      visible: ({ file, sharedLink }) =>
        file?.type === "assembly" && !sharedLink,
      enabled: ({ geometryLoaded }) => geometryLoaded,
    },
    {
      window: "search",
      label: "Search",
      image: SearchOutlined,
      component: SearchWindow,
      visible: ({ file, activeModel, sharedLink }) =>
        (file?.type === "assembly" ||
          file?.status.properties.state === "done") &&
        activeModel?.default &&
        !sharedLink,
    },
    {
      window: "validate",
      label: "Validate",
      image: CarryOutOutlined,
      component: ValidateWindow,
      ignoreViewerReady: true,
      visible: ({ file, sharedLink }) =>
        [".ifc", ".ifczip"].includes(file?.type) && !sharedLink,
    },
    {
      window: "clashes",
      label: "Clashes",
      image: BlockOutlined,
      component: ClashTestsWindow,
      visible: ({ file, sharedLink }) =>
        file?.type === "assembly" && !sharedLink,
    },
  ],
  toolbars: {
    draggers: {
      visible: ({ mode }) => mode === "viewer",
      items: [
        {
          label: "Pan",
          image: panImage,
          items: [
            { dragger: "Pan" },
            { dragger: "Orbit" },
            { dragger: "Zoom" },
            { dragger: "Walk" },
          ],
        },
        { dragger: "MeasureLine" },
        {
          label: "Cutting",
          image: cuttingImage,
          visible: ({ geometryLoaded, viewer }) =>
            geometryLoaded && viewer.is3D(),
          items: [
            { dragger: "CuttingPlaneXAxis" },
            { dragger: "CuttingPlaneYAxis" },
            { dragger: "CuttingPlaneZAxis" },
            { command: "clearSlices" },
          ],
        },
        {
          mode: "markup",
          dragger: "Line",
          label: "Markup",
          image: markupImage,
          visible: ({ sharedLink }) => !sharedLink,
        },
        { command: "saveViewpoint", visible: ({ sharedLink }) => !sharedLink },
      ],
    },
    commands: {
      visible: ({ mode }) => mode === "viewer",
      items: [
        {
          label: "View",
          image: viewImage,
          visible: ({ geometryLoaded, viewer }) =>
            geometryLoaded && viewer.is3D(),
          enabled: ({ activeDragger }) => activeDragger !== "Walk",
          items: [
            { command: "k3DViewSW" },
            { command: "k3DViewTop" },
            { command: "k3DViewBottom" },
            { command: "k3DViewLeft" },
            { command: "k3DViewRight" },
            { command: "k3DViewFront" },
            { command: "k3DViewBack" },
          ],
        },
        {
          label: "Explode",
          image: explodeImage,
          visible: ({ geometryLoaded, viewer }) =>
            geometryLoaded && viewer.is3D(),
          items: [{ command: "collect" }],
          dropdown: ExplodeDropdown,
        },
        {
          label: "Object",
          image: unselectedImage,
          items: [
            { command: "zoomToSelected" },
            { command: "isolateSelected" },
            { command: "hideSelected" },
            { command: "showAll" },
            { command: "unselect" },
          ],
        },
        {
          label: "Model",
          image: actionImage,
          items: [
            { command: "regenerateAll" },
            { command: "resetView" },
            { command: "updatePreview" },
          ],
        },
        { command: "zoomToExtents" },
      ],
    },
    markup1: {
      visible: ({ mode, sharedLink }) => mode === "markup" && !sharedLink,
      items: [
        { dragger: "Pan" },
        { dragger: "Orbit" },
        { dragger: "SelectMarkup" },
      ],
    },
    markup2: {
      visible: ({ mode, sharedLink }) => mode === "markup" && !sharedLink,
      items: [
        { dragger: "Line" },
        { dragger: "Text" },
        { dragger: "Arrow" },
        { dragger: "Rectangle" },
        { dragger: "Ellipse" },
        { dragger: "Cloud" },
        { dragger: "Image" },
      ],
    },
    markup3: {
      visible: ({ mode, sharedLink }) => mode === "markup" && !sharedLink,
      items: [
        {
          label: "Width",
          image: markupWidthImage,
          dropdown: MarkupLineWidthDropdown,
        },
        {
          label: "Line Type",
          image: markupLineTypeImage,
          items: [
            { command: "markupSetLineSolid" },
            { command: "markupSetLineDot" },
            { command: "markupSetLineDash" },
          ],
        },
        {
          label: "Color",
          image: markupColorImage,
          items: [
            { command: "red" },
            { command: "green" },
            { command: "blue" },
            { command: "magenta" },
          ],
        },
        {
          label: "Text Size",
          image: markupFontSizeImage,
          dropdown: MarkupFontSizeDropdown,
        },
        { command: "clearMarkup" },
      ],
    },
    markup4: {
      visible: ({ mode }) => mode === "markup",
      items: [
        { command: "saveViewpoint", visible: ({ sharedLink }) => !sharedLink },
        {
          mode: "viewer",
          label: "Close",
          image: markupCloseImage,
        },
      ],
    },
  },
  menus: {
    "viewer/context": [
      {
        command: "zoomToSelected",
        visible: ({ activeDragger, selectedCount }) =>
          activeDragger !== "Walk" && selectedCount > 0,
      },
      {
        command: "isolateSelected",
        visible: ({ activeDragger, selectedCount }) =>
          activeDragger !== "Walk" && selectedCount > 0,
      },
      {
        command: "hideSelected",
        visible: ({ activeDragger, selectedCount }) =>
          activeDragger !== "Walk" && selectedCount > 0,
      },
      { command: "showAll" },
      {
        command: "unselect",
        visible: ({ selectedCount }) => selectedCount > 0,
      },
    ],
  },
  header: {
    items: [
      { window: "clashes" },
      { window: "validate" },
      { window: "assemblyTransform" },
      { window: "search" },
      { window: "objectExplorer" },
      { window: "properties" },
      { window: "viewpoints" },
      {
        label: "Models",
        visible: ({ file, models }) =>
          file?.type !== "assembly" && models.length,
        render: ModelsDropdown,
      },
      { window: "share" },
      {
        label: "",
        ignoreViewerReady: true,
        visible: ({ file, sharedLink }) =>
          file &&
          (!sharedLink ||
            sharedLink?.permissions.actions.indexOf("readSourceFile") > -1),
        render: DownloadSourceFile,
      },
      { window: "settings" },
    ],
  },
  viewers: {
    vsfx: VisualizeViewer,
    gltf: ThreeViewer,
    ".ifc": TocViewer,
    ".usdz": ThreeViewer,
    ".ifcx": ThreeViewer,
  },
  // viewers2: [
  //   {
  //     files: "*",
  //     component: VisualizeViewer,
  //     visible: ({ file }) => file?.geometryFormat === "vsfx",
  //   },
  //   {
  //     files: "*",
  //     component: ThreeViewer,
  //     visible: ({ file }) => file?.geometryFormat === "gltf",
  //   },
  //   {
  //     files: ["*.ifcx", "*.usdz"],
  //     component: ThreeViewer,
  //   },
  // ],
};

export function expandCommand(item) {
  const { commands, draggers, windows } = contributes;
  const command = commands.find((x) => x.command === item.command);
  const dragger = draggers.find((x) => x.dragger === item.dragger);
  const window = windows.find((x) => x.window === item.window);
  Object.assign(item, { ...command, ...dragger, ...window, ...item });
}

export function expandContributes() {
  Object.keys(contributes.toolbars).forEach((group) =>
    contributes.toolbars[group].items.forEach((item) => {
      expandCommand(item);
      item.items?.forEach((x) => expandCommand(x));
    }),
  );
  Object.keys(contributes.menus).forEach((menu) =>
    contributes.menus[menu].forEach((item) => {
      expandCommand(item);
    }),
  );
  contributes.header.items.forEach((item) => {
    expandCommand(item);
  });
}

expandContributes();
