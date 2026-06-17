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
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/redux/features/sidebar/sidebarSlice";
import { ArrowRightToLineIcon, ArrowLeftToLineIcon } from "lucide-react";

function SidebarTrigger({ className }) {
  const dispatch = useDispatch();
  const { collapsed } = useSelector((state) => state.sideBar);
  const Icon = collapsed ? ArrowRightToLineIcon : ArrowLeftToLineIcon;

  return (
    <div
      className={classNames(
        className,
        "p-2 d-flex justify-content-center align-items-center ",
      )}
      style={{
        width: "40px",
        height: "40px",
        cursor: "pointer",
        border: "1px solid #e8e8e8",
        borderRadius: "15px",
        position: "absolute",
        bottom: "20px",
        right: "5px",
        transform: "translateX(50%)",
        zIndex: 100,
        backgroundColor: "#fff",
      }}
      onClick={() => dispatch(toggleSidebar())}
    >
      <Icon className="cursor-pointer" color="#656565" size={16} />
    </div>
  );
}

export default SidebarTrigger;
