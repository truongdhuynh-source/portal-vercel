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

import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ErrorBoundary, ErrorStub } from "./components";
import { AppContext } from "./AppContext";
import "./App.css";

import { useTranslation } from "react-i18next";
import RouterConfig from "@/routes";
import AppLoading from "@/components/Loading/AppLoading";
import { setupDeferredLogoutSync } from "./utils/syncAuthAcrossTabs";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
  getTeraTrackingInSession,
  removeEventFromTrackingSession,
  setTeraTrackingInSession,
} from "./utils/teraTracking";
import { trackingService } from "./services/teraTrackingService";

function App() {
  const [loading, setLoading] = useState(true);
  const { app } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    app
      .loginFromStorage()
      .catch((e) => console.log("Cannot login from storage.", e.message))
      .finally(() => {
        const isReturnApp = urlParams.get("isReturnApp");
        sessionStorage.setItem("isReturnApp", isReturnApp);
        if (urlParams.get("isFullView")) {
          sessionStorage.setItem("isFullView", urlParams.get("isFullView"));
        }
        navigate(
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
          {
            replace: true,
          },
        );
        setLoading(false);
      });

    const lang = urlParams.get("lang");
    i18n.changeLanguage(lang);
  }, [app]);

  useEffect(() => {
    return setupDeferredLogoutSync({
      getFallbackLang: () => i18n.resolvedLanguage || "en",
    });
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    const navType =
      performance.getEntriesByType("navigation")[0]?.type;

    if (navType === "reload") {
      createEventToTrackingSession({
        event: "page_reload",
        meta: createTeraTrackingPageMeta({
          action: "reload",
          path: window.location.pathname,
        }),
      });
    }
  }, []);

  useEffect(() => {
    createEventToTrackingSession({
      event: "view_page",
      meta: createTeraTrackingPageMeta("page", {
        hash: location.hash,
        title: document.title,
      }),
    });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    let isSending = false;

    const flushTrackingQueue = async () => {
      if (isSending) return;

      const events = getTeraTrackingInSession();

      if (!events.length) return;

      isSending = true;

      try {
        const sendingIds = new Set(
          events.map((event) => event.trackingId),
        );

        await trackingService.sendEvents(events);

        const currentEvents = getTeraTrackingInSession();

        const remainingEvents = currentEvents.filter(
          (event) => !sendingIds.has(event.trackingId),
        );

        if (remainingEvents.length) {
          setTeraTrackingInSession(remainingEvents);
        } else {
          removeEventFromTrackingSession();
        }
      } catch (error) {
        console.error("Polling error:", error);
      } finally {
        isSending = false;
      }
    };

    const INTERVAL_TIME_TRACKING =
      Number(import.meta.env.VITE_INTERVAL_TIME_TRACKING ?? 30000);

    const interval = setInterval(
      flushTrackingQueue,
      INTERVAL_TIME_TRACKING,
    );

    const handlePageHide = async () => {
      const events = getTeraTrackingInSession();

      if (!events.length) return;

      trackingService.sendOnUnload(events);
      removeEventFromTrackingSession();
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handlePageHide);
    }
  }, []);

  return (
    <ErrorBoundary fallback={ErrorStub}>
      <AppLoading loading={loading} size="medium">
        <RouterConfig app={app} loading={loading} />
      </AppLoading>
    </ErrorBoundary>
  );
}

export default App;
