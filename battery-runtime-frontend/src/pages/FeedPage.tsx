import "./FeedPage.css";
import { FC, useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { BatteryType, getBatteryTypes, getFeedItem } from "../modules/batteryApi";
import { AttributesList } from "../components/AttributesList";
import { ShortDescription } from "../components/ShortDescription";
import { ROUTES } from "../Routes";
import { AppOutletContext } from "../AppLayout";

const defaultImage = "/DefaultImage.jpg";
const defaultVideo = "/DefaultVideo.mp4";

// Лента = страница «подробнее» об услуге: видео на весь экран, характеристики и атрибуты поверх
export const FeedPage: FC = () => {
  const { id } = useParams();
  const [item, setItem] = useState<BatteryType | null>();
  const [mediaFailed, setMediaFailed] = useState(false);
  const { cards, setCards } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  // при смене id в адресе загружаем карточку вместе с атрибутами
  useEffect(() => {
    setItem(undefined);
    setMediaFailed(false);
    getFeedItem(id ? Number(id) : undefined).then(setItem);
  }, [id]);

  // если ленту открыли по прямой ссылке — загружаем список, чтобы знать порядок для «Далее»
  useEffect(() => {
    if (!cards.length) getBatteryTypes().then(setCards);
  }, [cards.length, setCards]);

  const handleNext = () => {
    if (!item || !cards.length) return;
    const index = cards.findIndex((card) => card.id === item.id);
    const nextItem = cards[(index + 1) % cards.length]; // после последней — снова первая
    navigate(`${ROUTES.FEED}/${nextItem.id}`);
  };

  if (item === undefined) {
    return (
      <div className="feedLoader">
        <Spinner animation="border" />
      </div>
    );
  }
  if (item === null) {
    return <p className="feedEmpty">Нет опубликованных аккумуляторов</p>;
  }

  const poster = (!mediaFailed && item.imageUrl) || defaultImage;
  const video = (!mediaFailed && item.videoUrl) || defaultVideo;

  return (
    <div className="feedPage">
      <video
        key={`${item.id}-${video}`}
        className="feedVideo"
        src={video}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setMediaFailed(true)}
      />
      <div className="feedOverlay">
        <div className="feedTitle">{item.modelName}</div>
        <div className="feedSpecs">
          {item.capacityMah ?? "—"} мА·ч · {item.nominalVoltageV ?? "—"} В
        </div>
        <ShortDescription text={item.shortDescription} />
        <AttributesList attributes={item.attributes} />
        <div className="feedRow">
          <button type="button" className="feedLike" disabled title="Лайк доступен после входа">
            <span className="feedLikeIcon">♥</span>
            {item.likesCount}
          </button>
          <Button className="feedNext" onClick={handleNext} aria-label="Далее" title="Далее">
            →
          </Button>
        </div>
      </div>
    </div>
  );
};
