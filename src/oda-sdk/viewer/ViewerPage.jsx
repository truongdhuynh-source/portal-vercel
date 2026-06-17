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

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { notification } from "antd";
import { useTranslation } from "react-i18next";

import {
  CommandSpinner,
  ContextMenu,
  GeometryProgress,
  Header,
  ModelError,
  ModelSpinner,
  Toolbar,
} from "./components";
import { contributes } from "./contributes";
import ClientFactory from "@/oda-sdk/ClientFactory";
import { AppContext } from "@/AppContext";

import "./ViewerPage.css";
import PortalHeader from "@/components/PortalHeader";
import { createEventToTrackingSession, createTeraTrackingPageMeta } from "@/utils/teraTracking";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTocViewerFile = (file) => file?.type?.toLowerCase() === ".ifc";

const isTocViewerRequested = (file, viewerMode) =>
  isTocViewerFile(file) && viewerMode === "toc";

const getViewerType = (file, viewerMode) => {
  if (isTocViewerRequested(file, viewerMode)) return ".ifc";
  if (isTocViewerFile(file)) return file?.geometryType;
  return file?.geometryType || file?.type?.toLowerCase();
};

function Viewer({ previewFileId, sharedFile }) {
  const { app } = useContext(AppContext);
  const { fileId, assemblyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchVersion = searchParams.get("version");
  const viewerMode = searchParams.get("viewer");
  const fileName = searchParams.get("n");
  const [client] = useState(ClientFactory.get());
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState();
  const [versions, setVersions] = useState();
  const [activeVersion, setActiveVersion] = useState();
  const [models, setModels] = useState();
  const [activeModel, setActiveModel] = useState();
  const [viewer, setViewer] = useState();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  const [geometryLoaded, setGeometryLoaded] = useState(false);
  const [activeDragger, setActiveDragger] = useState("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [visibleWindows, setVisibleWindows] = useState([]);
  const [mode, setMode] = useState("viewer");
  const { t } = useTranslation();
  const [sharedLink, setSharedLink] = useState();
  const navigate = useNavigate();

  const markGeometryReady = (file) => {
    if (file?.geometryType || !file?._data?.status?.geometry) return;
    file._data.status.geometry.state = "done";
  };

  const getModelsWhenReady = async (file) => {
    let lastError;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const models = await file.getModels();
        markGeometryReady(file);
        return models;
      } catch (e) {
        lastError = e;
        if (attempt === 5) break;
        await delay(1000);
        await file.checkout().catch(() => { });
      }
    }

    throw lastError;
  };

  useEffect(() => {
    async function loadContext() {
      setError(false);
      setLoading(true);
      try {
        let file;
        if (fileId || previewFileId)
          file = await client.getFile(fileId || previewFileId);
        else if (assemblyId) file = await client.getAssembly(assemblyId);
        else if (sharedFile) {
          file = sharedFile;
          setSharedLink(await sharedFile.getSharedLink());
        } else console.error("No file or assembly ID specified");
        if (!sharedFile && !file) {
          navigate("/Error404");
          return;
        }
        const versions = await file.getVersions();
        const version = versions?.find((x) => x.version === searchVersion - 1);
        const activeVersion = version?.version ?? file.activeVersion;
        await file.useVersion(activeVersion).checkout();

        const useSourceViewer = isTocViewerRequested(file, viewerMode);
        if (useSourceViewer) {
          setViewer();
          setDatabaseLoaded(false);
          setGeometryLoaded(false);
        }
        const models = useSourceViewer ? [] : await getModelsWhenReady(file);
        const activeModel =
          (useSourceViewer ? file : models.find((model) => model.default)) ||
          models[0] ||
          file;
        // if (!activeModel) throw new Error("No default model found");

        setFile(file);
        setVersions(versions);
        setActiveVersion(activeVersion);
        setModels(models);
        setActiveModel(activeModel);
        setReady(true);
      } catch (e) {
        console.error("Cannot get model info.", e);
        notification.error({
          message: t("Error"),
          description: t("Model not found, or access denied, or network error"),
        });
        setError(e.message);
        setReady(false);
        setViewer();
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, [
    fileId,
    assemblyId,
    searchVersion,
    viewerMode,
    client,
    reload,
    previewFileId,
  ]);

  useEffect(() => {
    if (viewerMode === "toc") return;
    if (!viewer || !activeModel || !fontsLoaded) return;
    viewer?.open(activeModel).catch((e) => {
      console.error("Cannot open model.", e);
      if (e.name !== "AbortError") {
        notification.error({
          message: t("Error"),
          description: t("Cannot open model"),
        });
      }
    });
  }, [viewer, activeModel, fontsLoaded, viewerMode]);

  useEffect(() => {
    createEventToTrackingSession({
      event: "view_model",
      meta: createTeraTrackingPageMeta("viewer_page", {
        mode: viewerMode || 'visualize',
        previewFileId,
        sharedFile,
        fileName,
      }),
    });
  }, [viewerMode])

  const loadFont = async (visViewer, url, name) => {
    const fontUrl = url instanceof URL ? url.toString() : String(url);
    const res = await fetch(fontUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch font "${name}" from ${fontUrl} (HTTP ${res.status})`,
      );
    }
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    try {
      visViewer?.addEmbeddedFile(name, bytes);
    } catch (error) {
      console.log(error);
    }
  };

  const loadAllFonts = async (visViewer) => {
    if (!visViewer) {
      console.error("visViewer is null or undefined");
      return;
    }
    const config = await app.loadConfig();

    const entries = Object.entries(config?.fonts ?? {});

    await Promise.all(
      entries.map(([name, url]) =>
        loadFont(visViewer, url, name).catch((err) => {
          console.error(`Failed to load ${name} (${url}):`, err);
        }),
      ),
    );
    setFontsLoaded(true);
  };

  const viewerInitialized = useCallback(
    (viewer) => {
      setViewer(viewer);

      viewer.options.data = app.options.data;

      viewer.addEventListener("dispose", () => {
        setViewer();
      });

      viewer.addEventListener("clear", () => {
        setDatabaseLoaded(false);
        setGeometryLoaded(false);
        setMode("viewer");
      });

      viewer.addEventListener("databasechunk", () => {
        setDatabaseLoaded(true);
        viewer.setActiveDragger(viewer.is3D() ? "Orbit" : "Pan");
      });

      viewer.addEventListener("geometryend", () => {
        setDatabaseLoaded(true);
        setGeometryLoaded(true);
      });

      viewer.addEventListener("changeactivedragger", ({ data: dragger }) => {
        setActiveDragger(dragger);
      });

      viewer.addEventListener("walkspeedchange", ({ data: speed }) => {
        notification.success({
          message: t("Success"),
          description: `${t("Move speed")} ${speed}`,
        });
      });

      viewer.addEventListener("command", ({ data: command }) => {
        if (command === "clearSlices" || command === "resetView") {
          viewer.setActiveDragger(viewer.is3D() ? "Orbit" : "Pan");
        }
      });

      viewer.addEventListener("changemode", ({ data: mode }) => {
        if (mode === "viewer") {
          viewer.setActiveDragger(viewer.is3D() ? "Orbit" : "Pan");
          viewer.clearOverlay();
        }
      });

      // viewer.addEventListener("drawviewpoint", () => {
      //   setMode("markup");
      //   viewer.markup.enableEditMode(!sharedLink);
      //   viewer.setActiveDragger("Pan");
      // });

      // load fonts and mark when finished so models open after fonts are available
      setFontsLoaded(false);
      loadAllFonts(viewer.visViewer()).catch((e) => {
        console.error("Error loading fonts:", e);
      });
    },
    [sharedLink, app.options],
  );

  const viewerInitError = useCallback(
    (e) => {
      console.error("Cannot initialize viewer.", e);
      notification.error({
        message: t("Error"),
        description: t("Cannot initialize viewer"),
      });
      setError(e.message);
      setReady(false);
    },
    [t],
  );

  const changeVersion = useCallback(
    (version) => {
      version
        ? searchParams.set("version", version.version + 1)
        : searchParams.delete("version");
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const changeDragger = useCallback(
    (dragger) => {
      viewer.setActiveDragger(dragger);
    },
    [viewer],
  );

  const changeMode = useCallback(
    (mode) => {
      setMode(mode);
      viewer.emitEvent({ type: "changemode", data: mode });
    },
    [viewer],
  );

  const changeViewerMode = useCallback(
    (mode) => {
      mode ? searchParams.set("viewer", mode) : searchParams.delete("viewer");
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const context = {
    loading,
    error,
    ready,
    file,
    sharedLink,
    versions,
    activeVersion,
    models,
    activeModel,
    viewer,
    databaseLoaded,
    geometryLoaded,
    activeDragger,
    mode,
    viewerMode,
    client,
    app,
    onVersion: changeVersion,
    onModel: setActiveModel,
    onCommand: executeCommand,
    onDragger: changeDragger,
    onWindow: showWindow,
    onMode: changeMode,
    onViewerMode: changeViewerMode,
  };

  function executeCommand(command, ...args) {
    const contrib = contributes.commands.find((x) => x.command === command);
    const { spinner, handler } = contrib || {};
    setCommandLoading(spinner);
    setTimeout(() => {
      try {
        if (handler) {
          handler(context, ...args);
          viewer.emitEvent({ type: "command", data: command, args });
        } else {
          viewer.executeCommand(command, ...args);
        }
      } catch (e) {
        console.error("Cannot execute command.", e);
      }
      setCommandLoading(false);
    });
  }

  function showWindow(name, show = !visibleWindows[name]) {
    setVisibleWindows({ ...visibleWindows, [name]: show });
  }

  const when = (f, _default = true) =>
    typeof f === "function" ? f(context) : _default;

  const windows = contributes.windows
    .filter((window) => window.component)
    .filter((window) => viewer || window.ignoreViewerReady)
    .filter((window) => when(window.visible, true))
    .map((window) =>
      React.createElement(window.component, {
        ...context,
        key: window.window,
        visible: visibleWindows[window.window] ?? false,
        onClose: () => showWindow(window.window, false),
      }),
    );

  const Viewer3D = file && contributes.viewers[getViewerType(file, viewerMode)];
  const isFullView = sessionStorage.getItem("isFullView") === "true";
  // const Viewer3D =
  //   file &&
  //   contributes.viewers
  //     .filter((viewer) => picomatch.isMatch(viewer.files, file.type))
  //     .filter((viewer) => when(viewer.visible, true))
  //     .pop();

  return previewFileId ? (
    <>
      <ContextMenu items={contributes.menus["viewer/context"]} {...context}>
        <div className="oda-viewer-viewer-wrapper">
          {ready && Viewer3D && (
            <Viewer3D
              onInit={viewerInitialized}
              onInitError={viewerInitError}
              {...context}
            />
          )}
        </div>
      </ContextMenu>
    </>
  ) : (
    <div className={`h-100 oda-viewer ${isFullView ? "fullscreen" : ""}`}>
      {/* {!sharedFile && (
        <div className="pl-3">
          <PortalHeader title="File" isBack={true} />
        </div>
      )} */}
      <GeometryProgress {...context} />
      <Header
        items={contributes.header.items}
        {...context}
        isBack={!sharedFile}
      />
      <div className="oda-viewer-container">
        <ContextMenu items={contributes.menus["viewer/context"]} {...context}>
          <div className="oda-viewer-viewer-wrapper">
            {ready && Viewer3D && (
              <Viewer3D
                onInit={viewerInitialized}
                onInitError={viewerInitError}
                {...context}
              />
            )}
          </div>
        </ContextMenu>
        <CommandSpinner spinning={commandLoading} />
        <Toolbar toolbars={contributes.toolbars} {...context} />
        {windows}
      </div>
      <ModelSpinner spinning={loading} />
      <ModelError error={error} onReload={() => setReload(reload + 1)} />
    </div>
  );
}

export default Viewer;
