///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2002-2023, Open Design Alliance (the "Alliance").
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

import dayjs from "dayjs";

export class ClashReportSaver {
  constructor(assembly, test, report) {
    this.assembly = assembly;
    this.test = test;
    this.flatReport = report
      .map((group) =>
        group.children.map((clash) => ({
          id: clash.id,
          distance: clash.distance,
          type: test.clearance ? "Clearance" : "Hard",
          createdAt: test.createdAt,
          first: group.first,
          firstName: group.firstName,
          firstModel: group.firstModel.name,
          second: clash.second,
          secondName: clash.secondName,
          secondModel: clash.secondModel.name,
        }))
      )
      .flat()
      .sort((a, b) => a.id - b.id);
  }

  saveAsHtml() {
    return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="VinaCAD Viewer Clash Report" />
  <title>${this.assembly.name} - Clash Report</title>
  <style>
    body {
      font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.88);
    }

    table {
      margin-bottom: 2rem;
      border-collapse: collapse;
    }

    thead {
      background-color: #fafafa;
    }

    th,
    td {
      padding: .5rem .5rem;
      border-color: #d9d9d9;
      border-style: solid;
      border-width: 1px;
      text-align: start;
    }

    th[colspan] {
      text-align: center;
    }

    .item1 {
      background-color: #f6ffed;
    }

    .item2 {
      background-color: #fffbe6;
    }

    tbody tr:hover,
    tbody tr:hover .item1,
    tbody tr:hover .item2 {
      background-color: #fafafa;
    }
  </style>
</head>

<body>
  <h1>Clash Report</h1>
  <table>
    <thead>
      <tr>
        <th>Assembly Name</th>
        <th>Test Name</th>
        <th>Test Type</th>
        <th>Tolerance</th>
        <th>Clashes</th>
        <th>Created At</th>
        <th>Test Status</th>
      </tr>
    <thead>
    <tbody>
      <tr>
        <td>${this.assembly.name}</td>
        <td>${this.test.name}</td>
        <td>${this.test.clearance ? "Clearance" : "Hard"}</td>
        <td>${this.test.tolerance}</td>
        <td>${this.flatReport.length}</td>
        <td>${dayjs(this.test.createdAt).format("L LT")}</td>
        <td>${this.test.status}</td>
      </tr>
    </tbody>
  </table>
  <table width="100%">
    <thead>
      <tr>
        <th colspan="3"></th>
        <th class="item1" colspan="3">Item 1</th>
        <th class="item2" colspan="3">Item 2</th>
      </tr>
      <tr>
        <th>Clash ID</th>
        <th>Distance</th>
        <th>Description</th>
        <th class="item1">Handle</th>
        <th class="item1">Name</th>
        <th class="item1">Model</th>
        <th class="item2">Handle</th>
        <th class="item2">Name</th>
        <th class="item2">Model</th>
      </tr>
    </thead>
    <tbody>
${this.flatReport
  .map(
    (x) => `      <tr>
        <td>${x.id}</td>
        <td>${x.distance}</td>
        <td>${x.type}</td>
        <td class="item1">${x.first}</td>
        <td class="item1">${x.firstName}</td>
        <td class="item1">${x.firstModel}</td>
        <td class="item2">${x.second}</td>
        <td class="item2">${x.secondName}</td>
        <td class="item2">${x.secondModel}</td>
      </tr>`
  )
  .join("\n")}
    </tbody>
  </table>
</body>

</html>`;
  }

  saveAsText() {
    return `Clash Report
--------------------

Assembly Name: ${this.assembly.name}
Test Name: ${this.test.name}
Test Type: ${this.test.clearance ? "Clearance" : "Hard"}
Tolarance: ${this.test.tolerance}
Clashes: ${this.flatReport.length}
Created At: ${dayjs(this.test.createdAt).format("L LT")}
Test Status: ${this.test.status}
${this.flatReport
  .map(
    (x) => `
--------------------

Clash ID: ${x.id}
Distance: ${x.distance}
Description: ${x.type}

Item 1
Handle: ${x.first}
Name: ${x.firstName}
Model: ${x.firstModel}

Item 2
Handle: ${x.second}
Name: ${x.secondName}
Model: ${x.secondModel}`
  )
  .join("\n")}
`;
  }

  saveAsCsv() {
    return `Clash ID;Distance;Description;Created At;Item1 Handle;Item1 Name;Item1 Model;Item2 Handle;Item2 Name;Item2 Model
${this.flatReport.reduce((text, x) => text + Object.values(x).join(";") + "\r\n", "")}`;
  }

  saveAsJson() {
    const jsonReport = {
      ...this.test.data,
      clashes: this.flatReport.length,
      report: this.flatReport,
    };
    return JSON.stringify(jsonReport, null, "  ");
  }

  saveAs(format) {
    if (format === "html") return this.saveAsHtml();
    else if (format === "txt") return this.saveAsText();
    else if (format === "json") return this.saveAsJson();
    else return this.saveAsCsv();
  }
}
