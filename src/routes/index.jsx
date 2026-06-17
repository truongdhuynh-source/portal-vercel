import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, withSuspense } from "@/components";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ODA } from "@/constants";
import Cookies from "js-cookie";
import getUserIdLogin from "@/utils/getUserIdLogin";
import AppLayout from "@/layout/AppLayout/AppLayout";
import MyFamilies from "@/pages/MyFamilies/MyFamilies";
import PublicFamilies from "@/pages/PublicFamilies/PublicFamilies";
import AppLoading from "@/components/Loading/AppLoading";
import ShareWithMe from "@/pages/ShareWithMe/ShareWithMe";
import { ProfileRedirect } from "@/pages/Profile/ProfileRedirect";
import { LicenseRedirect } from "@/pages/Licenses/LicenseRedirect";
import TermsOfUse from "@/pages/TermsOfUse";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import HomePage from "@/pages/Home";

const SharePasswordPage = withSuspense(
  React.lazy(() => import("@/oda-sdk/views/Share")),
);

const ViewerPage = withSuspense(
  React.lazy(() => import("@/oda-sdk/viewer/ViewerPage")),
);

const MyFiles = withSuspense(React.lazy(() => import("@/pages/MyFiles")));
const Feedbacks = withSuspense(React.lazy(() => import("@/pages/Feedbacks")));
const FeedbackDetail = withSuspense(
  React.lazy(() => import("@/pages/Feedbacks/FeedbackDetail")),
);
const Tasks = withSuspense(React.lazy(() => import("@/pages/Tasks")));
const TasksDetail = withSuspense(
  React.lazy(() => import("@/pages/Tasks/TaskDetail")),
);
const Licenses = withSuspense(React.lazy(() => import("@/pages/Licenses")));
const LicenseDetail = withSuspense(
  React.lazy(() => import("@/pages/Licenses/LicenseDetail")),
);
const Profile = withSuspense(React.lazy(() => import("@/pages/Profile")));
const Projects = withSuspense(React.lazy(() => import("@/pages/Projects")));
const ProjectDashboard = withSuspense(
  React.lazy(() => import("@/oda-sdk/views/ProjectDashboard")),
);
const ProjectSettings = withSuspense(
  React.lazy(() => import("@/oda-sdk/views/ProjectSettings")),
);
const ProjectMembers = withSuspense(
  React.lazy(() => import("@/oda-sdk/views/ProjectMembers")),
);
const ProjectModels = withSuspense(
  React.lazy(() => import("@/oda-sdk/views/ProjectModels")),
);
const StorageCloud = withSuspense(
  React.lazy(() => import("@/pages/StorageCloud")),
);
const StorageFiles = withSuspense(
  React.lazy(() => import("@/pages/StorageFiles")),
);
const TrashStorageFiles = withSuspense(
  React.lazy(() => import("@/pages/TrashStorageFiles")),
);
const Error404 = withSuspense(React.lazy(() => import("@/pages/Error404")));
const MyDevices = withSuspense(React.lazy(() => import("@/pages/MyDevices")));

const defaultPath =
  window.location.pathname === "/" ? "/my-files" : window.location.pathname;

const RouterConfig = ({ app, loading }) => {
  const [data, setData] = useState({});

  useEffect(() => {
    const userId = getUserIdLogin();
    setData({
      access: Cookies.get(`${ACCESS_TOKEN_KEY}_${userId}`),
      refresh: Cookies.get(`${REFRESH_TOKEN_KEY}_${userId}`),
      oda: JSON.parse(localStorage.getItem(`${USER_ODA}_${userId}`)),
      userId,
    });
  }, []);

  const routes = useMemo(
    () => (
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={defaultPath} replace />} />
          <Route
            path="/files"
            element={<Navigate to={"/my-files"} replace />}
          />

          <Route path="my-files">
            <Route index element={<MyFiles data={data} />} />
            <Route path=":fileId" element={<ViewerPage />} />
          </Route>
          <Route path="my-families">
            <Route index element={<MyFamilies data={data} />} />
            <Route path=":fileId" element={<ViewerPage />} />
          </Route>

          <Route path="public-families">
            <Route index element={<PublicFamilies data={data} />} />
            <Route path=":fileId" element={<ViewerPage />} />
          </Route>

          <Route path="shared-with-me">
            <Route index element={<ShareWithMe data={data} />} />
            <Route path=":fileId" element={<ViewerPage />} />
          </Route>

          <Route path="tasks">
            <Route index element={<Tasks />} />
            <Route path=":taskId" element={<TasksDetail />} />
          </Route>

          <Route path="feedbacks">
            <Route index element={<Feedbacks />} />
            <Route path=":feedbackId" element={<FeedbackDetail />} />
          </Route>

          <Route path="licenses">
            <Route index element={<LicenseRedirect />} />
            <Route path=":licenseId" element={<LicenseDetail />} />
          </Route>

          <Route path="profile" element={<ProfileRedirect />} />
          <Route path="devices" element={<MyDevices />} />

          <Route path="storage-cloud" element={<StorageCloud />} />

          <Route path="files">
            <Route path=":provider/:connectionId">
              <Route index element={<StorageFiles />} />
              <Route path=":folderId" element={<StorageFiles />} />
            </Route>

            <Route path="trash/:provider/:connectionId">
              <Route index element={<TrashStorageFiles />} />
              <Route path=":folderId" element={<TrashStorageFiles />} />
            </Route>
          </Route>

          {/* <Route path="projects">
            <Route index element={<Projects />} />
          </Route>

          <Route path="project/:projectId">
            <Route index element={<ProjectDashboard />} />
            <Route path="settings" element={<ProjectSettings />} />
            <Route path="members" element={<ProjectMembers />} />
            <Route path="models" element={<ProjectModels />} />
          </Route> */}
        </Route>
        <Route path="*" element={<Error404 />} />
      </Routes>
    ),
    [data],
  );
  if (loading) {
    return null;
  }

  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="*"
          element={
            <PrivateRoute user={app.user} element={routes} tag={"012"} />
          }
        />
        <Route path="shares/:sharedToken" element={<SharePasswordPage />} />
      </Routes>
    </Suspense>
  );
};

export default RouterConfig;
