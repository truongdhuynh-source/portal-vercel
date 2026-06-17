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

import React from "react";

export function ToolbarImage({ item, disabled }) {
  const { image: Image = "", label } = item;

  let element;
  if (typeof Image === "string") element = <img src={Image} alt="" />;
  else if (React.isValidElement(Image)) element = Image;
  else element = <Image title={label} />;

  return React.cloneElement(element, {
    style: {
      width: "1.75em",
      height: "1.75em",
      filter: disabled ? "grayscale(1) opacity(25%)" : "grayscale(0) opacity(100%)",
      transition: "filter 0.2s ease-in-out",
    },
  });
}
