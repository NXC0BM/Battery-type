export const ROUTES = {
  FEED: "/lenta",
  ADD: "/dobavlenie",
  GRID: "/plitka",
  LOGIN: "/vhod",
};
export type RouteKeyType = keyof typeof ROUTES;
export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  FEED: "Лента",
  ADD: "Добавление",
  GRID: "Плитка",
  LOGIN: "Вход",
};
