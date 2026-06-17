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
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";
import { CDATreeView } from "./CDATreeView";

export function ObjectExplorerWindow({ visible, onClose, ...props }) {
  const { t } = useTranslation();
  const { file, activeVersion } = props;
  const [loading, setLoading] = useState(false);
  const [cdaTree, setCdaTree] = useState();

  useEffect(() => {
    if (file) {
      setLoading(true);
      file
        .getCdaTree()
        .then((tree) => {
          tree.forEach((x, index) => {
            const modelName = file.associatedFiles?.find((x) => x.fileId === file.files[index])?.name;
            x.name = modelName ?? file.name;
          });
          setCdaTree(tree);
        })
        .catch((e) => {
          console.error("Cannot load CDA tree", e);
          setCdaTree();
        })
        .finally(() => setLoading(false));
    } else {
      setCdaTree();
    }
  }, [file, activeVersion]);

  return (
    <Window title={t("Object Explorer")} visible={visible} onClose={onClose}>
      <Spin spinning={loading} style={{ minHeight: 53 }}>
        {cdaTree ? (
          <CDATreeView cdaTree={cdaTree} {...props} />
        ) : (
          <div className="w-100 text-center text-muted p-2">{loading ? "" : t("Cannot load CDA tree")}</div>
        )}
      </Spin>
    </Window>
  );
}
