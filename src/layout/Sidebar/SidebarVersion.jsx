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
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import ClientFactory from "../../oda-sdk/ClientFactory";
import "./SidebarVersion.css";
import { useSelector } from "react-redux";

function ShortVersion({ client, server }) {
  return (
    <React.Fragment>
      <div>{client}</div>
      <div>{server}</div>
    </React.Fragment>
  );
}

function FullVersion({ client, server }) {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <div>
        {t("Client version")}: {client}
      </div>
      <div>
        {t("Server version")}: {server}
      </div>
    </React.Fragment>
  );
}

function SidebarVersion() {
  const [clientVersion, setClientVersion] = useState("master");
  const [serverVersion, setServerVersion] = useState("");
  const collapsed = useSelector((state) => state.sideBar.collapsed);

  useEffect(() => {
    ClientFactory.get()
      .version()
      .then((version) => {
        setClientVersion((version.client || "master").split(".").slice(0, 2).join("."));
        setServerVersion(version.server || version.version);
      })
      .catch((e) => console.error("Cannot get server version.", e));
  }, []);

  return collapsed ? (
    <Tooltip placement="right" overlay={<FullVersion client={clientVersion} server={serverVersion} />}>
      <div className="sidebar-version text-muted">
        <ShortVersion client={clientVersion} server={serverVersion} />
      </div>
    </Tooltip>
  ) : (
    <div className="sidebar-version text-muted">
      <FullVersion client={clientVersion} server={serverVersion} />
    </div>
  );
}

export default SidebarVersion;
