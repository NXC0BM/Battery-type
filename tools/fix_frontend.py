from pathlib import Path
p=Path('battery-runtime-frontend/src/AppLayout.tsx')
p.write_text('''import { FC } from "react";
import { Outlet } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import "./MobileApp.css";
export const AppLayout: FC = () => (
  <div className="appShell"><main className="appContent"><Outlet /></main><TabBar /></div>
);
''',encoding='utf-8')
p=Path('battery-runtime-frontend/src/pages/GridPage.tsx'); s=p.read_text(encoding='utf-8-sig').replace('useNavigate, useOutletContext','useNavigate').replace('import { AppOutletContext } from "../AppLayout";\n','').replace('  const { setCards } = useOutletContext<AppOutletContext>();\n','').replace('      setCards(list); // порядок для кнопки «Далее» в ленте\n',''); p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/pages/FeedPage.tsx');s=p.read_text(encoding='utf-8-sig').replace('useNavigate, useOutletContext, useParams','useNavigate, useParams').replace('import { AppOutletContext } from "../AppLayout";\n','').replace('  const { cards, setCards } = useOutletContext<AppOutletContext>();','  const [cards, setCards] = useState<BatteryType[]>([]);').replace('  }, [cards.length, setCards]);','  }, [cards.length]);'); p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/Routes.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('"/lenta"','"/battery_type/feed"').replace('"/dobavlenie"','"/battery_type/draft"').replace('"/plitka"','"/battery_type"').replace('"/vhod"','"/users/login"');p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/MobileApp.css');s=p.read_text(encoding='utf-8-sig').replace('max-width: 420px;','width: 420px;').replace('min-height: 100vh;','min-height: 800px;').replace('color: #333333;','color: #000000;');p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/components/TabBar.css');s=p.read_text(encoding='utf-8-sig').replace('width: 100%;\n    max-width: 420px;','width: 420px;');p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/pages/FeedPage.css');s=p.read_text(encoding='utf-8-sig').replace('calc(100vh - 60px)','740px');p.write_text(s,encoding='utf-8')
p=Path('battery-runtime-frontend/src/modules/mock.ts');s=p.read_text(encoding='utf-8-sig');s+='\n// Два поля по теме представлены также в вертикальном наборе атрибутов.\nfor (const batteryType of BATTERY_TYPES_MOCK) {\n  batteryType.attributes = [\n    { name: "Ёмкость", value: String(batteryType.capacityMah ?? ""), unit: "мА·ч" },\n    { name: "Напряжение", value: String(batteryType.nominalVoltageV ?? ""), unit: "В" },\n    ...(batteryType.attributes ?? []),\n  ];\n}\n';p.write_text(s,encoding='utf-8')
