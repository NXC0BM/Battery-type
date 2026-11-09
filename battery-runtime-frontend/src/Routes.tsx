export const ROUTES = {
  FEED: "/battery_type/feed",
  ADD: "/battery_type/draft",
  GRID: "/battery_type",
  LOGIN: "/users/login",
};
export type RouteKeyType = keyof typeof ROUTES;
export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  FEED: "Лента",
  ADD: "Добавление",
  GRID: "Плитка",
  LOGIN: "Вход",
};
