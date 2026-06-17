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

export class ValidationReportSaver {
  constructor(file, report) {
    this.file = file;
    this.report = report;
  }

  saveAsHtml() {
    return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="VinaCAD Viewer Validation Report" />
  <title>${this.file.name} - Validation Report</title>
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

    tbody tr:hover
      background-color: #fafafa;
    }
  </style>
</head>

<body>
  <h1>Validation Report</h1>
  <table>
    <tbody>
      <tr>
        <td>File Name</td>
        <td>${this.file.name}</td>
      </tr>
      <tr>
        <td>Errors</td>
        <td>${this.report.length}</td>
      </tr>
      <tr>
        <td>Validation Status</td>
        <td>${this.file.status.validation.state}</td>
      </tr>
    </tbody>
  </table>
  <table width="100%">
    <thead>
      <tr>
        <th>Handle</th>
        <th>Type</th>
        <th>Description</th>
        <th>Text Message</th>
        <th>Original Name</th>
        <th>Original Label</th>
      </tr>
    </thead>
    <tbody>
${this.report
  .map(
    (x) => `      <tr>
        <td>${x.handle}</td>
        <td>${x.type}</td>
        <td>${x.description}</td>
        <td>${x.textMessage}</td>
        <td>${x.originalName}</td>
        <td>${x.originalLabel}</td>
      </tr>`
  )
  .join("\n")}
    </tbody>
  </table>
</body>

</html>`;
  }

  saveAsText() {
    return `Validation Report
--------------------

File Name: ${this.file.name}
Errors: ${this.report.length}
Validation Status: ${this.file.status.validation.state}
${this.report
  .map(
    (x) => `
--------------------

Handle: ${x.handle}
Type: ${x.type}
Description: ${x.description}
Text Message: ${x.textMessage}
Original Name: ${x.originalName}
Original Label: ${x.originalLabel}
Logical: ${x.logical}`
  )
  .join("\n")}
`;
  }

  saveAsCsv() {
    return `Handle;Type;Description;Text Message;Original Name;Original Label;Logical
${this.report.reduce((text, x) => text + Object.values(x).join(";") + "\r\n", "")}`;
  }

  saveAsJson() {
    const jsonReport = {
      file: this.file.data,
      errors: this.report.length,
      report: this.report,
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
