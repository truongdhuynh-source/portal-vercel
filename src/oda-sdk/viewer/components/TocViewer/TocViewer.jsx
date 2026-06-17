import React, { useEffect, useRef, useState } from "react";
import VinaCADLogo from "@/assets/images/logo-vinacad.png";

import "./TocViewer.css";

const TOC_VIEWER_SCRIPT_ID = "toc-viewer-script";
const TOC_VIEWER_SCRIPT_SRC = "/lib/toc-viewer.js";
const LOADING_EXIT_DURATION_MS = 450;
const VIEWER_READY_TIMEOUT_MS = 15000;
const VIEWER_MIN_READY_MS = 1200;
const VIEWER_SETTLE_MS = 600;
const VIEWER_STABLE_FRAMES = 10;
const VIEWER_BUSY_SELECTOR = '[role="status"][aria-busy="true"]';

let tocViewerScriptPromise;

function loadTocViewerScript() {
  if (window.TocViewer) return Promise.resolve(window.TocViewer);

  if (!tocViewerScriptPromise) {
    tocViewerScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(TOC_VIEWER_SCRIPT_ID);

      const handleLoad = () => {
        if (window.TocViewer) {
          resolve(window.TocViewer);
          return;
        }

        reject(
          new Error("TocViewer script loaded, but window.TocViewer is missing"),
        );
      };

      const handleError = () => {
        reject(new Error(`Cannot load ${TOC_VIEWER_SCRIPT_SRC}`));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = TOC_VIEWER_SCRIPT_ID;
      script.src = TOC_VIEWER_SCRIPT_SRC;
      script.async = true;
      script.onload = handleLoad;
      script.onerror = handleError;
      document.body.appendChild(script);
    });
  }

  return tocViewerScriptPromise;
}

function getLastModified(file) {
  const updatedAt = file?.updatedAt || file?._data?.updatedAt;
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();

  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

async function createBrowserFile(file) {
  if (!file?.download) {
    throw new Error("Source IFC file cannot be downloaded");
  }

  const arrayBuffer = await file.download();
  const name = file.name || file?._data?.name || "model.ifc";

  return new File([arrayBuffer], name, {
    type: "application/octet-stream",
    lastModified: getLastModified(file),
  });
}

function createTocFileMetadata(file) {
  return {
    id: file?.id,
    fileId: file?.id,
    name: file?.name || file?._data?.name,
    type: file?.type || file?._data?.type,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getViewerCanvasSignature(mountPoint) {
  const canvas = mountPoint.querySelector("canvas");

  if (!canvas) return "";

  const rect = canvas.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) return "";

  return [
    Math.round(rect.width),
    Math.round(rect.height),
    canvas.width,
    canvas.height,
  ].join(":");
}

function waitForViewerToSettle(mountPoint, isDisposed) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let lastMutationAt = startedAt;
    let lastSignature = "";
    let stableFrames = 0;
    let frameId;

    const cleanup = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      observer.disconnect();
    };

    const resolveOnce = () => {
      cleanup();
      resolve();
    };

    const observer = new MutationObserver(() => {
      lastMutationAt = performance.now();
      stableFrames = 0;
    });

    observer.observe(mountPoint, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const tick = (now) => {
      if (isDisposed()) {
        resolveOnce();
        return;
      }

      const elapsed = now - startedAt;
      const signature = getViewerCanvasSignature(mountPoint);
      const hasBusyIndicator = !!mountPoint.querySelector(VIEWER_BUSY_SELECTOR);
      const isQuiet = now - lastMutationAt >= VIEWER_SETTLE_MS;

      if (
        signature &&
        !hasBusyIndicator &&
        elapsed >= VIEWER_MIN_READY_MS &&
        isQuiet
      ) {
        stableFrames = signature === lastSignature ? stableFrames + 1 : 1;
        lastSignature = signature;
      } else {
        stableFrames = 0;
        lastSignature = signature;
      }

      if (
        stableFrames >= VIEWER_STABLE_FRAMES ||
        elapsed >= VIEWER_READY_TIMEOUT_MS
      ) {
        resolveOnce();
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
  });
}

export function TocViewer({ file, onInitError }) {
  const mountHostRef = useRef();
  const cleanupRef = useRef();

  const elementIdRef = useRef(
    `toc-viewer-${Math.random().toString(36).slice(2)}`,
  );

  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    let disposed = false;
    const elementId = elementIdRef.current;

    async function mountViewer() {
      setLoading(true);
      setClosing(false);
      setError();

      const TocViewerApi = await loadTocViewerScript();
      const sourceFile = await createBrowserFile(file);

      if (disposed || !mountHostRef.current) return;

      const mountPoint = document.createElement("div");
      mountPoint.id = elementId;
      mountPoint.className = "toc-viewer-mount";

      mountHostRef.current.replaceChildren(mountPoint);

      const config = TocViewerApi.createViewerMountConfig(elementId, {
        actualFiles: [sourceFile],
        file: createTocFileMetadata(file),
      });

      cleanupRef.current = TocViewerApi.mount(config);

      if (!disposed) {
        await waitForViewerToSettle(mountPoint, () => disposed);
      }

      if (!disposed) {
        setClosing(true);
        await wait(LOADING_EXIT_DURATION_MS);

        if (!disposed) {
          setLoading(false);
        }
      }
    }

    mountViewer().catch((e) => {
      if (disposed) return;

      console.error("Cannot initialize TocViewer.", e);
      setError(e.message);
      setLoading(false);
      onInitError?.(e);
    });

    return () => {
      disposed = true;

      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      } else {
        window.TocViewer?.unmount(elementId);
      }

      mountHostRef.current?.replaceChildren();
    };
  }, [file, onInitError]);

  return (
    <div className="toc-viewer-host">
      <div className="toc-viewer-mount-host" ref={mountHostRef} />

      {loading && (
        <div
          className={`toc-viewer-loading ${
            closing ? "toc-viewer-loading-exit" : ""
          }`}
        >
          <div className="loader-container">
            <div className="loader-ring">
              <img
                src={VinaCADLogo}
                alt="Viewer Logo"
                className="loader-logo"
              />
            </div>
          </div>

          <div className="loading-label">Initializing viewer...</div>
        </div>
      )}
      {error && <div className="toc-viewer-error">{error}</div>}
    </div>
  );
}
