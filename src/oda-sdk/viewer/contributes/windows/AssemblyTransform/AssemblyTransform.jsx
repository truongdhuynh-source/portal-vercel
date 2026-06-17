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

import { useState, useEffect, useCallback } from "react";
import { Form, Button, Select, InputNumber, notification, Space, Col, Row } from "antd";
import { useTranslation } from "react-i18next";

import { Window } from "../../../components";

export function AssemblyTransformWindow({ file: assembly, viewer, geometryLoaded, visible, onClose }) {
  const [models, setModels] = useState([]);
  const [translate, setTranslate] = useState({ x: 0.0, y: 0.0, z: 0.0 });
  const [rotation, setRotation] = useState({ x: 0.0, y: 0.0, z: 0.0, angle: 0.0 });
  const [scale, setScale] = useState(1);
  const [modelIndex, setModelIndex] = useState();
  const [applying, setApplying] = useState(false);
  const { t } = useTranslation();

  const updateModelData = useCallback(() => {
    const models = (viewer.executeCommand("getModels") ?? []).map((handle, index) => {
      const transform = assembly.getModelTransformMatrix(handle) ?? {
        translate: { x: 0.0, y: 0.0, z: 0.0 },
        rotation: { x: 0.0, y: 0.0, z: 1.0, angle: 0.0 },
        scale: 1.0,
      };
      const modelName = assembly.associatedFiles?.find((x) => x.fileId === assembly.files[index])?.name;
      return {
        handle,
        name: modelName ?? assembly.name,
        transform,
      };
    });

    setModels(models);
    setModelIndex(0);
    updateTransformUI(models[0].transform);
  }, [assembly, viewer]);

  useEffect(() => {
    if (!viewer) return;
    if (!geometryLoaded) return;

    updateModelData();
  }, [assembly, viewer, geometryLoaded, updateModelData]);

  useEffect(() => {
    if (models.length === 0) return;
    if (!visible) return;

    const { handle } = models[modelIndex];
    viewer.executeCommand("selectModel", handle);

    return () => {
      viewer.executeCommand("unselect");
    };
  }, [viewer, models, modelIndex, visible]);

  function updateTransformUI(transform) {
    setTranslate(transform.translate);
    setRotation(transform.rotation);
    setScale(transform.scale);
  }

  function handleChangeModel(index) {
    const { transform } = models[index];
    updateTransformUI(transform);
    setModelIndex(index);
  }

  function applyTransform() {
    const transform = { translate, rotation, scale };
    setApplying(true);
    assembly
      .setModelTransformMatrix(models[modelIndex].handle, transform)
      .then(() => {
        viewer.executeCommand("applyModelTransform", assembly);
        models[modelIndex].transform = transform;
        notification.success({ message: t("Success"), description: t("Transform applied") });
      })
      .catch((e) => {
        console.log("Cannot apply transform", e);
        notification.error({ message: t("Error"), description: t("Cannot apply transform") });
      })
      .finally(() => setApplying(false));
  }

  function resetToDefaults() {
    const transform = {
      translate: { x: 0.0, y: 0.0, z: 0.0 },
      rotation: { x: 0.0, y: 0.0, z: 1.0, angle: 0.0 },
      scale: 1.0,
    };

    setTranslate(transform.translate);
    setRotation(transform.rotation);
    setScale(transform.scale);

    setApplying(true);
    assembly
      .setModelTransformMatrix(models[modelIndex].handle, transform)
      .then(() => {
        viewer.executeCommand("applyModelTransform", assembly);
        models[modelIndex].transform = transform;
        notification.success({ message: t("Success"), description: t("Transform applied") });
      })
      .catch((e) => {
        console.log("Cannot apply transform", e);
        notification.error({ message: t("Error"), description: t("Cannot apply transform") });
      })
      .finally(() => setApplying(false));
  }

  async function transformationToCentralPoint() {
    setApplying(true);
    try {
      await viewer.executeCommand("autoTransformAllModelsToCentralPoint", assembly);
      viewer.executeCommand("zoomToExtents", true, false);
      updateModelData();
      notification.success({ message: t("Success"), description: t("Transform to central point") });
    } catch (e) {
      console.log("Cannot apply transform", e);
      notification.error({ message: t("Error"), description: t("Cannot apply transform") });
    } finally {
      setApplying(false);
    }
  }

  return (
    <Window
      title={t("Transform")}
      style={{
        left: "calc(50% - 290px)",
        width: "580px",
        height: "min-content",
        minWidth: "500px",
        minHeight: "450px",
      }}
      visible={visible}
      onClose={onClose}
    >
      <div>
        <Form layout="vertical">
          <Form.Item label={t("Model for transformation:")}>
            <Select
              defaultValue={0}
              options={models.map((model, index) => ({ label: model.name, value: index }))}
              onChange={handleChangeModel}
              value={modelIndex}
            />
          </Form.Item>

          <Form.Item label={t("Translation:")}>
            <Row gutter={8}>
              <Col span={8}>
                <InputNumber
                  className="w-100"
                  addonBefore="X"
                  decimalSeparator="."
                  value={translate.x}
                  step={0.1}
                  onChange={(value) => setTranslate({ ...translate, x: value })}
                />
              </Col>

              <Col span={8}>
                <InputNumber
                  className="w-100"
                  addonBefore="Y"
                  decimalSeparator="."
                  value={translate.y}
                  step={0.1}
                  onChange={(value) => setTranslate({ ...translate, y: value })}
                />
              </Col>

              <Col span={8}>
                <InputNumber
                  className="w-100"
                  addonBefore="Z"
                  decimalSeparator="."
                  value={translate.z}
                  step={0.1}
                  onChange={(value) => setTranslate({ ...translate, z: value })}
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label={t("Rotation:")}>
            <Row gutter={8}>
              <Col span={6}>
                <InputNumber
                  className="w-100"
                  addonBefore="X"
                  decimalSeparator="."
                  value={rotation.x}
                  step={0.1}
                  max={1.0}
                  min={-1.0}
                  onChange={(value) => setRotation({ ...rotation, x: value })}
                />
              </Col>

              <Col span={6}>
                <InputNumber
                  className="w-100"
                  addonBefore="Y"
                  decimalSeparator="."
                  value={rotation.y}
                  step={0.1}
                  max={1.0}
                  min={-1.0}
                  onChange={(value) => setRotation({ ...rotation, y: value })}
                />
              </Col>

              <Col span={6}>
                <InputNumber
                  className="w-100"
                  addonBefore="Z"
                  decimalSeparator="."
                  value={rotation.z}
                  step={0.1}
                  max={1.0}
                  min={-1.0}
                  onChange={(value) => setRotation({ ...rotation, z: value })}
                />
              </Col>

              <Col span={6}>
                <InputNumber
                  className="w-100"
                  addonBefore={t("Angle")}
                  decimalSeparator="."
                  value={(rotation.angle * (180 / Math.PI)).toFixed(2)}
                  step={0.1}
                  min={0.0}
                  max={360.0}
                  onChange={(value) => setRotation({ ...rotation, angle: value * (Math.PI / 180) })}
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label={t("Scale:")}>
            <Row gutter={8}>
              <Col span={8}>
                <InputNumber
                  className="w-100"
                  addonBefore=""
                  decimalSeparator="."
                  value={scale}
                  step={0.1}
                  min={0.1}
                  onChange={(value) => setScale(value)}
                />
              </Col>
            </Row>
          </Form.Item>

          <Row>
            <Col span={48}>
              <Space style={{ width: "100%" }}>
                <Button type="primary" loading={applying} onClick={applyTransform}>
                  {t("Apply")}
                </Button>
                <Button onClick={resetToDefaults}>{t("Reset")}</Button>
                <Button onClick={transformationToCentralPoint}>{t("Transform to central point")}</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>
    </Window>
  );
}
