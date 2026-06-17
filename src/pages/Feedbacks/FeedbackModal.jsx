import React, { useState, useEffect } from "react";
import {
  Form,
  Modal,
  notification,
  Select,
  Input,
  Rate,
  Upload,
  Button,
} from "antd";
import { useTranslation } from "react-i18next";
import {
  MehOutlined,
  FrownOutlined,
  SmileOutlined,
  UploadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import axiosInstance from "@/plugins/axios";
import { USER_VINA, VINA_CAD } from "@/constants";
import getUserIdLogin from "@/utils/getUserIdLogin";
import "./FeedbackModal.css";
import Dragger from "antd/es/upload/Dragger";
import { useSearchParams } from "react-router-dom";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const { TextArea } = Input;

function FeedbackModal({ visible, onSubmit, onClose }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [product, setProduct] = useState([]);
  const [productId, setProductId] = useState(null);
  const [vinaCadWebId, setVinaCadWebId] = useState("");
  const [file, setFile] = useState([]);
  const [productVersionsId, setProductVersionsId] = useState("");
  const vinacadVersion = localStorage.getItem("appVersion") || "";
  const [searchParams] = useSearchParams();

  const setCurrentVersion = (sourceArr, currentVer) => {
    if (sourceArr.length && currentVer) {
      const currentVersionArr = sourceArr.filter((item) => {
        return item?.label === currentVer;
      });
      return currentVersionArr[0]?.value;
    }
    return null;
  };

  const fetchVersions = async () => {
    try {
      const res = await axiosInstance.get(
        `/feedback/version-all?allApp=${true}`,
      );
      if (res) {
        const option = res.data.map((item) => ({
          value: item.productVersion_Id,
          label: item.version,
        }));
        setVersions(option);
        if (vinacadVersion) {
          const newProductVerId = setCurrentVersion(
            option,
            vinacadVersion?.toString() || searchParams.get("version"),
          );
          setProductVersionsId(newProductVerId);

          form.setFieldsValue({
            version: newProductVerId,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/product/get-all-products");
      if (res) {
        const vinaCADWebLabel = "VinaCAD Web";
        const productsData = res.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        const wedCadId = productsData.filter(
          (item) => item.label === vinaCADWebLabel,
        )[0].value;
        setProduct(productsData);
        setVinaCadWebId(wedCadId);
        if (vinacadVersion) {
          const newProductId = setCurrentVersion(
            productsData,
            searchParams.get("product")?.toString() ?? VINA_CAD,
          );
          setProductId(newProductId);

          form.setFieldsValue({
            productId: newProductId,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getAllVersions = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchVersions(), fetchProducts()]);
    } catch (e) {
      console.error("Error fetching versions:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllVersions();
  }, []);

  // const handleLoadFile = () => {
  //   try {
  //     const input = document.createElement("input");
  //     input.setAttribute("type", "file");
  //     input.setAttribute("accept", ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip");
  //     input.click();
  //     input.onchange = function () {
  //       const file = input.files[0];
  //       if (!file) return;
  //       const fileLimit = 10 * 1024 * 1024; //10MB
  //       if (file.size > fileLimit) {
  //         notification.warn({
  //           message: t("Warning"),
  //           description: t(
  //             "The file size is too large. Please select a file smaller than 10MB",
  //           ),
  //         });
  //         return;
  //       }
  //       const regexFile = /\.(pdf|docx?|jpg|png|zip)$/;
  //       if (!regexFile.test(file.name)) {
  //         notification.warn({
  //           message: t("Warning"),
  //           description: t(
  //             "Please choose one of the following formats: .pdf / .doc / .docx / .jpg / .png / .zip",
  //           ),
  //         });
  //         return;
  //       }
  //       setFile([file]);
  //     };
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;

      for (const item of items) {
        if (item.kind === "file") {
          const pastedFile = item.getAsFile();

          if (pastedFile) {
            setFile([pastedFile]);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleSubmitFeedback = async (values) => {
    const user_vina_id = getUserIdLogin();
    const obj = localStorage.getItem(`${USER_VINA}_${user_vina_id}`);
    const user = JSON.parse(obj);
    setSubmitting(true);
    try {
      const { rate, version, productId, content } = values;
      const body = {
        rate: rate - 1,
        email: user?.email,
        productVersionId: version,
        productId,
        content,
        phoneNumber: user?.phoneNumber,
        file: file[0],
      };
      const formData = new FormData();
      for (const key in body) {
        formData.append(key, body[key]);
      }
      const res = await axiosInstance.post("/feedback", formData, {
        headers: {
          "content-type": "multipart/form-data",
        },
      });

      if (res) {
        notification.success({
          message: t("Success"),
          description: t(res.data.message),
        });
        createEventToTrackingSession({
          event: "create_feedback",
          meta: createTeraTrackingPageMeta("feedbacks", {
            action: "create_feedback",
            productId,
            productVersionId: version,
            rate: rate - 1,
            hasAttachment: Boolean(file[0]),
            attachmentType: file[0]?.name?.split(".").pop()?.toLowerCase(),
          }),
        });
        onSubmit();
        setFile([]);
      }
    } catch (e) {
      console.log(e);
      
      notification.error({ message: t("Error"), description: t(e.message) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (value) => {
    setProductId(value);
  };

  const handleClose = () => {
    setProductId("");
    onClose();
  };

  const statusRate = [
    t("Very bad"),
    t("Bad"),
    t("Normal"),
    t("Satisfied"),
    t("Very satisfied"),
  ];

  const customIcons = {
    1: <FrownOutlined />,
    2: <FrownOutlined />,
    3: <MehOutlined />,
    4: <SmileOutlined />,
    5: <SmileOutlined />,
  };

  return (
    <Modal
      open={visible}
      centered
      title={t("Feedback")}
      okText={t("Submit")}
      cancelTex={t("Cancel")}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      onCancel={submitting ? undefined : handleClose}
      afterClose={() => form.resetFields()}
      rootClassName="feedback-modal"
    >
      <Form
        form={form}
        name="feedback"
        layout="vertical"
        onFinish={(values) => {
          handleSubmitFeedback(values);
        }}
        initialValues={{
          rate: 3,
          version: productVersionsId,
          productId,
          title: undefined,
          content: undefined,
          command: undefined,
          isFeedback: true,
        }}
      >
        <Form.Item
          name="rate"
          label={t("Rate")}
          rules={[{ required: true, message: t("Select a rating") }]}
        >
          <Rate
            tooltips={statusRate}
            rootClassName="rate-bar"
            character={({ index = 0 }) => customIcons[index + 1]}
          />
        </Form.Item>

        <Form.Item
          name="productId"
          label={t("The product you want feedback on")}
          rules={[{ required: true, message: t("Required field") }]}
        >
          <Select
            loading={loading}
            allowClear
            showSearch
            options={product}
            placeholder={t("Select a product")}
            value={productId}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.Item
          name="version"
          label={t("Which version are you using")}
          hidden={productId === vinaCadWebId || !productId ? true : false}
          rules={[
            {
              required: productId === vinaCadWebId ? false : true,
              message: t("Required field"),
            },
          ]}
        >
          <Select
            loading={loading}
            allowClear
            showSearch
            options={versions}
            placeholder={t("Select a version")}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label={t("What do you think about our software")}
          rules={[{ required: true, message: t("Required field") }]}
        >
          <TextArea rows={3} placeholder={t("Input")} maxLength={500} />
        </Form.Item>
        <Form.Item>
          <Dragger
            fileList={file}
            maxCount={1}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
            beforeUpload={(file) => {
              const fileLimit = 10 * 1024 * 1024;

              if (file.size > fileLimit) {
                notification.warning({
                  message: t("Warning"),
                  description: t(
                    "The file size is too large. Please select a file smaller than 10MB",
                  ),
                });
                return Upload.LIST_IGNORE;
              }

              setFile([file]);
              return false;
            }}
            onRemove={() => {
              setFile([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>

            <p className="ant-upload-text">{t("dragDropOrSelectFile")}</p>

            <p className="ant-upload-hint">{t("supportPasteFromClipboard")}</p>
          </Dragger>

          <p className="upload-note mt-2">
            {t(
              "Tải tối đa 1 tập tin có định dạng .PDF/.DOC/.DOCX/.JPG/.PNG/.ZIP với dung lượng không quá 10MB.",
            )}
          </p>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default FeedbackModal;
