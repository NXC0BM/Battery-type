import { FC } from "react";
import { Outlet } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import "./MobileApp.css";
export const AppLayout: FC = () => (
  <div className="appShell"><main className="appContent"><Outlet /></main><TabBar /></div>
);
