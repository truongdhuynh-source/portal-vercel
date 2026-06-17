///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2025, Open Design Alliance (the "Alliance").
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
//   Open Design Alliance Copyright (C) 2002-2025 by Open Design Alliance.
//   All rights reserved.
//
// By use of this software, its documentation or related materials, you
// acknowledge and accept the above terms.
///////////////////////////////////////////////////////////////////////////////

//import { useTranslation } from "react-i18next";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";
import { ShareSettings } from "../ShareSettings/ShareSettings";

export function ShareWindow({ viewer, file, visible, onClose }) {
  const { t } = useTranslation();
  return (
    <Window
      title={t("Share")}
      style={{
        width: "300px",
        height: "395px",
      }}
      resizable={false}
      visible={visible}
      onClose={onClose}
    >
      <div className="m-3">
        <ShareSettings file={file} />
      </div>
    </Window>
  );
}
