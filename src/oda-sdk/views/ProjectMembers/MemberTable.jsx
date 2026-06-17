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

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Empty, Modal, notification, Select, Table, Tag, Tooltip, Typography } from "antd";
import { CrownOutlined, DeleteTwoTone, ExclamationCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { AppContext } from "@/AppContext";

const { Text, Link } = Typography;

function MemberTable({ project, refreshId }) {
  const { app } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const setRefreshId = useState()[1];
  const navigate = useNavigate();
  const canUpdateProject = project.authorization.project_actions.includes("update");
  const { t } = useTranslation();

  const columns = [
    {
      title: t("User"),
      dataIndex: "user",
      render: (user, member) => {
        return (
          <div className="d-flex">
            <div className="mr-3">
              <Avatar size="large" src={user.avatarUrl}>
                {user.initials}
              </Avatar>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1">
                <Text className="mr-2">{user.fullName}</Text>
                {member.type === "owner" && (
                  <Tag color="gold" icon={<CrownOutlined />}>
                    {t("Project owner")}
                  </Tag>
                )}
                {user.userId === app.user.id && <Tag color="green">{t("It is you")}</Tag>}
              </h6>
            </div>
          </div>
        );
      },
      width: "40%",
      ellipsis: true,
    },
    {
      title: t("Email"),
      dataIndex: "user",
      render: (user) => <Link href={`mailto:${user.email}`}>{user.email}</Link>,
      responsive: ["md"],
    },
    {
      title: t("Role"),
      dataIndex: "role",
      render: (_, member) => {
        const canChange = canUpdateProject && member.type !== "owner";
        return (
          <Select
            style={{ width: "100%" }}
            loading={member.updating}
            value={member.type === "owner" ? t("Full access") : t(member.role)}
            disabled={!canChange}
            options={roles.map((role) => ({ label: role.name, value: role.name, disabled: member.updating }))}
            onSelect={(value) => {
              member.updating = true;
              setRefreshId(new Date());
              member
                .update({ ...member.data, role: value })
                .then(() => {
                  notification.success({ message: t("Success"), description: t("Role has been changed") });
                })
                .catch((e) => {
                  console.error("Cannot change role.", e);
                  notification.error({ message: t("Error"), description: t("Cannot change role") });
                })
                .finally(() => {
                  member.updating = false;
                  setRefreshId(new Date());
                });
            }}
          />
        );
      },
      width: "20%",
      responsive: ["sm"],
    },
    {
      title: t("Actions"),
      key: "actions",
      render: (_, member) => {
        const canDelete = canUpdateProject && member.type !== "owner";
        return (
          <React.Fragment>
            {canDelete && (
              <Tooltip title={t("Remove member")}>
                <DeleteTwoTone
                  className="large-icon"
                  twoToneColor="#ff4d4f"
                  onClick={() =>
                    Modal.confirm({
                      title: t("Remove the member?"),
                      icon: <ExclamationCircleOutlined />,
                      okText: t("Yes"),
                      okType: "danger",
                      cancelText: "No",
                      cancelButtonProps: { type: "primary" },
                      onOk: () => {
                        member
                          .delete()
                          .then((data) => {
                            if (data.user.userId === app.user.id) {
                              navigate("/projects");
                            } else {
                              const newMembers = members.filter((x) => x.id !== data.id);
                              setMembers(newMembers);
                              notification.success({ message: t("Success"), description: t("Member removed") });
                            }
                          })
                          .catch((e) => {
                            console.error("Cannot remove member.", e);
                            notification.error({ message: t("Error"), description: t("Cannot remove member") });
                          });
                      },
                    })
                  }
                />
              </Tooltip>
            )}
          </React.Fragment>
        );
      },
      width: "15%",
      ellipsis: "true",
      align: "end",
    },
  ];

  useEffect(() => {
    setLoading(true);
    project
      .getMembers()
      .then((members) => setMembers(members))
      .catch((e) => {
        console.error("Cannot get members.", e);
        notification.error({ message: t("Error"), description: t("Cannot get members") });
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [project, refreshId, t]);

  useEffect(() => {
    project
      .getRoles()
      .then((roles) => setRoles(roles))
      .catch((e) => {
        console.error("Cannot get roles.", e);
        notification.error({ message: t("Error"), description: t("Cannot get roles") });
      });
  }, [project, t]);

  const emptyText = error
    ? t("Error loading members")
    : loading
      ? t("Loading members. Please  wait...")
      : `${t("No members in the project.")} ${canUpdateProject ? t(" To add members, click Add Members button.") : ""}`;

  const pagination = {
    showSizeChanger: true,
    showLessItems: true,
    responsive: true,
    disabled: loading,
    total: members.length,
  };

  return (
    <Table
      columns={columns}
      showSorterTooltip={false}
      rowKey={(row) => row.id}
      dataSource={members}
      pagination={pagination}
      loading={loading}
      bordered={false}
      // showHeader={false}
      locale={{ emptyText: <Empty description={emptyText} /> }}
    />
  );
}

export default MemberTable;
