
import { Routes, Route } from "react-router-dom";


import Dashboard from "./pages/dashboard";

import GetStarted from "./pages/GetStarted";
import InvestorDashboard from "./pages/InvestorDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AssociateDashboard from "./pages/AssociateDashboard";
import ForgotPassword from "./pages/ForgotPassword";


import ResetPassword from "./pages/ResetPassword";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/investor/dashboard" element={<InvestorDashboard />} />
      <Route path="/company/dashboard" element={<CompanyDashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      
      
      <Route path="/Associate/dashboard" element={<AssociateDashboard />} />
    </Routes>
  );
}

export default App;