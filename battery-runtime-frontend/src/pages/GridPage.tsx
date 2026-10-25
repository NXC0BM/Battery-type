import "./GridPage.css";
import { FC, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import { BatteryType, getBatteryTypes } from "../modules/batteryApi";
import { BatteryCard } from "../components/BatteryCard";
import { CapacityFilter, MIN_CAPACITY } from "../components/CapacityFilter";
import { ROUTES } from "../Routes";
import { AppOutletContext } from "../AppLayout";

const GridPage: FC = () => {
  const [minCapacity, setMinCapacity] = useState(MIN_CAPACITY);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BatteryType[]>([]);
  const { setCards } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  const load = (capacity: number) => {
    setLoading(true);
    getBatteryTypes(capacity).then((list) => {
      setItems(list);
      setCards(list); // порядок для кнопки «Далее» в ленте
      setLoading(false);
    });
  };

  // монтирование: первая загрузка без фильтра
  useEffect(() => {
    load(MIN_CAPACITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gridPage">
      <header className="appHeader">
        <div className="brand">Battery Runtime</div>
        <div className="brandSub">Расчёт времени работы</div>
        <h1>Аккумуляторы</h1>
        <p className="subtitle">Каталог типов аккумуляторов</p>
      </header>

      <CapacityFilter
        value={minCapacity}
        setValue={setMinCapacity}
        onSubmit={() => load(minCapacity)}
        loading={loading}
      />

      {loading && (
        <div className="gridLoader">
          <Spinner animation="border" />
        </div>
      )}
      {!loading &&
        (!items.length ? (
          <p className="gridEmpty">Нет аккумуляторов с такой ёмкостью</p>
        ) : (
          <div className="grid">
            {items.map((item) => (
              <BatteryCard
                key={item.id}
                {...item}
                onClick={() => navigate(`${ROUTES.FEED}/${item.id}`)}
              />
            ))}
          </div>
        ))}
    </div>
  );
};

export default GridPage;
