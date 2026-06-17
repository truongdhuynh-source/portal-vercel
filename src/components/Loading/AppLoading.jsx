import { Spin } from "antd";
import classNames from "classnames";
import React from "react";

const AppLoading = ({
  loading,
  children,
  size = "large",
  tip = "",
  className,
}) => {
  return (
    <div className={classNames("loading-app", className)}>
      {children}
      {loading && (
        <div className="loading-spin">
          <Spin spinning size={size} tip={tip} />
        </div>
      )}
    </div>
  );
};

export default AppLoading;
