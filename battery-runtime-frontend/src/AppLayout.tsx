import { FC, useState } from "react";
import { Outlet } from "react-router-dom";
import { BatteryType } from "./modules/batteryApi";
import { TabBar } from "./components/TabBar";
import "./MobileApp.css";

// Общий список карточек: плитка его заполняет, лента берёт из него порядок для кнопки «Далее».
// Передаётся вложенным страницам через Outlet context (без Redux и React Context).
export interface AppOutletContext {
  cards: BatteryType[];
  setCards: (cards: BatteryType[]) => void;
}

export const AppLayout: FC = () => {
  const [cards, setCards] = useState<BatteryType[]>([]);

  return (
    <div className="appShell">
      <main className="appContent">
        <Outlet context={{ cards, setCards }} />
      </main>
      <TabBar />
    </div>
  );
};
