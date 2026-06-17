import { Badge, Flex } from "antd";
import React from "react";
import { formatDate } from "../utils/functions";
import StatusBadge from "./StatusBadge";

export const ItemRenderer = ({ title, items }) => {
  const renderValue = (config) => {
    const { type, value, options = {} } = config;

    switch (type) {
      case "date":
        return formatDate(value) ?? "--/--";
      case "status":
        return value ? (
          <StatusBadge condition={value} statusList={options.statusList} />
        ) : (
          "--/--"
        );
      case "badge":
        return <Badge {...options} />;
      case "custom":
        return options.render(value);
      default:
        return value ?? "--/--";
    }
  };

  const renderItem = (config) => (
    <Flex gap={4} key={config.label}>
      <span>{config.label}:</span>
      <span>{renderValue(config)}</span>
    </Flex>
  );

  return (
    <Flex gap={8} vertical>
      {title && <h6>{title}</h6>}
      <Flex vertical>{items.map(renderItem)}</Flex>
    </Flex>
  );
};
