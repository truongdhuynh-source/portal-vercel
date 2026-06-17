import { AppContext } from "@/AppContext";
import { t } from "i18next";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Form, Input, Modal, Tooltip } from "antd";
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import './ShareSetting.css';
import { userConvertForShareFile } from "@/utils/userConvertForShareFile";

export const InviteMembers = forwardRef((prop, ref) => {
  const { value = [], onChange, addInvokerRef } = prop;
  const [keyword, setKeyword] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const { app } = useContext(AppContext);
  const form = Form.useFormInstance();
  const hasError = form.getFieldError("members").length > 0;
  const showInlineError = hasError && !isInputFocused;

  const isEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const getUserByEmail = async (email) => {
    try {
      const res = await app.getUserByEmail(email);
      if (!res || !res.email) {
        showError(t('No user found with email or name "{{keyword}}"', { keyword }));
        return;
      }
      return res;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleAddUser = async (e, options = {}) => {
    const { silent = false } = options;

    if (e && typeof e.preventDefault === "function") {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!keyword.trim()) return true;

    if (!isEmail(keyword)) {
      if (!silent) {
        showError(t("Invalid email format"));
      }

      return {
        ok: false,
        type: "invalid_email",
      };
    }

    const user = await getUserByEmail(keyword);

    if (!user) {
      return {
        ok: false,
        type: "not_found",
      };
    }

    const newUser = userConvertForShareFile(user);

    if (value.some((u) => u.email === newUser.email)) {
      if (!silent) {
        showError(t("member_already_exists", { email: newUser.email }));
      }

      return {
        ok: false,
        type: "duplicated",
        email: newUser.email,
      };
    }

    onChange?.([...value, newUser]);
    setKeyword("");

    return {
      ok: true,
    };
  };

  if (addInvokerRef && typeof addInvokerRef === 'object') {
    addInvokerRef.current = () =>
      handleAddUser(null, { silent: true });
  }

  const showError = (msg) => {
    Modal.error({
      title: t("Something went wrong"),
      content: msg,
      centered: true,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      okText: t("Got it"),
    });
  };

  const handleRemove = (email) => {
    onChange?.(value.filter(u => u.email !== email));
  };

  useImperativeHandle(ref, () => ({
    addUser: async () => {
      return await handleAddUser();
    }
  }), [keyword, value]);

  const getAvatarColor = (str = "") => {
    const colors = [
      "#1677ff",
      "#f56a00",
      "#7265e6",
      "#ffbf00",
      "#00a2ae",
      "#52c41a",
      "#eb2f96",
      "#fa541c"
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      <div className="invite-members-list">
        {value.map(user => {
          const hasName = !!user.name;
          const color = getAvatarColor(user.name || user.email);
          const tooltipTitle =
            user.name && user.name !== user.email
              ? `${user.name} (${user.email})`
              : user.email;

          const split = user.name ? user.name.split(" ") : [];
          return (
            <Tooltip key={user.id || user.email} title={tooltipTitle} placement="top">
              <div className="invite-tag">
                {hasName && (
                  <div
                    className="invite-avatar"
                    style={{ backgroundColor: color }}
                  >
                    {split.length > 1 ? split[0].charAt(0).toUpperCase() + split[split.length - 1].charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="invite-tag-text">
                  {
                    user.email
                  }
                </span>

                <span
                  className="invite-tag-remove"
                  onClick={() => handleRemove(user.email)}
                >
                  <CloseOutlined />
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <Input
        variant="borderless"
        placeholder={t("Search email...")}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => setIsInputFocused(true)}
        ref={inputRef}
        onBlur={(e) => {
          const nextElement = e.relatedTarget;
          if (nextElement && nextElement.tagName === 'BUTTON') {
            setIsInputFocused(false)
            return;
          }
          // inputRef.current?.focus();
          setIsInputFocused(true);
        }}
        onPressEnter={(e) => handleAddUser(e)}
        className={`invite-members-input ${showInlineError && !isInputFocused ? 'invite-members-input-error' : ''}`}
      />
    </div>
  );
});
