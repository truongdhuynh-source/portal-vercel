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

import React from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { Empty, notification, Table, Tooltip } from "antd";
import { PageHeader } from "@ant-design/pro-layout";
import i18next from "i18next";

import { StatusTag, statusMap } from "../../components";
import ClientFactory from "../../ClientFactory";
import { AppContext } from "@/AppContext";
import { contributes } from "../../viewer/contributes";

const t = i18next.t;

class Jobs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobs: [],
      loading: true,
      error: "",
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        position: ["bottomCenter"],
        showSizeChanger: true,
      },
      filters: { status: [] },
    };
  }

  async componentDidMount() {
    const tableBody = document.querySelector(".ant-table-body");
    if (tableBody) {
      const styleUpdate = { height: tableBody.style.maxHeight };
      Object.assign(tableBody.style, styleUpdate);
    }

    await this.getJobs();

    const isNeedUpdate = () => {
      return this.state.jobs
        .filter((job) => job.file || job.assembly)
        .some((job) => ["waiting", "inprogress"].includes(job.status));
    };

    this.interval = setInterval(async () => {
      if (isNeedUpdate()) await this.getJobs();
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getJobs = async (page, pageSize, status, sortByDesc, sortField) => {
    const { pagination, filters } = this.state;
    if (page === undefined) page = pagination.current;
    if (pageSize === undefined) pageSize = pagination.pageSize;
    if (status === undefined) status = filters.status;
    this.setState({ loading: true, error: "", filters: { status } });
    try {
      const client = ClientFactory.get();
      const jobs = await client.getJobs(
        status,
        pageSize,
        (page - 1) * pageSize,
        sortByDesc,
        sortField
      );

      const fileIds = [];
      const fileMap = new Map();
      const assemblyIds = [];
      const assemblyMap = new Map();

      jobs.result.forEach((job) => {
        job.fileId
          ? fileIds.push(job.fileId)
          : assemblyIds.push(job.assemblyId);
      });

      const files = await client.getFiles(null, null, null, null, fileIds);
      files.result.forEach((file) => fileMap.set(file.id, file));

      const assemblies = await client.getAssemblies(
        null,
        null,
        null,
        assemblyIds
      );
      assemblies.result.forEach((assembly) =>
        assemblyMap.set(assembly.id, assembly)
      );

      jobs.result.forEach((job) => {
        job.file = fileMap.get(job.fileId);
        job.assembly = assemblyMap.get(job.assemblyId);
      });

      this.setState({
        jobs: jobs.result,
        loading: false,
        pagination: {
          ...pagination,
          total: jobs.allSize,
          current: page,
          pageSize,
        },
      });
    } catch (e) {
      console.error(t("Cannot get jobs."), e);
      this.setState({ loading: false, error: e.message });
      notification.error({
        message: t("Error"),
        description: t("Cannot get jobs"),
      });
    }
  };

  handleTableChange = async (pagination, filters, sorter) => {
    await this.getJobs(
      pagination.current,
      pagination.pageSize,
      filters.status || [],
      sorter.order ? sorter.order === "descend" : undefined,
      sorter.order ? sorter.field : undefined
    );
  };

  render() {
    const { jobs, pagination, filters, loading, error } = this.state;

    const columns = [
      {
        title: t("Status"),
        dataIndex: "status",
        render: (status) => <StatusTag status={status} />,
        filters: statusMap.map((x) => ({ text: x.text, value: x.status })),
        ellipsis: { showTitle: false },
        width: "7%",
      },
      {
        title: t("Job ID"),
        dataIndex: "id",
        ellipsis: { showTitle: false },
        width: "20%",
      },
      {
        title: t("Name"),
        dataIndex: "name",
        render: (_, job) => {
          const to = job.fileId
            ? `/files/${job.fileId}`
            : `/assemblies/${job.assemblyId}`;
          const name = job.file?.name || job.assembly?.name || t("(Deleted)");
          const canOpenFile =
            job.file && contributes.viewers[job.file.geometryType];
          const canOpenAssembly =
            job.assembly && contributes.viewers[job.assembly.geometryType];
          const canOpen = canOpenFile || canOpenAssembly;
          return (
            <Tooltip
              title={job.fileId ? t("File") : t("Assembly")}
              placement="right"
            >
              {canOpen ? <Link to={to}>{name}</Link> : name}
            </Tooltip>
          );
        },
        ellipsis: { showTitle: false },
      },
      {
        title: t("Job Name"),
        dataIndex: "outputFormat",
        ellipsis: { showTitle: false },
        width: "12%",
      },
      {
        title: t("Created At"),
        dataIndex: "createdAt",
        render: (createdAt) => dayjs(createdAt).format("L LT"),
        ellipsis: { showTitle: false },
        width: "12%",
        sorter: true,
      },
      {
        title: t("Last Update"),
        dataIndex: "lastUpdate",
        render: (lastUpdate) => dayjs(lastUpdate).format("L LT"),
        ellipsis: { showTitle: false },
        width: "12%",
        sorter: true,
      },
    ];

    const filtered = filters.status.length > 0;
    const emptyText = error
      ? t("Error loading jobs")
      : loading
        ? t("Loading jobs. Please wait...")
        : filtered
          ? t("No jobs matching the filter")
          : t("No jobs");

    return (
      <React.Fragment>
        <PageHeader backIcon={false} title={t("Jobs")} />
        <Table
          size="small"
          columns={columns}
          showSorterTooltip={false}
          rowKey={(row) => row.id}
          dataSource={jobs}
          pagination={pagination}
          loading={loading}
          scroll={{ x: true, y: "calc(100svh - 170px)" }}
          locale={{ emptyText: <Empty description={emptyText} /> }}
          onChange={this.handleTableChange}
        />
      </React.Fragment>
    );
  }
}

Jobs.contextType = AppContext;

export default Jobs;
