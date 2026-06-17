import { ConfigProvider } from "antd";
import { generateLocaleForAntD } from "@/Localization";
import { useTranslation } from "react-i18next";

const AntdProvider = ({ children }) => {
  const { t } = useTranslation();
  return (
    <ConfigProvider locale={generateLocaleForAntD(t)}>
      {children}
    </ConfigProvider>
  );
};

export default AntdProvider;
