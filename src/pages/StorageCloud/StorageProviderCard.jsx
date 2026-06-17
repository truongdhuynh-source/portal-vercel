import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Tag, Collapse } from "antd";
import classNames from "classnames";
import { useTranslation } from "react-i18next";

const StorageProviderCard = ({ provider, onAddAccount, onRemoveAccount }) => {
  const { t } = useTranslation();
  const { title, icon, accounts, isTranslateY } = provider;
  return (
    <Collapse className="rounded" expandIconPosition="end">
      <Collapse.Panel
        key="storage"
        header={
          <div
            className={classNames("d-flex gap-2 align-items-center", {
              "box-icon-translate-y": isTranslateY,
            })}
          >
            <span
              style={{ width: 24, height: 24 }}
              className="d-flex align-items-center justify-content-center"
            >
              {icon}
            </span>
            <span>
              {title} ({accounts.length})
            </span>
          </div>
        }
        style={{ border: "none" }}
      >
        <div
          className={classNames("d-flex flex-wrap gap-2", {
            "mb-3": accounts.length > 0,
          })}
        >
          {accounts.map((acc) => (
            <Tag
              key={acc.id}
              closable
              closeIcon={<CloseOutlined />}
              onClose={(e) => {
                e.preventDefault();
                onRemoveAccount(acc);
              }}
              
            >
              {acc.email}
            </Tag>
          ))}
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={onAddAccount}>
          {t('Add new account')}
        </Button>
      </Collapse.Panel>
    </Collapse>
  );
};

export default StorageProviderCard;
