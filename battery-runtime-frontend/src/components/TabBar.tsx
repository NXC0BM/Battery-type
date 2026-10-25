import "./TabBar.css";
import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES, ROUTE_LABELS, RouteKeyType } from "../Routes";

interface TabItem {
  key: RouteKeyType;
  icon: string;
  enabled: boolean;
}

// 4 пункта меню; для гостя доступны только «Лента» и «Плитка»
const TABS: TabItem[] = [
  { key: "FEED", icon: "▶", enabled: true },
  { key: "ADD", icon: "+", enabled: false },
  { key: "GRID", icon: "▦", enabled: true },
  { key: "LOGIN", icon: "⎆", enabled: false },
];

export const TabBar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tabBar">
      {TABS.map(({ key, icon, enabled }) => {
        const active = location.pathname.startsWith(ROUTES[key]);
        return (
          <button
            key={key}
            type="button"
            className={`tabBarItem ${active ? "tabBarItemActive" : ""}`}
            disabled={!enabled}
            onClick={() => navigate(ROUTES[key])}
          >
            <span className="tabBarIcon">{icon}</span>
            {ROUTE_LABELS[key]}
          </button>
        );
      })}
    </nav>
  );
};
