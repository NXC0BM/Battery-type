import "./BatteryCard.css";
import { FC } from "react";
import { Card } from "react-bootstrap";

const defaultImage = "/DefaultImage.jpg";

interface Props {
  modelName: string;
  imageUrl: string | null;
  capacityMah: number | null;
  likesCount: number;
  onClick: () => void;
}

export const BatteryCard: FC<Props> = ({ modelName, imageUrl, capacityMah, likesCount, onClick }) => {
  return (
    <Card className="batteryCard" onClick={onClick}>
      <Card.Img
        className="batteryCardImage"
        variant="top"
        src={imageUrl || defaultImage}
        // битая ссылка из БД/MinIO — тоже показываем изображение по умолчанию
        onError={(e) => (e.currentTarget.src = defaultImage)}
      />
      <Card.Body className="batteryCardBody">
        <Card.Title className="batteryCardTitle">{modelName}</Card.Title>
        <div className="batteryCardMeta">
          <span className="batteryCardCapacity">{capacityMah ?? "—"} мА·ч</span>
          <span>♥ {likesCount}</span>
        </div>
      </Card.Body>
    </Card>
  );
};
