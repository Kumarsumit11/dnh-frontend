import { createBrowserRouter } from "react-router-dom";

import GetStarted from "./pages/GetStarted";
import InvestorDashboard from "./pages/InvestorDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AssociateDashboard from "./pages/AssociateDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <GetStarted />,
  },
  {
    path: "/investor/dashboard",
    element: <InvestorDashboard />,
  },
  {
    path: "/company/dashboard",
    element: <CompanyDashboard />,
  },
  {
    path: "/associate/dashboard",
    element: <AssociateDashboard />,
  },
]);