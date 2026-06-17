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
import classNames from "classnames";
import { Button, Checkbox, Col, Modal, Row, Space, Tooltip, Typography } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export function WalkHelpModal({ activeDragger, visible, onClose }) {
  const [showHelp, setShowHelp] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (activeDragger === "Walk" && showHelp) setAutoOpen(true);
  }, [activeDragger, showHelp]);

  function handleClose() {
    setAutoOpen(false);
    onClose();
  }

  return (
    <Modal
      title={t("Navigation in first person mode")}
      open={visible || autoOpen}
      onOk={handleClose}
      onCancel={handleClose}
      footer={false}
      centered
    >
      <Row gutter={[24, 8]}>
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col>
              <Title level={4}>{t("Walk")}</Title>
            </Col>
            <Col span={20}>
              <Row justify="center">
                <Tooltip title={t("Press key W to move forward")}>
                  <Button size="large" style={{ width: "50px" }}>
                    W
                  </Button>
                </Tooltip>
              </Row>
            </Col>
            <Col span={20}>
              <Row justify="center">
                <Space>
                  <Tooltip title={t("Press key A to move left")}>
                    <Button size="large" style={{ width: "50px" }}>
                      A
                    </Button>
                  </Tooltip>
                  <Tooltip title={t("Press key S to move backward")}>
                    <Button size="large" style={{ width: "50px" }}>
                      S
                    </Button>
                  </Tooltip>
                  <Tooltip title={t("Press key D to move right")}>
                    <Button size="large" style={{ width: "50px" }}>
                      D
                    </Button>
                  </Tooltip>
                </Space>
              </Row>
            </Col>
            <Col>
              <p>
                {t("Press key")} W, S, A, D {t("to move forward, backward, left, right")}
              </p>
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Title level={4}>{t("Look Around")}</Title>
            </Col>
            <Col span={20}>
              <Row justify="center">
                <Tooltip title={t("Drag mouse with left button pressed on view")}>
                  <Button size="large" style={{ width: "50px" }} icon={<VideoCameraOutlined />}></Button>
                </Tooltip>
              </Row>
            </Col>
            <Col span={24}>
              <p>{t("Drag mouse with left button pressed on view")}</p>
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col>
              <Title level={4}>{t("Adjust Speed")}</Title>
            </Col>
            <Col span={20}>
              <Row justify="center">
                <Space>
                  <Tooltip title={t("Press key + to increase movement speed")}>
                    <Button size="large" style={{ width: "50px" }}>
                      +
                    </Button>
                  </Tooltip>
                  <Tooltip title={t("Press key - to decrease movement speed")}>
                    <Button size="large" style={{ width: "50px" }}>
                      -
                    </Button>
                  </Tooltip>
                </Space>
              </Row>
            </Col>
            <Col>
              <p>{t("Press key + or - to change movement speed")}</p>
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <Row gutter={[8, 8]}>
            <Col>
              <Title level={4}>{t("Go Up and Down")}</Title>
            </Col>
            <Col span={20}>
              <Row justify="center">
                <Space>
                  <Tooltip title={t("Press key Q to move up")}>
                    <Button size="large" style={{ width: "50px" }}>
                      Q
                    </Button>
                  </Tooltip>
                  <Tooltip title={t("Press key E to move down")}>
                    <Button size="large" style={{ width: "50px" }}>
                      E
                    </Button>
                  </Tooltip>
                </Space>
              </Row>
            </Col>
            <Col>
              <p>{t("Press press Q, E to move up, down ")}</p>
            </Col>
          </Row>
        </Col>
      </Row>
      <Checkbox
        className={classNames("mt-3", { "d-none": !autoOpen })}
        checked={!showHelp}
        onChange={() => setShowHelp(!showHelp)}
      >
        {t("Don't show this help again")}
      </Checkbox>
    </Modal>
  );
}
