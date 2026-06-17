import React, { useRef, useState, useContext } from "react";
import {
  notification,
  Row,
  Col,
  Tabs,
  Input,
  Form,
  Button,
  Select,
  Tooltip,
  Modal,
} from "antd";
import "./Profile.css";
import { useTranslation } from "react-i18next";
import axiosInstance from "@/plugins/axios";
import PortalHeader from "@/components/PortalHeader";
import { positionOption } from "@/models/profile";
import {
  validatorPassword,
  blockSpace,
  validatorPhoneNumber,
  inputPhoneNumber,
} from "@/utils/validator";
import { USER_ODA, USER_VINA } from "@/constants/index";
import getUserIdLogin from "@/utils/getUserIdLogin";
import {
  CopyOutlined,
  LockOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { AppContext } from "@/AppContext";
import ClientFactory from "@/oda-sdk/ClientFactory";
import useScreen from "@/hooks/useScreen";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";

const Profile = () => {
  const user_vina_id = getUserIdLogin();
  const { isMobile, isDesktop } = useScreen();
  const [formUser, formPassword, formAccount] = Form.useForm();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);
  const inputUserIdRef = useRef();
  const { app } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem(`${USER_VINA}_${user_vina_id}`)) || {},
  );
  const [userOda, setUserOda] = useState(
    JSON.parse(localStorage.getItem(`${USER_ODA}_${user_vina_id}`) || "{}") ||
      {},
  );
  const [passwordUser, setPasswordUser] = useState(undefined);
  const client = ClientFactory.get();
  const isFullView = sessionStorage.getItem("isFullView") === "true";

  const handleCopyText = async () => {
    inputUserIdRef.current.select();
    await navigator.clipboard.writeText(inputUserIdRef.current.input.value);
    notification.success({
      message: t("Success"),
      description: t("Copied success"),
    });
    createEventToTrackingSession({
      event: "copy_user_id",
      meta: createTeraTrackingPageMeta("profile", {
        action: "copy_user_id",
      }),
    });
  };

  const handleChangePassword = async (values) => {
    try {
      setSubmit(true);
      const { oldPassword, password } = values;
      if (oldPassword === password) {
        notification.warning({
          message: t("Error"),
          description: t("New password must be different from old password"),
        });
        return;
      }
      const res = await axiosInstance.put("/users/myself?isPassword=true", {
        old: oldPassword,
        new: password,
        oda: userOda.tokenInfo.token,
      });

      if (res && res.data) {
        document.getElementById("change-password-form").reset();
        client
          .signInWithEmail(userOda.email, password)
          .then((userOdaUpdated) => {
            console.log(userOdaUpdated?._data);
            setUserOda(userOdaUpdated?._data);
            localStorage.setItem(
              `${USER_ODA}_${user_vina_id}`,
              JSON.stringify(userOdaUpdated?._data),
            );
            notification.success({
              message: t("Success"),
              description: t("Password changed successfully"),
            });
            createEventToTrackingSession({
              event: "change_password",
              meta: createTeraTrackingPageMeta("profile", {
                action: "change_password",
              }),
            });
          });
      }
    } catch (e) {
      notification.error({
        message: t("Error"),
        description: t("Failed to change password."),
      });
    } finally {
      setSubmit(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const body = {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        position: values.position,
        company: values.company,
        postalCode: values.postalCode,
        country: values.country,
        city: values.city,
        address: values.address,
        oda: userOda.tokenInfo.token,
      };

      const res = await axiosInstance.put("/users/myself", body);

      if (res && res.data) {
        const currentUser = await axiosInstance.get("/users/myself");
        if (currentUser.status === 200) {
          localStorage.setItem(
            `${USER_VINA}_${user_vina_id}`,
            JSON.stringify(currentUser.data),
          );
        }
        notification.success({
          message: t("Success"),
          description: t("Information updated successfully"),
        });
        createEventToTrackingSession({
          event: "update_profile",
          meta: createTeraTrackingPageMeta("profile", {
            action: "update_profile",
          }),
        });
      }
    } catch (e) {
      notification.error({ message: t("Error"), description: e.data.message });
    } finally {
      setLoading(false);
    }
  };
  const openModal = () => {
    setOpen(true);
  };
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const body = {
        password: passwordUser,
      };
      const res = await axiosInstance.delete(
        "/users/self-erase?password=" + passwordUser,
      );
      if (res && res.data) {
        sessionStorage.setItem("isReturnApp", true);
        notification.success({
          message: t("Success"),
          description: t("Account deleted successfully"),
        });
        createEventToTrackingSession({
          event: "delete_account",
          meta: createTeraTrackingPageMeta("profile", {
            action: "delete_account",
          }),
        });
        app.logout();
      }
    } catch (e) {
      notification.error({
        message: t("Error"),
        description: t("Failed to delete account"),
      });
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: "1",
      label: t("Personal information"),
      icon: !isMobile && <UserOutlined />,
      children: (
        <Form
          form={formUser}
          name="personal-information"
          layout="vertical"
          autoComplete="off"
          onFinish={handleUpdateProfile}
          initialValues={{ ...user, id: userOda?.id }}
        >
          <h4>{t("Personal information")}</h4>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label={t("Last name")}
                rules={[{ required: true, message: t("Required field") }]}
              >
                <Input
                  value={user.firstName}
                  placeholder={t("Input")}
                  maxLength={64}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label={t("First name")}
                rules={[{ required: true, message: t("Required field") }]}
              >
                <Input placeholder={t("Input")} maxLength={64} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input
                  value={user.email}
                  placeholder={t("Input")}
                  maxLength={50}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label={t("Phone number")}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (!value) {
                        return Promise.resolve();
                      }
                      if (!validatorPhoneNumber(value) || value.length < 10) {
                        return Promise.reject(
                          new Error(
                            t(
                              "Phone number must start with 0 and contain 10 digits",
                            ),
                          ),
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input
                  placeholder={t("Input")}
                  onKeyDown={inputPhoneNumber}
                  minLength={10}
                  maxLength={10}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={t("User name")}
                rules={[{ required: true, message: t("Required field") }]}
              >
                <Input
                  placeholder={t("Input")}
                  maxLength={64}
                  onKeyDown={blockSpace}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label={t("Position")}>
                <Select
                  loading={loading}
                  allowClear
                  showSearch
                  placeholder={t("Position")}
                  options={positionOption}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company" label={t("Company")}>
                <Input placeholder={t("Input")} maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="postalCode" label={t("Zip code")}>
                <Input placeholder={t("Input")} maxLength={10} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="address" label={t("Address")}>
                <Input placeholder={t("Input")} maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label={t("City")}>
                <Input placeholder={t("Input")} maxLength={200} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="country" label={t("Country")}>
                <Input placeholder={t("Input")} maxLength={200} />
              </Form.Item>
            </Col>
            <Col span={12} className="position-relative">
              <Form.Item name="id" label={t("User ID")}>
                <Input
                  value={user.id}
                  disabled
                  ref={inputUserIdRef}
                  suffix={
                    <Tooltip title={t("Copy User ID")}>
                      <Button
                        className="copy-button"
                        icon={<CopyOutlined />}
                        onClick={handleCopyText}
                      />
                    </Tooltip>
                  }
                  className="pt-0 pb-0 pr-0 pl-2.75"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="d-flex justify-content-center mt-2">
            <Button
              type="primary"
              htmlType="submit"
              className="px-4"
              loading={loading}
            >
              {t("Update")}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: t("Change password"),
      icon: !isMobile && <LockOutlined />,
      children: (
        <Form
          id="change-password-form"
          form={formPassword}
          name="change-password"
          layout="vertical"
          onFinish={handleChangePassword}
          initialValues={{
            oldPassword: undefined,
            password: undefined,
            confirmPassword: undefined,
          }}
        >
          <h4>{t("Change password")}</h4>
          <Form.Item
            name="oldPassword"
            label={t("Password")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("Required field"),
              },
              {
                min: 8,
                message: t("Enter a password with at least 8 characters"),
              },
            ]}
          >
            <Input.Password
              placeholder={t("Input")}
              autoComplete="current-password"
              maxLength={50}
              onKeyDown={blockSpace}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("New password")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("Required field"),
              },
              {
                min: 8,
                message: t("Enter a password with at least 8 characters"),
              },
              () => ({
                validator(_, value) {
                  if (validatorPassword(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The password is in the wrong format"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={t("Input")}
              autoComplete="new-password"
              maxLength={50}
              onKeyDown={blockSpace}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            label={t("Confirm new password")}
            rules={[
              { required: true, message: t("Required field") },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("The password you entered does not match")),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={t("Input")}
              autoComplete="new-password"
              maxLength={50}
              onKeyDown={blockSpace}
            />
          </Form.Item>
          <Form.Item className="d-flex justify-content-center mt-2">
            <Button
              type="primary"
              htmlType="submit"
              className="px-4"
              loading={submit}
            >
              {t("Update")}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    ...(isFullView
      ? [
          {
            key: "3",
            label: t("Account"),
            icon: !isMobile && <UserDeleteOutlined />,
            children: (
              <>
                <Form
                  id="change-password-form"
                  form={formAccount}
                  name="change-password"
                  layout="vertical"
                  onFinish={openModal}
                  initialValues={{
                    password: undefined,
                  }}
                >
                  <h4>{t("Delete account")}</h4>
                  <p>
                    {t(
                      "Deleting your account will remove all of your information from our database. This cannot be undone.",
                    )}
                  </p>
                  <Form.Item
                    name="password"
                    label={t("Password")}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: t("Required field"),
                      },
                      {
                        min: 8,
                        message: t(
                          "Enter a password with at least 8 characters",
                        ),
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder={t("Input")}
                      autoComplete="current-password"
                      maxLength={50}
                      onKeyDown={blockSpace}
                      defaultValue={passwordUser}
                      onChange={(e) => setPasswordUser(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item className="d-flex justify-content-center mt-2">
                    <Button
                      danger
                      htmlType="submit"
                      className="px-4"
                      loading={submit}
                    >
                      {t("Delete account")}
                    </Button>
                  </Form.Item>
                </Form>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="h-100 d-flex flex-column profile-page">
      {/* <PortalHeader title={t("My Profile")} /> */}
      <div className="profile">
        <Tabs
          rootClassName="tab-container"
          defaultActiveKey="1"
          tabPosition={isDesktop ? "left" : "top"}
          items={items}
        />
      </div>
      <Modal
        title={t("Delete account")}
        open={open}
        onOk={() => handleDeleteAccount()}
        onCancel={() => setOpen(false)}
        okText={t("OK")}
        cancelText={t("Cancel")}
        centered
      >
        <p>{t("Are you sure you want to delete your account?")}</p>
      </Modal>
    </div>
  );
};

export default Profile;
