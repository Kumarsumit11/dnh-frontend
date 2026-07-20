import { createBrowserRouter } from "react-router-dom";

import GetStarted from "./pages/GetStarted";
import InvestorDashboard from "./pages/InvestorDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AssociateDashboard from "./pages/AssociateDashboard";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <GetStarted />,
  },

   {
    path: "/forgot-password",
    element: <ForgotPassword/>,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
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