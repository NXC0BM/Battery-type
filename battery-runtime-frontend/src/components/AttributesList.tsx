import { FC } from "react";
import { ListGroup } from "react-bootstrap";
import { BatteryAttribute } from "../modules/batteryApi";

// Доп. характеристики услуги из вертикальной таблицы battery_type_attributes (EAV)
export const AttributesList: FC<{ attributes?: BatteryAttribute[] }> = ({ attributes }) => {
  if (!attributes?.length) return null;
  return (
    <ListGroup variant="flush" className="feedAttrs">
      {attributes.map((attr) => (
        <ListGroup.Item key={attr.name} className="feedAttr">
          <span className="feedAttrName">{attr.name}</span>
          <span className="feedAttrValue">
            {attr.value}
            {attr.unit ? ` ${attr.unit}` : ""}
          </span>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};
