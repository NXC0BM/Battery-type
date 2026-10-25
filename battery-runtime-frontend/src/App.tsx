import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import GridPage from "./pages/GridPage";
import { FeedPage } from "./pages/FeedPage";
import { ROUTES } from "./Routes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={ROUTES.GRID} replace />} />
          <Route path={ROUTES.GRID} element={<GridPage />} />
          <Route path={ROUTES.FEED} element={<FeedPage />} />
          <Route path={`${ROUTES.FEED}/:id`} element={<FeedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
