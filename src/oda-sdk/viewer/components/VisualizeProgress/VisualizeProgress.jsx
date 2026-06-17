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

import classNames from "classnames";
import { Progress } from "antd";
import { useTranslation } from "react-i18next";

import "./VisualizeProgress.css";

export function VisualizeProgress({ loading, value }) {
  const { t } = useTranslation();

  return (
    <div className={classNames("oda-visualize-progress", { "d-none": !loading })} data-testid="visualize-progress">
      <Progress
        className="mb-2"
        type="circle"
        percent={value}
        status="normal"
        format={(percent) => `${percent.toFixed(0)}%`}
        aria-label="VisualizeJS Progress"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
      />
      <p>{t("Loading")} VisualizeJS...</p>
    </div>
  );
}
