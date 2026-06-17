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

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";

import $ from "jquery";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import "dayjs/locale/ja";

import "./index.css";
import AppProviders from "@/providers/AppProvider";

window.jQuery = window.$ = $;

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppProviders />);
